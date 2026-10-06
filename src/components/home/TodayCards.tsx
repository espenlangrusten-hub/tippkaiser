"use client";

import Image from "next/image";
import { ReferenceArt } from "@/components/layout/ReferenceArt";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { BASE_PATH, type GameSlug } from "@/lib/site";
import { loadRecords } from "@/lib/storage";
import { computeStreak } from "@/lib/streaks";
import { TopPlayers } from "./TopPlayers";
import { AccountNudge } from "./AccountNudge";
import s from "./StadiumHome.module.css";

type DailySlug = GameSlug | "trener-genius";
type HomeGame = {
  slug: string;
  recordSlug?: DailySlug;
  name: string;
  description: string;
  art: "xi" | "goal" | "mystery" | "penalty" | "trainer" | "word";
  image?: string;
};

const games: HomeGame[] = [
  { slug: "mangler-xi", recordSlug: "mangler-xi", name: "Fehlende Elf", description: "Welche Spieler fehlen in der Aufstellung?", art: "xi", image: "/design/xi.webp" },
  { slug: "maalloes", recordSlug: "maalloes", name: "Torlos", description: "Errate Spiele, in denen keiner trifft.", art: "goal", image: "/design/goal.webp" },
  { slug: "finn-spilleren", recordSlug: "finn-spilleren", name: "Finde den Spieler", description: "Welchen Spieler suchen wir?", art: "mystery", image: "/design/mystery.webp" },
  { slug: "straffespark", name: "Elfmeter", description: "Fünf neue Fragen jeden Tag.", art: "penalty", image: "/design/penalty.webp" },
  { slug: "gullordet", recordSlug: "gullordet", name: "Goldwort", description: "Fünf Buchstaben. Sechs Versuche.", art: "word" },
  { slug: "trener-genius", recordSlug: "trener-genius", name: "Trainer-Genie", description: "Vier Fragen. Eine taktische Wahl.", art: "trainer", image: "/trener-genius/card-retro.webp" },
];

export function TodayCards() {
  const [done, setDone] = useState<Partial<Record<DailySlug, boolean>>>({});
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<{ ok: boolean; today?: string }>("/today?game=mangler-xi")
      .then((response) => {
        if (!active || !response.today) return;
        const tracked: DailySlug[] = ["mangler-xi", "maalloes", "finn-spilleren", "gullordet", "trener-genius"];
        setStreak(computeStreak(tracked.flatMap((slug) => loadRecords(slug)), response.today).current);
        setDone(Object.fromEntries(tracked.map((slug) => [slug, loadRecords(slug).some((record) => record.date === response.today && !record.archive)])));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>Fußballwissen <span>•</span> Jeden Tag <span>•</span> Für alle</p>
          <h1>Die Fußballspiele des Tages — jeden Tag neue Aufgaben<span className="sr-only"> Wie gut kennst du den deutschen Fußball?</span></h1>
          <p className={s.lead}>Quizkaiser ist der Ort für alle, die Fußball und gute Knobeleien lieben. Sechs tägliche Spiele, neue Herausforderungen und eine Liga mit Freunden und anderen Fußballverrückten.</p>
          <div className={s.heroActions}>
            <Link href="#spill" className={s.primary}>Spiele des Tages starten <span aria-hidden="true">→</span></Link>
            {streak ? <span className={s.streak}><b>{streak}</b> {streak === 1 ? "Tag" : "Tage"} in Folge</span> : null}
          </div>
          <AccountNudge />
        </div>

        <div className={s.heroArt} aria-hidden="true">
          <ReferenceArt name="homeHero" />
        </div>
      </section>

      <section id="spill" className={s.gamesSection} aria-label="Spiele des Tages">
        <div className={s.sectionHeading}>
          <div>
            <h3>Unsere Spiele</h3>
            <p>Sechs verschiedene Arten, dein Fußballwissen zu testen. Jeden Tag neue Aufgaben!</p>
          </div>
          <Link href="/arkiv/">Alle Spiele ansehen <span aria-hidden="true">→</span></Link>
        </div>

        <div className={s.gameGrid}>
          {games.map((game) => {
            const completed = game.recordSlug ? done[game.recordSlug] : false;
            return (
              <Link
                key={game.slug}
                href={`/${game.slug}/`}
                className={`${s.gameCard} ${s[game.art]}`}
                aria-label={
                  game.slug === "mangler-xi" ? (completed ? "Ergebnis für Fehlende Elf ansehen" : "Die Elf des Tages spielen") :
                  game.slug === "maalloes" ? (completed ? "Ergebnis für Torlos ansehen" : "Torlos spielen") :
                  game.slug === "finn-spilleren" ? (completed ? "Ergebnis für Finde den Spieler ansehen" : "Finde den Spieler spielen") :
                  game.slug === "straffespark" ? "Elfmeter spielen, die 5 des Tages" :
                  game.slug === "gullordet" ? (completed ? "Ergebnis für Goldwort ansehen" : "Goldwort spielen") :
                  completed ? "Ergebnis für Trainer-Genie ansehen" : "Trainer-Genie spielen"
                }
              >
                <div className={s.gameArt}>
                  {game.art === "trainer"
                    ? <Image src={BASE_PATH + game.image!} alt="" fill sizes="(max-width: 760px) 50vw, 20vw" />
                    : game.art === "word"
                      ? <Image src={BASE_PATH + "/gullordet/logo.webp"} alt="" fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 17vw" className={s.wordLogo} />
                      : <ReferenceArt name={game.art} />}
                </div>
                <div className={s.gameCopy}>
                  <div>
                    <h2>{game.name}</h2>
                    <p>{game.description}</p>
                  </div>
                  <span className={s.gameArrow} aria-hidden="true">→</span>
                  <small>{completed ? "✓ Erledigt" : "JEDEN TAG NEUE AUFGABEN"}</small>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={s.communityGrid}>
        <TopPlayers />

        <Link href="/liga/" className={s.friendCard}>
          <div className={s.friendCopy}>
            <p className={s.smallKicker}>Liga und Freunde</p>
            <h2>Gründe deine eigene Freundesliga</h2>
            <p>Spiel gegen Freunde, Kollegen oder die ganze Fußballclique. Wer weiß am meisten?</p>
            <span>Liga gründen <b aria-hidden="true">→</b></span>
          </div>
          <div className={s.friendArt}><ReferenceArt name="friends" /></div>
          
        </Link>

        <div className={s.sideStack}>
          <aside className={s.factCard}>
            <p className={s.factKicker}>★ Fakt des Tages</p>
            <p>Deutschland ist viermal Weltmeister geworden: 1954, 1974, 1990 und 2014.</p>
            <div className={s.factArt}><ReferenceArt name="trophy" /></div>
          </aside>


        </div>
      </section>
    </div>
  );
}
