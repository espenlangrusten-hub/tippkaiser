import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Schreib Tippkaiser eine Nachricht – ein Fehler in einer Aufstellung, eine Frage, die nicht stimmt, oder eine Idee.",
  alternates: { canonical: "/kontakt" },
};

export default function Page() {
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-4xl font-bold uppercase">Kontakt</h1>
      <p className="text-mist">
        Du hast einen Fehler in einer Aufstellung gefunden, eine Antwort, die hätte zählen sollen, oder eine Idee für ein neues
        Spiel? Schreib uns. Gib deine E-Mail-Adresse an, dann antworten wir dorthin.
      </p>
      <ContactForm />
    </article>
  );
}
