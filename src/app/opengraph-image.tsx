import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Tippkaiser – die täglichen Fußballspiele";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

/**
 * The share card. Two things it deliberately avoids:
 *
 * Emoji — Satori draws no glyph for one unless an emoji font is supplied, so the ⚽
 * that used to sit in the badge rendered as an empty red square on every share.
 * The mark is the logo image instead.
 *
 * System fonts — the site's wordmark is Barlow Condensed, so the card loaded Arial
 * and looked like a different site. The face is already a dependency; it is read
 * from disk at build time.
 */
const font = (weight: 700 | 900) =>
  readFileSync(path.join(process.cwd(), "node_modules/@fontsource/barlow-condensed/files", `barlow-condensed-latin-${weight}-normal.woff`));

const RED = "#dd0000";
const GOLD = "#ffce00";
const SNOW = "#f4f7fb";

/** The Tippkaiser wordmark, read from disk at build time like the fonts. */
const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/logo.png")).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 76px",
          color: SNOW,
          background: "linear-gradient(135deg, #0b0b0b 0%, #1d1d1d 65%, #3a0000 100%)",
          fontFamily: "Barlow Condensed",
        }}
      >
        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={logo} width={540} height={80} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, lineHeight: 1, fontWeight: 900, letterSpacing: -1 }}>Sechs Fußballspiele.</div>
          <div style={{ marginTop: 20, fontSize: 46, color: "#c9d4e7" }}>Jeden Tag eine neue Herausforderung.</div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 34, fontWeight: 700 }}>
          <div style={{ display: "flex", padding: "12px 28px", borderRadius: 999, background: RED }}>Fehlende Elf</div>
          <div style={{ display: "flex", padding: "12px 28px", borderRadius: 999, background: GOLD, color: "#0b0b0b" }}>Torlos</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow Condensed", data: font(700), weight: 700, style: "normal" },
        { name: "Barlow Condensed", data: font(900), weight: 900, style: "normal" },
      ],
    },
  );
}
