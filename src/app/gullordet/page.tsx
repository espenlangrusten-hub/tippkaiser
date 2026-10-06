import type { Metadata } from "next";
import { Suspense } from "react";
import { GameSkeleton } from "@/components/GameLoader";
import { GullordetScreen } from "./GullordetScreen";

export const metadata: Metadata = {
  title: "Goldwort – Fußball-Wordle auf Deutsch",
  description: "Fünf Buchstaben, sechs Versuche: errate das Fußballwort oder den Namen des Tages.",
  alternates: { canonical: "/gullordet" },
};

export default function Page() {
  return <Suspense fallback={<GameSkeleton />}><GullordetScreen /></Suspense>;
}
