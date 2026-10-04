import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./reference-redesign.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { PageViewBeacon } from "@/components/analytics/Beacon";
import { INDEXABLE, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – ${SITE_TAGLINE}`, template: `%s – ${SITE_NAME}` },
  description: "Das tägliche Fußballquiz: Vervollständige die Startelf der Nationalmannschaft, finde die seltensten Antworten bei Torlos, errate den Spieler, schieße fünf schnelle Elfmeter, teste dein Trainerwissen und errate das Goldwort. Kostenlos, neue Spiele um Mitternacht.",
  keywords: ["Fußballquiz", "Fußball Quiz", "Nationalmannschaft Quiz", "Bundesliga Quiz", "tägliches Fußballspiel", "Fußball Wordle"],
  openGraph: { type: "website", locale: "de_DE", siteName: SITE_NAME, title: `${SITE_NAME} – ${SITE_TAGLINE}`, description: "Die täglichen Fußballspiele: Fehlende Elf, Torlos, Finde den Spieler, Elfmeter, Trainer-Genie und Goldwort." },
  twitter: { card: "summary_large_image" },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <ConsentProvider>
          <Header />
          <main className="site-main">{children}</main>
          <Footer />
          <PageViewBeacon />
        </ConsentProvider>
      </body>
    </html>
  );
}
