import { describe, expect, it } from "vitest";
import { loadDataset } from "@/data/load";
import { answerIsSpelledOut, isPlayable } from "@/data/straffespark";

const ds = loadDataset();
/** Only trivia entries carry a prompt and an answer; photo and chant rounds do not. */
type Trivia = Extract<(typeof ds.straffespark)[number], { kind: "trivia" }>;
const trivia = ds.straffespark.filter((q): q is Trivia => q.kind === "trivia");

describe("Straffespark-banken", () => {
  it("stiller ingen spørsmål som staver svaret i teksten", () => {
    // "Hvilken klubb har Brann Stadion som hjemmebane?" er lesetrening, ikke fotball:
    // den som ikke kan norsk fotball svarer like raskt som den som kan det.
    const giveaways = trivia
      .filter((q) => isPlayable(q))
      .filter((q) => answerIsSpelledOut(q.prompt, q.answer.label))
      .map((q) => `${q.id}: ${q.prompt}`);
    expect(giveaways).toEqual([]);
  });

  it("skiller mellom å lese svaret og å kunne det", () => {
    expect(answerIsSpelledOut("Hvilken klubb har Brann Stadion som hjemmebane?", "Brann")).toBe(true);
    // Forstavelse inne i et lengre ord er ikke det samme som å stave svaret.
    expect(answerIsSpelledOut("Hvilken klubb har Høddvoll som hjemmebane?", "Hødd")).toBe(false);
    expect(answerIsSpelledOut("Hvem vant seriegullet i 2007?", "Brann")).toBe(false);
  });

  it("lar en spillbar oppføring alltid ha en kilde", () => {
    for (const q of trivia.filter((q) => isPlayable(q)))
      expect(q.sources.length, q.id).toBeGreaterThan(0);
  });
});
