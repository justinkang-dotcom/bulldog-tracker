import { TrackerApp } from "@/components/tracker-app";
import { listPublicPins } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPins = await listPublicPins("ssr-anonymous");
  return <TrackerApp initialPins={initialPins} />;
}
