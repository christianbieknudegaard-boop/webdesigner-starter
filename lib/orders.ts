import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SHIPPING_PRICE = 45;

/** Selgers frist for å sende, i dager fra kjøpet. */
export const SHIP_DEADLINE_DAYS = 5;
/** Utsettelse selgeren kan gi seg selv, én gang. */
export const EXTENSION_DAYS = 2;
/** Timer selgeren har på å svare på en kanselleringsforespørsel. */
export const CANCEL_RESPONSE_HOURS = 48;

export type OrderStatus = "kjopt" | "sendt" | "levert" | "kansellert";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  kjopt: "Kjøpt – venter på sending",
  sendt: "Sendt",
  levert: "Levert",
  kansellert: "Kansellert",
};

export class OrderError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface ShippingAddress {
  name: string;
  street: string;
  postalCode: string;
  city: string;
}

/** Validerer leveringsadressen; kaster OrderError ved feil. */
export function validateAddress(
  address: Partial<ShippingAddress> | undefined
): ShippingAddress {
  const name = address?.name?.trim();
  const street = address?.street?.trim();
  const postalCode = address?.postalCode?.trim();
  const city = address?.city?.trim();
  if (!name || !street || !postalCode || !city)
    throw new OrderError(
      "Fyll inn navn, gateadresse, postnummer og sted",
      400
    );
  if (!/^\d{4}$/.test(postalCode))
    throw new OrderError("Postnummeret må være 4 siffer", 400);
  return { name, street, postalCode, city };
}

/** Kjøper en annonse: oppretter ordre og markerer boken som solgt. */
export async function createOrder(
  listingId: string,
  buyerId: string,
  address: ShippingAddress
) {
  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new OrderError("Fant ikke annonsen", 404);
    if (listing.sold) throw new OrderError("Boken er allerede solgt", 409);
    if (listing.sellerId === buyerId)
      throw new OrderError("Du kan ikke kjøpe din egen bok", 400);

    await tx.listing.update({
      where: { id: listingId },
      data: { sold: true },
    });
    return tx.order.create({
      data: {
        listingId,
        buyerId,
        itemPrice: listing.price,
        shippingPrice: SHIPPING_PRICE,
        shipDeadline: new Date(
          Date.now() + SHIP_DEADLINE_DAYS * 24 * 60 * 60 * 1000
        ),
        shipName: address.name,
        shipStreet: address.street,
        shipPostalCode: address.postalCode,
        shipCity: address.city,
      },
      include: { listing: true },
    });
  });
}

/** Kansellerer en ordre og legger varen ut for salg igjen. */
async function cancelOrderInTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  listingId: string
) {
  await tx.order.update({
    where: { id: orderId },
    data: { status: "kansellert" },
  });
  await tx.listing.update({
    where: { id: listingId },
    data: { sold: false },
  });
}

/**
 * Kansellerer ordrer der fristen er utløpt: sendefristen er passert,
 * eller en kanselleringsforespørsel har stått ubesvart for lenge.
 * Kalles lazily når ordrer/annonser hentes – ingen cron nødvendig.
 */
export async function expireOverdueOrders() {
  const now = new Date();
  const requestCutoff = new Date(
    now.getTime() - CANCEL_RESPONSE_HOURS * 60 * 60 * 1000
  );
  const overdue = await prisma.order.findMany({
    where: {
      status: "kjopt",
      OR: [
        { shipDeadline: { lt: now } },
        { cancelRequestedAt: { lt: requestCutoff } },
      ],
    },
    select: { id: true, listingId: true },
  });
  for (const order of overdue) {
    await prisma.$transaction(async (tx) => {
      // Sjekk statusen på nytt i transaksjonen (selger kan ha rukket å sende)
      const fresh = await tx.order.findUnique({ where: { id: order.id } });
      if (fresh?.status !== "kjopt") return;
      await cancelOrderInTx(tx, order.id, order.listingId);
    });
  }
  return overdue.length;
}

/** Selgeren utsetter sendefristen – kun én gang. */
export async function extendDeadline(orderId: string, sellerId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { listing: true },
    });
    if (!order) throw new OrderError("Fant ikke ordren", 404);
    if (order.listing.sellerId !== sellerId)
      throw new OrderError("Bare selgeren kan utsette fristen", 403);
    if (order.status !== "kjopt")
      throw new OrderError("Fristen kan bare utsettes før sending", 409);
    if (order.deadlineExtended)
      throw new OrderError("Fristen er allerede utsatt én gang", 409);
    const base = order.shipDeadline ?? new Date();
    return tx.order.update({
      where: { id: orderId },
      data: {
        shipDeadline: new Date(
          base.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000
        ),
        deadlineExtended: true,
      },
    });
  });
}

