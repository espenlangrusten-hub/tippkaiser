import type { Metadata } from "next";
import { Suspense } from "react";
import { ArchiveScreen } from "./ArchiveScreen";

export const metadata: Metadata = {
  title: "Archiv – frühere Spiele",
  description: "Spiele frühere Ausgaben von Fehlende Elf und Torlos.",
  alternates: { canonical: "/arkiv" },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-ink-2" />}>
      <ArchiveScreen />
    </Suspense>
  );
}
