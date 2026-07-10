import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/auth";
import { getConversations } from "@/lib/messages";

export const metadata = {
  title: "Meldinger",
};

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/logg-inn");

  const conversations = await getConversations(seller.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-brand-dark">Meldinger</h1>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-3xl">💬</p>
          <p className="mt-2 font-semibold">Ingen samtaler ennå</p>
          <p className="mt-1 text-sm text-muted">
            Finn en bok du lurer på noe om, og send selgeren en melding fra
            annonsen.
          </p>
          <Link
            href="/boker"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
          >
            Finn bøker
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/meldinger/${c.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand"
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {c.counterpartName}
                  <span className="ml-2 font-normal text-muted">
                    om «{c.listingTitle}»
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {c.lastMessage}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {c.unreadCount > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                    {c.unreadCount}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {new Date(c.lastMessageAt).toLocaleDateString("nb-NO")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
