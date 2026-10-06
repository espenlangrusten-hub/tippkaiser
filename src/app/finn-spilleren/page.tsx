import type { Metadata } from "next";
import { Suspense } from "react";
import { GameSkeleton } from "@/components/GameLoader";
import { FinnSpillerenScreen } from "./FinnSpillerenScreen";

export const metadata: Metadata = {
  title: "Finde den Spieler – Tägliches Fußball-Rätsel",
  description: "Fünf Hinweise, eine Antwort. Je früher du richtig liegst, desto mehr Punkte – jeden Tag neu.",
  alternates: { canonical: "/finn-spilleren" },
};

export default function Page() {
  return <Suspense fallback={<GameSkeleton />}><FinnSpillerenScreen /></Suspense>;
}
