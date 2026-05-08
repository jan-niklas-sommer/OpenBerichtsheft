# Architekturdokumentation – OpenBerichtsheft

## Tech Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Framework | Next.js (App Router) | 15.x |
| Sprache | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Datenbank | PostgreSQL | 16.x |
| ORM | Prisma | 6.x |
| Authentifizierung | Auth.js (NextAuth v5) | 5.x |
| Runtime | Node.js | 22.x |
| Deployment | Docker + docker-compose | - |

### Begründung

- **Next.js**: Bietet Frontend und API-Routes in einem Framework. App Router ermöglicht Server Components, Streaming und moderne Patterns. File-based Routing reduziert Boilerplate.
- **Tailwind CSS**: Utility-first, ideal für reduzierte, konsistente Designsysteme. Dark Mode ist nativ unterstützt.
- **PostgreSQL**: Bewährte relationale Datenbank mit starkem Constraint-System, Transaktionen und Volltextsuche-Fähigkeiten.
- **Prisma**: Type-safe ORM mit Migrationstooling, guter DX und automatischer Typgenerierung.
- **Auth.js**: Die native Next.js-Auth-Bibliothek. Unterstützt Credentials-Provider, Session-Management und rollenbasierte Autorisierung.

---

## Projektstruktur (geplant)

```text
open-berichtsheft/
├── prisma/
│   ├── schema.prisma          # Datenbankschema
│   ├── migrations/            # Automatische Migrationen
│   └── seed.ts                # Testdaten / Seed
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth-Routen (login, etc.)
│   │   ├── (dashboard)/       # Geschützter Bereich
│   │   │   ├── admin/         # Admin-Sichten
│   │   │   ├── trainer/       # Ausbilder-Dashboard
│   │   │   ├── officer/       # Ausbildungsbeauftragten-Dashboard
│   │   │   ├── trainee/       # Auszubildenden-Sichten
│   │   │   └── reports/
│   │   │       └── [week]/    # Wochenbericht-Editor
│   │   ├── api/               # API-Routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── reports/
│   │   │   ├── reviews/
│   │   │   ├── assignments/
│   │   │   └── users/
│   │   ├── layout.tsx         # Root Layout
│   │   ├── page.tsx           # Landing / Redirect
│   │   └── globals.css
│   ├── components/            # Wiederverwendbare UI-Komponenten
│   │   ├── ui/                # Primitives (Button, Card, Input, etc.)
│   │   ├── layout/            # Shell, Sidebar, Navbar
│   │   └── reports/           # Report-spezifische Komponenten
│   ├── lib/                   # Utilities undShared Logic
│   │   ├── auth.ts            # Auth-Konfiguration
│   │   ├── prisma.ts          # Prisma Client Singleton
│   │   ├── validations.ts     # Zod-Schemata
│   │   └── utils.ts           # Helpers
│   ├── hooks/                 # Custom React Hooks
│   └── types/                 # Globale TypeScript-Typen
├── public/                    # Statische Assets
├── docker-compose.yml         # Lokale Dev-Umgebung
├── Dockerfile
├── ARCHITECTURE.md
├── HANDOVER.md
└── package.json
```

---

## Datenmodell

### User

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| email | String (unique) | E-Mail-Adresse |
| name | String | Vollständiger Name |
| role | Enum | `admin`, `trainer`, `training_officer`, `trainee` |
| passwordHash | String | Gehashtes Passwort |
| professionId | String? (FK → TrainingProfession) | Ausbildungsberuf (nur für Trainees relevant) |
| trainingStartDate | DateTime? | Eintrittsdatum der Ausbildung (ab wann Berichte relevant sind) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |
| deactivatedAt | DateTime? | Deaktivierungszeitpunkt (optional) |
| anonymizedAt | DateTime? | Anonymisierungszeitpunkt (optional, DSGVO) |

### TrainingProfession

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| name | String (unique) | Bezeichnung des Ausbildungsberufs |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

### TraineeTrainerAssignment

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| traineeId | String (FK → User) | Auszubildender |
| trainerId | String (FK → User) | Ausbilder |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

Unique Constraint: `(traineeId, trainerId)`

### TraineeOfficerAssignment

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| traineeId | String (FK → User) | Auszubildender |
| trainingOfficerId | String (FK → User) | Ausbildungsbeauftragter |
| trainerId | String (FK → User) | Zugehöriger Ausbilder (für Hierarchie) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

Unique Constraint: `(traineeId, trainingOfficerId)`

