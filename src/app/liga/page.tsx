import type { Metadata } from "next";
import { LeagueScreen } from "@/components/league/LeagueScreen";

export const metadata: Metadata = { title: "Liga", description: "Die Liga des Monats: Punkte aus den täglichen Spielen, und wer am Monatsende oben steht, wird Tippkaiser des Monats.", alternates: { canonical: "/liga" }, robots: { index: false } };
export default function Page() { return <LeagueScreen />; }
