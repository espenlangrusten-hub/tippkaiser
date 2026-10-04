"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadProgress, saveProgress, addRecord, getVisitorFlags, setVisitorFlags } from "@/lib/storage";
import { maalloesShareText, shareOrCopy } from "@/lib/share";
import { track } from "@/components/analytics/Beacon";
import { apiGet, apiPost } from "@/lib/api";
import { AdSlot } from "@/components/ads/AdSlot";
import { useMidnightCountdown } from "@/hooks/useCountdown";
import design from "./Maalloes.module.css";

import type { MaalloesPublic } from "@/lib/gameTypes";
export type { MaalloesPublic };

// score and fact stay null until the round is over: the whole point of the game is
// choosing five answers without knowing how the earlier ones did.
type Entry = { text: string; id: string | null; label: string | null; score: number | null; fact: string | null };
type Final = {
  resolved: ({ id: string; label: string; fact: string | null } | null)[];
  scores: number[];
  total: number;
  shield: boolean;
  dropped: number | null;
  tier: { key: string; label: string; emoji: string };
  thresholds: { champions: number; europe: number; mid: number };
  board: { id: string; label: string; fact: string | null; score: number; count: number }[];
  respondents: number;
  explanation: string | null;
};
type GameState = { v: 1; puzzleId: string; entries: Entry[]; final: Final | null; startedAt: string | null; finishedAt: string | null };
type Suggestion = { id: string; label: string; surname?: string };

const ANSWERS = 5;

function scoreColor(s: number) {
  if (s === 100) return "bg-flag text-white";
  if (s === 0) return "bg-gold text-ink";
  if (s <= 10) return "bg-correct text-ink";
  if (s <= 35) return "bg-present text-ink";
  return "bg-line-2 text-snow";
}

