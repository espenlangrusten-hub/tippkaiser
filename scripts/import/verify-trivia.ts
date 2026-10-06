/**
 * Check everything written from memory against German Wikipedia: the Elfmeter and
 * Trainer-Genie questions, and the line-ups, squads, honours and player clues.
 *
 * Questions written from memory sit at `recall` and never reach a player. This reads
 * the article each one names in its `verify` block, checks that the article text
 * actually contains what the answer claims, and promotes the ones that pass to
 * `single_source` with the article as their source. A question that fails keeps its
 * status and gets a note saying what was missing - it is flagged for a human, never
 * silently rejected and never silently promoted.
 *
 *   node --import tsx scripts/import/verify-trivia.ts [--limit 10]
 *
 * The build sandbox cannot reach wikipedia.org; run it through the
 * "Verifiser spørsmål" GitHub Action.
 *
 * Every question names a German Wikipedia article in `verify.subject`, so the article
 * title and the strings in `mustMention` are written the way de.wikipedia writes them.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { coachQuizFile, honourFile, matchFile, squadFile, straffesparkFile } from "../../src/data/schema";
import { articleMatchesSubject, verdictFor, type Checkable, type WikiPage } from "../../src/data/verify";
import { playerClueFile } from "../../src/server/puzzles/playerClues";

const API = "https://de.wikipedia.org/w/api.php";
const UA = "Tippkaiser trivia verifier (https://github.com/espenlangrusten-hub/tippkaiser)";
const DATA = path.join(process.cwd(), "data", "source");

/**
 * Everything written from memory is checked the same way, whichever game it feeds: the
 * question banks, the line-ups behind Fehlende Elf, the squads and honours behind Torlos
 * and the player clues behind Finde den Spieler. A unit is one file; an entry is one
 * thing in it with a `verify` block. Entries without an id get one from `idOf`.
 */
type Raw = Record<string, unknown>;
type Unit = { file: string; raw: unknown; entries: { id: string; target: Raw }[] };

function arrayUnit(name: string, schema: z.ZodType, idOf: (e: Raw, i: number) => string): Unit | null {
  const file = path.join(DATA, name);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, "utf8")) as Raw[];
  schema.parse(raw); // a file that does not parse is not checked, it is fixed
  return { file, raw, entries: raw.map((e, i) => ({ id: idOf(e, i), target: e })) };
}

function matchUnits(): Unit[] {
  const dir = path.join(DATA, "matches");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      const raw = JSON.parse(readFileSync(file, "utf8")) as Raw;
      matchFile.parse(raw);
      return { file, raw, entries: [{ id: String(raw.id), target: raw }] };
    });
}

const units = (): Unit[] =>
  [
    arrayUnit("straffespark.json", straffesparkFile, (e) => String(e.id)),
    arrayUnit("trenerquiz.json", coachQuizFile, (e) => String(e.id)),
    arrayUnit("squads.json", squadFile, (e) => `squad:${String(e.tournament)}`),
    arrayUnit("honours.json", honourFile, (e) => `${String(e.kind)}:${String(e.year)}:${String(e.club ?? e.player ?? e.person ?? "")}`),
    arrayUnit("player-clues.json", playerClueFile, (e) => `clues:${String(e.playerId)}`),
    ...matchUnits(),
  ].filter((u): u is Unit => !!u);

const checkable = (id: string, e: Raw): Checkable => ({
  id,
  status: String(e.status ?? "recall"),
  sources: Array.isArray(e.sources) ? e.sources : [],
  notes: typeof e.notes === "string" ? e.notes : undefined,
  verify: e.verify as Checkable["verify"],
});

type ApiPage = {
  title: string;
  missing?: boolean;
  extract?: string;
  fullurl?: string;
  revisions?: { slots?: { main?: { content?: string } } }[];
};

async function query(params: Record<string, string>): Promise<ApiPage[]> {
  const url = new URL(API);
  url.search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", ...params }).toString();
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${JSON.stringify(params)}`);
  const json = (await res.json()) as { query?: { pages?: ApiPage[] } };
  return json.query?.pages ?? [];
}

/**
 * The plain-text extract drops every table, and line-ups, squads and lists of winners
 * live in tables. The page's wikitext is read alongside it, so a name that is only in a
 * table still counts as written in the article. Both are the same article: nothing is
 * read from anywhere else.
 */
const EXTRACT = { prop: "extracts|info|revisions", explaintext: "1", exlimit: "1", inprop: "url", rvprop: "content", rvslots: "main" };
const textOf = (page: ApiPage) => [page.extract ?? "", page.revisions?.[0]?.slots?.main?.content ?? ""].join("\n");

/**
 * Exact title first, search second. Search is what saves the run when an article has
 * been renamed ("Werder Bremen" vs "SV Werder Bremen"), but it will answer any query with
 * something, so a hit that shares nothing with the subject is treated as no hit.
 */
async function fetchArticle(subject: string): Promise<WikiPage> {
  const [exact] = await query({ titles: subject, redirects: "1", ...EXTRACT });
  if (exact && !exact.missing && textOf(exact).trim()) return { title: exact.title, url: exact.fullurl ?? "", extract: textOf(exact) };

  const [hit] = await query({ generator: "search", gsrsearch: subject, gsrlimit: "1", ...EXTRACT });
  if (!hit || hit.missing || !textOf(hit).trim()) return null;
  if (!articleMatchesSubject(hit.title, subject)) return null;
  return { title: hit.title, url: hit.fullurl ?? "", extract: textOf(hit) };
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  let budget = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
  const today = new Date().toISOString().slice(0, 10);
  let promoted = 0;
  let flagged = 0;

  for (const unit of units()) {
    if (budget <= 0) break;
    const queue = unit.entries.filter((e) => (e.target.status ?? "recall") === "recall" && e.target.verify).slice(0, budget);
    if (!queue.length) continue;
    budget -= queue.length;
    console.log(`${path.relative(DATA, unit.file)}: ${queue.length} å kontrollere.`);

    for (const { id, target } of queue) {
      const entry = checkable(id, target);
      const subject = entry.verify!.subject;
      let page: WikiPage = null;
      try {
        page = await fetchArticle(subject);
      } catch (err) {
        console.log(`  ${id}: oppslaget feilet (${(err as Error).message})`);
        continue; // A network hiccup is not evidence against the entry.
      }
      const verdict = verdictFor(entry, page, today);
      if (verdict.ok) {
        delete target.notes;
        target.status = "single_source";
        target.sources = [...entry.sources, verdict.source];
        promoted++;
        console.log(`  ✓ ${id}: ${verdict.note}`);
      } else {
        target.notes = verdict.note;
        flagged++;
        console.log(`  ? ${id}: ${verdict.note}`);
      }
      await new Promise((r) => setTimeout(r, 300)); // be a polite API client
    }

    writeFileSync(unit.file, JSON.stringify(unit.raw, null, 2) + "\n");
  }

  console.log(`\nGodkjent: ${promoted}. Til manuell sjekk: ${flagged}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
