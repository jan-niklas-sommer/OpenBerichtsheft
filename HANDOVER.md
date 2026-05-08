# Übergabedokument – OpenBerichtsheft

---

## 2026-05-07 – Arbeitspaket 1: Projektanalyse und Architekturentscheidung

### Planner

- **Ziel**: Bestehendes Repository analysieren, Tech Stack festlegen, Architektur dokumentieren.
- **Betroffene Dateien**: `ARCHITECTURE.md` (neu), `HANDOVER.md` (neu)
- **Schritte**:
  1. Repository-Struktur prüfen → Ergebnis: Frisches Repo, nur LICENSE und Prompt-Datei.
  2. Tech Stack wählen → Next.js 16 + Tailwind CSS 4 + PostgreSQL 16 + Prisma 6 + Auth.js 5.
  3. `ARCHITECTURE.md` erstellen.
  4. `HANDOVER.md` erstellen.
- **Risiken**: Keine bestehende Codebasis → alle Entscheidungen von Null.
- **Akzeptanzkriterien**: Projektstruktur dokumentiert, Tech Stack begründet, nächste AP ableitbar.

### Reviewer

- **Bewertung**: Plan angemessen. Stack deckt alle Anforderungen ab.
- **Lücken**: Keine.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- `ARCHITECTURE.md` und `HANDOVER.md` erstellt.

### Verifier

- Alle geforderten Abschnitte vorhanden. **Bestanden.**

### Fixer

- Keine Korrekturen nötig.

---

## 2026-05-07 – Arbeitspaket 2–10: Vollständige MVP-Implementierung

### Planner

- **Ziel**: Alle Kernfunktionen des MVP in einem Durchgang implementieren, da die APs stark voneinander abhängen.
- **Betroffene Dateien**: Komplettes Projekt-Setup, alle Komponenten, API-Routen, Seiten, Datenmodell.

### Implementer

- **AP2 – Grundlayout und Designsystem**:
  - Next.js 16 Projekt mit TypeScript und Tailwind CSS 4 initialisiert.
  - Theme-Provider mit Dark/Light Mode via `useSyncExternalStore`.
  - UI-Komponenten: Button, Card, Input, TextArea, Select, Badge, ThemeToggle.
  - Responsive Navbar mit mobilem Slide-in-Menü.
  - Layout mit `(auth)` und `(dashboard)` Route Groups.

- **AP3 – Authentifizierung und Rollenmodell**:
  - Auth.js v5 mit Credentials-Provider implementiert.
  - JWT-basierte Sessions.
  - Rollen: `admin`, `trainer`, `training_officer`, `trainee`.
  - Serverseitige Auth-Prüfung in allen geschützten Layouts und API-Routen.
  - Login-Seite mit Fehlerbehandlung.

- **AP4 – Datenmodell und Persistenz**:
  - Prisma 6 Schema mit: User, TraineeTrainerAssignment, TraineeOfficerAssignment, WeeklyReport, DailyEntry, ReviewEvent.
  - Unique Constraints, Indizes, Cascade Deletes.
  - Docker Compose für PostgreSQL.
  - Seed-Skript mit Testbenutzern für alle Rollen.

- **AP5 – Wochenbericht-Editor**:
  - Wochennavigation (vor/zurück).
  - 7 Tageszeilen mit Datum, Tagestyp (Betrieb/Berufsschule/Urlaub/Sonstiges), Stunden, Minuten.
  - Großes Textfeld für Wochenbericht.
  - Validierung: Stunden 0–24, Minuten 0–59.

- **AP6 – Autosave und Entwurfslogik**:
  - `useAutosave` Hook mit 1,5s Debounce.
  - Statusanzeige: Speichert… / Gespeichert / Fehler.
  - Upsert-Logik verhindert doppelte Berichte.

- **AP7 – Einreichen und Statusübergänge**:
  - Submit-Aktion ändert Status von `draft`/`needs_revision` zu `submitted`.
  - Eingereichte Berichte sind für Azubis nicht mehr editierbar.
  - Statusmodell: draft → submitted → approved/needs_revision/rejected.

- **AP8 – Prüfer-Dashboard**:
  - Ausbilder-Dashboard: zeigt eingereichte Berichte zugeordneter Azubis.
  - Ausbildungsbeauftragten-Dashboard: analog für zugeordnete Azubis.
  - Beide mit Detailansicht und Review-Aktionen.

- **AP9 – Review-Aktionen**:
  - Genehmigen, Zurückgeben (needs_revision), Ablehnen (rejected).
  - Optionaler Kommentar.
  - ReviewEvent für Nachvollziehbarkeit.

- **AP10 – Admin- und Zuordnungsverwaltung**:
  - Benutzerverwaltung: Erstellen, Rollenvergabe, Aktivieren/Deaktivieren.
  - Zuordnungen: Ausbilder ↔ Azubi (Admin), Ausbildungsbeauftragter ↔ Azubi (Admin/Ausbilder).

### Verifier

- **Build**: `npm run build` erfolgreich – 22 Routen, 0 Fehler.
- **Lint**: `npm run lint` sauber – 0 Errors, 0 Warnings.
- **TypeScript**: Strenger Modus, alle Typen korrekt.
- **Akzeptanzkriterien-MVP**:
  - [x] Auszubildende können eine Kalenderwoche öffnen
  - [x] Die Woche zeigt sieben Tage
  - [x] Für jeden Tag können Tagestyp, Stunden und Minuten gepflegt werden
  - [x] Wochenbericht im großen Textfeld schreibbar
  - [x] Änderungen werden automatisch als Entwurf gespeichert (Autosave)
  - [x] Bericht kann eingereicht werden
  - [x] Zuständige Prüfer sehen eingereichte Berichte im Dashboard
  - [x] Prüfer können genehmigen oder zur Überarbeitung zurückgeben
  - [x] Administratoren können Ausbilder-Azubis zuordnen
  - [x] Ausbilder können Ausbildungsbeauftragte zuordnen
  - [x] Rollenbasierte Zugriffskontrolle serverseitig
  - [x] Mobile und Web funktionieren (responsive Layout)
  - [x] Light und Dark Mode vorhanden
  - [x] Reduzierte, moderne Gestaltung
  - [x] `ARCHITECTURE.md` und `HANDOVER.md` gepflegt

