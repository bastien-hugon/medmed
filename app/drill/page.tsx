import DrillRunner from "@/components/drill-runner";
import { getDrillTopics } from "@/lib/drill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entraînement" };

export default async function DrillPage() {
  const topics = await getDrillTopics();
  return <DrillRunner topics={topics} />;
}
