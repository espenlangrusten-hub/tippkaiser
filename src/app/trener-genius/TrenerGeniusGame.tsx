"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiPost, apiBeacon } from "@/lib/api";
import { storedUser } from "@/lib/auth";
import { BASE_PATH, SITE_URL } from "@/lib/site";
import { addRecord } from "@/lib/storage";
import type { GeniusResponse } from "@/lib/trener-genius";
import s from "./TrenerGenius.module.css";

type Reply = GeniusResponse | { ok: false; error: string };
export function TrenerGeniusGame() {
  const [game, setGame] = useState<GeniusResponse | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [offensive, setOffensive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shareText, setShareText] = useState("");
  const [restart, setRestart] = useState(0);
  const [newDay, setNewDay] = useState(false);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = useRef("");

  useEffect(() => {
    let active = true;
    const user = storedUser();
    const key = `tt-genius-attempt:${user?.id ?? "guest"}`;
    let attemptId: string | undefined;
    try { attemptId = localStorage.getItem(key) ?? undefined; } catch { /* storage is optional */ }
    apiPost<Reply>("/trener-genius/start", { attemptId }).then(r => {
      if (!active) return;
      if (!r.ok) { setError(r.error === "no-round" ? "Die Trainerbank des Tages ist noch nicht bereit. Versuch es etwas später noch einmal." : r.error === "unauthorised" ? "Die Anmeldung ist abgelaufen. Melde dich erneut an, um zu spielen." : "Die Runde des Tages konnte nicht geöffnet werden."); return; }
      try { localStorage.setItem(key, r.attemptId); } catch { /* optional */ }
      setGame(r); setError(""); setNewDay(false); setChoice(null); setOffensive(false);
      apiBeacon({ name: "game_start", game: "trener-genius" });
    }).catch(() => { if (active) setError("Keine Verbindung zur Trainerbank. Versuch es noch einmal."); });
    return () => { active = false; };
  }, [restart]);

  useEffect(() => {
    if (!game || game.answers.length !== 4 || completed.current === game.attemptId) return;
    completed.current = game.attemptId;
    addRecord("trener-genius", { date: game.date, won: game.answers.every(a=>a.correct), score: game.points, archive: false, completedAt: new Date().toISOString() });
    apiBeacon({ name: "game_complete", game: "trener-genius", props: { score: game.points } });
  }, [game]);

  const act = useCallback(async (action: "answer" | "help" | "next") => {
    if (!game || pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const r = await apiPost<Reply>(`/trener-genius/${action}`, { attemptId: game.attemptId, index: game.index, ...(action === "answer" ? { option: choice, offensive } : {}) });
      if (!r.ok) {
        if (r.error === "day-changed") { setNewDay(true); setError("Ein neuer Tag hat begonnen. Öffne die Runde des Tages, um weiterzuspielen."); }
        else if (r.error === "unauthorised" || r.error === "not-found") setError("Die Anmeldung hat sich geändert. Öffne die Runde neu oder melde dich erneut an.");
        else setError("Die Antwort konnte nicht gespeichert werden. Versuch es noch einmal.");
        return;
      }
      setGame(r);
      if (action === "help") { setOffensive(false); if (choice !== null && r.hidden.includes(choice)) setChoice(null); }
      else { setChoice(null); setOffensive(false); }
      if (action === "next") requestAnimationFrame(() => heading.current?.focus());
    } catch { setError("Die Verbindung wurde unterbrochen. Versuch es noch einmal – die Antwort zählt nur einmal."); }
    finally { pending.current = false; setBusy(false); }
  }, [game, choice, offensive]);

  const share = async () => {
    if (!game) return;
    const text = `Trainer-Genie #${game.number} · ${game.date}\n${game.answers.map(a => a.offensive ? a.correct ? "⭐" : "🟥" : a.correct ? "🟩" : "⬜").join("")}\n${game.points}/100 Punkte\n${SITE_URL}/trener-genius/`;
    try { await navigator.clipboard.writeText(text); setShareText("Resultatet er kopiert!"); }
    catch { setShareText(text); }
  };
  const reveal = game?.phase === "reveal";
  const done = game?.phase === "done";
  const last = game?.answers[game.index];
  const helpAvailable = !!game && !game.helpUsed && !reveal && !done;
  const offenseAvailable = !!game && !game.offensiveUsed && !game.hidden.length && !reveal && !done;
  const score = game ? game.answers.length === 4 ? game.points : game.total : 0;

  return <div className={s.shell}>
    <div className={s.stadium} aria-hidden="true"><Image src={BASE_PATH + "/design/stadium.webp"} alt="" fill priority sizes="100vw" /></div>
    <Link className={s.back} href="/">← Alle Spiele</Link>
    <div className={s.stage}>
      <div className={s.coach} aria-hidden="true"><Image src={BASE_PATH + "/trener-genius/dugout.webp"} alt="" fill priority sizes="(max-width: 760px) 1px, 450px" /><p className={s.bubble}>{done ? "Neuer Tag, neue Chancen. Wir sehen uns auf der Bank!" : reveal ? last?.correct ? "Der saß! Gut gelesen." : "Kopf hoch. Die nächste Chance kommt!" : "Glaubst du an deine Antwort? Geh offensiv!"}</p></div>
      <header className={s.header}>
        <div><h1>TRAINER <span>GENIE</span></h1><p>Vier Fragen. Eine taktische Wahl.</p></div>
        <div className={s.score} aria-label={`${score} Punkte`}><strong>{score}</strong><span>PUNKTE</span></div>
      </header>
      <div className={s.progress}><span>{game ? `RUNDE DES TAGES #${game.number}` : "RUNDE DES TAGES"}</span><ol aria-label="Fortschritt">{[0,1,2,3].map(i => <li key={i} aria-current={game?.index === i && !done ? "step" : undefined} className={game?.answers[i] ? game.answers[i].correct ? s.correctStep : s.wrongStep : game?.index === i ? s.activeStep : ""}>{game?.answers[i] ? game.answers[i].correct ? "✓" : "×" : i+1}</li>)}</ol><small>0–100 Ligapunkte</small></div>
      <section className={s.panel} aria-busy={busy}>
        {!game && !error && <div className={s.loading} role="status"><span className={s.badge}>WILLKOMMEN AUF DER BANK</span><h2>Die vier Fragen des Tages werden geladen …</h2><div /><div /><div /></div>}
        {error && <div className={s.error} role="alert"><p>{error}</p><button onClick={() => { setGame(null); setError(""); setRestart(n=>n+1); }}>{newDay ? "Runde des Tages öffnen" : "Runde neu öffnen"}</button><Link href="/liga/#login">Anmelden</Link></div>}
        {game && !done && <>
          <div className={s.badge}>{game.question?.category} · FRAGE {game.index+1} VON 4</div>
          <h2 ref={heading} tabIndex={-1} className={s.question}>{game.question?.prompt}</h2>
          <div className={s.options} role="group" aria-label="Svaralternativer">{game.question?.options.map((option,i) => {
            const correct = reveal && game.reveal?.answerIndex === i;
            const wrong = reveal && last?.option === i && !last.correct;
            const hidden = game.hidden.includes(i);
            return <button key={i} disabled={busy || reveal || hidden || newDay} aria-pressed={!reveal && choice === i} onClick={() => setChoice(i)} className={`${s.option} ${choice === i && !reveal ? s.selected : ""} ${correct ? s.correct : ""} ${wrong ? s.wrong : ""} ${hidden ? s.hidden : ""}`}><span className={s.letter}>{correct ? "✓" : wrong ? "×" : "ABCD"[i]}</span><span>{option}</span>{hidden && <span className={s.removed}>Entfernt</span>}</button>;
          })}</div>
          {reveal && game.reveal ? <div className={s.reveal} role="status">
            <div className={s.revealTitle}><strong>{last?.correct ? "Richtig!" : "Richtige Antwort:"} {game.reveal.answer}</strong><b>{last && last.delta > 0 ? "+" : ""}{last?.delta} Punkte</b></div>
            <p>{game.reveal.fact}</p>
            <details><summary>Quelle ansehen</summary>{game.reveal.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</details>
            <button className={s.primary} disabled={busy || newDay} onClick={()=>void act("next")}>{game.index === 3 ? "Ergebnis ansehen" : "Nächste Frage"} →</button>
          </div> : <>
            <div className={s.tactics}>
              <button className={`${s.tactic} ${s.attack} ${offensive ? s.armed : ""}`} disabled={!offenseAvailable || busy || newDay} aria-pressed={offensive} onClick={()=>setOffensive(v=>!v)}><span className={s.icon}>★</span><span><strong>{game.offensiveUsed ? "Offensive genutzt" : offensive ? "Du gehst offensiv!" : "Offensiv gehen"}</strong><small>+50 richtig / −25 falsch</small><small>Einmal pro Runde</small></span></button>
              <button className={s.tactic} disabled={!helpAvailable || busy || offensive || newDay} onClick={()=>void act("help")}><span className={s.icon}>◉</span><span><strong>{game.helpUsed ? "50/50 genutzt" : "50/50-Joker"}</strong><small>Zwei Antworten weg · Max. 10 Punkte</small><small>Einmal pro Runde</small></span></button>
            </div>
            <p className={s.tacticNote}>Nicht bei derselben Frage kombinierbar.</p>
            <button className={s.primary} disabled={choice === null || busy || newDay} onClick={()=>void act("answer")}>{busy ? "Wird gespeichert …" : offensive ? "Offensive Antwort festlegen" : "Antwort festlegen"}</button>
            <p className={s.note}>{choice === null ? "Wähle zuerst eine Antwort" : offensive ? "Dein Einsatz: +50 richtig / −25 falsch" : game.hidden.length ? "Richtig mit Joker gibt 10 Punkte" : "Bereit? Du kannst deine Wahl vor dem Festlegen ändern."}</p>
            <p className={s.small}>Normale Antwort: +25 richtig / 0 falsch</p>
          </>}
        </>}
        {game && done && <div className={s.results}>
          <span className={s.badge}>RUNDE DES TAGES ERLEDIGT</span><h2>{game.points === 100 ? "Trainergenie!" : game.points >= 50 ? "Starkes Coaching!" : "Neue Chance morgen!"}</h2>
          <div className={s.finalScore}>{game.points}<span>/100 Punkte</span></div>
          <p>{game.answers.filter(a=>a.correct).length} von 4 richtig · {game.offensiveUsed ? "Offensive genutzt" : "Ohne Offensive gespielt"}</p>
          {game.total !== game.points && <p className={s.small}>Spielsumme {game.total}. Das Endergebnis ist auf 0–100 Punkte begrenzt.</p>}
          <p className={s.rankNote}>{game.ranked ? "Die Punkte sind in der Monatsliga eingetragen." : "Du hast als Gast gespielt. Melde dich vor der nächsten Runde an, um Ligapunkte zu sammeln."}</p>
          <div className={s.recap}>{game.recap?.map((q,i)=><details key={i}><summary><span className={q.correct ? s.yes : s.no}>{q.correct ? "✓" : "×"}</span> Frage {i+1}<strong>{q.delta > 0 ? "+" : ""}{q.delta} p</strong></summary><p>{q.prompt}</p><b>{q.answer}</b><p>{q.fact}</p></details>)}</div>
          <button className={s.primary} onClick={()=>void share()}>Ergebnis teilen ↗</button>
          {shareText && <p className={s.shareText} role="status">{shareText}</p>}
          <div className={s.resultLinks}><Link href="/liga/">Zur Monatsliga →</Link><Link href="/">Mehr Spiele →</Link></div>
          <p className={s.note}>Neue Runde um 00:00 Uhr deutscher Zeit</p>
        </div>}
      </section>
      <details className={s.rules}><summary>So wird gespielt</summary><p>Vier Fragen, vier Antwortmöglichkeiten und dieselbe Tagesrunde für alle. Eine leichte, zwei mittlere und eine schwere Frage. Kein Zeitdruck.</p><p>Eine richtige Antwort gibt 25 Punkte. Einmal darfst du offensiv gehen: +50 bei einer richtigen Antwort und −25 bei einer falschen. Der 50/50-Joker kann einmal genutzt werden, entfernt zwei falsche Antworten und gibt 10 Punkte, wenn du richtig liegst. Joker und Offensive lassen sich nicht kombinieren. Das Endergebnis ist auf 0–100 begrenzt.</p><p>Melde dich vor dem Start an, um Ligapunkte zu sammeln. Die Lösung erscheint nach jeder Antwort. Deine Antworten werden automatisch gespeichert.</p></details>
    </div>
  </div>;
}
