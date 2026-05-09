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
| Kalender | react-day-picker | 10.x |
| Popover | @radix-ui/react-popover | 1.x |
| Runtime | Node.js | 22.x |
| Deployment | Docker + docker-compose | - |

### Begründung

- **Next.js**: Bietet Frontend und API-Routes in einem Framework. App Router ermöglicht Server Components, Streaming und moderne Patterns. File-based Routing reduziert Boilerplate.
- **Tailwind CSS**: Utility-first, ideal für reduzierte, konsistente Designsysteme. Dark Mode ist nativ unterstützt. Alle Farbwerte, Abstände, Radien und Schatten werden über CSS-Variablen (Design-Tokens) referenziert — siehe `DESIGN_SYSTEM.md` für die verbindliche Spezifikation.
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
│   │   ├── ui/                # Primitives (Button, Card, Input, DatePicker, Calendar, Popover, etc.)
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

### ScheduleAssignment

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| traineeId | String (FK → User) | Auszubildender |
| scheduleType | Enum | `department`, `school`, `vacation`, `other` |
| startDate | DateTime | Startdatum der Zuweisung |
| endDate | DateTime | Enddatum der Zuweisung |
| department | String? | Abteilungsname (bei scheduleType=department) |
| supervisorId | String? (FK → User) | Ausbildungsbeauftragter (optional) |
| color | String? | Benutzerdefinierte Farbe |
| createdBy | String (FK → User) | Ersteller (Admin oder Ausbilder) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

Unique Constraint: keine (mehrere Zuweisungen pro Tag möglich, Layering beachten)

**Layering-Regel:** Schule > Urlaub > Sonstiges > Abteilung (höherer Typ überdeckt niedrigeren am selben Tag)

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
| GET | `/api/schedule` | Einsatzplanung abrufen | admin, trainer, training_officer |
| POST | `/api/schedule` | Einsatzplanung erstellen | admin, trainer |
| PUT | `/api/schedule` | Einsatzplanung aktualisieren | admin, trainer (eigene) |
| DELETE | `/api/schedule` | Einsatzplanung löschen | admin, trainer (eigene) |
| GET | `/api/recurrence-rules` | Wiederholungsregeln abrufen | admin, trainer, training_officer, trainee (eigene) |
| POST | `/api/recurrence-rules` | Wiederholungsregel erstellen | admin, trainer |
| PUT | `/api/recurrence-rules` | Wiederholungsregel aktualisieren | admin, trainer (eigene) |
| DELETE | `/api/recurrence-rules` | Wiederholungsregel löschen | admin, trainer (eigene) |
| GET | `/api/reports/prefill` | Prefill-Daten für Bericht abrufen | trainee |

---

## Wiederholungsregeln und Einsatzplanung (Recurrence & Schedule)

### Überblick

Die Einsatzplanung ist die **single source of truth** für alle zeitlichen Zuweisungen eines Auszubildenden. Wochenberichte werden beim Erstellen aus der Planung vorausgefüllt, danach sind sie unabhängig.

### Abgrenzung: Berichtsheft ≠ Zeiterfassung

Die Anwendung ist ein **Berichtsheft**, keine Zeiterfassung. Stunden in DailyEntry sind geplante/erwartete Stunden, nicht erfasste Arbeitszeit. Es gibt keine Stempeluhr, keine Pausenvalidierung und keine Überstundenberechnung.

### Datenmodell-Erweiterung

#### RecurrenceRule

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| traineeId | String (FK → User) | Auszubildender |
| scheduleType | Enum | `department`, `school`, `vacation`, `other` |
| startDate | DateTime | Beginn der Regel |
| endDate | DateTime | Ende der Regel |
| weekDays | Int | Bitfeld für Wochentage (siehe Bitfeld-Konvention) |
| displayLabel | String? | Anzeigename (z.B. "IT-Abteilung") |
| department | String? | Abteilungsname (bei scheduleType=department) |
| supervisorId | String? (FK → User) | Ausbildungsbeauftragter |
| color | String? | Benutzerdefinierte Farbe |
| priority | Int | Priorität bei Konflikten (höher = wichtiger) |
| createdById | String (FK → User) | Ersteller |
| updatedById | String? (FK → User) | Letzter Bearbeiter |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

**Bitfeld-Konvention für `weekDays`:**

Bitposition 0 = Montag (Wert 1), Bitposition 1 = Dienstag (Wert 2), …, Bitposition 6 = Sonntag (Wert 64). ISO 8601 Reihenfolge. Beispiel: Mo+Mi+Fr = 1 + 4 + 16 = 21.

Helferfunktionen in `src/lib/schedule-resolver.ts`:
- `weekdayToBit(weekday: 1-7): number` — konvertiert ISO-Wochentag zu Bitwert
- `bitfieldContainsWeekday(bits: number, weekday: 1-7): boolean` — prüft ob Wochentag im Bitfeld enthalten ist

Diese Helfer verhindern Off-by-one-Bugs bei der Bitmanipulation.

