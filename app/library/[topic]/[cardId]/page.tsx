import { notFound } from "next/navigation";
import LessonReader from "@/components/lesson-reader";
import { getLibraryLesson } from "@/lib/cards";
import { titleFromCardId, topicChip } from "@/lib/topics";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string; cardId: string }>;
}) {
  const { cardId, topic } = await params;
  const id = decodeURIComponent(cardId);
  const t = decodeURIComponent(topic);
  return {
    title: `${titleFromCardId(id)} — ${topicChip(t).label}`,
  };
}

export default async function LessonReadingPage({
  params,
}: {
  params: Promise<{ topic: string; cardId: string }>;
}) {
  const { topic: rawTopic, cardId: rawCardId } = await params;
  const topic = decodeURIComponent(rawTopic);
  const cardId = decodeURIComponent(rawCardId);

  const lesson = await getLibraryLesson(cardId);
  if (!lesson) notFound();

  // Sécurité : on vérifie que la lesson appartient bien au topic de l'URL
  // (sinon URL `/library/HTA/anxiete-c1-l01-...` retournerait la lesson anxiete).
  if ((lesson.tags.sdd?.[0] as string) !== topic) notFound();

  return <LessonReader lesson={lesson} />;
}
