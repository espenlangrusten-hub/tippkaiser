import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Über Tippkaiser", description: "Über die täglichen Fußballspiele von Tippkaiser, die Datenquellen dahinter und wie du uns erreichst.", alternates: { canonical: "/om" } };

export default function Page() {
  return (
    <article className="prose-invert flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-4xl font-bold uppercase">Über Tippkaiser</h1>
      <p className="text-mist">Tippkaiser sind kleine, tägliche Fußballspiele für alle, die sich an große Länderspielabende, Bundesliga-Samstage und legendäre Aufstellungen erinnern – und für alle, die den deutschen Fußball einfach mögen. Neue Spiele gibt es jede Nacht um 00:00 Uhr deutscher Zeit.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Die Spiele</h2>
      <p className="text-mist">
        <b className="text-snow">Fehlende Elf</b> zeigt dir ein echtes Länderspiel der deutschen Nationalmannschaft. Du siehst Gegner, Ergebnis und belegte Positionen, wenn es sie gibt – und sollst alle elf Spieler der Startelf finden, Buchstabe für Buchstabe.
      </p>
      <p className="text-mist">
        <b className="text-snow">Torlos</b> stellt eine Frage zum deutschen Fußball. Du gibst fünf Antworten, und jede Antwort bekommt Punkte danach, wie viele andere Spieler dasselbe geantwortet haben. Seltene Antworten sind Gold wert. Die Punkte bleiben verborgen, bis alle fünf Antworten abgegeben sind, damit niemand unterwegs umsteuern kann.
      </p>
      <p className="text-mist">
        <b className="text-snow">Finde den Spieler</b> beschreibt einen deutschen Nationalspieler in bis zu fünf Hinweisen. Je weniger Hinweise du brauchst, desto mehr Punkte.
      </p>
      <p className="text-mist">
        <b className="text-snow">Elfmeter</b> sind fünf schnelle Fragen zum deutschen Fußball – Torschützen, Kapitäne, Stadien und Meister. Dieselbe Frage kommt frühestens nach 100 Tagen wieder.
      </p>
      <p className="text-mist">
        <b className="text-snow">Trainer-Genie</b> dreht sich um die Trainer im deutschen Spitzenfußball: vier Fragen mit je vier Antworten, und du entscheidest selbst, wann du offensiv gehst.
      </p>
      <p className="text-mist">
        <b className="text-snow">Goldwort</b> ist das Fünf-Buchstaben-Wortspiel von Tippkaiser. Die Lösung hat immer mit Fußball zu tun, aber auch gewöhnliche deutsche Wörter zählen als Versuch. Du hast sechs Versuche. Grün heißt richtiger Buchstabe an der richtigen Stelle, Gelb heißt richtiger Buchstabe an der falschen Stelle.
      </p>
      <p className="text-mist">
        Fehlende Elf, Torlos, Finde den Spieler, Trainer-Genie und Goldwort bringen Punkte in der <Link href="/liga" className="underline">Liga des Monats</Link>. Wer am Monatsende oben steht, wird Tippkaiser des Monats.
      </p>
      <h2 className="font-display text-2xl font-bold uppercase">Daten und Quellen</h2>
      <p className="text-mist">
        Alle Spiele, Aufstellungen und Tabellen in der Datenbank sind mit ihrem Quellenstatus gekennzeichnet. In den täglichen Spielen werden nur Aufstellungen verwendet, die mit öffentlichen Spielarchiven und Spielberichten abgeglichen sind. Lässt sich eine Antwort nicht sicher belegen, wird die Frage nicht gestellt. Du hast einen Fehler gefunden? Wir freuen uns über eine Nachricht über das <Link href="/kontakt" className="underline">Kontaktformular</Link>.
      </p>
      <h2 className="font-display text-2xl font-bold uppercase">Unabhängig</h2>
      <p className="text-mist">Tippkaiser ist ein unabhängiges Hobbyprojekt und steht in keiner Verbindung zum Deutschen Fußball-Bund, zur DFL oder zu einem Verein. Die Spiele sind von klassischen täglichen Wortspielen inspiriert, mit eigenen Regeln, eigenem Design und eigener Datenbank.</p>
    </article>
  );
}
