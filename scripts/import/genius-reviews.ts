/**
 * Move the Trainer-Genie drafts of checked questions into the playable layer.
 *
 * A draft (data/drafts/trener-genius-utkast.json) holds what the question bank does not:
 * three wrong options, a category and the line shown after the answer. It becomes a
 * playable review only once its question in trenerquiz.json has left `recall` with a
 * source attached, and the review carries that source. Drafts whose question is still
 * waiting stay where they are, and nothing already in trener-genius.json is rewritten.
 *
 *   node --import tsx scripts/import/genius-reviews.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { coachQuizFile } from "../../src/data/schema";

type Draft = { sourceId: string; expectedAnswer: string; difficulty: number; category: string; distractors: string[]; fact: string };
type Review = Draft & { reviewedAt: string; sources: { title: string; url: string }[] };

const root = process.cwd();
const quizPath = path.join(root, "data", "source", "trenerquiz.json");
const draftPath = path.join(root, "data", "drafts", "trener-genius-utkast.json");
const reviewPath = path.join(root, "data", "source", "trener-genius.json");

const quiz = new Map(coachQuizFile.parse(JSON.parse(readFileSync(quizPath, "utf8"))).map((q) => [q.id, q]));
const drafts = JSON.parse(readFileSync(draftPath, "utf8")) as Draft[];
const reviews = JSON.parse(readFileSync(reviewPath, "utf8")) as Review[];
const done = new Set(reviews.map((r) => r.sourceId));
const today = new Date().toISOString().slice(0, 10);

let added = 0;
for (const d of drafts) {
  const q = quiz.get(d.sourceId);
  if (!q || done.has(d.sourceId)) continue;
  if (q.status !== "single_source" && q.status !== "verified") continue;
  // The draft was written against this answer; if the question has changed since, a person decides.
  if (q.answer.label !== d.expectedAnswer) {
    console.log(`  ? ${d.sourceId}: svaret er endret («${d.expectedAnswer}» → «${q.answer.label}»), hoppet over`);
    continue;
  }
  const sources = q.sources.flatMap((s) => (s.url ? [{ title: s.title, url: s.url }] : []));
  if (!sources.length) continue;
  reviews.push({ ...d, reviewedAt: today, sources });
  added++;
}

writeFileSync(reviewPath, JSON.stringify(reviews, null, 2) + "\n");
console.log(`Trainer-Genie: ${added} nye, ${reviews.length} totalt.`);
