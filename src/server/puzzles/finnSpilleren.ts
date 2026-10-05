import { inArray } from "drizzle-orm";
import type { Db } from "@/server/db";
import { schema as s } from "@/server/db";
import { POSITION_LABEL } from "@/lib/positions";
import type { FinnSpillerenPayload } from "./types";
import { playerClues } from "./playerClues";

export type FinnSpillerenPuzzleRow = {
  id: string;
  game: "finn-spilleren";
  kind: string;
  title: string;
  payload: FinnSpillerenPayload;
  difficulty: number;
  quality: number;
  era: number;
  tags: string[];
  fingerprint: string;
  sourceRef: string;
};

/**
 * Generate source-backed clue rounds from documented Norway lineups. Each clue is
 * derived from the same match row as the answer, so adding a new verified lineup
 * automatically adds eleven more candidate rounds without editorial guesswork.
 */
/** "2014-07-13" -> "13.07.2014", the way a German reader writes a date. */
const germanDate = (date: string) => date.split("-").reverse().join(".");

export async function buildFinnSpillerenPuzzles(db: Db): Promise<FinnSpillerenPuzzleRow[]> {
  const matches = (await db.select().from(s.matches)).filter((m) => m.lineupComplete && (m.status === "verified" || m.status === "single_source"));
  if (!matches.length) return [];
  const apps = await db.select().from(s.appearances).where(inArray(s.appearances.matchId, matches.map((m) => m.id)));
  const players = await db.select().from(s.players).where(inArray(s.players.id, Array.from(new Set(apps.map((a) => a.playerId)))));
  const aliases = await db.select().from(s.playerAliases).where(inArray(s.playerAliases.playerId, players.map((p) => p.id)));
  const squads = (await db.select().from(s.squadMembers)).filter((s) => s.clubName && (s.status === "verified" || s.status === "single_source"));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const aliasesById = new Map<string, string[]>();
  for (const a of aliases) aliasesById.set(a.playerId, [...(aliasesById.get(a.playerId) ?? []), a.alias]);

  const out: FinnSpillerenPuzzleRow[] = [];
  for (const match of matches) {
    for (const app of apps.filter((a) => a.matchId === match.id && a.starter)) {
      const player = playerById.get(app.playerId);
      if (!player) continue;
      const first = player.displayName.trim().split(/\s+/)[0];
      const surname = player.surname;
      const profile = playerClues.get(player.id);
      // Without a profile the first clue would be "I started for Norway against X",
      // which is equally true of the ten team-mates beside him - unguessable by design.
      // A round is only worth serving when the opening clue points at the person.
      if (!profile) continue;
      const squad = squads.filter((s) => s.playerId === player.id).sort((a, b) => a.tournamentId.localeCompare(b.tournamentId))[0];
      const tournament = squad?.tournamentId.replace("wc-", "WM ").replace("euro-", "EM ");
      // "Gegner: Niederlande" rather than "gegen Niederlande": some countries take an article.
      const matchClue = `Am ${germanDate(match.date)} stand ich in der Startelf (Gegner: ${match.opponent}), Position: ${POSITION_LABEL[app.position]}${app.shirtNumber != null ? `, Rückennummer ${app.shirtNumber}` : ""}.`;
      // Personal first, narrowing to the match last: the three profile clues are about
      // the person, then the squad or result places him, then the match, then the name.
      const hints: FinnSpillerenPayload["hints"] = [
        profile.hints[0],
        profile.hints[1],
        profile.hints[2],
        squad ? `Im deutschen Kader für die ${tournament} stand ich als Spieler von ${squad.clubName}.` : matchClue,
        `Mein Vorname ist ${first}, mein Nachname beginnt mit ${surname[0].toUpperCase()}.`,
      ];
      out.push({
        id: `finn-${match.id}-${player.id}`,
        game: "finn-spilleren",
        kind: "lineup-player",
        title: "Wer ist der Spieler?",
        payload: {
          answerId: player.id,
          answer: player.displayName,
          aliases: Array.from(new Set([player.fullName, player.displayName, player.surname, ...(aliasesById.get(player.id) ?? [])])),
          role: "spiller",
          hints,
          explanation: `${player.displayName} stand am ${germanDate(match.date)} in Deutschlands Startelf (Gegner: ${match.opponent}). ${profile.hints.join(" ")}`,
          status: "single_source",
          sourceIds: [match.id, ...profile.sources.map((src) => src.url)],
        },
        difficulty: Math.max(1, 5.5 - (player.fame ?? 2)),
        quality: match.importance + (player.fame ?? 2) / 10,
        era: Math.floor(Number(match.date.slice(0, 4)) / 10) * 10,
        tags: [match.opponentCode, match.competitionId, "spiller"],
        // The player alone, not the player and the match.
        //
        // The scheduler spaces rounds apart with lineupSimilarity(), which splits the
        // fingerprint on commas and measures overlap - it was written for Mangler XI,
        // whose fingerprints are comma-separated line-ups. "brede-hangeland:1998-..."
        // has no comma, so two rounds with the same answer scored 0, exactly the same
        // as two rounds about different people: the repeat protection did nothing. The
        // thing that must not come round again is the answer, so the answer is the key.
        fingerprint: player.id,
        sourceRef: match.id,
      });
    }
  }
  return out;
}
