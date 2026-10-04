import type { Metadata } from "next";
import { Suspense } from "react";
import { MaalloesScreen } from "./MaalloesScreen";
import { GameSkeleton } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Torlos – finde die seltensten Antworten",
  description: "Das tägliche Quiz zu Bundesliga und Nationalmannschaft: fünf Antworten, und je weniger dasselbe antworten, desto besser. Jeden Tag eine neue Frage.",
  alternates: { canonical: "/maalloes" },
};

export default function Page() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <MaalloesScreen />
    </Suspense>
  );
}
