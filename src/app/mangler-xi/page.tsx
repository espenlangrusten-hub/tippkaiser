import type { Metadata } from "next";
import { Suspense } from "react";
import { ManglerXiScreen } from "./ManglerXiScreen";
import { GameSkeleton } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Fehlende Elf – Tägliches Aufstellungs-Quiz",
  description: "Vervollständige Deutschlands Startelf aus einem echten Länderspiel – Buchstabe für Buchstabe. Jeden Tag neu auf Quizkaiser.",
  alternates: { canonical: "/mangler-xi" },
};

export default function Page() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <ManglerXiScreen />
    </Suspense>
  );
}