### WeeklyReport

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| traineeId | String (FK → User) | Besitzer |
| weekStartDate | DateTime | Montag der Woche |
| weekEndDate | DateTime | Sonntag der Woche |
| calendarYear | Int | Kalenderjahr |
| calendarWeek | Int | Kalenderwoche (ISO) |
| reportText | String? | Wochenbericht-Text |
| reportType | Enum | `weekly`, `daily` |
| status | Enum | `draft`, `submitted`, `approved`, `rejected`, `needs_revision` |
| submittedAt | DateTime? | Einreichungszeitpunkt |
| reviewedAt | DateTime? | Prüfungszeitpunkt |
| reviewedById | String? (FK → User) | Prüfer |
| reviewComment | String? | Kommentar des Prüfers |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

Unique Constraint: `(traineeId, calendarYear, calendarWeek)`

### DailyEntry

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| weeklyReportId | String (FK → WeeklyReport) | Zugehöriger Wochenbericht |
| date | DateTime | Datum des Tages |
| dayType | Enum | `company`, `vocational_school`, `vacation`, `other` |
| hours | Int | Stunden |
| minutes | Int | Minuten (0–59) |
| reportText | String? | Tagesbericht-Text (nur bei reportType=daily) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

### ReviewEvent (optional für MVP, aber schema-vorbereitet)

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| weeklyReportId | String (FK → WeeklyReport) | Zugehöriger Bericht |
| actorId | String (FK → User) | Handelnder Nutzer |
| action | Enum | `created`, `autosaved`, `submitted`, `approved`, `needs_revision`, `rejected` |
| comment | String? | Kommentar |
| createdAt | DateTime | Zeitstempel |

### AppSetting

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| key | String (PK) | Einstellungs-Key (z.B. `workingDays`) |
| value | String | JSON-serialisierter Wert |
| updatedAt | DateTime | Letzte Änderung |

**Default-Settings:**
- `workingDays` = `[1,2,3,4,5]` (Montag–Freitag, JS `Date.getDay()` Werte)

---

## Rollen- und Berechtigungsmodell

### Rollen

| Rolle | Interner Key | DE-Label |
|-------|-------------|----------|
| Administrator | `admin` | Administrator |
| Ausbilder | `trainer` | Ausbilder |
| Ausbildungsbeauftragter | `training_officer` | Ausbildungsbeauftragter |
| Auszubildender | `trainee` | Auszubildende(r) |

### Berechtigungsübersicht

| Aktion | admin | trainer | training_officer | trainee |
|--------|-------|---------|------------------|---------|
| Benutzer verwalten | Ja | Nein | Nein | Nein |
| Rollen vergeben | Ja | Nein | Nein | Nein |
| Trainer ↔ Trainee zuordnen | Ja | Nein | Nein | Nein |
| Officer ↔ Trainee zuordnen | Ja | Ja (eigene Trainees) | Nein | Nein |
| Eigene Berichte erstellen/bearbeiten | Nein | Nein | Nein | Ja (nur draft/needs_revision) |
| Berichte einreichen | Nein | Nein | Nein | Ja (nur eigene drafts) |
| Berichte prüfen | Ja (alle) | Ja (zugeordnete Trainees) | Ja (zugeordnete Trainees) | Nein |
| Berichte genehmigen/ablehnen | Ja (alle) | Ja (zugeordnete Trainees) | Ja (zugeordnete Trainees) | Nein |
| Alle Berichte einsehen | Ja | Nein | Nein | Nein |

### Autorisierungslogik

- Jede API-Route prüft Authentifizierung (Session vorhanden).
- Jede API-Route prüft Autorisierung (Rolle + Zuständigkeit).
- Die Zuordnung Prüfer ↔ Auszubildender wird über die Assignment-Tabellen geprüft.
- Admins haben globalen Lesezugriff auf alle Berichte.

---

## Statusmodell der Berichte

```text
draft → submitted → approved
                  → needs_revision → submitted (erneut)
                  → rejected
```

| Status | Bearbeitbar durch Trainee | Sichtbar für Prüfer |
|--------|--------------------------|---------------------|
| `draft` | Ja | Nein |
| `submitted` | Nein | Ja (Dashboard) |
| `approved` | Nein | Ja (archiviert) |
| `needs_revision` | Ja | Ja |
| `rejected` | Nein | Ja |

---

## Autosave-Strategie

- **Trigger**: `onChange`-Events auf Formularfeldern mit 1-sekundigem Debounce.
- **Mechanismus**: PUT-Request an `/api/reports/[id]` (oder Upsert-Route).
- **Idempotenz**: Upsert anhand `(traineeId, calendarYear, calendarWeek)` verhindert Duplikate.
- **UI-Feedback**: Statusanzeige "Speichert…" / "Gespeichert" / "Fehler" im Editor.
- **Optimistic UI**: Formular bleibt editierbar während Request läuft.
- **Fehlerbehandlung**: Retry bei Netzwerkfehlern, Toast bei persistenten Fehlern.