#### RecurrenceException

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| id | String (UUID) | Primärschlüssel |
| ruleId | String (FK → RecurrenceRule) | Zugehörige Regel |
| date | DateTime | Ausnahmedatum |
| reason | String? | Grund (Phase 1: Freitext, Migration zu Enum möglich) |
| createdAt | DateTime | Erstellungszeitpunkt |
| updatedAt | DateTime | Letzte Änderung |

Unique Constraint: `(ruleId, date)` — ein Datum kann pro Regel nur eine Ausnahme haben.

Index auf `(ruleId, date)` für performante Abfragen.

### Lazy-Create-Lifecycle für Wochenberichte

1. Ein Wochenbericht **existiert nicht**, bevor der Auszubildende ihn zum ersten Mal öffnet.
2. Beim Öffnen einer Woche wird geprüft, ob ein Bericht existiert.
3. Falls nicht: Bericht wird erstellt, DailyEntry-Zeilen werden aus der Einsatzplanung vorausgefüllt (**Prefill**).
4. Nach dem Erstellen ist der Bericht unabhängig von der Planung — Änderungen an der Planung wirken sich nicht auf bereits erstellte Berichte aus.

**Kein Fremdschlüssel zwischen Bericht und Einsatzplanung.** Der Bericht kopiert die Default-Werte beim Erstellen. Das Schema dokumentiert diese Entscheidung mit einem Kommentar.

### Soft-Prefill-Prinzip

- Kein Logging des Prefill-Vorgangs.
- Kein Diff zwischen Planung und manuellen Änderungen.
- Kein Lock der vorausgefüllten Felder — der Auszubildende kann alles frei bearbeiten.

### Resolver-Semantik

Der Auflösungsalgorithmus (`src/lib/schedule-resolver.ts`) bestimmt, welche Zuweisung für ein gegebenes Datum gilt.

**Regel:** Der Resolver wird mit einem Datum aufgerufen und verwendet die **aktuell gültige** Planung, auch für historische Daten.

**Begründung:** Wenn die Planung korrigiert wird (z.B. nachträglich eingetragene Berufsschultage), soll diese Korrektur auch bei nachträglich erstellten Berichten wirksam werden. Andernfalls entstünde eine stille Inkonsistenz zwischen Planung und Bericht.

**Konfliktauflösung (Priorität, höchste zuerst):**
1. Einzeleinsatz (ScheduleAssignment ohne Wiederholung)
2. Jüngere RecurrenceRule (später erstellte Regel gewinnt)
3. Ältere RecurrenceRule
4. Default (leerer Eintrag)

### Phase-1-Rollenrechte: Officer

In Phase 1 haben Ausbildungsbeauftragte (Officer) **volle Edit-Rechte** für die Einsatzplanung, identisch zu Ausbildern (Trainer). Rollenspezifische Einschränkungen (z.B. nur eigene zugeordnete Auszubildende) werden in Phase 2 eingeführt.

Die aktuelle Berechtigungsübersicht oben dokumentiert das finale Zielmodell. Phase-1-Abweichungen sind hier explizit markiert.

### ISO-Wochen-Konvention

Durchgehend wird ISO 8601 (DIN 1355) verwendet: Montag = erster Tag der Woche, KW 1 = Woche mit dem ersten Donnerstag des Jahres. Alle Berechnungen in `src/lib/date-utils.ts` nutzen diese Konvention konsistent.

### Komponentenarchitektur Schedule

```text
src/
  lib/
    schedule-resolver.ts     # Auflösungsalgorithmus + Bitfeld-Helfer
    report-builder.ts        # Prefill-Logik (buildDefaultEntries)
  components/
    schedule/
      types.ts               # Zentrale Typen für Schedule-Komponenten
      gantt-timeline.tsx     # Gemeinsame Timeline-Komponente (mode: edit|readonly)
      assignment-modal.tsx   # Container-Modal für Zuweisungserstellung
      single-range-form.tsx  # Einzeleinsatz-Formular
      recurring-form.tsx     # Wiederholungsregel-Formular
      day-composition-form.tsx # Tageszusammensetzung-Formular
```

**Virtualisierungs-TODO:** Die Timeline-Komponente muss bei >1 Jahr Ansicht virtualisiert werden. Die Komponentengrenze ist so geschnitten, dass nachträgliche Virtualisierung kein Refactoring der Aufrufer erfordert.

---

## Bekannte technische Schulden

- ReviewEvent-Schema wird für MVP nur vorbereitet, nicht vollständig genutzt.
- Keine E-Mail-Verifikation bei Registrierung (admin-gesteuerte Benutzeranlage).
- Kein Rate-Limiting für API-Routes (für Produktivbetrieb nötig).
- Kein Drag-Resize in der Gantt-Timeline (bewusst excluded, Phase 2+).
- Kein Schulferien-Import (bewusst excluded).
- Keine vollständige RRULE-Komplexität (bewusst auf eigene RecurrenceRule-Tabelle begrenzt).
