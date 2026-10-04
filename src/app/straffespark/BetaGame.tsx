"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { formatDateNo, msUntilNextOsloMidnight, osloDateKey } from "@/lib/dates";
import { BASE_PATH } from "@/lib/site";
import { track } from "@/components/analytics/Beacon";
import {
  betaCorrect,
  dailyStraffesparkRound,
  MIN_STRAFFESPARK_REPEAT_DAYS,
  type BetaQuestion,
} from "@/lib/straffespark-beta";
import design from "./Straffespark.module.css";

export function BetaGame({ pool }: { pool: BetaQuestion[] }) {
  // Keep the server-rendered shell date-neutral. The browser resolves Oslo's calendar
  // date after hydration, so a static GitHub Pages build can still change round every
  // midnight without a deploy.
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<boolean[]>([]);
  const [mediaError, setMediaError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const update = () => {
      setDateKey(osloDateKey());
      timer = setTimeout(update, msUntilNextOsloMidnight() + 750);
    };
    update();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const questions = useMemo(() => (dateKey ? dailyStraffesparkRound(pool, dateKey) : []), [pool, dateKey]);

  // A tab left open across midnight becomes the new daily game instead of carrying over
  // yesterday's score and question index.
  useEffect(() => {
    if (!dateKey) return;
    setIndex(0);
    setGuess("");
    setResults([]);
    setMediaError(false);
  }, [dateKey]);

  useEffect(() => {
    if (dateKey) heading.current?.focus();
  }, [index, dateKey]);

  const answered = results.length > index;
  const complete = questions.length > 0 && index === questions.length;
  const score = results.filter(Boolean).length;
  const q = questions[index];
  const shellStyle = {
    "--stadium": `url("${BASE_PATH}/design/stadium.webp")`,
    "--game-art": `url("${BASE_PATH}/design/penalty.webp")`,
  } as CSSProperties;

  // Measured like the other daily games, so the statistics show whether it is played.
  const round = dateKey ? `straffespark-${dateKey}` : undefined;
  useEffect(() => {
    if (complete && round) track({ name: "game_complete", game: "straffespark", puzzleId: round, props: { score } });
  }, [complete, round, score]);

  function submit(skip = false) {
    if (!q || answered || complete || (!skip && !guess.trim())) return;
    if (index === 0 && results.length === 0) track({ name: "game_start", game: "straffespark", puzzleId: round });
    setResults((previous) => previous.length === index ? [...previous, !skip && betaCorrect(q, guess)] : previous);
  }

  const intro = (
    <header className={design.hero}>
      <span className={design.badge}>Runde des Tages</span>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Elfmeter, 5 schnelle</h1>
      <p className="mt-2 text-sm text-mist">
        Jeden Tag fünf neue Fragen. Dieselbe Frage kommt frühestens nach {MIN_STRAFFESPARK_REPEAT_DAYS} Tagen wieder.
      </p>
      {dateKey && <p className="mt-1 text-xs text-mist">{formatDateNo(dateKey)}</p>}
    </header>
  );

  if (!dateKey) {
    return (
      <div className={`${design.game} flex flex-col gap-5`} style={shellStyle}>
        {intro}
        <section className={`card p-6 text-center ${design.card}`}>
          <p className="text-mist">Die fünf Elfmeter des Tages werden geladen …</p>
        </section>
      </div>
    );
  }

  if (complete) {
    return (
      <div className={`${design.game} flex flex-col gap-5`} style={shellStyle}>
        {intro}
        <ol aria-label="Deine fünf Elfmeter" className={design.progress}>
          {questions.map((item, i) => <li key={item.id} className={`${design.shot} ${results[i] ? design.goal : design.miss}`} aria-label={`Frage ${i + 1}: ${results[i] ? "Tor" : "verschossen"}`}>{results[i] ? "⚽" : "✕"}</li>)}
        </ol>
        <section className={`card p-6 text-center ${design.card} ${design.completeCard}`}>
          <h2 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold">Du hast {score} von 5 verwandelt!</h2>
          <p className="mt-2 text-mist">{score === 5 ? "Volle Punktzahl — fünf von fünf im Netz!" : "Morgen gibt es fünf neue."}</p>
          <button className="btn btn-primary mt-5" onClick={() => { setIndex(0); setResults([]); setGuess(""); setMediaError(false); }}>Runde des Tages noch einmal spielen</button>
          <Link href="/" className="mt-4 block underline">Zur Startseite</Link>
        </section>
      </div>
    );
  }

  if (!q) {
    return (
      <div className={`${design.game} flex flex-col gap-5`} style={shellStyle}>
        {intro}
        <section className={`card p-6 text-center ${design.card}`}>
          <p className="text-mist">Die Runde des Tages konnte nicht geladen werden.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={`${design.game} flex flex-col gap-5`} style={shellStyle}>
      {intro}
      <ol aria-label="Deine fünf Elfmeter" className={design.progress}>
        {questions.map((item, i) => <li key={item.id} className={`${design.shot} ${i < results.length ? (results[i] ? design.goal : design.miss) : i === index ? design.current : ""}`} aria-label={`Frage ${i + 1}: ${i < results.length ? results[i] ? "Tor" : "verschossen" : "nicht beantwortet"}`}>{i < results.length ? results[i] ? "⚽" : "✕" : "○"}</li>)}
      </ol>
      <section className={`card p-5 ${design.card}`} key={q.id}>
        <p className={design.questionMeta}>Frage {index + 1} von 5 · {q.kind === "photo" ? "Das Bild" : q.kind === "chant" ? "Der Fangesang" : "Fußballwissen"}</p>
        <h2 ref={heading} tabIndex={-1} className={design.prompt}>{q.prompt}</h2>
        {q.media && <div className="mt-4">
          {q.kind === "photo" ? <div className={design.media}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE_PATH}/media/straffespark/${q.media.file}`} alt={answered ? q.answer : "Unscharfes Bild eines Fußballspielers"} className="mx-auto h-64 w-full object-contain" style={{ filter: answered ? "none" : "blur(9px)" }} onError={() => setMediaError(true)} />
          </div> : <audio controls preload="none" className="w-full" src={`${BASE_PATH}/media/straffespark/${q.media.file}`} onError={() => setMediaError(true)}>Dein Browser kann keine Audiodateien abspielen.</audio>}
          <p className="mt-2 text-xs text-mist">{q.media.credit} · {q.media.licence}{q.kind === "photo" && " · Unschärfe im Spiel hinzugefügt"}</p>
          {q.media.sourceUrl && <a className="text-xs underline" href={q.media.sourceUrl} target="_blank" rel="noreferrer">Bildquelle (kann die Lösung verraten)</a>}
          {q.media.licence === "CC BY 4.0" && <a className="ml-3 text-xs underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Lizenz</a>}
          {mediaError && <p role="alert" className="mt-2 text-sm">Das Medium konnte nicht geladen werden. Lade die Seite neu oder überspringe die Frage.</p>}
        </div>}
        {!answered ? <form className={`${design.form} mt-5 flex flex-col gap-3`} onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <label htmlFor="beta-answer" className="text-sm font-semibold">Deine Antwort</label>
          <input id="beta-answer" value={guess} onChange={(e) => setGuess(e.target.value)} maxLength={120} autoComplete="off" className="w-full rounded-lg border border-white/20 bg-ink-3 p-3 text-base" placeholder={q.kind === "photo" ? "Name des Spielers" : "Deine Antwort"} />
          <button className="btn btn-primary" disabled={!guess.trim()} type="submit">Schießen!</button>
          <button className="btn" type="button" onClick={() => submit(true)}>Überspringen</button>
        </form> : <div className={design.answerState} role="status">
          <p className="text-xl font-bold">{results[index] ? "⚽ Tor!" : "Verschossen!"}</p>
          <p className="mt-2">Richtige Antwort: <strong>{q.answer}</strong></p>
          {q.fact && <p className="mt-1 text-sm text-mist">{q.fact}</p>}
          <details className="mt-3 text-xs text-mist"><summary>Quellen</summary><ul className="mt-2 space-y-2">{q.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a> : s.title}</li>)}</ul></details>
          <button className="btn btn-primary mt-5 w-full" onClick={() => { setIndex(index + 1); setGuess(""); setMediaError(false); }}>{index === questions.length - 1 ? "Ergebnis ansehen" : "Nächste Frage"}</button>
        </div>}
      </section>
    </div>
  );
}
