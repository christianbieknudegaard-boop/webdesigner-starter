import { prisma } from "@/lib/db";

export class AccountError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/**
 * Sletter en konto (GDPR retten til sletting):
 *  - avviser hvis brukeren har pågående kjøp eller salg
 *  - sletter usolgte annonser med samtaler og rapporter
 *  - sletter alle sesjoner (logger ut overalt)
 *  - anonymiserer profilen; fullførte ordrer og sendte meldinger
 *    beholdes av hensyn til motparten, men uten personopplysninger
 */
export async function deleteAccount(sellerId: string) {
  await prisma.$transaction(async (tx) => {
    const activeOrders = await tx.order.count({
      where: {
        status: { in: ["kjopt", "sendt"] },
        OR: [{ buyerId: sellerId }, { listing: { sellerId } }],
      },
    });
    if (activeOrders > 0)
      throw new AccountError(
        "Du har pågående kjøp eller salg. Fullfør dem før du sletter kontoen.",
        409
      );

    const unsold = await tx.listing.findMany({
      where: { sellerId, sold: false },
      select: { id: true },
    });
    const unsoldIds = unsold.map((l) => l.id);
    await tx.conversation.deleteMany({
      where: { listingId: { in: unsoldIds } },
    });
    await tx.listing.deleteMany({ where: { id: { in: unsoldIds } } });

    await tx.session.deleteMany({ where: { sellerId } });
    await tx.seller.update({
      where: { id: sellerId },
      data: {
        name: "Slettet bruker",
        city: "",
        email: null,
        passwordHash: null,
      },
    });
  });
}
