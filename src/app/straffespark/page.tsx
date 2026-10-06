import type { Metadata } from "next";
import { loadDataset } from "@/data/load";
import { isPlayable } from "@/data/straffespark";
import type { BetaQuestion } from "@/lib/straffespark-beta";
import { BetaGame } from "./BetaGame";

export const metadata: Metadata = {
  title: "Elfmeter – Fünf Fußballfragen am Tag",
  description: "Fünf schnelle Fragen zum deutschen Fußball. Täglich neu auf Quizkaiser.",
  alternates: { canonical: "/straffespark" },
};

// The beta media files were manually prepared for the public site under neutral filenames.
// Trivia needs no override. Add future photo/audio questions here only after their public
// asset has been committed, so a daily draw can never land on a broken media question.
// Photo and chant rounds whose file is published under public/media/straffespark.
const PUBLIC_MEDIA: Record<string, string> = {};

export default function Page() {
  const ds = loadDataset();

  const pool: BetaQuestion[] = ds.straffespark
    .filter((q) => isPlayable(q))
    .filter((q) => q.kind === "trivia" || !!PUBLIC_MEDIA[q.id])
    .map((q) => {
      if (q.kind === "photo") {
        const player = ds.players.get(q.playerId);
        if (!player) throw new Error(`Missing player: ${q.playerId}`);
        return {
          id: q.id,
          kind: q.kind,
          prompt: q.prompt || "Wer versteckt sich auf dem Bild?",
          answer: player.displayName,
          aliases: [player.fullName, player.surname, ...player.aliases.map((a) => a.alias)],
          media: { ...q.image, file: PUBLIC_MEDIA[q.id] },
          sources: q.sources.map((s) => ({ title: s.title, url: s.url })),
        };
      }
      if (q.kind === "chant") {
        return {
          id: q.id,
          kind: q.kind,
          prompt: q.prompt,
          answer: q.answer.label,
          aliases: q.answer.aliases ?? [],
          media: { ...q.audio, file: PUBLIC_MEDIA[q.id] },
          sources: q.sources.map((s) => ({ title: s.title, url: s.url })),
        };
      }
      return {
        id: q.id,
        kind: q.kind,
        prompt: q.prompt,
        answer: q.answer.label,
        aliases: q.answer.aliases ?? [],
        fact: q.fact,
        sources: q.sources.map((s) => ({ title: s.title, url: s.url })),
      };
    });

  return <BetaGame pool={pool} />;
}
