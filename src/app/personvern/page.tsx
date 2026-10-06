import Link from "next/link";
import type { Metadata } from "next";
import { ConsentSettingsButton } from "@/components/consent/ConsentSettingsButton";

export const metadata: Metadata = { title: "Datenschutz und Cookies", description: "Wie Quizkaiser mit Daten, Werbung und dem Speicher im Browser umgeht.", alternates: { canonical: "/personvern" } };

export default function Page() {
  return (
    <article className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-4xl font-bold uppercase">Datenschutz</h1>
      <p className="text-mist">Kurzfassung: Du kannst ohne Konto spielen. Wenn du ein Ligaprofil anlegst, speichern wir Benutzernamen, einen gesicherten Passwortwert und Ergebnisse. Für die Statistik verwenden wir keine Tracking-Cookies.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Speicher im Browser</h2>
      <p className="text-mist">Damit das Spiel funktioniert, speichern wir Fortschritt, Ergebnisse und Serie im lokalen Speicher deines Browsers (localStorage). Das ist für den Dienst notwendig, verlässt dein Gerät nie und lässt sich durch Löschen der Browserdaten entfernen.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Ligaprofil</h2>
      <p className="text-mist">Das Ligaprofil ist freiwillig. Wir speichern deinen eindeutigen Benutzernamen, ein gesalzenes und langsam gehashtes Passwort, einen zeitlich begrenzten Anmeldeschlüssel und vom Server berechnete Spielergebnisse. Das Passwort wird nie im Klartext gespeichert. Benutzername und Gesamtpunktzahl erscheinen öffentlich in der Ligatabelle.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Statistik</h2>
      <p className="text-mist">Wir zählen Seitenaufrufe und Spiele mit einem anonymen, täglich wechselnden Schlüssel, der auf dem Server aus IP-Adresse und Browsertyp gebildet wird. Der Schlüssel lässt sich nicht auf dich zurückführen, wird nicht in deinem Browser gespeichert, und die IP-Adresse wird nicht gespeichert.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Werbung</h2>
      <p className="text-mist">Quizkaiser ist kostenlos und kann durch Werbung von Google AdSense finanziert werden. Google kann Cookies verwenden, um Werbung anzuzeigen. Du entscheidest selbst, ob du personalisierte Werbung erlaubst. Ohne Einwilligung wird nicht personalisierte Werbung angezeigt. Du kannst deine Wahl jederzeit ändern:</p>
      <ConsentSettingsButton />
      <p className="text-mist">
        Mehr dazu, wie Google Daten verwendet:{" "}
        <a href="https://policies.google.com/technologies/partner-sites" className="underline" rel="noopener noreferrer" target="_blank">
          policies.google.com/technologies/partner-sites
        </a>
        .
      </p>
      <h2 className="font-display text-2xl font-bold uppercase">Kontaktformular</h2>
      <p className="text-mist">Wenn du über das Kontaktformular eine Nachricht sendest, speichern wir Betreff, Nachricht und die angegebene E-Mail-Adresse, zusammen mit einem anonymen, täglich wechselnden Code, der nur dazu dient, die Zahl der Nachrichten pro Tag zu begrenzen. Die Nachricht wird über den E-Mail-Dienst Resend an den Betreiber von Quizkaiser weitergeleitet. Wir verwenden die Angaben nur, um dir zu antworten, und Nachrichten werden nach 12 Monaten automatisch gelöscht.</p>
      <h2 className="font-display text-2xl font-bold uppercase">Verantwortlicher und Kontakt</h2>
      <p className="text-mist">Quizkaiser wird als unabhängiges Projekt betrieben. Fragen zum Datenschutz oder zur Auskunft kannst du über das <Link href="/kontakt" className="underline">Kontaktformular</Link> stellen. Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>
    </article>
  );
}
