import { z } from "zod";
import raw from "../../../data/source/player-clues.json";

// Facts are editorially checked; unknown birthplaces or first clubs stay absent.
// A profile written from memory sits at `recall` until the Wikipedia check
// (scripts/import/verify-trivia.ts) has found its facts in the player's article;
// only a checked profile with a source reaches a round.
export const playerClueFile = z.array(z.object({
  playerId: z.string().min(1),
  hints: z.tuple([z.string().min(10), z.string().min(10), z.string().min(10)]),
  status: z.enum(["verified", "single_source", "recall", "uncertain", "rejected"]).default("recall"),
  sources: z.array(z.object({ url: z.url(), title: z.string(), kind: z.literal("web"), accessed: z.string() })).default([]),
  notes: z.string().optional(),
  verify: z.object({ subject: z.string().min(1), mustMention: z.array(z.string()).min(1) }).optional(),
}));
export const allPlayerClues = playerClueFile.parse(raw);
if (new Set(allPlayerClues.map((p) => p.playerId)).size !== allPlayerClues.length) throw new Error("Duplicate player clue profile");
export const playerClues = new Map(
  allPlayerClues.filter((p) => (p.status === "verified" || p.status === "single_source") && p.sources.length > 0).map((p) => [p.playerId, p]),
);
