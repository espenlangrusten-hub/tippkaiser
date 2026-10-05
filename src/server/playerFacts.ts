/**
 * What the archive can say about a player, without anyone writing it.
 *
 * Every fact here is computed from the match files, so it traces back to the matches
 * that produced it and inherits their sourcing. Nothing is recalled: a hand-written
 * anecdote is only as good as its source, and an unsourced one would sit in the game
 * looking exactly as authoritative as the curated lineups.
 *
 * Shared by the Mangler XI puzzle builder, which ships a few of these with each puzzle,
 * and by scripts/build-player-facts.ts, which writes the full sheet for review. One copy,
 * so the game can never show a fact the review file has not seen.
 */
import { POSITION_LABEL, type Position } from "@/lib/positions";
import { normalizeName } from "@/lib/names";

/** The minimum each caller has to supply; the db rows and the dataset both reduce to this. */
export type FactMatch = {
  id: string;
  date: string;
  opponent: string;
  competitionLabel: string;
  norwayHome: boolean;
  score: [number, number];
};
export type FactAppearance = {
  matchId: string;
  playerId: string;
  starter: boolean;
  position: Position | null;
  shirtNumber: number | null;
  captain: boolean;
};
export type FactGoal = { matchId: string; playerId: string | null };

/** "2014-07-13" -> "13.07.2014". */
const de = (date: string) => date.split("-").reverse().join(".");

export type PlayerFact = { kind: string; text: string; matchIds: string[] };

/** How the scoreline reads from Norway's side. */
export const scoreline = (m: FactMatch) =>
  m.norwayHome ? `Deutschland ${m.score[0]}:${m.score[1]} ${m.opponent}` : `${m.opponent} ${m.score[1]}:${m.score[0]} Deutschland`;

/**
 * A fact that contains the player's own name is not a hint, it is the answer.
 *
 * Nothing below writes a name, but the archive supplies the opponents, and Norway has
 * played clubs and countries whose names collide with a surname. Checking is cheaper
 * than finding out from a player who got the answer handed to him.
 */
