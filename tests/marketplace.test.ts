/**
 * Integrasjonstester for forretningslogikken, kjørt rett mot databasen.
 *
 * Kjør med: npm test  (krever DATABASE_URL i .env og at `npm run db:push`
 * er kjørt). Testene lager sine egne brukere/annonser med tilfeldige
 * e-poster og rydder opp etter seg.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ListingError,
  createListing,
  deleteListing,
  searchListings,
  updateListing,
  validateNewListing,
} from "@/lib/data";
import {
  OrderError,
  createOrder,
  rateOrder,
  updateOrderStatus,
  validateAddress,
} from "@/lib/orders";
import {
  MessageError,
  getConversation,
  getUnreadCount,
  sendMessage,
  startConversation,
} from "@/lib/messages";
import { ReportError, reportListing } from "@/lib/reports";
import { AccountError, deleteAccount } from "@/lib/account";
import { findByIsbn, normalizeIsbn, searchCatalog } from "@/lib/catalog";

const RUN_ID = randomBytes(6).toString("hex");
const createdSellerIds: string[] = [];

async function makeSeller(name: string) {
  const seller = await prisma.seller.create({
    data: {
      name,
      city: "Testby",
      email: `${name.toLowerCase().replace(/\s/g, "")}-${RUN_ID}@test.local`,
    },
  });
  createdSellerIds.push(seller.id);
  return seller;
}

const BOOK = {
  title: `Testboken ${RUN_ID}`,
  author: "Test Forfatter",
  category: "fakta",
  condition: "god",
  price: 100,
};

const ADDRESS = {
  name: "Kari Test",
  street: "Testveien 1",
  postalCode: "0001",
  city: "Oslo",
};

after(async () => {
  // Rydd opp i alt testkjøringen har laget, i FK-vennlig rekkefølge.
  const listingFilter = { listing: { sellerId: { in: createdSellerIds } } };
  await prisma.message.deleteMany({
    where: { conversation: listingFilter },
  });
  await prisma.conversation.deleteMany({ where: listingFilter });
  await prisma.report.deleteMany({ where: listingFilter });
  await prisma.order.deleteMany({
    where: {
      OR: [{ buyerId: { in: createdSellerIds } }, listingFilter],
    },
  });
  await prisma.listing.deleteMany({
    where: { sellerId: { in: createdSellerIds } },
  });
  await prisma.session.deleteMany({
    where: { sellerId: { in: createdSellerIds } },
  });
  await prisma.seller.deleteMany({ where: { id: { in: createdSellerIds } } });
  await prisma.$disconnect();
});

test("bokkatalog: ISBN-normalisering og søk", () => {
  assert.equal(normalizeIsbn("978-82-03-37311-4"), "9788203373114");
  assert.equal(findByIsbn("9788203373114")?.title, "Kniv");
  assert.ok(searchCatalog("nesbø").length >= 2);
  assert.equal(searchCatalog("finnesikke-xyz").length, 0);
});

test("validering: annonse og adresse", () => {
  assert.equal(
    validateNewListing({ ...BOOK, price: -5 }),
    "Prisen må være et positivt heltall i kroner"
  );
  assert.equal(validateNewListing({ ...BOOK }), null);
  assert.throws(
    () => validateAddress({ ...ADDRESS, postalCode: "12" }),
    (e: unknown) => e instanceof OrderError && e.status === 400
  );
});

test("validering: film krever format og filmkategori", () => {
  const FILM = {
    productType: "film",
    title: "Testfilmen",
    author: "Test Regissør",
    category: "film-drama",
    condition: "god",
    price: 50,
  };
  // Film uten format avvises
  assert.equal(
    validateNewListing({ ...FILM }),
    "Velg format (DVD, Blu-ray eller 4K)"
  );
  assert.equal(validateNewListing({ ...FILM, format: "dvd" }), null);
  // Bokkategori på film avvises, og omvendt
  assert.equal(
    validateNewListing({ ...FILM, format: "dvd", category: "krim" }),
    "Kategorien passer ikke produkttypen"
  );
  assert.equal(
    validateNewListing({ ...BOOK, category: "film-drama" }),
    "Kategorien passer ikke produkttypen"
  );
});

test("annonser: opprett, søk, rediger og tilgangskontroll", async () => {
  const seller = await makeSeller("Selger En");
  const other = await makeSeller("Annen Bruker");

  const listing = await createListing(BOOK, seller.id);
  const found = await searchListings({ query: RUN_ID });
  assert.equal(found.length, 1);
  assert.equal(found[0].id, listing.id);

  // Bare eieren kan redigere
  await assert.rejects(
    updateListing(listing.id, other.id, { price: 1 }),
    (e: unknown) => e instanceof ListingError && e.status === 403
  );
  const updated = await updateListing(listing.id, seller.id, { price: 80 });
  assert.equal(updated.price, 80);
});

test("kjøp: hele flyten fra kjøpt til levert med vurdering", async () => {
  const seller = await makeSeller("Selger To");
  const buyer = await makeSeller("Kjøper To");
  const listing = await createListing(BOOK, seller.id);

  // Kan ikke kjøpe sin egen bok
  await assert.rejects(
    createOrder(listing.id, seller.id, ADDRESS),
    (e: unknown) => e instanceof OrderError && e.status === 400
  );

  const order = await createOrder(listing.id, buyer.id, ADDRESS);
  assert.equal(order.shipStreet, "Testveien 1");
  const sold = await prisma.listing.findUnique({ where: { id: listing.id } });
  assert.equal(sold?.sold, true);

  // Dobbeltkjøp avvises
  await assert.rejects(
    createOrder(listing.id, buyer.id, ADDRESS),
    (e: unknown) => e instanceof OrderError && e.status === 409
  );

  // Kjøperen kan ikke merke som sendt; selgeren kan
  await assert.rejects(
    updateOrderStatus(order.id, "sendt", buyer.id),
    (e: unknown) => e instanceof OrderError && e.status === 403
  );
  await updateOrderStatus(order.id, "sendt", seller.id);

  // Kan ikke vurdere før levert
  await assert.rejects(
    rateOrder(order.id, buyer.id, 5),
    (e: unknown) => e instanceof OrderError && e.status === 409
  );

  await updateOrderStatus(order.id, "levert", buyer.id);
  const sellerAfter = await prisma.seller.findUnique({
    where: { id: seller.id },
  });
  assert.equal(sellerAfter?.salesCount, 1);

  await rateOrder(order.id, buyer.id, 4);
  const rated = await prisma.seller.findUnique({ where: { id: seller.id } });
  assert.equal(rated?.rating, 4);

  // Kan ikke vurdere to ganger
  await assert.rejects(
    rateOrder(order.id, buyer.id, 1),
    (e: unknown) => e instanceof OrderError && e.status === 409
  );

  // Solgte annonser kan ikke slettes
  await assert.rejects(
    deleteListing(listing.id, seller.id),
    (e: unknown) => e instanceof ListingError && e.status === 409
  );
});

test("meldinger: samtale, uleste og tilgangskontroll", async () => {
  const seller = await makeSeller("Selger Tre");
  const buyer = await makeSeller("Kjøper Tre");
  const outsider = await makeSeller("Utenforstående");
  const listing = await createListing(BOOK, seller.id);

  // Selgeren kan ikke starte samtale med seg selv
  await assert.rejects(
    startConversation(listing.id, seller.id, "hei meg"),
    (e: unknown) => e instanceof MessageError && e.status === 400
  );

  const conversation = await startConversation(
    listing.id,
    buyer.id,
    "Er boken tilgjengelig?"
  );
  assert.equal(await getUnreadCount(seller.id), 1);

  // Utenforstående har ikke tilgang
  await assert.rejects(
    getConversation(conversation.id, outsider.id),
    (e: unknown) => e instanceof MessageError && e.status === 403
  );
  await assert.rejects(
    sendMessage(conversation.id, outsider.id, "hei"),
    (e: unknown) => e instanceof MessageError && e.status === 403
  );

  // Å lese tråden markerer meldingene som lest, og selgeren kan svare
  const thread = await getConversation(conversation.id, seller.id);
  assert.equal(thread.messages.length, 1);
  assert.equal(await getUnreadCount(seller.id), 0);
  await sendMessage(conversation.id, seller.id, "Ja, den er ledig!");
  assert.equal(await getUnreadCount(buyer.id), 1);
});

test("rapportering: én per bruker, ikke egen annonse", async () => {
  const seller = await makeSeller("Selger Fire");
  const reporter = await makeSeller("Rapportør");
  const listing = await createListing(BOOK, seller.id);

  await assert.rejects(
    reportListing(listing.id, seller.id, "svindel"),
    (e: unknown) => e instanceof ReportError && e.status === 400
  );
  await reportListing(listing.id, reporter.id, "svindel", "Mistenkelig");
  await assert.rejects(
    reportListing(listing.id, reporter.id, "annet"),
    (e: unknown) => e instanceof ReportError && e.status === 409
  );
});

test("kontosletting: sperres ved aktiv ordre, anonymiserer ellers", async () => {
  const seller = await makeSeller("Selger Fem");
  const buyer = await makeSeller("Kjøper Fem");
  const listing = await createListing(BOOK, seller.id);
  await createOrder(listing.id, buyer.id, ADDRESS);

  // Kjøperen har en pågående ordre → sletting avvises
  await assert.rejects(
    deleteAccount(buyer.id),
    (e: unknown) => e instanceof AccountError && e.status === 409
  );

  // En bruker uten pågående ordrer kan slettes: annonser fjernes og
  // profilen anonymiseres
  const loner = await makeSeller("Ensom Bruker");
  const lonerListing = await createListing(BOOK, loner.id);
  await deleteAccount(loner.id);
  assert.equal(
    await prisma.listing.findUnique({ where: { id: lonerListing.id } }),
    null
  );
  const anonymized = await prisma.seller.findUnique({
    where: { id: loner.id },
  });
  assert.equal(anonymized?.name, "Slettet bruker");
  assert.equal(anonymized?.email, null);
});
