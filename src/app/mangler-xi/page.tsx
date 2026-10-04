import type { Metadata } from "next";
import { Suspense } from "react";
import { ManglerXiScreen } from "./ManglerXiScreen";
import { GameSkeleton } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Fehlende Elf – errate Deutschlands Startelf",
  description: "Das tägliche Fußballquiz: Vervollständige Deutschlands Startelf aus einem historischen Länderspiel, Buchstabe für Buchstabe. Jeden Tag um 00:00 Uhr eine neue Elf.",
  alternates: { canonical: "/mangler-xi" },
};

export default function Page() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <ManglerXiScreen />
    </Suspense>
  );
}
