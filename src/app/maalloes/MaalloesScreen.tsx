"use client";
import { useSearchParams } from "next/navigation";
import { useGamePuzzle, GameSkeleton, GameUnavailable } from "@/components/GameLoader";
import { MaalloesGame } from "@/components/maalloes/MaalloesGame";
import type { MaalloesPublic } from "@/lib/gameTypes";
import { formatDateNo } from "@/lib/dates";
import { BASE_PATH } from "@/lib/site";
import type { CSSProperties } from "react";
import design from "@/components/maalloes/Maalloes.module.css";

export function MaalloesScreen() {
  const params = useSearchParams();
  const nrParam = params.get("nr");
  const nr = nrParam && /^\d+$/.test(nrParam) ? Number(nrParam) : null;
  const state = useGamePuzzle<MaalloesPublic>("maalloes", nr);

  return (
    <div
      className={design.page}
      style={{
        "--stadium": `url("${BASE_PATH}/design/stadium.webp")`,
        "--game-art": `url("${BASE_PATH}/design/goal.webp")`,
      } as CSSProperties}
    >
      <div className={design.heading}>
        <p className={design.eyebrow}>Fußballwissen <span>•</span> Jeden Tag <span>•</span> Torlos</p>
        <h1 className={design.title}>
          Torlos{state.status === "ready" && state.isArchive && <span> #{state.puzzle.number}</span>}
        </h1>
        <p className={design.subtitle}>Finde die Spiele, die torlos endeten. Je weniger dieselbe Antwort wählen, desto besser.</p>
        {state.status === "ready" && (
          <p className={design.date}>{state.isArchive ? `Archiv · ${formatDateNo(state.puzzle.date)}` : formatDateNo(state.today)}</p>
        )}
      </div>
      <div className={design.gameArea}>
        {state.status === "loading" && <GameSkeleton />}
        {(state.status === "empty" || state.status === "error") && <GameUnavailable game="maalloes" kind={state.status} archive={nr !== null} />}
        {state.status === "ready" && <MaalloesGame puzzle={state.puzzle} isArchive={state.isArchive} today={state.today} />}
      </div>
    </div>
  );
}
