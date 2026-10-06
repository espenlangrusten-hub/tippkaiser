/**
 * Build-time configuration.
 *
 * These read `||` rather than `??` on purpose: GitHub Actions passes an *empty
 * string* for a variable that has not been set, which `??` would happily keep and
 * which then breaks things far from the cause (an empty SITE_URL used to crash the
 * build inside `new URL()`).
 */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Quizkaiser";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3200").replace(/\/$/, "");
export const SITE_TAGLINE = "Tägliches Fußballquiz";
/**
 * Search engines are kept out until launch: the test site on github.io is for invited
 * testers. Set NEXT_PUBLIC_INDEXABLE=true for the build on quizkaiser.de.
 */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";

export const GAME_META = {
  "mangler-xi": {
    slug: "mangler-xi",
    name: "Fehlende Elf",
    short: "Vervollständige Deutschlands Startelf",
    description: "Kennst du noch Deutschlands Startelf aus einem historischen Länderspiel? Errate die Spieler Buchstabe für Buchstabe.",
    emoji: "🇩🇪",
  },
  maalloes: {
    slug: "maalloes",
    name: "Torlos",
    short: "Finde die seltensten Antworten",
    description: "Fünf Antworten auf eine Frage zum deutschen Fußball. Je weniger Leute dasselbe antworten wie du, desto besser.",
    emoji: "🥅",
  },
  "finn-spilleren": {
    slug: "finn-spilleren",
    name: "Finde den Spieler",
    short: "Fünf Hinweise. Eine Antwort.",
    description: "Finde den Spieler oder Trainer. Eine frühe richtige Antwort gibt die meisten Punkte; eine falsche beendet die Runde.",
    emoji: "🕵️",
  },
  gullordet: {
    slug: "gullordet",
    name: "Goldwort",
    short: "Fünf Buchstaben. Sechs Versuche.",
    description: "Errate das deutsche Fußballwort oder den Fußballnamen des Tages in sechs Versuchen.",
    emoji: "🟩",
  },
} as const;

export type GameSlug = keyof typeof GAME_META;
