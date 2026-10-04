import { BASE_PATH } from "@/lib/site";

// Art-only windows into the supplied design sheets. Keeping the originals intact
// avoids recompression; text, controls and user data are always rendered as HTML.
const windows = {
  logo: ["home", 70, 22, 270, 40],
  homeHero: ["home", 615, 74, 803, 339],
  leagueHero: ["league", 550, 74, 868, 205],
  xiHero: ["xi", 630, 74, 788, 213],
  xi: ["home", 74, 483, 251, 132],
  goal: ["home", 342, 483, 248, 132],
  mystery: ["home", 606, 483, 238, 132],
  penalty: ["home", 861, 484, 246, 131],
  friends: ["home", 778, 765, 267, 221],
  trophy: ["home", 1244, 822, 133, 163],
  profile: ["league", 32, 796, 461, 84],
  cheer: ["xi", 1202, 684, 190, 152],
  ball: ["xi", 1270, 875, 120, 120],
  ground: ["xi", 706, 306, 247, 128],
} as const;

// Tippkaiser's own art, drawn for the same frames: each image has the shape of the
// window it replaces, so it fills it and the layout stays as it was. Where a frame is
// narrower than the art (the hero on desktop), the empty paper on the left gives way.
const standalone: Partial<Record<keyof typeof windows, string>> = {
  logo: "/brand/logo.webp",
  homeHero: "/design/home-hero.webp",
};

export function ReferenceArt({ name, className = "" }: { name: keyof typeof windows; className?: string }) {
  const own = standalone[name];
  if (own) {
    return <span className={`reference-art ${className}`} aria-hidden="true" style={{ display: "block", position: "relative", overflow: "hidden", width: "100%", height: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE_PATH}${own}`} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: name === "logo" ? "contain" : "cover", objectPosition: name === "homeHero" ? "right center" : "center" }} />
    </span>;
  }
  const [sheet, x, y, width, height] = windows[name];
  return <span className={`reference-art ${className}`} aria-hidden="true" style={{ display: "block", position: "relative", overflow: "hidden", width: "100%", height: "100%", ...(name === "trophy" ? { clipPath: "polygon(62% 0,100% 0,100% 100%,0 100%,0 62%,50% 62%,50% 42%,62% 42%)" } : {}) }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`${BASE_PATH}/design/reference/${sheet}.jpg`} alt="" draggable={false} style={{ position: "absolute", maxWidth: "none", width: `${1448 / width * 100}%`, height: `${1086 / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
  </span>;
}
