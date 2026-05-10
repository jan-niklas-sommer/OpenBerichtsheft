# OpenBerichtsheft

Digitale Ausbildungsdokumentation – Wochenberichte erfassen, einreichen und prüfen.

## Tech Stack

| Schicht | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| Datenbank | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | Auth.js 5 (NextAuth, JWT) |
| Runtime | Node.js 22 |
| Deployment | Docker / Docker Compose |

## Schnellstart

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. PostgreSQL starten
docker compose up -d

# 3. Datenbank migrieren und Testdaten laden
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# 4. Dev-Server starten
npm run dev
```

Die App läuft dann auf **http://localhost:3000**.

## Testzugänge

Alle Konten verwenden das Passwort `password123`.

| Rolle | E-Mail | Name |
|-------|--------|------|
| Administrator | admin@example.com | Admin User |
| Ausbilder | trainer@example.com | Max Mustermann |
| Ausbilder | trainer2@example.com | Dr. Katharina Weber |
| Ausbilder | trainer3@example.com | Stefan Krüger |
| Ausbilder | trainer4@example.com | Petra Hoffmann |
| Ausbildungsbeauftragte/r | officer@example.com | Erika Mustermann |
| Ausbildungsbeauftragte/r | officer2@example.com | Thomas Schmidt |
| Ausbildungsbeauftragte/r | officer3@example.com – officer10@example.com | … |
| Auszubildende | trainee@example.com – trainee22@example.com | 22 Azubis, 3 Berufe (FiAE, FiSi, KVF) |

## Rollen

| Rolle | Was kann sie tun? |
|-------|-------------------|
| **Administrator** | Benutzer verwalten, Rollen vergeben, Zuordnungen erstellen |
| **Ausbilder** | Berichte zugeordneter Azubis prüfen, genehmigen, zurückgeben |
| **Ausbildungsbeauftragter** | Berichte zugeordneter Azubis prüfen |
| **Auszubildende(r)** | Wochenberichte schreiben, autospeichern, einreichen |

## Features

- **Wochenbericht-Editor** mit 7 Tageszeilen (Tagestyp, Stunden, Minuten)
- **Autosave** mit Debounce – keine Datenverluste
- **Statusmodell**: Entwurf → Eingereicht → Genehmigt / Zurückgegeben / Abgelehnt
- **PDF-Export** generierter Wochenberichte pro Bericht
- **Einsatzplanung** mit interaktivem Gantt-Chart und Drag-Unterstützung
- **Wiederholungsregeln** für wiederkehrende Einsätze (Betrieb, Berufsschule, etc.)
- **Bericht-Prefill** – Vorwocheninhalt automatisch übernehmen
- **Benachrichtigungen** – Prüfer bei Einreichung benachrichtigen, Azubis bei Review
- **Ausbildungsberufe** – Verwaltung von Berufen (FiAE, FiSi, KVF) mit Zuordnung
- **Fortschritts-Dashboard** – Übersicht über Berichtserstellungs- und Genehmigungsstatus
- **Anonymisierung (DSGVO)** – Benutzerdaten anonymisieren statt löschen
- **Year-Calendar** – Jahresübersicht aller Berichtswochen mit Heatmap
- **Prüfer-Dashboards** für Ausbilder und Ausbildungsbeauftragte
- **Admin-Bereich** für Benutzerverwaltung, Zuordnungen und Berufe
- **Design-System** mit Token-Architektur, Dark/Light Mode und Systemerkennung
- **Responsive** – Desktop und Smartphone
- **Rate-Limiting** auf API-Routen zum Missbrauchsschutz
- **Zugriffsschutz** – Serverseitige Autorisierung auf allen API-Routen und Seiten

## Projektstruktur

```text
src/
├── app/
│   ├── (auth)/login/                  # Login-Seite
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── users/                 # Benutzerverwaltung
│   │   │   ├── assignments/           # Azubi-Ausbilder-Zuordnungen
│   │   │   ├── professions/           # Ausbildungsberufe verwalten
│   │   │   ├── progress/              # Fortschritts-Dashboard
│   │   │   └── settings/              # Systemeinstellungen
│   │   ├── trainer/
│   │   │   ├── schedule/              # Einsatzplanung (Gantt)
│   │   │   ├── officers/              # Ausbildungsbeauftragte verwalten
│   │   │   └── report/[id]/           # Bericht prüfen
│   │   ├── officer/
│   │   │   ├── schedule/              # Einsatzplanung
│   │   │   └── report/[id]/           # Bericht prüfen
│   │   └── trainee/
│   │       ├── schedule/              # Eigene Einsatzplanung
│   │       ├── reports/               # Berichtsliste + Year-Calendar
│   │       └── reports/[week]/        # Berichtseditor
│   └── api/
│       ├── auth/                      # NextAuth (Auth.js)
│       ├── reports/                   # CRUD + submit + review + pdf + prefill
│       ├── schedule/                  # Einsatzplanung-API
│       ├── assignments/               # Zuordnungs-API
│       ├── officer-assignments/       # Beauftragten-Zuordnungen
│       ├── recurrence-rules/          # Wiederholungsregeln
│       ├── notifications/             # Benachrichtigungen
│       ├── professions/               # Ausbildungsberufe
│       ├── users/                     # Benutzerverwaltung + Anonymisierung
│       └── settings/                  # Systemeinstellungen
├── components/
│   ├── ui/                            # Button, Card, Input, Select, Badge, Modal, etc.
│   ├── layout/                        # Navbar, ThemeProvider
│   ├── reports/                       # Dashboard- und Review-Komponenten
│   └── schedule/                      # Gantt-Chart, Timeline-Komponenten
├── hooks/                             # useAutosave, useSession
├── lib/                               # auth.ts, prisma.ts, validations.ts, utils.ts, rate-limit.ts
└── types/                             # TypeScript-Typen + next-auth Declarations
```

## NPM Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Production-Build |
| `npm run start` | Production-Server |
| `npm run lint` | ESLint ausführen |
| `npm test` | Vitest Unit/API/Component Tests |
| `npm run test:watch` | Vitest im Watch-Modus |
| `npm run test:coverage` | Vitest mit Coverage-Report |
| `npm run test:e2e` | Playwright E2E Tests |
| `npm run docker:up` | PostgreSQL starten |
| `npm run docker:down` | PostgreSQL stoppen |
| `npm run db:migrate` | Migration ausführen |
| `npm run db:seed` | Testdaten laden |
| `npm run db:studio` | Prisma Studio öffnen |

> **Hinweis:** Es gibt kein `npm run typecheck`-Script. Für einen TypeScript-Check ohne Emit nutze `npx tsc --noEmit`.

## Dokumentation

| Datei | Inhalt |
|-------|--------|
| `ARCHITECTURE.md` | Architektur, Datenmodell, API-Routen, Auth, Designsystem |
| `DESIGN_SYSTEM.md` | Design-System mit Token-Schichten, Komponenten-Spezifikation |
| `HANDBUCH.md` | Benutzerhandbuch für alle Rollen |
| `HANDOVER.md` | Übergabeprotokoll zwischen Arbeitspaketen |
| `CODE_REVIEW.md` | Code-Review-Ergebnisse mit Issue-Tracking |

## Lizenz

MIT