/**
 * Kjøperen ber om kansellering. Selgeren kan godta (kansellering) eller
 * sende varen (forespørselen faller bort); uten svar innen
 * CANCEL_RESPONSE_HOURS kanselleres ordren automatisk.
 */
export async function requestCancellation(orderId: string, buyerId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new OrderError("Fant ikke ordren", 404);
  if (order.buyerId !== buyerId)
    throw new OrderError("Bare kjøperen kan be om kansellering", 403);
  if (order.status !== "kjopt")
    throw new OrderError(
      "Ordren kan ikke kanselleres etter at varen er sendt",
      409
    );
  if (order.cancelRequestedAt)
    throw new OrderError("Du har allerede bedt om kansellering", 409);
  return prisma.order.update({
    where: { id: orderId },
    data: { cancelRequestedAt: new Date() },
  });
}

/** Selgeren godtar kjøperens kanselleringsforespørsel. */
export async function acceptCancellation(orderId: string, sellerId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { listing: true },
    });
    if (!order) throw new OrderError("Fant ikke ordren", 404);
    if (order.listing.sellerId !== sellerId)
      throw new OrderError("Bare selgeren kan godta kanselleringen", 403);
    if (order.status !== "kjopt" || !order.cancelRequestedAt)
      throw new OrderError("Ingen kanselleringsforespørsel å godta", 409);
    await cancelOrderInTx(tx, order.id, order.listingId);
    return tx.order.findUnique({ where: { id: orderId } });
  });
}

/**
 * Kjøperens vurdering av selgeren (1–5) etter levering. Kan gis én gang;
 * selgerens snittvurdering regnes om fra alle vurderte ordrer.
 */
export async function rateOrder(
  orderId: string,
  buyerId: string,
  rating: unknown,
  comment?: unknown
) {
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  )
    throw new OrderError("Vurderingen må være et helt tall fra 1 til 5", 400);
  const trimmedComment =
    typeof comment === "string" ? comment.trim().slice(0, 500) : null;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { listing: true },
    });
    if (!order) throw new OrderError("Fant ikke ordren", 404);
    if (order.buyerId !== buyerId)
      throw new OrderError("Bare kjøperen kan vurdere", 403);
    if (order.status !== "levert")
      throw new OrderError("Du kan vurdere når boken er levert", 409);
    if (order.rating != null)
      throw new OrderError("Ordren er allerede vurdert", 409);

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { rating, ratingComment: trimmedComment },
    });

    const agg = await tx.order.aggregate({
      where: {
        listing: { sellerId: order.listing.sellerId },
        rating: { not: null },
      },
      _avg: { rating: true },
    });
    if (agg._avg.rating != null) {
      await tx.seller.update({
        where: { id: order.listing.sellerId },
        data: { rating: Math.round(agg._avg.rating * 10) / 10 },
      });
    }
    return updated;
  });
}

/**
 * Statusflyt: selgeren merker "sendt", kjøperen bekrefter "levert".
 * Ved levert øker selgerens salgsteller.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { listing: true },
    });
    if (!order) throw new OrderError("Fant ikke ordren", 404);

    const isSeller = order.listing.sellerId === actorId;
    const isBuyer = order.buyerId === actorId;

    if (newStatus === "sendt") {
      if (!isSeller)
        throw new OrderError("Bare selgeren kan merke ordren som sendt", 403);
      if (order.status !== "kjopt")
        throw new OrderError("Ordren kan ikke merkes som sendt nå", 409);
      if (order.shipDeadline && order.shipDeadline < new Date()) {
        await cancelOrderInTx(tx, order.id, order.listingId);
        throw new OrderError(
          "Sendefristen er utløpt og ordren er kansellert",
          409
        );
      }
    } else if (newStatus === "levert") {
      if (!isBuyer)
        throw new OrderError("Bare kjøperen kan bekrefte mottak", 403);
      if (order.status !== "sendt")
        throw new OrderError("Ordren er ikke sendt ennå", 409);
      await tx.seller.update({
        where: { id: order.listing.sellerId },
        data: { salesCount: { increment: 1 } },
      });
    } else {
      throw new OrderError("Ugyldig status", 400);
    }

    return tx.order.update({
      where: { id: orderId },
      // Sending avviser en eventuell kanselleringsforespørsel
      data: { status: newStatus, cancelRequestedAt: null },
      include: { listing: true },
    });
  });
}

/** Ordrer der brukeren er kjøper, nyeste først. */
export async function getPurchases(buyerId: string) {
  await expireOverdueOrders();
  return prisma.order.findMany({
    where: { buyerId },
    include: { listing: { include: { seller: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Ordrer på brukerens egne annonser, nyeste først. */
export async function getSales(sellerId: string) {
  await expireOverdueOrders();
  return prisma.order.findMany({
    where: { listing: { sellerId } },
    include: { listing: true, buyer: true },
    orderBy: { createdAt: "desc" },
  });
}
