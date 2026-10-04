import type { Metadata } from "next";
import { Suspense } from "react";
import { GameSkeleton } from "@/components/GameLoader";
import { GullordetScreen } from "./GullordetScreen";

export const metadata: Metadata = {
  title: "Goldwort",
  description: "Errate das deutsche Fußballwort des Tages in sechs Versuchen.",
  alternates: { canonical: "/gullordet" },
};

export default function Page() {
  return <Suspense fallback={<GameSkeleton />}><GullordetScreen /></Suspense>;
}
