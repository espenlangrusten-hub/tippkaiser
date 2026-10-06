import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./reference-redesign.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { PageViewBeacon } from "@/components/analytics/Beacon";
import { INDEXABLE, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const DEFAULT_DESCRIPTION =
  "Tägliches Fußballquiz für deutsche Fans: Fehlende Elf, Torlos, Finde den Spieler, Elfmeter, Goldwort & Trainer-Genie. Kostenlos im Browser – jeden Tag neu um Mitternacht.";

const OG_TITLE = `${SITE_NAME} – Tägliches Fußballquiz`;
const OG_DESCRIPTION =
  "Sechs tägliche Spiele für Fußballfans: Fehlende Elf, Torlos, Finde den Spieler und mehr. Kostenlos – jeden Tag neu.";
const TWITTER_DESCRIPTION = "Sechs Spiele. Jeden Tag neu. Kostenlos im Browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – ${SITE_TAGLINE}`, template: `%s – ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Fußballquiz",
    "Fußball Quiz",
    "Nationalmannschaft Quiz",
    "Bundesliga Quiz",
    "DFB Quiz",
    "tägliches Fußballspiel",
    "Fußball Wordle",
  ],
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: SITE_NAME,
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: TWITTER_DESCRIPTION,
  },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  inLanguage: "de",
  description: "Tägliches Fußballquiz mit sechs Spielen für deutsche Fans. Kostenlos im Browser.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