---

## Authentifizierung

- **Provider**: Credentials (E-Mail + Passwort).
- **Session-Strategie**: JWT-basierte Sessions via Auth.js.
- **Session-Inhalt**: `userId`, `email`, `name`, `role`.
- **Middleware**: Next.js Middleware prüft Auth für geschützte Routen und leitet bei Bedarf um.
- **Passwort-Hashing**: bcrypt via `bcryptjs`.

---

## Designsystem-Grundlagen

### Farbpalette

**Light Mode:**
- Background: `#FAFAFA` / `#FFFFFF`
- Text: `#0A0A0A` / `#404040`
- Cards: `#FFFFFF` mit `border: 1px solid #E5E5E5`
- Primary Action: `#0A0A0A` (schwarz), Text darauf `#FFFFFF`

**Dark Mode:**
- Background: `#0A0A0A` / `#141414`
- Text: `#FAFAFA` / `#A3A3A3`
- Cards: `#1C1C1C` mit `border: 1px solid #262626`
- Primary Action: `#FAFAFA` (weiß), Text darauf `#0A0A0A`

### Typografie

- System-Font-Stack oder Inter als Webfont.
- Heading: 24–32px, semibold.
- Body: 16px, regular.
- Small/Caption: 14px, regular.

### Komponenten

- **Button**: Abgerundet (8px), keine schweren Schatten.
- **Card**: 12px Border-Radius, dezenter Border, kein Shadow.
- **Input**: Clean, 1px Border, ausreichendes Padding.
- **Segmented Control**: Für Tagestyp-Auswahl.

---

## Wichtige API-Routen (geplant)

| Methode | Route | Beschreibung | Rollen |
|---------|-------|-------------|--------|
| POST | `/api/auth/[...nextauth]` | Auth-Endpoints | Alle |
| GET | `/api/reports` | Eigene Berichte (Trainee) / Zugeordnete Berichte (Prüfer) | trainee, trainer, training_officer |
| GET | `/api/reports/summary` | Fortschrittsübersicht pro Azubi | admin, trainer, training_officer |
| POST | `/api/reports` | Bericht erstellen/upserten | trainee |
| GET | `/api/reports/[id]` | Bericht-Details | Besitzer oder zugeordneter Prüfer |
| GET | `/api/reports/[id]/pdf` | Bericht als PDF-Download | Besitzer oder zugeordneter Prüfer |
| PUT | `/api/reports/[id]` | Bericht aktualisieren (Autosave) | trainee (nur draft/needs_revision) |
| POST | `/api/reports/[id]/submit` | Bericht einreichen | trainee (nur draft) |
| POST | `/api/reports/[id]/review` | Bericht prüfen (approve/revise/reject) | trainer, training_officer, admin |
| GET | `/api/notifications` | Eigene Benachrichtigungen | Alle |
| PUT | `/api/notifications/[id]` | Benachrichtigung als gelesen | Alle |
| DELETE | `/api/notifications/[id]` | Benachrichtigung löschen | Alle |
| POST | `/api/notifications/check` | Fehlende Berichte prüfen | admin |
| GET | `/api/users` | Benutzerliste | admin |
| POST | `/api/users` | Benutzer erstellen | admin |
| PUT | `/api/users/[id]` | Benutzer bearbeiten | admin |
| POST | `/api/users/[id]/anonymize` | Benutzer anonymisieren (DSGVO) | admin |
| GET | `/api/professions` | Ausbildungsberufe-Liste | admin |
| POST | `/api/professions` | Ausbildungsberuf anlegen | admin |
| PUT | `/api/professions/[id]` | Ausbildungsberuf bearbeiten | admin |
| DELETE | `/api/professions/[id]` | Ausbildungsberuf löschen | admin |
| GET | `/api/assignments` | Zuordnungen abrufen | admin, trainer |
| POST | `/api/assignments` | Zuordnung erstellen | admin, trainer |
| GET | `/api/settings` | App-Einstellungen abrufen | Alle (auth) |
| PUT | `/api/settings` | App-Einstellungen aktualisieren | admin |

---

## Bekannte technische Schulden

- Keine Tests vorhanden (wird in AP11 adressiert).
- ReviewEvent-Schema wird für MVP nur vorbereitet, nicht vollständig genutzt.
- Keine E-Mail-Verifikation bei Registrierung (admin-gesteuerte Benutzeranlage).
- Kein Rate-Limiting für API-Routes (für Produktivbetrieb nötig).
