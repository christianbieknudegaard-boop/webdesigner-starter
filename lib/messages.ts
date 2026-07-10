import { prisma } from "@/lib/db";

export class MessageError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

const MAX_BODY_LENGTH = 2000;

function validateBody(body: unknown): string {
  if (typeof body !== "string" || !body.trim())
    throw new MessageError("Meldingen kan ikke være tom", 400);
  if (body.length > MAX_BODY_LENGTH)
    throw new MessageError("Meldingen er for lang (maks 2000 tegn)", 400);
  return body.trim();
}

/**
 * Starter (eller gjenbruker) en samtale om en annonse og sender første
 * melding. Bare andre enn selgeren kan starte en samtale.
 */
export async function startConversation(
  listingId: string,
  senderId: string,
  rawBody: unknown
) {
  const body = validateBody(rawBody);
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new MessageError("Fant ikke annonsen", 404);
  if (listing.sellerId === senderId)
    throw new MessageError("Du kan ikke sende melding til deg selv", 400);

  const conversation = await prisma.conversation.upsert({
    where: { listingId_buyerId: { listingId, buyerId: senderId } },
    update: {},
    create: { listingId, buyerId: senderId },
  });
  await prisma.message.create({
    data: { conversationId: conversation.id, senderId, body },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });
  return conversation;
}

/** Svarer i en samtale. Kun deltakerne (interessent/selger) kan svare. */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  rawBody: unknown
) {
  const body = validateBody(rawBody);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { listing: true },
  });
  if (!conversation) throw new MessageError("Fant ikke samtalen", 404);
  if (
    conversation.buyerId !== senderId &&
    conversation.listing.sellerId !== senderId
  )
    throw new MessageError("Du er ikke med i denne samtalen", 403);

  const message = await prisma.message.create({
    data: { conversationId, senderId, body },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

/** Brukerens samtaler, nyeste aktivitet først, med uleste-teller. */
export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { listing: { sellerId: userId } }],
    },
    include: {
      listing: { include: { seller: true } },
      buyer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          messages: { where: { read: false, senderId: { not: userId } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((c) => ({
    id: c.id,
    listingId: c.listingId,
    listingTitle: c.listing.title,
    counterpartName:
      c.buyerId === userId ? c.listing.seller.name : c.buyer.name,
    lastMessage: c.messages[0]?.body ?? "",
    lastMessageAt: (c.messages[0]?.createdAt ?? c.updatedAt).toISOString(),
    unreadCount: c._count.messages,
  }));
}

/**
 * Henter en samtale med alle meldinger og markerer motpartens meldinger
 * som lest. Kun deltakerne har tilgang.
 */
export async function getConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { include: { seller: true } },
      buyer: true,
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });
  if (!conversation) throw new MessageError("Fant ikke samtalen", 404);
  if (
    conversation.buyerId !== userId &&
    conversation.listing.sellerId !== userId
  )
    throw new MessageError("Du er ikke med i denne samtalen", 403);

  await prisma.message.updateMany({
    where: { conversationId, read: false, senderId: { not: userId } },
    data: { read: true },
  });

  return {
    id: conversation.id,
    listingId: conversation.listingId,
    listingTitle: conversation.listing.title,
    listingPrice: conversation.listing.price,
    listingSold: conversation.listing.sold,
    counterpartName:
      conversation.buyerId === userId
        ? conversation.listing.seller.name
        : conversation.buyer.name,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === userId,
      senderName: m.sender.name,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

/** Antall uleste meldinger totalt – til nav-merket i headeren. */
export function getUnreadCount(userId: string) {
  return prisma.message.count({
    where: {
      read: false,
      senderId: { not: userId },
      conversation: {
        OR: [{ buyerId: userId }, { listing: { sellerId: userId } }],
      },
    },
  });
}
