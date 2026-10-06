/**
 * What the monthly league says about itself, given only the dates.
 *
 * Kept pure and out of the components so every phase of a month can be tested with a
 * fixed date, and so the front page and /liga cannot drift into saying different things
 * about the same table. "Today" is the server's Oslo date from /leaderboard, not the
 * browser's clock: a phone set to another time zone must not announce the last day of
 * September on the first of October.
 */
import { addDays, daysBetween, monthNameNo } from "./dates";

export type LeagueMonth = { from: string; to: string; end: string };
export type Champion = { month: string; username: string; points: number; played?: number } | null;

/** The last week is when a month's race is worth calling out. */
export const FINAL_STRETCH_DAYS = 7;

export type MonthCopy = {
  /** "September" */
  month: string;
  /** "September 2026 · Ligapunkte" */
  period: string;
  /** One line on where the month stands. */
  pulse: { lead: string; rest: string; urgent: boolean };
  /** Last month's winner, shown in gold. */
  champion: { kicker: string; name: string; points: string } | null;
  /** Said instead, while there is no winner to show yet. */
  noChampion: string | null;
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtPoints = (n: number) => `${new Intl.NumberFormat("de-DE").format(n)} Punkte`;

export function monthCopy(month: LeagueMonth, champion: Champion): MonthCopy {
  const name = monthNameNo(month.to);
  const next = monthNameNo(addDays(month.end, 1));
  const daysLeft = daysBetween(month.to, month.end); // days after today
  const dayOfMonth = daysBetween(month.from, month.to) + 1;

  let pulse: MonthCopy["pulse"];
  if (daysLeft === 0) {
    pulse = { lead: "Letzter Tag.", rest: `Um Mitternacht steht der Quizkaiser im ${name} fest.`, urgent: true };
  } else if (daysLeft === 1) {
    pulse = { lead: "Noch ein Tag.", rest: "Wer wird Quizkaiser des Monats?", urgent: true };
  } else if (daysLeft <= FINAL_STRETCH_DAYS) {
    pulse = { lead: `Noch ${daysLeft} Tage im ${name}.`, rest: "Wer wird Quizkaiser des Monats?", urgent: true };
  } else if (dayOfMonth <= 3) {
    pulse = { lead: "Neuer Monat, neues Glück.", rest: "Alle starten bei null.", urgent: false };
  } else {
    pulse = { lead: `Neustart am 1. ${next}.`, rest: "Jeder Tag zählt.", urgent: false };
  }

  const shown = champion && champion.month !== month.from.slice(0, 7) ? champion : null;
  return {
    month: name,
    period: `${capital(name)} ${month.to.slice(0, 4)} · Ligapunkte`,
    pulse,
    champion: shown
      ? { kicker: `Quizkaiser des Monats · ${monthNameNo(`${shown.month}-01`)}`, name: shown.username, points: fmtPoints(shown.points) }
      : null,
    // No month has been decided yet, or last month nobody played. Either way the honest
    // thing to say is when the next one is decided, and that it is still open.
    // Not "the first gold name": that stops being true the first time a later month ends
    // without a winner, and nothing on the client knows which case it is in.
    noChampion: shown ? null : `Am 1. ${next} steht hier der Quizkaiser im ${name} in Gold. Bleib dran bis zum Monatsende!`,
  };
}
