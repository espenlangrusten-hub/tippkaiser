# Quizkaiser – tägliches Fußballquiz

Sechs tägliche Spiele für deutsche Fußballfans:

- **Fehlende Elf** – vervollständige Deutschlands Startelf aus einem echten Länderspiel, Buchstabe für Buchstabe.
- **Torlos** – eine Frage zum deutschen Fußball, fünf Antworten; je weniger andere dasselbe antworten, desto besser.
- **Finde den Spieler** – fünf quellenbasierte Hinweise; frühe richtige Antwort gibt die meisten Punkte.
- **Elfmeter**, **Trainer-Genie** und **Goldwort** – weitere tägliche Herausforderungen.

Neues Spiel jede Nacht um 00:00 Uhr deutscher Zeit (Europe/Berlin).

Live (GitHub Pages): https://espenlangrusten-hub.github.io/tippkaiser/  
Eigene Domain (geplant): https://quizkaiser.de

## Architektur

Das Produkt läuft auf GitHub und Supabase – keine anderen Anbieter.

| Schicht | Wo | Was |
| --- | --- | --- |
| Website | GitHub Pages | Statischer Export der Next.js-App |
| Spiel-API | Supabase Edge Function (`supabase/functions/kaiser-api`) | Alles, was nicht im Browser liegen darf: Lösungen, Bewertung, Torlos-Punkte |
| Datenbank | Supabase Postgres, Schema `tippkaiser` | Spiele, Nutzer, Plan, Statistik (geteilt mit Tippetuppen im Projekt «dommer», eigene Schemas) |
| Daten-Pipeline | GitHub Actions (`.github/workflows/data.yml`) | Import und Tagesplan |

## Lokal starten

```bash
npm install
npm run db:migrate
npm run db:seed
npm run data:schedule
ADMIN_KEY=<lokal> ANALYTICS_SALT=<lokal> npm run dev:stack
npm run build && npm start
```

Tests: `npm test` (Vitest), `npm run check:deno` (Edge Function), `npm run e2e` (Playwright).

## Produktion

Siehe `docs/RUNBOOK.md`. Repo-Pfad und DB-Schema bleiben `tippkaiser`; die Marke in der UI ist **Quizkaiser**.
