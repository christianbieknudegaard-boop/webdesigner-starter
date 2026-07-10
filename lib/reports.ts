import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export class ReportError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export const REPORT_REASONS: Record<string, string> = {
  svindel: "Mistanke om svindel",
  "feil-informasjon": "Feil informasjon om boken",
  upassende: "Upassende innhold",
  annet: "Annet",
};

/** Rapporterer en annonse. Én rapport per bruker per annonse. */
export async function reportListing(
  listingId: string,
  reporterId: string,
  reason: unknown,
  comment?: unknown
) {
  if (typeof reason !== "string" || !(reason in REPORT_REASONS))
    throw new ReportError("Velg en gyldig årsak", 400);
  const trimmedComment =
    typeof comment === "string" ? comment.trim().slice(0, 1000) : "";

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new ReportError("Fant ikke annonsen", 404);
  if (listing.sellerId === reporterId)
    throw new ReportError("Du kan ikke rapportere din egen annonse", 400);

  try {
    return await prisma.report.create({
      data: { listingId, reporterId, reason, comment: trimmedComment },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    )
      throw new ReportError("Du har allerede rapportert denne annonsen", 409);
    throw e;
  }
}
