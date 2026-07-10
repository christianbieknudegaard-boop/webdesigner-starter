import { prisma } from "@/lib/db";

export const SHIPPING_PRICE = 45;

export type OrderStatus = "kjopt" | "sendt" | "levert";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  kjopt: "Kjøpt – venter på sending",
  sendt: "Sendt",
  levert: "Levert",
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
        shipName: address.name,
        shipStreet: address.street,
        shipPostalCode: address.postalCode,
        shipCity: address.city,
      },
      include: { listing: true },
    });
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
      data: { status: newStatus },
      include: { listing: true },
    });
  });
}

/** Ordrer der brukeren er kjøper, nyeste først. */
export function getPurchases(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: { listing: { include: { seller: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Ordrer på brukerens egne annonser, nyeste først. */
export function getSales(sellerId: string) {
  return prisma.order.findMany({
    where: { listing: { sellerId } },
    include: { listing: true, buyer: true },
    orderBy: { createdAt: "desc" },
  });
}
