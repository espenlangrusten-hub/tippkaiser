import type { Metadata } from "next";
import { Suspense } from "react";
import { GameSkeleton } from "@/components/GameLoader";
import { FinnSpillerenScreen } from "./FinnSpillerenScreen";

export const metadata: Metadata = { title: "Finde den Spieler", description: "Finde den deutschen Nationalspieler mit bis zu fünf Hinweisen.", alternates: { canonical: "/finn-spilleren" } };

export default function Page() {
  return <Suspense fallback={<GameSkeleton />}><FinnSpillerenScreen /></Suspense>;
}
