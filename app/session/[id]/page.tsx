import { notFound, redirect } from "next/navigation";
import SessionRunner from "@/components/session-runner";
import { getReviewedCardIdsInSession, pickSessionBatch } from "@/lib/cards";
import { getSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();
  if (session.ended_at) redirect("/dashboard");

  const reviewedIds = await getReviewedCardIdsInSession(id);
  const cards = await pickSessionBatch(20, reviewedIds);

  return <SessionRunner sessionId={id} cards={cards} />;
}
