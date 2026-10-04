import type { Metadata } from "next";
import { StatsView } from "@/components/stats/StatsView";
import { osloDateKey } from "@/lib/dates";

export const metadata: Metadata = { title: "Statistik", description: "Deine Serie und deine Ergebnisse in den täglichen Spielen.", alternates: { canonical: "/statistikk" }, robots: { index: false } };

export default function Page() {
  return <StatsView today={osloDateKey()} />;
}
