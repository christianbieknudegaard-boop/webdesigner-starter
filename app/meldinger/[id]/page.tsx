import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MessageThread from "@/components/MessageThread";
import { getCurrentSeller } from "@/lib/auth";
import { MessageError, getConversation } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/logg-inn");

  const { id } = await params;
  let conversation;
  try {
    conversation = await getConversation(id, seller.id);
  } catch (e) {
    if (e instanceof MessageError) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="text-sm text-muted">
        <Link href="/meldinger" className="hover:text-brand-dark">
          ‹ Alle meldinger
        </Link>
      </nav>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            {conversation.counterpartName}
          </h1>
          <p className="text-sm text-muted">
            om «{conversation.listingTitle}» · {conversation.listingPrice} kr
            {conversation.listingSold ? " · Solgt" : ""}
          </p>
        </div>
        <Link
          href={`/bok/${conversation.listingId}`}
          className="shrink-0 rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Se annonsen
        </Link>
      </div>

      <MessageThread
        conversationId={conversation.id}
        initialMessages={conversation.messages}
      />
    </div>
  );
}
