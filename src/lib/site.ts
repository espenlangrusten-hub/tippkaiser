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
/** Default document title suffix: "Quizkaiser – {SITE_TAGLINE}" */
export const SITE_TAGLINE = "Tägliches Fußballquiz | 6 Spiele";
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
    description: "Vervollständige Deutschlands Startelf aus einem echten Länderspiel – Buchstabe für Buchstabe. Jeden Tag neu auf Quizkaiser.",
    emoji: "🇩🇪",
  },
  maalloes: {
    slug: "maalloes",
    name: "Torlos",
    short: "Finde die seltensten Antworten",
    description: "Fünf Antworten auf eine Frage zum deutschen Fußball. Je weniger andere dasselbe tippen, desto mehr Punkte.",
    emoji: "🥅",
  },
  "finn-spilleren": {
    slug: "finn-spilleren",
    name: "Finde den Spieler",
    short: "Fünf Hinweise. Eine Antwort.",
    description: "Fünf Hinweise, eine Antwort. Je früher du richtig liegst, desto mehr Punkte – jeden Tag neu.",
    emoji: "🕵️",
  },
  gullordet: {
    slug: "gullordet",
    name: "Goldwort",
    short: "Fünf Buchstaben. Sechs Versuche.",
    description: "Fünf Buchstaben, sechs Versuche: errate das Fußballwort oder den Namen des Tages.",
    emoji: "🟩",
  },
} as const;

export type GameSlug = keyof typeof GAME_META;
