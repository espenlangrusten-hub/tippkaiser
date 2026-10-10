import { describe, expect, it } from "vitest";
import { loadDataset } from "@/data/load";

// Findings from the fact check of the 1990–2024 DFB tournament matches (PR #14).
describe("DFB tournament match data", () => {
  const ds = loadDataset();

  it("shows Mario Gomez with the German spelling (answers typed as Gómez still match via normalisation)", () => {
    const p = [...ds.players.values()].find((x) => x.id === "mario-gomez");
    expect(p?.displayName).toBe("Mario Gomez");
    expect(p?.fullName).toBe("Mario Gomez");
  });

  it("keeps Lars Bender's full name so he is not confused with Sven Bender", () => {
    const p = [...ds.players.values()].find((x) => x.id === "lars-bender");
    expect(p?.displayName).toBe("Lars Bender");
  });

  it("records Hummels' 2021 own goal the same way as other own goals", () => {
    const m = ds.matches.find((x) => x.id === "2021-06-15-fra-ger");
    expect(m?.goals.find((g) => g.kind === "og")).toMatchObject({ scorer: "Mats Hummels (Eigentor)" });
  });

  it("does not ship knockout matches decided after extra time or penalties", () => {
    const ids = new Set(ds.matches.map((m) => m.id));
    for (const id of ["1990-07-04-ger-eng", "2006-06-30-ger-arg", "2016-07-02-ger-ita", "2006-07-04-ger-ita", "2014-06-30-ger-alg"]) {
      expect(ids.has(id)).toBe(false);
    }
  });
});
