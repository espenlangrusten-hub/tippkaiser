import Link from "next/link";
import { ReferenceArt } from "./ReferenceArt";

export function Footer() {
  return (
    <footer className="tt-footer">
      <div className="tt-footer-inner">
        <Link href="/" className="stadium-brand tt-wordmark tt-footer-brand" aria-label="Tippkaiser – Startseite">
          <span className="tt-reference-logo"><ReferenceArt name="logo" /></span>
        </Link>
        <nav className="tt-footer-links" aria-label="Fußzeilenmenü">
          <Link href="/om/">Über Tippkaiser</Link>
          <Link href="/kontakt/">Häufige Fragen</Link>
          <Link href="/personvern/">Datenschutz</Link>
          <Link href="/kontakt/">Kontakt</Link>
        </nav>
        <p className="tt-footer-tagline">Fußballwissen macht alles ein bisschen besser <b>♥</b></p>
      </div>
    </footer>
  );
}
