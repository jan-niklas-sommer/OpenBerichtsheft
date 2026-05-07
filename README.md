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

| Rolle | E-Mail |
|-------|--------|
| Administrator | admin@example.com |
| Ausbilder | trainer@example.com |
| Ausbildungsbeauftragter | officer@example.com |
| Auszubildende | trainee@example.com |
| Auszubildender | trainee2@example.com |

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
- **Prüfer-Dashboards** für Ausbilder und Ausbildungsbeauftragte
- **Admin-Bereich** für Benutzerverwaltung und Zuordnungen
- **Dark Mode / Light Mode** mit Systemerkennung
- **Responsive** – Desktop und Smartphone
- **Serverseitige Autorisierung** auf allen API-Routen und Seiten

## Projektstruktur

```text
src/
├── app/
│   ├── (auth)/login/          # Login-Seite
│   ├── (dashboard)/
│   │   ├── admin/             # Benutzer- und Zuordnungsverwaltung
│   │   ├── trainer/           # Ausbilder-Dashboard + Review
│   │   ├── officer/           # Ausbildungsbeauftragten-Dashboard + Review
│   │   └── trainee/           # Azubi-Dashboard + Berichtseditor
│   └── api/                   # REST-API-Routen
├── components/
│   ├── ui/                    # Button, Card, Input, Select, Badge, etc.
│   ├── layout/                # Navbar
│   └── reports/               # Gemeinsame Dashboard- und Review-Komponenten
├── hooks/                     # useAutosave, useSession
├── lib/                       # auth.ts, prisma.ts, validations.ts, utils.ts
└── types/                     # TypeScript-Typen + next-auth Declarations
```

## NPM Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Production-Build |
| `npm run start` | Production-Server |
| `npm run lint` | ESLint ausführen |
| `npm run docker:up` | PostgreSQL starten |
| `npm run docker:down` | PostgreSQL stoppen |
| `npm run db:migrate` | Migration ausführen |
| `npm run db:seed` | Testdaten laden |
| `npm run db:studio` | Prisma Studio öffnen |

## Dokumentation

| Datei | Inhalt |
|-------|--------|
| `ARCHITECTURE.md` | Architektur, Datenmodell, API-Routen, Auth, Designsystem |
| `HANDBUCH.md` | Benutzerhandbuch für alle Rollen |
| `HANDOVER.md` | Übergabeprotokoll zwischen Arbeitspaketen |
| `CODE_REVIEW.md` | Code-Review-Ergebnisse mit Issue-Tracking |

## Lizenz

MIT
