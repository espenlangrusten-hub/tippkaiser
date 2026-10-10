import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadDataset } from "@/data/load";

/**
 * The Bundesliga tables are what Målløs builds most of its rounds from. A wrong or
 * missing club costs a player who knows the answer the full 100 points, so the data is
 * held to closed, checkable facts: every season complete, two sources, the known champions.
 */
const ds = loadDataset();
const bl = ds.seasons.filter((s) => s.competition === "bundesliga").sort((a, b) => a.year - b.year);
const generator = readFileSync(path.join(process.cwd(), "src", "server", "puzzles", "maalloes.ts"), "utf8");

// Deutsche Meister by season end year (https://de.wikipedia.org/wiki/Liste_der_deutschen_Fußballmeister).
const CHAMPIONS: Record<number, string> = {
  2006: "bayern", 2007: "stuttgart", 2008: "bayern", 2009: "wolfsburg", 2010: "bayern", 2011: "dortmund", 2012: "dortmund",
  2013: "bayern", 2014: "bayern", 2015: "bayern", 2016: "bayern", 2017: "bayern", 2018: "bayern", 2019: "bayern",
  2020: "bayern", 2021: "bayern", 2022: "bayern", 2023: "bayern", 2024: "leverkusen", 2025: "bayern",
};

describe("Bundesliga tables 2005/06–2024/25", () => {
  it("loads without dataset problems", () => {
    expect(ds.problems.filter((p) => p.includes("season"))).toEqual([]);
  });

  it("covers every season in the span, with no gaps", () => {
    expect(bl.map((s) => s.year)).toEqual(Array.from({ length: 20 }, (_, i) => 2006 + i));
  });

  it("holds 18 different clubs per season, with points that only fall down the table", () => {
    for (const s of bl) {
      const rows = s.table.map((r) => (typeof r === "string" ? { club: r, points: undefined } : r));
      expect(new Set(rows.map((r) => r.club)).size, s.id).toBe(18);
      for (let i = 1; i < rows.length; i++) expect(rows[i].points!, s.id).toBeLessThanOrEqual(rows[i - 1].points!);
    }
  });

  it("names the right champion first", () => {
    for (const s of bl) {
      const first = s.table[0];
      expect(typeof first === "string" ? first : first.club, s.id).toBe(CHAMPIONS[s.year]);
    }
  });

  it("relegates two or three clubs, all from the bottom three", () => {
    for (const s of bl) {
      expect(s.relegated.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.relegated.length, s.id).toBeLessThanOrEqual(3);
      const bottom = s.table.slice(-3).map((r) => (typeof r === "string" ? r : r.club));
      for (const r of s.relegated) expect(bottom, s.id).toContain(r);
    }
  });

  it("cites two independent sources for every season", () => {
    for (const s of bl) {
      expect(s.sources.some((x) => x.url?.includes("football-data.co.uk")), s.id).toBe(true);
      expect(s.sources.some((x) => x.url?.includes("wikipedia.org")), s.id).toBe(true);
    }
  });

  it("asks decade questions only over a complete decade", () => {
    expect(generator).toContain("if (d.seasons < 10) continue;");
  });

  it("names seasons, not bare years, so the window cannot be misread", () => {
    expect(generator).not.toContain("zwischen ${start} und ${end}");
    expect(generator).toContain("zwischen ${seasonOf(start)} und ${seasonOf(end)}");
  });
});