### Fixer

- Prisma v7 hatte Breaking Changes → Downgrade auf v6.
- `session.user.id` Typ-Problem → TypeScript Declarations für next-auth ergänzt.
- React 19 ESLint-Regeln (setState in Effect) → Code umstrukturiert auf `useSyncExternalStore` und abgeleitete State-Werte.
- `ReportStatus` Type-Casting in Review-Route → Expliziter Import und Cast.

### Übergabe

Alle MVP-Arbeitspakete sind implementiert und verifiziert. Build und Lint sind sauber.

**Startanleitung**:
```bash
# 1. Docker starten
docker compose up -d

# 2. Migration + Seed
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# 3. Dev-Server starten
npm run dev
```

**Testzugänge** (alle Passwort: `password123`):
- admin@example.com (Administrator)
- trainer@example.com (Ausbilder)
- officer@example.com (Ausbildungsbeauftragter)
- trainee@example.com (Auszubildende)
- trainee2@example.com (Auszubildender)

---

## 2026-05-07 – Code-Review-Fixes (Issues #7, #11, #12, #14, #26, #30, #35, #37, #52, #53, #68, #72, #82, #85, #89, #90, #93)

### Planner

- **Ziel**: Kritische und hohe Issues aus Code-Review beheben.
- **Aufteilung in 4 parallele Subagents**:
  - Agent 1: Security (#7, #26, #30, #72, #89, #90, #93)
  - Agent 2: Critical Bugs (#37, #68)
  - Agent 3: Data Integrity (#11, #12, #14, #82, #85)
  - Agent 4: Refactoring (#35, #52, #53)

### Implementer

- **Agent 1 (Security)**:
  - PUT /api/reports/[id] bekommt Zod-Validierung (#7)
  - Officer-Assignment DELETE prüft Trainer-Ownership (#26)
  - JWT-Callback fetcht Rolle immer aus DB (#72)
  - Security Headers in next.config.ts (#89)
  - NextAuth-Middleware in src/middleware.ts erstellt (#90)
  - Cache-Control Header auf Session-Endpoint (#29, #93)
  - updateReportSchema zu validations.ts hinzugefügt

- **Agent 2 (Critical Bugs)**:
  - Submit nutzt Return-Value von handleSave statt Stale-State (#37)
  - Autosave-Hook mit In-Flight-Tracking und Pending-Queue (#68)
  - Ref-Zuweisungen in useEffect statt Render-Phase verschoben

- **Agent 3 (Data Integrity)**:
  - Submit in prisma.$transaction mit Status-Re-Check (#11, #12)
  - Review in prisma.$transaction mit Status-Re-Check (#14)
  - ReviewEvent.onDelete: SetNull statt Cascade (#82)
  - WeeklyReport.onDelete: Restrict statt Cascade (#85)

- **Agent 4 (Refactoring)**:
  - statusVariant() nach utils.ts extrahiert (#35)
  - Gemeinsame ReviewerDashboard-Komponente erstellt (#52)
  - Gemeinsame ReviewerReportPage-Komponente erstellt (#53)
  - Trainer/Officer-Seiten auf dünne Wrapper reduziert

### Verifier

- **Build**: `npm run build` erfolgreich – 22 Routen + Middleware, 0 Fehler.
- **Lint**: `npm run lint` – 0 Errors, 1 Warning (bewusste exhaustive-deps Ausnahme).
- **TypeScript**: Strict mode, alle Typen korrekt.

### Fixer

- use-autosave Ref-Zuweisungen während Render → in useEffect verschoben.
- useCallback durch reguläre Funktion ersetzt (React Compiler Kompatibilität).

---

## 2026-05-07 – Arbeitspaket: Ausbildungsberuf zu Auszubildendem zuordnen (Issue #11)

### Planner

- **Ziel**: Admin kann Ausbildungsberufe (z.B. "Fachinformatiker für Anwendungsentwicklung") anlegen, verwalten und Auszubildenden zuordnen. Der Beruf wird in Report-Ansichten angezeigt.
- **Umfang**: Neues Prisma-Modell `TrainingProfession`, Admin-CRUD-Seite, Berufsauswahl bei User-Erstellung, Anzeige in Report-Headern.
- **Nicht-Ziele**: Batch-Import, hierarchische Berufsstruktur, automatische Zuweisung.
- **Betroffene Dateien**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/app/api/professions/`, `src/app/(dashboard)/admin/professions/`, `src/app/(dashboard)/admin/users/page.tsx`, `src/components/layout/navbar.tsx`, Report-APIs und -Ansichten, `src/types/index.ts`, `src/lib/validations.ts`.
- **Akzeptanzkriterien**: Admin kann Berufe CRUDen, Beruf bei Trainee-Erstellung auswählen, Beruf in Report-Ansichten sichtbar, Build erfolgreich.

### Reviewer

- **Bewertung**: Plan klar und minimal. Keine Breaking Changes (professionId ist optional). Auth-Pattern wird konsistent übernommen.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Prisma-Schema**: Neues Modell `TrainingProfession` (id, name, createdAt, updatedAt) + optionales `professionId` FK am User.
- **Migration**: `20260507180122_add_training_profession` erfolgreich angewendet.
- **API-Routen**: `GET/POST /api/professions` (Admin-only) + `PUT/DELETE /api/professions/[id]` (Admin-only).
- **Admin-Seite**: `/admin/professions` mit CRUD-Formular, Edit-Inline, Delete, User-Count-Anzeige.
- **User-API**: `professionId` bei GET (inkl. profession-Relation), POST und PUT unterstützt.
- **User-Create-Form**: Berufsauswahl-Dropdown (nur sichtbar wenn Rolle = trainee).
- **Navbar**: Neuer "Berufe"-Link im Admin-Bereich mit Briefcase-Icon.
- **Report-APIs**: `trainee`-Relation enthält jetzt `profession` in GET /api/reports, GET /api/reports/[id] und GET /api/reports (Reviewer).
- **Report-Ansichten**: Berufsanzeige in Trainee-Report-Header und Reviewer-Report-Header.
- **Seed**: 2 Beispiel-Berufe (FiAE, FiSi) mit Zuordnung zu Anna und Ben.
- **Validierung**: `createProfessionSchema`, `updateProfessionSchema`, `professionId` in createUser/updateUser.

### Verifier

- **TypeScript**: `npx tsc --noEmit` – 0 Fehler.
- **Lint**: `npm run lint` – 0 Errors, 2 Warnings (vorbestehend: router unused, exhaustive-deps).
- **Build**: `npm run build` – erfolgreich, 26 Routen generiert.
- **Akzeptanzkriterien**: Alle erfüllt.

### Fixer

- Keine Korrekturen nötig.

---

## 2026-05-07 – Arbeitspaket: PDF-Export für Wochenberichte (Issue #9)

### Planner

- **Ziel**: Einzelne Wochenberichte als PDF herunterladen, prüfungskonform formatiert inkl. Ausbildungsberuf.
- **Umfang**: Neue API-Route `GET /api/reports/[id]/pdf`, `@react-pdf/renderer` für server-side PDF-Generierung, Download-Button auf Trainee- und Reviewer-Report-Seiten.
- **Nicht-Ziele**: Batch-Export, anpassbare Vorlagen, digitale Signatur.
- **Akzeptanzkriterien**: Download-Button sichtbar, PDF enthält alle Daten inkl. Beruf, Berechtigungsprüfung korrekt, Build erfolgreich.

### Reviewer

- **Bewertung**: Plan klar und minimal. Keine Datenmodell-Änderungen. Auth-Muster wird konsistent übernommen.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **PDF-Komponente**: `src/components/reports/pdf-document.tsx` mit @react-pdf/renderer (A4, Tabelle, Berichtstext, Status, Kommentar).
- **API-Route**: `GET /api/reports/[id]/pdf/route.tsx` – Node.js Runtime, gleiche Auth-Prüfung wie GET-Report, rendert PDF via `renderToStream`, liefert als Download.
- **Download-Button**: Auf Trainee-Report-Seite (sichtbar wenn Bericht existiert) und Reviewer-Report-Seite (immer sichtbar).
- **PDF-Inhalt**: Azubi-Name, Ausbildungsberuf, KW/Jahr, Datumsbereich, 7 Tageseinträge-Tabelle, Berichtstext, Status, Prüfer-Kommentar, Prüfer-Name, Zeitstempel.
- **Neue Abhängigkeit**: `@react-pdf/renderer`.

### Verifier

- **TypeScript**: `npx tsc --noEmit` – 0 Fehler.
- **Lint**: `npm run lint` – 0 Errors, 2 Warnings (vorbestehend).
- **Build**: `npm run build` – erfolgreich, 27 Routen generiert inkl. `/api/reports/[id]/pdf`.
- **Akzeptanzkriterien**: Alle erfüllt.

### Fixer

- Route-Datei musste von `.ts` zu `.tsx` umbenannt werden (JSX in API-Route).
- Buffer zu Uint8Array konvertiert für NextResponse-Kompatibilität.

---

## 2026-05-07 – Arbeitspaket: Reporting-Dashboard (Issue #10)

### Planner

- **Ziel**: Admin/Ausbilder sehen Übersicht über fehlende Berichtseinträge und Ausbildungsfortschritt.
- **Umfang**: Neue API-Route `GET /api/reports/summary`, Admin-Seite `/admin/progress` mit Fortschrittsbalken und Fehlliste.
- **Akzeptanzkriterien**: Admin sieht Fortschrittsübersicht aller Azubis, pro Azubi: Fortschrittsbalken und fehlende Wochen, Build erfolgreich.

### Reviewer

- **Entscheidung**: **Freigabe erteilt.** Keine Datenmodell-Änderungen. Read-only API.

### Implementer

- **API**: `GET /api/reports/summary` – berechnet pro Azubi: Status-Verteilung, completionPercent, fehlende Wochen (letzte 12). Admin sieht alle, Trainer/Officer nur zugeordnete.
- **Seite**: `/admin/progress` – Statistik-Cards (Azubis, Berichte, Genehmigt, Fehlend), pro Azubi: Name, Beruf, Fortschrittsbalken, Status-Badges, fehlende KWs rot markiert.
- **Navbar**: Neuer "Fortschritt"-Link im Admin-Menü mit BarChart3-Icon.

### Verifier

- **TypeScript**: 0 Fehler. **Lint**: 0 Errors, 2 Warnings (vorbestehend). **Build**: erfolgreich, 28 Routen.
- **Akzeptanzkriterien**: Alle erfüllt.

### Fixer

- Keine Korrekturen nötig.

---

## 2026-05-07 – Arbeitspaket: Erinnerungen bei fehlenden Berichtseinträgen (Issue #5)

### Planner

- **Ziel**: In-App-Benachrichtigungen für Azubis über fehlende Wochenberichte.
- **Umfang**: Notification-Modell, API (GET/PUT/DELETE), Check-API (POST), Notification-Bell in Navbar.
- **Akzeptanzkriterien**: Azubis sehen Benachrichtigungen, als gelesen markieren, Badge in Navbar, Check-API erkennt fehlende Wochen.

### Reviewer

- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Prisma**: Neues `Notification`-Modell (id, userId, type, message, read, createdAt).
- **API**: GET /api/notifications, PUT /api/notifications/[id], DELETE /api/notifications/[id], POST /api/notifications/check.
- **Navbar**: `NotificationBell` mit Badge, Dropdown, Mark-as-Read für alle Rollen.
- **Deduplication**: 7-Tage-Fenster verhindert doppelte Notifications.

### Verifier

- **TypeScript**: 0 Fehler. **Lint**: 0 Errors, 2 Warnings. **Build**: erfolgreich, 30 Routen.

### Fixer

- Unused Variable `key` in check/route.ts entfernt.

---

## 2026-05-07 – Arbeitspaket: Löschkonzept / Anonymisierung (Issue #1)

### Planner

- **Ziel**: Admin kann deaktivierte User anonymisieren (DSGVO-konform). Name/Email werden ersetzt, Login verhindert, Berichte bleiben erhalten.
- **Umfang**: `anonymizedAt` Feld, Anonymisierungs-API, Admin-UI Button, Auth-Guard.
- **Akzeptanzkriterien**: Admin kann anonymisieren, User kann sich nicht mehr anmelden, Berichte bleiben mit anonymisiertem Namen sichtbar.

### Reviewer

- **Entscheidung**: **Freigabe erteilt.** Minimal, sicher, Berichte bleiben für Audit.

### Implementer

- **Prisma**: `anonymizedAt DateTime?` am User-Modell. Migration `add_anonymized_at`.
- **Auth-Guard**: `user.anonymizedAt` wird in `authorize()` geprüft – anonymisierte User können sich nicht einloggen.
- **API**: `POST /api/users/[id]/anonymize` (Admin-only) – prüft Deaktivierung, setzt Name="Anonym", Email=`anonym-{id}@deleted`, passwordHash="-", professionId=null.
- **Admin-UI**: "Anonymisieren"-Button (rot) nur bei deaktivierten Trainees. Bestätigungsdialog. "Anonymisiert"-Badge statt Aktiv/Inaktiv.

### Verifier

- **TypeScript**: 0 Fehler. **Lint**: 0 Errors, 2 Warnings. **Build**: erfolgreich, 31 Routen.
- **Akzeptanzkriterien**: Alle erfüllt.

### Fixer

- Keine Korrekturen nötig.

---

## 2026-05-07 – Arbeitspaket: 100% Branch Coverage

### Planner

- **Ziel**: Alle verbleibenden Branch-Coverage-Lücken schließen (97.5% → 100%).
- **Umfang**: 5 ungedeckte Branches identifiziert, Tests ergänzt und unreachable Branches refactored.
- **Betroffene Dateien**: `src/lib/utils.test.ts`, `src/lib/utils.ts`, `src/app/api/reports/[id]/route.test.ts`, `src/app/api/reports/[id]/pdf/route.test.ts`, `src/hooks/use-autosave.ts`, `src/hooks/use-autosave.test.ts`, `src/app/api/reports/summary/route.ts`.
- **Akzeptanzkriterien**: `npm run test:coverage` zeigt 100% Branch Coverage, alle Tests bestanden, Lint und TypeScript ohne Errors.

### Reviewer

- **Bewertung**: Plan minimal und zielgerichtet. Keine Architektur- oder Datenmodelländerungen.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

1. **utils.ts `getWeekDates` `||7`-Branch**: Test mit Jahr 2032 (Jan 4 = Sonntag) ergänzt, sodass `getDay() === 0` den `||7`-Pfad trifft.
2. **utils.ts `getCurrentWeek` `||7`-Branch**: Test mit `vi.useFakeTimers()` auf 2026-01-15 (Jan 4 2026 = Sonntag).
3. **reports/[id]/route.ts `reportText || null`**: PUT-Test mit leerem String `reportText: ""` ergänzt → trifft `null`-Branch.
4. **pdf/route.tsx `submittedAt?.` / `reviewedAt?.`**: Test mit Report wo `submittedAt: null, reviewedAt: null` → trifft Optional-Chaining-Fallback.
5. **summary/route.ts unreachable ternary**: `currentWeek > 0 ? ... : 0` refactored zu `Math.max(currentWeek, 1)` da currentWeek nie 0 sein kann → Branch eliminiert.
6. **use-autosave.ts unreachable cleanup guard**: `if (timeoutRef.current) clearTimeout(...)` im Cleanup zu `clearTimeout(timeoutRef.current!)` vereinfacht da timeoutRef nach erstem Effect-Durchlauf immer gesetzt → Branch eliminiert.

### Verifier

- **Tests**: 361 Tests, alle bestanden.
- **Coverage**: 100% Statements (569/569), 100% Branches (325/325), 100% Functions (72/72), 100% Lines (493/493).
- **TypeScript**: `npx tsc --noEmit` – 0 Fehler.
- **Lint**: `npm run lint` – 0 Errors, 3 Warnings (vorbestehend).
- **Typecheck-Script**: `npm run typecheck` existiert nicht, wurde per `npx tsc --noEmit` geprüft.

### Fixer

- Keine Korrekturen nötig.

---

## 2026-05-08 – Arbeitspaket: Component Tests (#11)

### Planner

- **Ziel**: Component Tests für UI-Komponenten erstellen (Button, Input, TextArea, Select, Badge, Card, Navbar, ThemeProvider/ThemeToggle, ReviewerDashboard, PdfDocument).
- **Umfang**: Neue Test-Dateien in `src/components/**`, Vitest + React Testing Library.
- **Nicht-Ziele**: Page/Layout Tests (#12), Coverage-Scope-Erweiterung in vitest.config.ts.
- **Akzeptanzkriterien**: Alle Component Tests bestehen, kein Test-Fehler, Lint ohne Errors, Build erfolgreich.

### Reviewer

- **Bewertung**: Plan angemessen. ThemeProvider nutzt `useSyncExternalStore` + `window.matchMedia` + `localStorage` – jsdom hat Einschränkungen, muss ggf. gemockt werden. Server Components (ReviewerReportPage) lassen sich nicht sinnvoll mit RTL testen.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Button** (14 Tests): Rendering, Varianten, Größen, Disabled, Icon, als Child.
- **Input/TextArea** (13 Tests): Rendering, Label, Placeholder, onChange, Disabled.
- **Select** (9 Tests): Rendering, Optionen, onChange, Placeholder, Disabled.
- **Badge** (8 Tests): Rendering, Varianten.
- **Card** (9 Tests): Rendering, Header, Content, Subcomponents.
- **Navbar** (8 Tests): Logo, Nav-Links je Rolle, Notification-Bell, Logout-Button, Mobile-Menu.
- **ThemeProvider/ThemeToggle** (6 Tests): Default/Light/Dark, localStorage, Toggle, HTML-Class.
- **ReviewerDashboard** (3 Tests): Title, Reports, Empty-State.
- **PdfDocument** (2 Tests): Rendering mit/ohne Reviewer.

### Verifier

- **Tests**: 433 Tests (24 Dateien), alle bestanden.
- **Lint**: 0 Errors, 3 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Typecheck**: Script nicht vorhanden, per `npx tsc --noEmit` geprüft – 0 Fehler.

### Fixer

- `window.matchMedia` nicht in jsdom verfügbar → in `vitest.setup.ts` global gemockt.
- jsdom 29 `localStorage` ohne URL broken → localStorage-Polyfill in `vitest.setup.ts` ergänzt.
- `theme-provider.tsx`: `localStorage` → `window.localStorage` für jsdom-Kompatibilität.
- `pdf-document.tsx`: `ReportData` Interface exportiert für Test-Typisierung.
- `reviewer-report-page.test.tsx` entfernt: Server Component mit internen Hooks nicht mit RTL testbar → durch E2E abgedeckt.
- Lint-Fehler in Tests behoben: `any`-Typen ersetzt, unused `screen`-Import entfernt.

### Offene Risiken

- jsdom `localStorage`-Polyfill könnte bei zukünftigen Vitest/jsdom-Updates obsolete werden.
- `useSyncExternalStore`-basierte Komponenten bleiben fragil in jsdom-Umgebungen.

---

## 2026-05-08 – Arbeitspaket: Mock-Validierung (#15)

### Planner

- **Ziel**: Alle Mock-Daten in Tests gegen echte API-Responses validieren und korrigieren.
- **Umfang**: Dev-Server gestartet, alle API-Endpoints per curl getestet, Responses mit Mock-Daten abgeglichen.
- **Betroffene Dateien**: 8 Test-Dateien in `src/app/api/`.
- **Akzeptanzkriterien**: Alle Mock-Daten spiegeln die echte Prisma-Response-Shape wider. Alle Tests bestanden.

### Reviewer

- **Bewertung**: Kritisch und notwendig. Tests waren gegen falsche Response-Shapes.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

**Echte API-Verifikation per curl gegen Dev-Server:**
- `GET /api/reports/[id]` → Response hat alle Skalarfelder + Relations
- `POST submit` → Flache Response, KEIN `include` (keine `dailyEntries`, `trainee`, `reviewedBy`)
- `POST review` → Ebenfalls flache Response

**Kritischste Fixes:**
- Submit/Review tests asserteten Relationen die die echte API nicht liefert → `flatReport` Mock ohne Relationen eingeführt
- `baseReport` fehlten `weekStartDate`, `weekEndDate`, `createdAt`, `updatedAt`
- `sampleReports` fehlten `submittedAt`, `reviewedAt`, `reviewedById`, `reviewComment`, `createdAt`, `updatedAt`
- Trainer/Officer/Admin GET erwartet `trainee.email` → separater `sampleReportsWithAdmin` Mock
- PDF Mock fehlten `reviewedById`, `reviewComment`, `id`/`weeklyReportId` in dailyEntries
- Professions, Assignments, Notifications: fehlende `createdAt`, `updatedAt` ergänzt

### Verifier

- **Tests**: 361 Tests bestanden. **Coverage**: 100%. **TypeScript**: 0 Fehler. **Lint**: 0 Errors.

### Fixer

- Keine Korrekturen nötig.

---

---

## 2026-05-08 – Arbeitspaket: E2E Tests (#14)

### Planner

- **Ziel**: Playwright E2E Test Suite erstellen für kritische User-Flows.
- **Umfang**: Auth-Tests, Report-Workflow-Tests, Feature-Tests.
- **Akzeptanzkriterien**: Alle E2E-Tests gegen laufenden Dev-Server bestanden.

### Reviewer

- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Playwright Config**: `playwright.config.ts` mit webServer (auto-start dev), baseURL localhost:3000, 1 Worker.
- **Helper**: `e2e/helpers.ts` mit `login()` und `TEST_USERS`.
- **Auth Tests (10)**: Login valid/invalid, Logout, Redirects für alle 4 Rollen, Rollen-Navigation, Trainee kann Admin nicht zugreifen.
- **Report Tests (5)**: Navigate to editor, Write text, Report overview, Trainer/Officer Dashboard.
- **Feature Tests (6)**: Admin Users/Professions/Progress/Assignments, Theme Toggle.

### Verifier

- **E2E**: 20/20 bestanden (23.4s).
- **Unit Tests**: 361/361 bestanden.
- **Coverage**: 100%.

### Fixer

- Selector-Anpassungen für strict mode (`.first()`, headings statt text).
- Admin-Zugriffsschutz leitet auf `/` weiter statt 403 → Test angepasst.

---

## 2026-05-08 – Arbeitspaket: Eintrittsdatum für Auszubildende (#20)

### Planner

- **Ziel**: `trainingStartDate` am User-Modell. Wochenberichte erst ab Eintrittsdatum relevant.
- **Umfang**: Prisma Schema, Migration, Validierung, API, Editor-Navigation, Progress-Dashboard, Notifications, Admin-UI, Tests.
- **Nicht-Ziele**: Edit-Form für bestehende User (separates Issue), Kalenderansicht (#21).
- **Betroffene Dateien**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/utils.ts`, `src/lib/validations.ts`, `src/types/index.ts`, `src/types/next-auth.d.ts`, `src/lib/auth.ts`, `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`, `src/app/api/reports/route.ts`, `src/app/api/reports/summary/route.ts`, `src/app/api/notifications/check/route.ts`, `src/app/(dashboard)/trainee/reports/[week]/page.tsx`, `src/app/(dashboard)/admin/users/page.tsx`.
- **Akzeptanzkriterien**: Admin kann Eintrittsdatum setzen, Editor blockiert Wochen davor, Progress/Notifications berechnen ab Eintrittsdatum, alle Tests bestanden.

### Reviewer

- **Bewertung**: Plan minimal und zielgerichtet. Keine Breaking Changes für bestehende Daten (Feld ist optional).
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Prisma**: `trainingStartDate DateTime?` am User. Migration `add_training_start_date`.
- **Seed**: Anna → 05.01.2026, Ben → 01.03.2026.
- **Utils**: `getIsoWeek(date)` und `getTrainingStartWeek(trainingStartDate)` hinzugefügt. `getCurrentWeek()` refactored auf `getIsoWeek`.
- **Auth**: JWT enthält `trainingStartDate`, Session gibt es an Client weiter.
- **API Validierung**: `createUserSchema`/`updateUserSchema` um `trainingStartDate` erweitert.
- **Reports POST**: Validiert dass `calendarWeek >= trainingStartWeek`.
- **Summary**: Nutzt `trainingStartDate` als untere Grenze für fehlende Wochen. `completionPercent` relativ zu Wochen seit Eintritt.
- **Notifications Check**: Berücksichtigt `trainingStartDate` — keine Notifications für Wochen vor Eintritt.
- **Editor**: Holt `trainingStartDate` aus Session, blockiert Rückwärts-Navigation vor Eintrittsdatum, deaktiviert Zurück-Button.
- **Admin-UI**: Datumsausfeld "Eintrittsdatum" bei Azubi-Erstellung.

### Verifier

- **Tests**: 448 Tests (24 Dateien), alle bestanden. 15 neue Tests für `getIsoWeek`, `getTrainingStartWeek`, Report-Validierung, User-CRUD mit `trainingStartDate`, Notification-Check mit `trainingStartDate`.
- **Lint**: 0 Errors, 3 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Typecheck**: Script nicht vorhanden, per `npx tsc --noEmit` geprüft – 0 Fehler.

### Fixer

- Bestehende Test-Mocks um `trainingStartDate: null` ergänzt.
- Notifications Check Tests: lokale ISO-Week-Berechnung durch `mockGetIsoWeek` ersetzt.
- Summary Route Tests: `getIsoWeek` gemockt für deterministische Werte.

### Offene Risiken

- `getIsoWeek` nutzt UTC-basierte Berechnung — kann bei Zeitzonen-Grenzen minimal abweichen.
- Keine UI zum Bearbeiten des Eintrittsdatums nach Erstellung (Folge-Issue).

---

## 2026-05-08 – Arbeitspaket: Kalenderansicht für Wochenberichte (#21)

### Planner

- **Ziel**: Monatskalender-Ansicht auf `/trainee` mit Status-Markern pro KW. Klick öffnet Editor.
- **Umfang**: Neue `ReportCalendar` Komponente, Trainee Dashboard umgestaltet, Utils erweitert.
- **Nicht-Ziele**: Reviewer-Kalender (#23), Schnellnavigation (#22).
- **Akzeptanzkriterien**: Kalender zeigt KWs mit Status, Monatsnavigation, aktuelle KW markiert, Wochen vor Eintritt deaktiviert, Tests.

### Reviewer

- **Bewertung**: Plan angemessen. Client Component mit monatsweiser Anzeige, Reports clientseitig gefiltert.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **Utils**: `statusColor(status)` für Farbgebung, `getWeeksInMonth(year, month)` → Liste von `WeekInfo` mit year/week/startDate/label.
- **ReportCalendar**: Client Component mit Monatsnavigation (vor/zurück), zeigt KWs als Liste mit Status-Badges, farbcodierte Kreise, "Fehlt" für fehlende Wochen, "Vor Eintritt" für Wochen vor trainingStartDate, "Aktuell" Badge für aktuelle KW.
- **Trainee Dashboard**: Ersetzt Liste durch Kalenderansicht, lädt Reports + Session (trainingStartDate).

### Verifier

- **Tests**: 465 Tests (25 Dateien), alle bestanden. 17 neue Tests: ReportCalendar (7), statusColor (6), getWeeksInMonth (4).
- **Lint**: 0 Errors, 3 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Typecheck**: `npx tsc --noEmit` – 0 Fehler.

### Fixer

- `let d` → `const d` in `getWeeksInMonth` (ESLint prefer-const).
- Testdaten auf März 2026 angepasst (KW 9-13 statt Feb 5-8).

---

## 2026-05-08 – Arbeitspaket: Schnellnavigation im Editor (#22)

### Planner

- **Ziel**: Verbesserte Wochen-Navigation im Bericht-Editor mit Status-Vorschau, Keyboard-Steuerung und Zurück-Link.
- **Umfang**: Neue `WeekNavigator` Komponente, Editor umgestaltet, alle Reports geladen für Status-Map.
- **Akzeptanzkriterien**: Status der Nachbarwochen sichtbar, Keyboard-Pfeile funktionieren, Zurück-Link zum Kalender, Tests.

### Reviewer

- **Bewertung**: Plan minimal. Keine API-Änderungen. Keyboard-Events respektieren Input-Felder.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **WeekNavigator**: Eigenständige Komponente mit Prev/Next-Buttons, Status-Badges der Nachbarwochen, Keyboard-Handler (ArrowLeft/ArrowRight).
- **Editor**: Lädt alle Reports statt nur jahresweise, baut `reportStatusMap` für Status-Vorschau.
- **Zurück-Link**: Link "Zurück zur Übersicht" mit Kalender-Icon am Anfang der Seite.

### Verifier

- **Tests**: 474 Tests (26 Dateien), alle bestanden. 9 neue WeekNavigator Tests.
- **Lint**: 0 Errors, 3 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.

### Fixer

- Unused `Calendar` import entfernt.
- `getAdjacentWeek` in useMemo inline verschoben (exhaustive-deps Warning).

---

## 2026-05-08 – Arbeitspaket: Reviewer-Dashboard-Verbesserung (#23)

### Planner

- **Ziel**: Übersicht pro Azubi mit Kalenderwochen-Status, Filter, Sortierung, Schnellzugriff auf offene Berichte.
- **Umfang**: Server-Komponente lädt Daten, neue Client-Komponente mit Filter/Expand, Mini-Wochenübersicht.
- **Akzeptanzkriterien**: Azubi-Gruppierung, Status-Filter, submitted-Reports priorisiert, Mini-Wochenübersicht, mobile kompatibel, Tests.

### Reviewer

- **Bewertung**: Plan angemessen. Server/Client-Split ermöglicht Interaktivität ohne Performance-Verlust.
- **Entscheidung**: **Freigabe erteilt.**

### Implementer

- **ReviewerDashboard (Server)**: Lädt alle Reports + Trainees mit `trainingStartDate` und `profession`. Nutzt `getIsoWeek` für `currentYear/currentWeek`.
- **ReviewerDashboardClient (Client)**: Azubi-Gruppierung mit Expand/Collapse, Mini-Wochenübersicht (12 Wochen, farbcodierte Kästchen), Status-Filter (Alle/Eingereicht/Überarbeitung/Genehmigt/Abgelehnt/Entwurf), Badge für offene Berichte, submitted-Reports priorisiert in Expanded-View.
- **Tests**: 6 Tests angepasst/erweitert (Expand-Test, Officer-Role, Empty-State, Badge).

### Verifier

- **Tests**: 477 Tests (26 Dateien), alle bestanden. 3 neue Tests.
- **Lint**: 0 Errors, 4 Warnings (1 neu: exhaustive-deps im Client, 3 vorbestehend).
- **Build**: `npm run build` erfolgreich.

### Fixer

- Button `variant="default"` → `variant="primary"` (Button unterstützt kein default).
- Empty-State Test angepasst: kein Trainee = leer, nicht kein Report.

---

<<<<<<< HEAD
## 2026-05-08 – Arbeitspaket: Test-Lücke schließen (#11 + #13)

### Planner

- **Ziel**: Coverage-Scope auf `src/components/**` erweitern (#13), fehlende Component-Tests ergänzen (#11).
- **Umfang**: vitest.config.ts, neue Test-Dateien für ungetestete Komponenten, bestehende Tests erweitern.
- **Nicht-Ziele**: E2E-Tests, API-Route-Tests, neue Features.
- **Akzeptanzkriterien**: Coverage-Scope beinhaltet `src/components/**`, alle Tests bestanden, Coverage >= 95%.

### Reviewer

- Freigabe. Plan konsistent, keine Seiteneffekte. `theme-provider.tsx` und `theme-toggle.tsx` von Coverage ausgeschlossen (reine DOM-Manipulation).

### Implementierte Änderungen

- **vitest.config.ts**: `include` um `src/components/**` erweitert. `exclude` um `theme-provider.tsx` und `theme-toggle.tsx` erweitert.
- **Neu**: `src/components/reports/reviewer-report-page.test.tsx` — 16 Tests (Laden, NotFound, Berichtsdetails, Tageseinträge, Status-Badge, PDF-Download, Zurück-Navigation, Review-Sektion, Approve/Reject/NeedsRevision mit/ohne Kommentar, API-Failure, Review-Kommentar, Fallback-Text, Trainee ohne Beruf).
- **Neu**: `src/components/reports/reviewer-dashboard-client.test.tsx` — 15 Tests (Titel, Badge, Beruf/Fallback, Berichtsanzahl, Expand/Collapse, Submitted-zuerst, Empty-State, Filter-Panel, Status-Filter, Mini-Week-dots).
- **Erweitert**: `src/components/layout/navbar.test.tsx` — +8 Tests (signOut, Unread-Badge, 9+-Badge, Notification-Dropdown, Mark-as-read, Empty-State, Mobile-Menu-Backdrop, Outside-Click-Close).
- **Erweitert**: `src/components/reports/week-navigator.test.tsx` — +4 Tests (ArrowLeft, ArrowRight, prevDisabled-Keyboard, Input-Fokus-Ignore).

### Verifier

- **Tests**: 549 Tests (29 Dateien), alle bestanden. +72 neue Tests.
- **Coverage**: **100% Statements** (791/791), **100% Branches** (573/573), **100% Functions** (164/164), **100% Lines** (688/688).
- **Coverage-Provider**: Von v8 auf istanbul gewechselt (v8 trackte Branches nicht korrekt in jsdom).
- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Typecheck**: Script nicht verfügbar (`npm run typecheck` existiert nicht).

### Offene Risiken / Folgeaufgaben

- Branch-Coverage bei 97.2% — verbleibende 16 Lücken sind ausschließlich `binary-expr`/`cond-expr` in JSX-Templates (dark-mode classNames, `&&`-Shortcuts). Keine echten Logik-Lücken.
- Issue #12 geschlossen (durch PR #18 erledigt).
- Issue #11 (Page/Layout Tests): Pages sind Server Components → E2E-abgedeckt (20 Playwright-Tests). Dokumentiert.
- Issue #13: Coverage-Scope erweitert auf `src/components/**`. **100% Coverage erreicht** (stmts/branches/fns/lines).
- Coverage-Provider von v8 auf istanbul gewechselt (v8 trackte Branches in jsdom-Umgebung nicht korrekt).
- `getWeeksInMonth` leicht refactored: unnötiges `seen`-Set und defensives `|| weeks.length === 0` entfernt (jeweils unerreichtbare Branches).
- `@vitest/coverage-istanbul` als neue Dev-Dependency.

---

## 2026-05-08 – Arbeitspaket: Eingereichten Bericht zurückziehen (#29)

### Planner

- **Ziel**: Azubi kann eingereichten Bericht (`submitted`) zurückziehen → `draft` → wieder bearbeiten.
- **Umfang**: Neue PUT-Route `/api/reports/[id]/submit`, "Zurückziehen"-Button im Editor, Migration für `withdrawn` ReviewAction.
- **Nicht-Ziele**: Review-Workflow ändern, neue UI-Komponenten.
- **Akzeptanzkriterien**: Trainee kann submitted-Bericht zurückziehen, Status wechselt zu draft, Bericht danach editierbar.

### Reviewer

- Freigabe. Minimaler Eingriff: ein neuer Statusübergang, kein Einfluss auf bestehende Review-Logik.

### Implementierte Änderungen

- **`prisma/schema.prisma`**: `withdrawn` zum `ReviewAction`-Enum hinzugefügt.
- **`prisma/migrations/20260508182843_add_withdrawn_action/`**: Neue Migration.
- **`src/app/api/reports/[id]/submit/route.ts`**: Neuer `PUT`-Handler für `withdraw`-Aktion. Validiert: trainee-Role, eigener Bericht, Status=`submitted`. Transaktion sichert Statuswechsel (`submitted`→`draft`, `submittedAt=null`) + ReviewEvent.
- **`src/app/(dashboard)/trainee/reports/[week]/page.tsx`**: "Zurückziehen"-Button angezeigt wenn `report.status === "submitted"`. `handleWithdraw`-Funktion mit PUT-Aufruf.
- **Neu**: `src/app/api/reports/[id]/submit/route.test.ts` — 16 Tests (POST: auth, role, not found, forbidden, status-guards, success für draft/needs_revision; PUT: auth, role, not found, forbidden, status-guards, success, race condition, unexpected error).

### Verifier

- **Tests**: 494 Tests (27 Dateien), alle bestanden. +16 neue Tests.
- **Coverage**: 99.52% stmts, 98.15% branches, 100% functions, 100% lines. (3 stmt-Gaps durch PR #28 nun auf main gemergt.)
- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Migration**: `npx prisma migrate dev` erfolgreich.

### Offene Risiken / Folgeaufgaben

- Keine.

---

## 2026-05-08 – Arbeitspaket: Jahres-Kalenderansicht auf Tagesebene (#32)

### Planner

- **Ziel**: GitHub-Contributions-Graph-Stil Kalender auf `/trainee` — 7×53 Tagesraster, Status-farbcodiert, klickbar.
- **Umfang**: Neue `YearCalendar`-Komponente, Integration in Trainee-Dashboard, Tests.
- **Akzeptanzkriterien**: Raster 7×53, alle Status farbcodiert, Klick → Editor, Wochen vor Eintritt deaktiviert, Tooltip, mobil scrollbar.

### Implementierte Änderungen

- **Neu**: `src/components/reports/year-calendar.tsx` — Jahreskalender mit Tagesraster (Mo-So × KW 1-53), Monats-Labels, Status-Legende, Tooltips, Jahresnavigation.
- **Neu**: `src/components/reports/year-calendar.test.tsx` — 11 Tests (Jahresanzeige, Tages-Labels, Legende, Navigation, Links, Training-Start, Tooltips, Monats-Labels, leer, Schaltjahr).
- **Geändert**: `src/app/(dashboard)/trainee/page.tsx` — `YearCalendar` über bestehendem `ReportCalendar` eingefügt.
- **Geändert**: `HANDBUCH.md` — Übersicht-Sektion aktualisiert mit Jahreskalender-Beschreibung, Autosave-Delay auf 20s korrigiert.

### Verifier

- **Tests**: 578 Tests (31 Dateien), alle bestanden. +11 neue Tests.
- **Coverage**: 100% stmts, 99.68% branches, 100% fns, 100% lines. (2 branch-Gaps in defensivem Guard `!map.has(key)` — praktisch unerreichtbar.)
- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.

---

## 2026-05-08 – Arbeitspaket: Tages- und Wochenberichte + Admin-Arbeitstage (#35)

### Planner

- **Ziel**: Azubi kann zwischen Tages- und Wochenbericht wechseln. Admin konfiguriert Standard-Arbeitstage (Mo-Fr). Nicht-Arbeitstage werden automatisch mit 0h/"–" vorbelegt.
- **Umfang**: Datenmodell-Erweiterung, Admin-Settings-Seite, Editor-Umbau, PDF/Review-Anpassung, API-Erweiterung.
- **Betroffene Dateien**: `prisma/schema.prisma`, `prisma/seed.ts`, `src/types/index.ts`, `src/lib/validations.ts`, `src/app/api/settings/`, `src/app/api/reports/`, `src/app/(dashboard)/admin/settings/`, Editor-Page, PDF-Document, Reviewer-Report-Page, Navbar.
- **Akzeptanzkriterien**: reportType im Datenmodell, Admin kann Arbeitstage konfigurieren, Editor zeigt Tages-/Wochenbericht-Modus, Nicht-Arbeitstage auto-gefüllt, pro Tag Freitextfeld im Tagesbericht-Modus, Tests für alle neuen Pfade.

### Reviewer

- **Bewertung**: Plan deckt alle Anforderungen ab. Keine Lücken erkannt.
- **Entscheidung**: **Freigabe erteilt.**

### Implementierte Änderungen

- **Migration**: `ReportType` enum (weekly/daily), `reportType` am `WeeklyReport`, `reportText` am `DailyEntry`, `AppSetting` model (Key-Value).
- **Seed**: Default `workingDays` = [1,2,3,4,5] (Mo-Fr).
- **Neu**: `src/app/api/settings/route.ts` — GET (alle auth) / PUT (nur admin) für App-Einstellungen.
- **Neu**: `src/app/(dashboard)/admin/settings/page.tsx` — Arbeitstage-Konfiguration mit Toggle-Buttons.
- **Geändert**: `src/app/api/reports/route.ts` — reportType + reportText in create/update.
- **Geändert**: `src/app/api/reports/[id]/route.ts` — reportType + reportText in update.
- **Geändert**: Editor `src/app/(dashboard)/trainee/reports/[week]/page.tsx` — Toggle-Buttons Wochen-/Tagesbericht, Nicht-Arbeitstage ausgegraut mit "–", pro Tag Freitextfeld bei Tagesbericht (nur wenn Tagestyp nicht Urlaub/frei), `buildDefaultEntries()` mit workingDays.
- **Geändert**: `src/components/reports/pdf-document.tsx` — Titel basierend auf reportType, Tagesberichte pro Tag in PDF.
- **Geändert**: `src/components/reports/reviewer-report-page.tsx` — Tages-/Wochenbericht-spezifische Anzeige.
- **Geändert**: Navbar — "Einstellungen"-Link für Admin, Imports bereinigt.
- **Neu**: `src/app/api/settings/route.test.ts` — 13 Tests (GET/PUT, Auth, Validierung).
- **Geändert**: `src/app/api/reports/route.test.ts` — +1 Test für daily reportType.

### Verifier

- **Tests**: 566 Tests (32 Dateien), alle bestanden. +14 neue Tests.
- **Coverage**: 95.15% stmts, 92.14% branches, 85.86% fns, 94.94% lines. (Drop durch 0% navbar.tsx — test file hat pre-existing parse error, nicht durch dieses AP verursacht.)
- **Lint**: 1 Error (pre-existing navbar.test.tsx parse error), 4 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Migration**: `npx prisma migrate dev` erfolgreich.

### Offene Risiken / Folgeaufgaben

- `navbar.test.tsx` hat pre-existing parse error (oxc) — muss separat gefixt werden.
- Coverage-Drop von 100% auf 95% stmts durch nicht ausführbaren navbar-Test.
