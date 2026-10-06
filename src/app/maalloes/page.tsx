import type { Metadata } from "next";
import { Suspense } from "react";
import { MaalloesScreen } from "./MaalloesScreen";
import { GameSkeleton } from "@/components/GameLoader";

export const metadata: Metadata = {
  title: "Torlos – Das Seltenheits-Quiz zum Fußball",
  description: "Fünf Antworten auf eine Frage zum deutschen Fußball. Je weniger andere dasselbe tippen, desto mehr Punkte.",
  alternates: { canonical: "/maalloes" },
};

export default function Page() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <MaalloesScreen />
    </Suspense>
  );
}
