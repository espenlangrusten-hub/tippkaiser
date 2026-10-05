import { describe, it, expect } from "vitest";
import { loadDataset } from "@/data/load";
import { evaluate } from "../supabase/functions/_shared/guess.ts";
import type { ManglerXiPayload } from "../supabase/functions/_shared/types.ts";

const ds = loadDataset();

describe("brothers in the same XI", () => {
  it("never prefixes initials anywhere in the dataset", () => {
    const prefixed = ds.appearances.filter((a) => a.answerKey !== null);
    expect(prefixed).toEqual([]);
  });
});

describe("guessing a shared surname", () => {
  const payload = {
    matchId: "m", date: "2008-10-11", competition: "c", stage: null, opponent: "Skottland", opponentCode: "SCO",
    norwayHome: false, score: [0, 0], venue: null, city: null, manager: null, formation: "4-4-2",
    status: "single_source", notes: null, opponentScorers: [],
    players: [
      { playerId: "p1", displayName: "John Arne Riise", answer: "RIISE", pos: "LB", order: 0, no: null, captain: false, goals: 0, aliases: ["John Arne Riise", "Riise", "JA Riise"] },
      { playerId: "p2", displayName: "Bjørn Helge Riise", answer: "RIISE", pos: "RM", order: 1, no: null, captain: false, goals: 0, aliases: ["Bjørn Helge Riise", "Riise", "BH Riise"] },
    ],
  } as unknown as ManglerXiPayload;

  it("solves either brother from the surname alone", () => {
    for (const i of [0, 1]) {
      const r = evaluate(payload, i, "Riise");
      expect(r.ok && r.solved).toBe(true);
    }
  });

  it("still solves from the full name, which is longer than the tiles", () => {
    const r = evaluate(payload, 0, "John Arne Riise");
    expect(r.ok && r.solved).toBe(true);
    expect(r.ok && r.name).toBe("John Arne Riise");
  });
});
