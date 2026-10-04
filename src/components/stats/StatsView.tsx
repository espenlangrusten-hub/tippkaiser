"use client";
import { useEffect, useState } from "react";
import { computeStreak, type GameRecord } from "@/lib/streaks";
import { loadRecords } from "@/lib/storage";

export function StatsView({ today }: { today: string }) {
  const [mxi, setMxi] = useState<GameRecord[]>([]);
  const [mal, setMal] = useState<GameRecord[]>([]);
  const [finn, setFinn] = useState<GameRecord[]>([]);
  const [genius, setGenius] = useState<GameRecord[]>([]);
  const [gull, setGull] = useState<GameRecord[]>([]);
  useEffect(() => {
    setMxi(loadRecords("mangler-xi"));
    setMal(loadRecords("maalloes"));
    setFinn(loadRecords("finn-spilleren"));
    setGenius(loadRecords("trener-genius"));
    setGull(loadRecords("gullordet"));
  }, []);
  const all = [...mxi, ...mal, ...finn, ...genius, ...gull];
  const streak = computeStreak(all, today);
  const sMxi = computeStreak(mxi, today);
  const sMal = computeStreak(mal, today);
  const sFinn = computeStreak(finn, today);
  const sGenius = computeStreak(genius, today);
  const sGull = computeStreak(gull, today);
  const officialMxi = mxi.filter((r) => !r.archive);
  const officialMal = mal.filter((r) => !r.archive);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const dist = Array.from({ length: 12 }, (_, i) => mxi.filter((r) => r.score === i).length);
  const maxDist = Math.max(1, ...dist);
  const both = new Set(officialMxi.map((r) => r.date)).size ? officialMal.filter((r) => officialMxi.some((x) => x.date === r.date)).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-4xl font-bold uppercase">Statistik</h1>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Tage in Folge" value={`🔥 ${streak.current}`} />
        <Stat label="Beste Serie" value={String(streak.best)} />
        <Stat label="Spiele insgesamt" value={String(all.length)} />
      </div>
      <section className="card p-4">
        <h2 className="font-display text-2xl font-bold uppercase">🇩🇪 Fehlende Elf</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Gespielt" value={String(mxi.length)} small />
          <Stat label="Volltreffer (11/11)" value={String(mxi.filter((r) => r.won).length)} small />
          <Stat label="Schnitt gefunden" value={avg(mxi.map((r) => r.score))?.toString() ?? "–"} small />
        </div>
        <p className="mt-2 text-xs text-mist">Serie: {sMxi.current} · beste {sMxi.best}</p>
        {mxi.length ? (
          <div className="mt-3">
            <div className="text-xs uppercase tracking-widest text-mist">Verteilung (Anzahl gefunden)</div>
            <div className="mt-1 flex flex-col gap-1">
              {dist.map((n, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-right font-display text-sm">{i}</span>
                  <div className="h-4 rounded bg-correct/80" style={{ width: `${(n / maxDist) * 100}%`, minWidth: n ? 8 : 0 }} />
                  <span className="text-mist">{n || ""}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-mist">Spiele eine Runde Fehlende Elf, um eine Ergebnisverteilung zu sehen.</p>
        )}
      </section>
      <section className="card p-4">
        <h2 className="font-display text-2xl font-bold uppercase">🥅 Torlos</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Gespielt" value={String(mal.length)} small />
          <Stat label="Abstieg vermieden" value={String(mal.filter((r) => r.won).length)} small />
          <Stat label="Schnitt Punkte" value={avg(mal.map((r) => r.score))?.toString() ?? "–"} small />
        </div>
        <p className="mt-2 text-xs text-mist">Serie: {sMal.current} · beste {sMal.best}</p>
      </section>
      <section className="card p-4">
        <h2 className="font-display text-2xl font-bold uppercase">🕵️ Finde den Spieler</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Gespielt" value={String(finn.length)} small />
          <Stat label="Gelöst" value={String(finn.filter((r) => r.won).length)} small />
          <Stat label="Schnitt Punkte" value={avg(finn.map((r) => r.score))?.toString() ?? "–"} small />
        </div>
        <p className="mt-2 text-xs text-mist">Serie: {sFinn.current} · beste {sFinn.best}</p>
      </section>
      <section className="card p-4">
        <h2 className="font-display text-2xl font-bold uppercase">🧠 Trainer-Genie</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Gespielt" value={String(genius.length)} small />
          <Stat label="4 von 4" value={String(genius.filter((r) => r.won).length)} small />
          <Stat label="Schnitt Punkte" value={avg(genius.map((r) => r.score))?.toString() ?? "–"} small />
        </div>
        <p className="mt-2 text-xs text-mist">Serie: {sGenius.current} · beste {sGenius.best}</p>
      </section>
      <section className="card p-4">
        <h2 className="font-display text-2xl font-bold uppercase">🟩 Goldwort</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Stat label="Gespielt" value={String(gull.length)} small />
          <Stat label="Gelöst" value={String(gull.filter((r) => r.won).length)} small />
          <Stat label="Schnitt Punkte" value={avg(gull.map((r) => r.score))?.toString() ?? "–"} small />
        </div>
        <p className="mt-2 text-xs text-mist">Serie: {sGull.current} · beste {sGull.best}</p>
      </section>
      <section className="card p-4 text-sm text-mist">
        <p>
          Tage mit beiden Spielen erledigt: <b className="text-snow">{both}</b>. Die Statistik wird nur in deinem Browser gespeichert. Archivspiele zählen nicht für die Serie.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={`card p-3 text-center ${small ? "" : "py-4"}`}>
      <div className={`font-display font-bold leading-none ${small ? "text-2xl" : "text-3xl"}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-mist">{label}</div>
    </div>
  );
}