export function MaalloesGame({ puzzle, isArchive, today }: { puzzle: MaalloesPublic; isArchive: boolean; today: string }) {
  const [state, setState] = useState<GameState | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdown = useMidnightCountdown();

  useEffect(() => {
    const saved = loadProgress<GameState>("maalloes", puzzle.puzzleId);
    setState(saved && saved.v === 1 ? saved : { v: 1, puzzleId: puzzle.puzzleId, entries: [], final: null, startedAt: null, finishedAt: null });
    if (!getVisitorFlags().seenIntro?.maalloes) setShowIntro(true);
  }, [puzzle.puzzleId]);
  useEffect(() => {
    if (state) saveProgress("maalloes", puzzle.puzzleId, state);
  }, [state, puzzle.puzzleId]);
  useEffect(() => {
    // Both kinds get suggestions. Club questions are the majority of the bank, and a
    // wrong spelling costs the same 100 points as a wrong answer.
    const minChars = puzzle.answerKind === "player" ? 1 : 2;
    if ((puzzle.answerKind !== "player" && puzzle.answerKind !== "club") || text.trim().length < minChars || state?.final) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void apiGet<{ ok: boolean; suggestions: Suggestion[] }>(`/suggestions?kind=${puzzle.answerKind}&q=${encodeURIComponent(text.trim())}`)
        .then((result) => {
          if (!cancelled) setSuggestions(result.ok ? result.suggestions : []);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [puzzle.answerKind, state?.final, text]);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1800);
  };

  const submitAnswer = async () => {
    if (!state || state.final || busy || state.entries.length >= ANSWERS) return;
    const t = text.trim();
    if (t.length < 2) return;
    setBusy(true);
    try {
      if (!state.startedAt) track({ name: "game_start", game: "maalloes", puzzleId: puzzle.puzzleId, archive: isArchive });
      if (state.entries.some((e) => e.text.toLocaleLowerCase("nb") === t.toLocaleLowerCase("nb"))) {
        showToast("Diese Antwort ist schon dabei");
        return;
      }
      const entry: Entry = { text: t, id: null, label: null, score: null, fact: null };
      const entries = [...state.entries, entry];
      setText("");
      setSuggestions([]);
      const next: GameState = { ...state, entries, startedAt: state.startedAt ?? new Date().toISOString() };
      setState(next);
      showToast("Antwort hinzugefügt – wird beim Absenden bewertet");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  };

  const editEntry = (index: number) => {
    if (!state || state.final || busy) return;
    const entry = state.entries[index];
    setState({ ...state, entries: state.entries.filter((_, i) => i !== index) });
    setText(entry.label ?? entry.text);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finalize = async () => {
    if (!state || state.final || busy || state.entries.length !== ANSWERS) return;
    setBusy(true);
    try {
      const f = await apiPost<{ ok: boolean } & Final>("/maalloes/submit", {
        puzzleId: puzzle.puzzleId,
        answers: state.entries.map((entry) => ({ id: entry.id, text: entry.text })),
      });
      if (!f.ok) return;
      const finishedAt = new Date().toISOString();
      const done: GameState = {
        ...state,
        final: f,
        finishedAt,
        entries: state.entries.map((entry, i) => ({ ...entry, id: f.resolved[i]?.id ?? null, label: f.resolved[i]?.label ?? null, score: f.scores[i], fact: f.resolved[i]?.fact ?? null })),
      };
      setState(done);
      addRecord("maalloes", { date: puzzle.date, completedAt: finishedAt, score: f.total, won: f.tier.key !== "relegation", archive: isArchive });
      track({ name: "game_complete", game: "maalloes", puzzleId: puzzle.puzzleId, archive: isArchive, props: { total: f.total, tier: f.tier.key, shield: f.shield } });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  const dismissIntro = () => {
    setShowIntro(false);
    setVisitorFlags({ seenIntro: { ...getVisitorFlags().seenIntro, maalloes: true } });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (!state) return <div className="h-72 animate-pulse rounded-2xl bg-ink-2" />;
  const f = state.final;

  const share = async () => {
    if (!f) return;
    const r = await shareOrCopy(maalloesShareText({ number: puzzle.number, total: f.total, tier: f.tier.label, tierEmoji: f.tier.emoji, scores: f.scores, shield: f.shield, archive: isArchive }));
    setShareMsg(r === "copied" ? "In die Zwischenablage kopiert!" : r === "shared" ? "Geteilt!" : "Teilen nicht möglich");
    track({ name: "share", game: "maalloes", puzzleId: puzzle.puzzleId, archive: isArchive });
  };

  return (
    <div className={`flex flex-col gap-4 ${design.game}`}>
      <div className={`card p-5 ${design.hero}`}>
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-mist">
          <span>
            Torlos #{puzzle.number}
            {isArchive && " · arkiv"}
          </span>
          <span>{puzzle.category}</span>
        </div>
        <p className="mt-2 text-sm text-mist">{puzzle.intro}</p>
        <h2 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{puzzle.question}</h2>
        <p className="mt-2 text-xs text-fog">{puzzle.answerCount} gyldige svar finnes. Feil svar koster 100 poeng.</p>
      </div>

      {f && (
        <div className={`card p-5 ${design.resultCard}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-mist">Ergebnis</div>
              <h2 className="font-display text-4xl font-bold uppercase leading-none">
                {f.tier.emoji} {f.tier.label}
              </h2>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl font-bold leading-none">{f.total}</div>
              <div className="text-xs text-mist">poeng{f.shield ? " · skjold brukt" : ""}</div>
            </div>
          </div>
          <p className="mt-2 text-xs text-fog">
            Meister ≤ {f.thresholds.champions} · Europapokal ≤ {f.thresholds.europe} · Mittelfeld ≤ {f.thresholds.mid}
            {f.respondents > 1 ? ` · ${f.respondents} har spilt` : ""}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button className="btn btn-primary flex-1" onClick={share}>
              Del resultatet
            </button>
            <Link href="/mangler-xi" className="btn btn-secondary flex-1" onClick={() => track({ name: "second_game_click", game: "mangler-xi", props: { from: "maalloes" } })}>
              Fehlende Elf spielen →
            </Link>
          </div>
          {shareMsg && <p className="mt-2 text-center text-sm text-correct">{shareMsg}</p>}
          {!isArchive && puzzle.date === today && countdown && <p className="mt-3 text-center text-sm text-mist">Neues Torlos in {countdown}</p>}
        </div>
      )}

      {/* Answers */}
      <div className={`card p-4 ${design.answersCard}`}>
        <ol className="flex flex-col gap-2">
          {Array.from({ length: ANSWERS }).map((_, i) => {
            const e = state.entries[i];
            const isDropped = f?.dropped === i;
            return (
              <li key={i} className={`${design.answerRow} flex items-center gap-3 rounded-xl border px-3 py-2 ${e ? "border-line bg-ink-3" : "border-dashed border-line"} ${isDropped ? "opacity-50 line-through" : ""}`}>
                <span className="w-5 text-center font-display text-lg text-fog">{i + 1}</span>
                {e ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{e.label ?? e.text}</div>
                      <div className="truncate text-xs text-mist">{!f ? "Wird bewertet, wenn alle fünf abgeschickt sind" : e.label ? (e.fact ?? "") : "Ungültige oder doppelte Antwort"}</div>
                    </div>
                    {e.score == null ? (
                      <button type="button" className="rounded-lg bg-ink-2 px-2.5 py-1 text-xs font-semibold text-mist hover:text-snow" onClick={() => editEntry(i)} aria-label={`Endre ${e.label ?? e.text}`}>
                        Endre
                      </button>
                    ) : (
                      <span className={`rounded-lg px-2.5 py-1 font-display text-xl font-bold ${scoreColor(e.score)}`}>{e.score === 0 ? "TORLOS" : e.score}</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-fog">{i === state.entries.length ? "Deine nächste Antwort" : ""}</span>
                )}
              </li>
            );
          })}
        </ol>
        {!f && state.entries.length < ANSWERS && (
          <form
            className={`${design.answerForm} relative mt-3 flex gap-2`}
            onSubmit={(e) => {
              e.preventDefault();
              void submitAnswer();
            }}
          >
            <input
              ref={inputRef}
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={puzzle.answerKind === "club" ? "Verein eingeben …" : puzzle.answerKind === "player" ? "Nachname eingeben …" : "Namen eingeben …"}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="send"
              aria-label="Deine Antwort"
              role="combobox"
              aria-autocomplete={puzzle.answerKind === "player" || puzzle.answerKind === "club" ? "list" : "none"}
              aria-expanded={suggestions.length > 0}
              aria-controls="player-suggestions"
              maxLength={80}
            />
            <button type="submit" className="btn btn-primary" disabled={busy || text.trim().length < 2}>
              Svar
            </button>
            {suggestions.length > 0 && (
              <ul id="player-suggestions" role="listbox" aria-label="Vorschläge" className="absolute left-0 right-20 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-ink-2 shadow-xl">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-ink-3 focus:bg-ink-3 focus:outline-none"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setText(suggestion.label);
                        setSuggestions([]);
                        inputRef.current?.focus();
                      }}
                    >
                      {suggestion.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}
        {!f && state.entries.length === ANSWERS && (
          <div className={`${design.finalize} mt-3 rounded-xl border border-line bg-ink-3 p-3`}>
            <p className="text-sm text-mist">Prüfe deine Antworten. Du kannst sie noch ändern, bevor die Punkte berechnet werden.</p>
            <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => void finalize()} disabled={busy}>
              {busy ? "Wird gesendet …" : "Fünf Antworten absenden"}
            </button>
          </div>
        )}
        {!f && (
          <p className="mt-2 text-xs text-fog">
            Gib den Nachnamen ein und wähle den Spieler aus der Liste. Ein eindeutiger Nachname reicht auch allein. Die Vorschläge kommen aus dem ganzen Spielerregister und verraten die Lösung nicht. Alle Antworten lassen sich bis zum Absenden ändern.
          </p>
        )}
      </div>

      {f && (
        <>
          <AdSlot placement="result" />
          <div className={`card p-4 ${design.board}`}>
            <h3 className="font-display text-xl font-bold uppercase">Alle Antworten, von der seltensten zur häufigsten</h3>
            {f.explanation && <p className="mt-1 text-sm text-mist">{f.explanation}</p>}
            <ol className="mt-3 grid gap-1 sm:grid-cols-2">
              {f.board.map((b) => {
                const mine = state.entries.some((e) => e.id === b.id);
                return (
                  <li key={b.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${mine ? "bg-ink-3 font-semibold" : ""}`}>
                    <span className={`w-14 shrink-0 rounded-md px-1.5 py-0.5 text-center font-display text-base font-bold ${scoreColor(b.score)}`}>{b.score === 0 ? "0" : b.score}</span>
                    <span className="truncate">{b.label}</span>
                    {b.fact && <span className="ml-auto truncate text-xs text-fog">{b.fact}</span>}
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-fog">
              Punkte = geschätzter Anteil von 100 Spielern, die dieselbe Antwort geben. Die Schätzung wird angepasst, je mehr Leute spielen.
              {puzzle.status === "single_source" ? " Die Fakten sind mit Spielarchiven abgeglichen." : ""}
            </p>
            {isArchive && (
              <p className="mt-2 text-sm">
                <Link href="/arkiv/?game=maalloes" className="underline">
                  Flere fra arkivet
                </Link>
              </p>
            )}
          </div>
        </>
      )}

      {toast && <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-snow px-4 py-2 font-semibold text-ink shadow-lg">{toast}</div>}

      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={dismissIntro} role="dialog" aria-modal="true">
          <div className={`card w-full max-w-md p-5 ${design.modal}`} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold uppercase">So spielst du Torlos</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-mist">
              <li>Lies die Frage und gib fünf Antworten. Du kannst sie vor dem Absenden ändern.</li>
              <li>Jede Antwort bekommt Punkte danach, wie viele von 100 Spielern dasselbe antworten. Wenig ist gut.</li>
              <li>Eine falsche Antwort gibt 100 Punkte. Eine Antwort, die sonst niemand gegeben hat, ist <b className="text-gold">torlos</b> (0) – und bringt dir ein Schild, das deine schlechteste Antwort streicht.</li>
              <li>Die Summe bestimmt deinen Tabellenplatz: von Abstieg bis Meister.</li>
            </ol>
            <button className="btn btn-primary mt-4 w-full" onClick={dismissIntro}>
              Los geht’s!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
