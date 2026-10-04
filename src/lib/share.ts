import { SITE_URL } from "./site";

export type ShareRow = ("solved-fast" | "solved" | "solved-slow" | "failed")[];

const EMOJI = { "solved-fast": "🟩", solved: "🟨", "solved-slow": "🟧", failed: "⬛" } as const;

/** Spoiler-free Fehlende Elf share text: one emoji per player, rows mirror the pitch (attack first). */
export function manglerXiShareText(opts: { number: number; title: string; rows: ShareRow[]; found: number; tries: number; archive: boolean }): string {
  const grid = opts.rows.map((r) => r.map((s) => EMOJI[s]).join("")).join("\n");
  const head = `Fehlende Elf #${opts.number}${opts.archive ? " (Archiv)" : ""} – ${opts.title}`;
  return `${head}\n${grid}\n${opts.found}/11 · ${opts.tries} Versuche\n${SITE_URL}/mangler-xi`;
}

export function maalloesShareText(opts: { number: number; total: number; tier: string; tierEmoji: string; scores: number[]; shield: boolean; archive: boolean }): string {
  const bar = opts.scores.map((s) => (s === 100 ? "❌" : s === 0 ? "🥅" : s <= 10 ? "🟩" : s <= 35 ? "🟨" : "🟧")).join("");
  const head = `Torlos #${opts.number}${opts.archive ? " (Archiv)" : ""}`;
  return `${head}\n${bar}${opts.shield ? " 🛡️" : ""}\n${opts.total} Punkte · ${opts.tierEmoji} ${opts.tier}\n${SITE_URL}/maalloes`;
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator !== "undefined" && navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    /* user cancelled or unsupported → fall back to clipboard */
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