export function leaksAnswer(text: string, displayName: string, surname?: string): boolean {
  const haystack = normalizeName(text);
  // The surname is the answer, so it is checked at any length. Norway has fielded a Flo,
  // a Berg and a Lund, and a four-letter floor let every one of them through: "Startet
  // mot Flo United" would have handed the player the answer it was charging him for.
  // Given names keep the floor, so an "Ole" or "Jan" inside ordinary prose is not a hit.
  const needles = [
    ...(surname ? [surname] : []),
    ...displayName.split(/\s+/).filter((n) => n.length >= 4),
  ].filter((n) => n.length >= 2);
  return needles.some((n) => new RegExp(`(^| )${normalizeName(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(haystack));
}

export function factsFor(
  playerId: string,
  displayName: string,
  matches: Map<string, FactMatch>,
  appearances: FactAppearance[],
  goals: FactGoal[],
  surname?: string,
): PlayerFact[] {
  const apps = appearances
    .filter((a) => a.playerId === playerId)
    .map((a) => ({ ...a, match: matches.get(a.matchId) }))
    .filter((a): a is typeof a & { match: FactMatch } => !!a.match)
    .sort((a, b) => a.match.date.localeCompare(b.match.date));
  const starts = apps.filter((a) => a.starter);
  if (!starts.length) return [];

  const scored = goals
    .filter((g) => g.playerId === playerId)
    .map((g) => matches.get(g.matchId))
    .filter((m): m is FactMatch => !!m)
    .sort((a, b) => a.date.localeCompare(b.date));

  const out: PlayerFact[] = [];
  const debut = starts[0];
  const last = starts[starts.length - 1];

  out.push({
    kind: "debut",
    text: `Erstes Spiel im Archiv in der Startelf: ${de(debut.match.date)}, ${debut.match.competitionLabel}. Es endete ${scoreline(debut.match)}.`,
    matchIds: [debut.matchId],
  });

  if (starts.length > 1) {
    const years = Number(last.match.date.slice(0, 4)) - Number(debut.match.date.slice(0, 4));
    out.push({
      kind: "omfang",
      text: years >= 1
        ? `${starts.length} Spiele im Archiv in der Startelf, verteilt über ${years} ${years === 1 ? "Jahr" : "Jahre"} von ${debut.match.date.slice(0, 4)} bis ${last.match.date.slice(0, 4)}.`
        : `${starts.length} Spiele im Archiv in der Startelf, alle ${debut.match.date.slice(0, 4)}.`,
      matchIds: starts.map((a) => a.matchId),
    });
  }

  // Never a total. Only 49 of the 362 matches carry a complete goal list, so counting the
  // goals we happen to hold and calling it a tally understates almost everybody: "scoret
  // ett mål" reads as "scored once for Norway", which for most of these men is false.
  // Naming a match we do have is true either way.
  if (scored.length) {
    const scoredOnDebut = scored.some((m) => m.id === debut.matchId);
    out.push({
      kind: "mål",
      text: scoredOnDebut
        ? `Traf schon im ersten Spiel im Archiv (${de(debut.match.date)}, Gegner: ${debut.match.opponent}).`
        : `Traf am ${de(scored[0].date)} (Gegner: ${scored[0].opponent})${scored.length > 1 ? ` und am ${de(scored[scored.length - 1].date)} (Gegner: ${scored[scored.length - 1].opponent})` : ""}.`,
      matchIds: scored.map((m) => m.id),
    });
  }

  const asCaptain = starts.filter((a) => a.captain);
  if (asCaptain.length)
    out.push({
      kind: "kaptein",
      text: `Trug die Kapitänsbinde in ${asCaptain.length === 1 ? "einem Spiel" : `${asCaptain.length} Spielen`}, zuerst am ${de(asCaptain[0].match.date)} (Gegner: ${asCaptain[0].match.opponent}).`,
      matchIds: asCaptain.map((a) => a.matchId),
    });

  const positions = [...new Set(starts.map((a) => a.position).filter((p): p is Position => !!p && p !== "OUT"))];
  if (positions.length === 1)
    out.push({ kind: "posisjon", text: `Stand in den Spielen mit dokumentierter Rolle immer als ${POSITION_LABEL[positions[0]]} in der Startelf.`, matchIds: starts.map((a) => a.matchId) });
  else if (positions.length > 1)
    out.push({ kind: "posisjon", text: `In mehreren Rollen eingesetzt: ${positions.map((p) => POSITION_LABEL[p]).join(", ")}.`, matchIds: starts.map((a) => a.matchId) });

  const numbers = [...new Set(starts.map((a) => a.shirtNumber).filter((n): n is number => n != null))].sort((a, b) => a - b);
  if (numbers.length === 1) out.push({ kind: "draktnummer", text: `Trug immer die Rückennummer ${numbers[0]}.`, matchIds: starts.map((a) => a.matchId) });
  else if (numbers.length > 1) out.push({ kind: "draktnummer", text: `Trug ${numbers.length} verschiedene Rückennummern: ${numbers.join(", ")}.`, matchIds: starts.map((a) => a.matchId) });

  const wins = starts.filter((a) => a.match.score[0] > a.match.score[1]);
  if (wins.length) {
    const best = wins.sort((a, b) => (b.match.score[0] - b.match.score[1]) - (a.match.score[0] - a.match.score[1]))[0];
    if (best.match.score[0] - best.match.score[1] >= 3) {
      // Not scoreline() here: it already names Norway, so "Norge vant Kypros 0-3 Norge"
      // came out of the away fixtures. Norway's own goals first, and say where it was.
      const g = best.match;
      out.push({
        kind: "største seier",
        text: `Stand auf dem Platz, als Deutschland am ${de(g.date)} ${g.norwayHome ? "zu Hause" : "auswärts"} ${g.score[0]}:${g.score[1]} gewann (Gegner: ${g.opponent}).`,
        matchIds: [best.matchId],
      });
    }
  }

  return out.filter((f) => !leaksAnswer(f.text, displayName, surname));
}

/**
 * The facts Mangler XI may serve for one player in one match.
 *
 * The match being played is dropped: its date, opponent and scoreline are printed above
 * the pitch, so "startet mot Kamerun 1990-10-31" on that very puzzle tells the player
 * nothing he cannot already read, and reads like a bug.
 */
export function factsForPuzzle(facts: PlayerFact[], matchId: string): string[] {
  return facts.filter((f) => !(f.matchIds.length === 1 && f.matchIds[0] === matchId)).map((f) => f.text);
}
