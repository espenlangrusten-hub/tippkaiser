// GENERATED FILE – do not edit. Source: src/lib/<name>. Run `npm run sync:shared`.
/** Pitch positions. Shared by the database schema, the Next app and the Deno Edge Function. */
/** `OUT` is a documented starter whose exact playing position is not in the source. */
export const POSITIONS = ["GK", "OUT", "RB", "CB", "LB", "RWB", "LWB", "DF", "DM", "CM", "RM", "LM", "AM", "MF", "RW", "LW", "SS", "CF", "FW"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Torwart",
  OUT: "Feldspieler",
  RB: "Rechtsverteidiger",
  CB: "Innenverteidiger",
  LB: "Linksverteidiger",
  RWB: "Rechter Schienenspieler",
  LWB: "Linker Schienenspieler",
  DF: "Abwehr",
  DM: "Defensives Mittelfeld",
  CM: "Zentrales Mittelfeld",
  RM: "Rechtes Mittelfeld",
  LM: "Linkes Mittelfeld",
  AM: "Offensives Mittelfeld",
  MF: "Mittelfeld",
  RW: "Rechtsaußen",
  LW: "Linksaußen",
  SS: "Hängende Spitze",
  CF: "Mittelstürmer",
  FW: "Angriff",
};
