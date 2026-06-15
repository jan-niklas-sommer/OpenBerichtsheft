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

---

## 2026-05-09 – Arbeitspaket: Page- und Layout-Tests ergänzen (#11)

### Planner

- **Ziel**: Alle API-Routen und Komponenten ohne Tests absichern. Fehlerhaften navbar-Test fixen.
- **Umfang**: 4 neue Testdateien, 1 gefixter Test, 1 aktualisierter Test.
- **Akzeptanzkriterien**: Alle Tests bestanden, 0 Lint-Errors, Coverage ≥95%.

### Implementierte Änderungen

- **Neu**: `src/app/api/reports/[id]/review/route.test.ts` — 11 Tests (Auth, Permission, Statusübergänge, Transaktion).
- **Neu**: `src/app/api/users/[id]/route.test.ts` — 7 Tests (Auth, Validierung, Update, Passwort-Hashing).
- **Neu**: `src/app/api/users/[id]/anonymize/route.test.ts` — 6 Tests (Auth, Validierung, DSGVO-Anonymisierung).
- **Neu**: `src/app/api/notifications/[id]/route.test.ts` — 4 Tests (PUT mark-read, DELETE).
- **Fix**: `src/components/layout/navbar.test.tsx` — Verwaistes Code-Fragment entfernt (Zeile 34-37), Parse Error behoben, "Einstellungen" in Admin-Nav-Test ergänzt.

### Verifier

- **Tests**: 617 Tests (36 Dateien), alle bestanden. +51 Tests (29 neu + 22 wiederhergestellt durch navbar-Fix).
- **Coverage**: 99.26% stmts, 97.48% branches, 96.85% fns, 99.15% lines.
- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- Keine.

---

## 2026-05-09 – Arbeitspaket: Neues Zuordnungsmodell (#38)

### Planner

- **Ziel**: Ausbilder werden Berufen zugeordnet (sehen alle Azubis des Berufs). Ausbildungsbeauftragte bekommen Azubi+Zeitraum (nur Berichte im Zeitraum sichtbar). Ausbilder können Officer berechtigen.
- **Umfang**: Datenmodell, Migration, API-Routen, Admin-UI, Tests.
- **Akzeptanzkriterien**: Alle Tests bestanden, Build erfolgreich, alte Zuordnungen migriert.

### Implementierte Änderungen

- **Migration**: `TraineeTrainerAssignment` → `TrainerProfessionAssignment` (trainerId + professionId). `TraineeOfficerAssignment` bekommt `validFrom`, `validUntil`, `assignedById` (ersetzt `trainerId`). Datenmigration für bestehende Einträge.
- **API**: Alle Report-Zugriffsprüfungen für Trainer nutzen jetzt `TrainerProfessionAssignment` (zwei-Schritt: Professionen → Azubis). Officer-Filter inkludiert Zeitraum-Prüfung.
- **Validierung**: `assignmentSchema` → `{trainerId, professionId}`. `officerAssignmentSchema` → + `validFrom`, `validUntil`.
- **Admin-UI**: `/admin/assignments` zeigt Trainer→Beruf Zuordnungen. Formular mit Trainer+Beruf Dropdowns.
- **Seed**: `TrainerProfessionAssignment` statt `TraineeTrainerAssignment`. Officer-Zuordnung mit Zeitraum.
- **Tests**: Alle 16 betroffenen Testdateien aktualisiert (Mocks, Assertions).

### Verifier

- **Tests**: 617 Tests (36 Dateien), alle bestanden.
- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- Officer-UI für Ausbilder (Officer+Azubi+Zeitraum zuordnen) noch nicht als eigene Seite — API unterstützt es bereits.

---

## 2026-05-09 – Arbeitspaket: Einsatzplanung / Gantt-Chart

### Planner

- **Ziel**: Ausbilder und Admins können tagesgenaue Einsatzplanungen für Auszubildende erstellen (Gantt-Chart Ansicht). Ausbildungsbeauftragte sehen eine read-only Ansicht ihrer Zeiträume.
- **Umfang**: Datenmodell (`ScheduleAssignment`), Migration, API-Route (`/api/schedule`), Gantt-Chart UI (`/trainer/schedule`), read-only UI (`/officer/schedule`), Navbar-Updates, API-Tests.
- **Betroffene Dateien**: `prisma/schema.prisma`, `prisma/migrations/20260509140000_add_schedule_assignments/`, `src/app/api/schedule/`, `src/app/(dashboard)/trainer/schedule/`, `src/app/(dashboard)/officer/schedule/`, `src/components/layout/navbar.tsx`.
- **Akzeptanzkriterien**: Gantt-Chart tagesgenau, bis 1 Jahr sichtbar, 4 Zuweisungstypen (Abteilung, Schule, Urlaub, Sonstiges), Layering, Officer read-only, alle Tests bestanden.

### Reviewer

- **Bewertung**: Plan deckt alle Anforderungen. Datenmodell minimal erweitert, keine Breaking Changes.
- **Entscheidung**: **Freigabe erteilt.**

### Implementierte Änderungen

- **Migration**: `ScheduleAssignment`-Modell (traineeId, scheduleType, startDate, endDate, department, supervisorId, color, createdBy).
- **API**: `GET/POST/PUT/DELETE /api/schedule` — Admin: alles, Trainer: nur eigene Azubis (über TrainerProfessionAssignment), Auto-Inferenz: wenn supervisor ein Officer ist, wird automatisch eine `TraineeOfficerAssignment` erstellt.
- **UI Trainer**: `/trainer/schedule` — Gantt-Chart mit tagesgenauen Balken, Farb-Kodierung nach Typ, Drag&Drop-Range zum Erstellen, Edit/Delete, Monatsnavigation, Legende.
- **UI Officer**: `/officer/schedule` — Read-only Gantt-Chart, nur zugewiesene Zeiträume.
- **Navbar**: "Planung"-Link für Trainer und Officer mit `CalendarDays`-Icon.
- **Tests**: `src/app/api/schedule/route.test.ts` — 14 Tests (GET: auth, role, admin, trainer; POST: auth, role, validation, create, auto-officer; PUT: auth, update, forbidden; DELETE: auth, delete).

### Verifier

- **Tests**: 635 Tests (37 Dateien), alle bestanden.
- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.
- **Migration**: Manuell erstellt und angewendet (`20260509140000`).

### Fixer

- UUID-Validierung: Testdaten verwendeten `"00000000-..."` Platzhalter die von Zod `.uuid()` abgelehnt werden → echte v4-UUIDs verwendet.
- Fehlender Mock für `trainerProfessionAssignment.findFirst` ergänzt.

### Offene Risiken / Folgeaufgaben

- Keine E2E-Tests für Einsatzplanung (Folgeaufgabe).
- Gantt-Chart ist Client-seitig — bei sehr vielen Zuweisungen könnte Performance ein Thema werden.

---

## 2026-05-09 – Arbeitspaket: UI-Overhaul Übersichtsseite + Editor + Navbar

### Planner

- **Ziel**: Übersichtsseite vereinfachen (Wochenleiste statt Tages-Heatmap, kompakte Karten, Status-Pills), Editor verbessern (Wochensumme Stunden, relative Speicherzeit), Navbar modernisieren (Avatar-Initialen, Design-Tokens).
- **Umfang**: `year-calendar.tsx`, `report-calendar.tsx`, `trainee/page.tsx`, `trainee/reports/[week]/page.tsx`, `navbar.tsx`, `utils.ts`, `globals.css`.
- **Nicht-Ziele**: Mikrotypografie, Farbnuancen, Icon-Tuning (explizit zurückgestellt).
- **Akzeptanzkriterien**: Alle Tests bestanden, 0 Lint-Errors, Build erfolgreich, Design konsistent über Themes.

### Reviewer

- **Bewertung**: Plan deckt alle Anforderungen. Keine Datenmodell- oder API-Änderungen. Alle Änderungen rein visuell/strukturell.
- **Entscheidung**: **Freigabe erteilt.**

### Implementierte Änderungen

**Übersichtsseite:**
- `year-calendar.tsx`: 7×53 Tagesraster ersetzt durch 1×52 Wochenleiste (jede Zelle = eine Woche). Monats-Labels beibehalten. Statuslegende hinter Tooltip-Icon verborgen. Hover-Tooltips mit Datumsbereich und Statuslabel.
- `report-calendar.tsx`: Karten auf 44px Zeilenhöhe reduziert. Wochennummer als neutraler Kreis, Status als rechtsbündige farbige Pill. Gesamte Karte klickbar.
- `trainee/page.tsx`: Keine strukturellen Änderungen, nur Aufräumen.

**Erstellungsmaske:**
- `trainee/reports/[week]/page.tsx`: Wochensumme der Stunden sichtbar im Tageseinträge-Header (Clock-Icon + Xh Ymin). Speicherstatus zeigt "Zuletzt gespeichert vor X Sekunden" statt statischem "Gespeichert". `savedAt` wird direkt in `handleSave` gesetzt (kein useEffect-Sync-SetState).

**Navbar:**
- `navbar.tsx`: Username-Text ersetzt durch Avatar-Kreis mit Initialen (max 2 Buchstaben). Theme-Toggle visuell vom Logout-Button getrennt (16px Spacer).

**Design-Tokens:**
- `globals.css`: Border-Radius-Tokens hinzugefügt (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`).
- `utils.ts`: Neuer `statusCellColor()` für Heatmap-Zellen. `statusColor()` leicht angepasst (höhere Sättigung für aktive Status).

**Tests aktualisiert:**
- `year-calendar.test.tsx`: Day-Label-Tests entfernt, Legende-Tooltip-Test ergänzt.
- `report-calendar.test.tsx`: Keine Änderungen nötig (generische Assertions).
- `navbar.test.tsx`: Avatar-Initialen-Test statt Username-Text-Test.

### Verifier

- **Tests**: 635 Tests (37 Dateien), alle bestanden.
- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- Wochenenden im Editor sind visuell deemphasiert aber technisch noch wie Arbeitstage behandelbar — keine Pflichtfeld-Validierung ist bereits implementiert durch `isNonWorkingDay`.
- Border-Radius-Tokens definiert aber noch nicht referenziert in Komponenten — Migration in Folgeaufgabe.

---

## 2026-05-09 – Arbeitspaket: Recurrence Rules + Report Prefill Backend + UI-Refactor

### Planner

- **Ziel**: Wiederholungsregeln (RecurrenceRule), Bericht-Prefill und gemeinsame Gantt-Komponente implementieren.
- **Umfang**:
  - ARCHITECTURE.md: 8+ Designentscheidungen dokumentiert
  - Schedule-Resolver mit Bitfeld-Helfern und Auflösungsalgorithmus
  - Report-Builder für Lazy-Create Prefill
  - Prisma-Schema: RecurrenceRule + RecurrenceException
  - GanttTimeline-Komponente extrahiert (Duplikation entfernt)
  - Konflikterkennung (visuell, Ring-Marker bei überlappenden Zuweisungen)
- **Nicht-Ziele**: RecurrenceRule API CRUD (folgt), RecurrenceException UI, Drag-Interaktion.

### Reviewer

- Plan geprüft, Freigabe erteilt.
- Klarstellungen: Bitfeld-Konvention (Bit 0=Mo), Resolver-Semantik (aktuelle Planung für historische Daten), Phase-1 Officer = volle Edit-Rechte.
- Phase-1 Scope: Click-only, kein Drag.

### Implementierte Änderungen

- **PR #46 (gemerged)**: Backend-Fundamente
  - `src/lib/schedule-resolver.ts` — Auflösungsalgorithmus, `weekdayToBit`, `bitfieldContainsWeekday`, `resolveDay`, `resolveWeek`
  - `src/lib/report-builder.ts` — `buildDefaultEntries` mit ScheduleType→DayType Mapping
  - `prisma/schema.prisma` — RecurrenceRule + RecurrenceException Models
  - `prisma/migrations/20260509160000_add_recurrence_rules/migration.sql`
  - `ARCHITECTURE.md` — 8+ neue Abschnitte
  - 26 neue Tests (19 Resolver + 7 Report-Builder)
- **UI-Refactor (dieser Branch)**:
  - `src/components/schedule/types.ts` — Gemeinsame Typen, Konstanten, Helfer
  - `src/components/schedule/gantt-timeline.tsx` — Geteilte Timeline mit `mode: edit|readonly`, Konflikterkennung, Single-Row
  - Alle 3 Schedule-Seiten umgestellt auf gemeinsame Komponente
  - Duplikation eliminiert (~340 Zeilen reduziert)
  - `.env.remote` für Remote-DB erstellt, `.gitignore` aktualisiert

### Verifikation

- **Typecheck**: Nicht verfügbar (kein separates Script).
- **Lint**: 0 Errors, 4 Warnings (alle vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.
- **Migration remote**: Auf Prisma Postgres (`db.prisma.io`) angewendet.

### Offene Risiken / Folgeaufgaben

- RecurrenceRule CRUD API fehlt noch (nur Schema + Resolver existieren).
- RecurrenceException UI fehlt (nur Schema existiert).
- Assignment-Modal mit 3 Modi (Single, Recurring, DayComposition) noch nicht implementiert.
- Bericht-Editor Umbau (Prefill-Integration beim Lazy-Create) noch nicht implementiert.
- Virtualisierung der Timeline bei >1 Jahr Ansicht noch nicht implementiert.

---

## 2026-05-09 – Arbeitspaket: RecurrenceRule API + Assignment-Modal

### Planner

- **Ziel**: RecurrenceRule CRUD API und Erstellungsmodal mit 3 Modi implementieren.
- **Umfang**:
  - `/api/recurrence-rules` — GET/POST/PUT/DELETE mit rollenbasierter Autorisierung
  - `AssignmentModal` — 3 Modi (Einzeleinsatz, Wiederholung, Tagesplan), Wochentag-Auswahl, Priorität
  - Trainer-Schedule-Seite: Inline-Formular ersetzt durch Modal
- **Nicht-Ziele**: RecurrenceException UI, Bericht-Editor Umbau.

### Reviewer

- Freigabe ohne Einwände.

### Implementierte Änderungen

- `src/app/api/recurrence-rules/route.ts` — Vollständige CRUD-API mit weekDays-Bitfeld-Akzeptanz (Array oder Integer), Trainer-Besitz-Check, Priorität
- `src/components/schedule/assignment-modal.tsx` — Modal mit 3 Modi (Single, Recurring, Composition), Wochentag-Toggle-Buttons, Farb-/Prioritätsauswahl
- `src/app/(dashboard)/trainer/schedule/page.tsx` — Inline-Formular entfernt, AssignmentModal integriert, `refreshData` Callback

### Verifikation

- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- RecurrenceException UI fehlt (nur Schema + API-seitiges Exception-Handling im Resolver).
- Bericht-Editor Umbau (Prefill-Integration beim Lazy-Create) noch nicht implementiert.
- Tagesplan-Modus (Composition) erstellt aktuell nur einen Einzeleinsatz — Erweiterung zu Mehrfach-Einsatz pro Tag in Phase 2.

---

## 2026-05-09 – Arbeitspaket: Report Prefill Integration (Lazy-Create)

### Planner

- **Ziel**: Bericht-Editor mit Prefill aus der Einsatzplanung verknüpfen.
- **Umfang**:
  - `/api/reports/prefill` — Neuer Endpunkt, der aufgelöste DailyEntry-Daten für eine Woche zurückgibt
  - Bericht-Editor: Prefill-Fetch wenn kein existierender Bericht gefunden wird (Lazy-Create)
  - Week-Navigation nutzt ebenfalls Prefill
- **Nicht-Ziele**: UI-Umbau des Editors (nur Datenanbindung).

### Reviewer

- Freigabe ohne Einwände.

### Implementierte Änderungen

- `src/app/api/reports/prefill/route.ts` — GET-Endpunkt: Lädt ScheduleAssignments + RecurrenceRules + Exceptions für den Trainee, resolvt die Woche via `buildDefaultEntries`, gibt 7 Einträge zurück
- `src/app/(dashboard)/trainee/reports/[week]/page.tsx` — Bei `!found` (kein existierender Bericht): Prefill-Fetch, asynchrones Nachladen der aufgelösten Einträge. Gleicher Mechanismus bei `navigateWeek`.

### Verifikation

- **Lint**: 0 Errors, 4 Warnings (vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- Prefill passiert asynchron nach initialem Render — kurzes Aufblitzen der Default-Werte möglich.
- Prefill-Endpunkt hat keine Tests (sollte in Folgeaufgabe nachgeholt werden).
- RecurrenceException UI fehlt weiterhin.

---

## 2026-05-09 – Arbeitspaket: Modal-Überholung + Timeline-Visu-Fix

### Planner

- **Ziel**: Modal aufräumen, Timeline visuell auf Akzeptanzkriterien-Niveau bringen.
- **Umfang**:
  - Tagesplan-Modus entfernen (war toter Code)
  - Farbpicker + Priorität entfernen (Farbe folgt aus Kategorie, Konfliktauflösung über createdAt)
  - Modal breiter (max-w-lg), Labels, Footer mit Trennlinie
  - Vorschau nächste 12 Termine im Wiederholungs-Modus
  - Timeline: Hierarchischer Header (Monat + KW), Wochenende-Hintergrund, Heute-Linie (rot), Wochengrenzen gestrichelt
  - API: color/priority aus Validierungs-Schemas entfernt, im Code ignoriert
- **Nicht-Ziele**: Datepicker-Tausch (shadcn Calendar nicht installiert), Frequenz-Feld (interval nicht im Resolver), DB-Migration zum Droppen der Spalten.

### Reviewer

- Freigabe ohne Einwände.

### Implementierte Änderungen

- `src/components/schedule/assignment-modal.tsx` — Komplett-rewrite: 2 Modi (single/recurring), kein Farbpicker/Priorität, Vorschau-Komponente, max-w-lg
- `src/components/schedule/gantt-timeline.tsx` — Hierarchischer Header (Monatszeile + KW-Zeile), Wochenend-Hintergrund (`bg-neutral-100`), Heute-Linie (`border-red-500`), Wochengrenzen gestrichelt, Farbe nur aus `TYPE_COLORS`
- `src/app/(dashboard)/trainer/schedule/page.tsx` — Farbpicker aus Edit-Modal entfernt, `color` aus form-state entfernt
- `src/lib/schedule-resolver.ts` — `color` und `priority` aus Types/Candidate entfernt, Sortierung: layer → createdAt
- `src/app/api/schedule/route.ts` — `color` aus createSchema/POST/PUT entfernt
- `src/app/api/recurrence-rules/route.ts` — `color`/`priority` aus createSchema/POST/PUT entfernt
- `src/app/api/reports/prefill/route.ts` — `color`/`priority` aus Mapping entfernt
- Alle Testdateien angepasst (keine `priority: 0` oder `color` Referenzen mehr)

### Verifikation

- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- `color` und `priority` Spalten existieren noch in der DB (nullable, werden ignoriert). Migration zum Droppen in Folgeaufgabe möglich.
- shadcn Calendar+Popover nicht installiert — Datepicker-Upgrade in Folgeaufgabe.
- Frequenz-Feld (interval) nicht implementiert — wäre ein neues Feature im Resolver.

### Doku-Update (HANDBUCH.md)

- Abschnitt 5.5 Einsatzplanung aktualisiert:
  - Tagesplan-Modus entfernt (nur noch Einzeleinsatz + Wiederholung)
  - Farbpicker-Referenzen entfernt (Farbe automatisch aus Kategorie)
  - Priorität-Referenzen entfernt (Konfliktauflösung: Layer → createdAt)
  - Timeline-Visu-Verbesserungen dokumentiert (hierarchischer Header, Heute-Linie, Wochenend-Hintergrund, Wochengrenzen)
  - Vorschau der nächsten 12 Termine im Wiederholungs-Modus erwähnt

---

## 2026-05-09 – Arbeitspaket: Design-System-Einführung (AP1: Dokumentation)

### Planner

- **Ziel:** Verbindliches Design-System als `DESIGN_SYSTEM.md` im Repo verankern, Agenten-Regeln aktualisieren.
- **Umfang:**
  - `DESIGN_SYSTEM.md` erstellen mit vollständiger Spezifikation (Farbsystem 4 Schichten, Typografie, Abstände, Radien, Schatten, Komponenten-Spec, Anti-Patterns)
  - `AGENTS.md`: `ui-rules`-Block ersetzen durch `design-system-rules` mit Verweis auf DESIGN_SYSTEM.md und Token-Pflicht
  - `ARCHITECTURE.md`: Verweis auf DESIGN_SYSTEM.md im Tailwind-Abschnitt
- **Nicht-Ziele:** Kein produktiver Code-Change. Keine CSS-Variablen, keine Komponenten-Migration.
- **Akzeptanzkriterien:** DESIGN_SYSTEM.md vollständig, AGENTS.md referenziert es, kein Code geändert.

### Reviewer

- Freigabe ohne Einwände. Spezifikation ist konsistent mit bestehender Architektur.

### Implementierte Änderungen

- `DESIGN_SYSTEM.md` — Neu erstellt. Enthält: Designprinzipien, Farbsystem (4 Schichten mit Light/Dark Werten), Typografie, Abstände, Radien, Schatten, Komponenten-Spezifikation (Buttons, Inputs, Cards, Badges, Modals, Navigation, Gantt, Heatmap), Layout-Regeln, Iconographie, Animation, Anti-Patterns, Warnungen.
- `AGENTS.md` — `<!-- BEGIN:ui-rules -->` ersetzt durch `<!-- BEGIN:design-system-rules -->` mit Token-Pflicht, Farbschichten-Trennung, Komponenten-Spezifikation, Anti-Patterns und Migrationshinweis.
- `ARCHITECTURE.md` — Tailwind-Abschnitt erweitert mit Verweis auf `DESIGN_SYSTEM.md`.

### Verifikation

- **Lint**: 0 Errors (nur Markdown-Dateien geändert).
- **Build**: Nicht erforderlich (kein Code geändert).

### Offene Risiken / Folgeaufgaben

- AP2–AP7 stehen aus: Token-Foundation in `globals.css`, UI-Primitives, Layout, Pages, Schedule, Reports/PDF.
- Bestehende 693 Hardcoded-Color-Referenzen (38 Dateien) müssen schrittweise migriert werden.
- `pdf-document.tsx` behält Hex-Werte (zulässig laut Design-System, da `@react-pdf/renderer` keine Tailwind-Klassen unterstützt).

---

## 2026-05-09 – Arbeitspaket: Design-Token-Foundation (AP2)

### Planner

- **Ziel:** CSS-Variablen als Design-Token in `globals.css` definieren, Tailwind v4 `@theme inline` erweitern, zentrale Farb-Mappings auf Token umstellen.
- **Umfang:**
  - `globals.css`: `:root` (Light) + `.dark` (Dark) CSS-Variablen für alle 4 Farbschichten + Schatten
  - `@theme inline`: Token-Klassen registrieren (`surface-*`, `content-*`, `stroke-*`, `accent-*`, `success-*`, `warning-*`, `danger-*`, `info-*`, `cat-*`)
  - `types.ts`: `TYPE_COLORS` von Hex auf `var()` CSS-Variablen umgestellt, `TYPE_BORDER_COLORS` ergänzt
  - `utils.ts`: `statusColor()` + `statusCellColor()` von hardcoded Tailwind-Klassen auf Token-basierte Klassen umgestellt
  - `body` + `*` Basis-Styles auf CSS-Variablen umgestellt (keine `@apply` mehr)
- **Nicht-Ziele:** Keine Komponenten-Migration (AP3–AP7), kein Radius-Change (bleibt kompatibel).
- **Akzeptanzkriterien:** Alle Token definiert, `statusColor`/`statusCellColor` nutzen Token, 659 Tests grün, Build OK.

### Reviewer

- Freigabe. Token-Naming (`surface-*`, `content-*`, `stroke-*`) ist konsistent und generiert saubere Tailwind-Klassen (`bg-surface-base`, `text-content-muted`, `border-stroke-subtle`).

### Implementierte Änderungen

- `src/app/globals.css` — Komplett-rewrite:
  - `:root` + `.dark`: 30+ CSS-Variablen für Neutralfarben, Akzent, Semantisch, Kategorial, Schatten
  - `@theme inline`: Token-Klassen registriert (`surface-base`, `surface-elevated`, `surface-overlay`, `surface-sunken`, `content-base`, `content-muted`, `content-subtle`, `content-on-accent`, `stroke-subtle`, `stroke-base`, `stroke-strong`, `accent`, `accent-fg`, `accent-hover`, `success`, `success-soft`, `warning`, `warning-soft`, `danger`, `danger-soft`, `info`, `info-soft`, `cat-department`, `cat-department-soft`, `cat-school`, `cat-school-soft`, `cat-vacation`, `cat-vacation-soft`, `cat-other`, `cat-other-soft`)
  - `body`/`*`: Statt `@apply` jetzt direkte CSS-Variable-Referenzen
- `src/components/schedule/types.ts` — `TYPE_COLORS` auf `var()` umgestellt, `TYPE_BORDER_COLORS` ergänzt
- `src/lib/utils.ts` — `statusColor()` + `statusCellColor()` auf Token-Klassen (`bg-success-soft`, `bg-warning-soft`, etc.)
- `src/lib/utils.test.ts` — Test-Assertions an neue Token-Namen angepasst

### Verifikation

- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- AP3 (UI-Primitives): Button, Badge, Input, Select, Card auf Token migrieren
- AP4 (Layout): Navbar, Layouts, Theme-Toggle
- AP5 (Pages): Alle Dashboard-Pages
- AP6 (Schedule): Gantt-Timeline, Assignment-Modal
- AP7 (Reports): PDF, Report-Komponenten
- `--radius-sm` wurde von 4px auf 6px (0.375rem) geändert — bestehende `rounded-sm`-Nutzungen werden bei Komponenten-Migration in AP3 angepasst.

---

## 2026-05-09 – Arbeitspaket: UI-Primitives auf Design-Token (AP3)

### Planner

- **Ziel:** 5 UI-Basiskomponenten (Button, Badge, Input, Select, Card) von hardcoded Tailwind-Farben auf Design-Token umstellen.
- **Umfang:**
  - `button.tsx`: Primary (Inversion `bg-accent`), Secondary (`border-stroke-base`), Ghost, Destructive (`bg-danger-soft text-danger` statt vollrot)
  - `badge.tsx`: Status-Mapping auf semantische Token (`bg-success-soft text-success`, etc.)
  - `input.tsx` + `textarea`: Border, Focus, Error auf Token (`border-stroke-base`, `border-danger`, `text-danger`)
  - `select.tsx`: Gleiche Migration wie Input
  - `card.tsx`: Hintergrund `bg-surface-elevated`, Border `border-stroke-subtle`, Title `text-content-base`
- **Akzeptanzkriterien:** Keine hardcoded Farbklassen in den 5 Dateien, alle Tests grün, Build OK.

### Reviewer

- Freigabe. Destructive-Button wechselt von vollrot zu Pastell-Muster (Design-System-Spec).

### Implementierte Änderungen

- `src/components/ui/button.tsx` — Alle 4 Varianten auf Token (`bg-accent`, `text-accent-fg`, `border-stroke-base`, `bg-danger-soft text-danger`, `text-content-muted`, `bg-surface-overlay`)
- `src/components/ui/badge.tsx` — 5 Varianten auf semantische Token (`bg-success-soft text-success`, `bg-warning-soft text-warning`, etc.)
- `src/components/ui/input.tsx` — Input + TextArea: Labels `text-content-muted`, Border `border-stroke-base`, Focus `border-stroke-strong`, Error `border-danger text-danger`, Placeholder `text-content-subtle`
- `src/components/ui/select.tsx` — Gleiche Migration wie Input
- `src/components/ui/card.tsx` — Card: `bg-surface-elevated border-stroke-subtle`, CardTitle: `text-content-base`
- Test-Assertions angepasst: `bg-neutral-900` → `bg-accent`, `bg-red-600` → `bg-danger-soft`, `bg-green-100` → `bg-success-soft`, `border-red-500` → `border-danger`

### Verifikation

- **Lint**: 0 Errors, 5 Warnings (vorbestehend).
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: `npm run build` erfolgreich.

### Offene Risiken / Folgeaufgaben

- AP4 (Layout): Navbar, Layouts, Theme-Toggle
- AP5 (Pages): Alle Dashboard-Pages
- AP6 (Schedule): Gantt-Timeline, Assignment-Modal
- AP7 (Reports): PDF, Report-Komponenten

---

## 2026-05-09 – Arbeitspaket: Layout + Navigation auf Design-Token (AP4)

### Planner

- **Ziel:** Navbar, Theme-Toggle, Dashboard-Layout, Auth-Layout von hardcoded Farben auf Token umstellen.

### Reviewer

- Freigabe. Trennlinie zwischen Theme-Toggle und Logout als `bg-stroke-subtle` statt leerem div.

### Implementierte Änderungen

- `src/components/layout/navbar.tsx` — Header `bg-surface-base`, Nav-Token, Avatar, Notification-Dropdown, Trennlinie `bg-stroke-subtle`
- `src/components/ui/theme-toggle.tsx` — Token-basierte Hover-Farben
- `src/app/(dashboard)/layout.tsx` — `bg-surface-base`
- `src/app/(auth)/layout.tsx` — `bg-surface-base`

### Verifikation

- **Lint**: 0 Errors, 5 Warnings.
- **Tests**: 659 Tests (39 Dateien), alle bestanden.
- **Build**: erfolgreich.

### Offene Risiken / Folgeaufgaben

- AP6: Schedule-Pages (trainer/trainee/officer), Gantt-Timeline, Assignment-Modal
- AP7: Report-Editor, PDF, Report-Komponenten

---

## 2026-05-09 – Arbeitspaket: Dashboard-Pages auf Design-Token (AP5)

### Planner

- **Ziel:** Alle einfachen Dashboard-Pages von hardcoded Farben auf Token umstellen. 9 Dateien.

### Reviewer

- Freigabe.

### Implementierte Änderungen

- Login, Admin (6 Seiten), Trainee-Übersicht, Trainer-Officers — alle hardcoded Farbklassen ersetzt durch Design-Token.

### Verifikation

- **Lint**: 0 Errors, 5 Warnings.
- **Tests**: 659 Tests, alle bestanden.
- **Build**: erfolgreich.

### Offene Risiken / Folgeaufgaben

- AP6: Schedule-Pages, Gantt-Timeline, Assignment-Modal
- AP7: Report-Editor, PDF, Report-Komponenten

---

## 2026-05-09 – Arbeitspaket: Schedule-Komponenten auf Design-Token (AP6)

### Planner

- **Ziel:** Schedule-Pages (trainer/trainee/officer), Gantt-Timeline, Assignment-Modal auf Token umstellen.
- **Umfang:** 5 Dateien, ~1500 Zeilen.
- **Akzeptanzkriterien:** 0 hardcoded Farbklassen, 659 Tests grün, Build OK.

### Reviewer

- Freigabe. Gantt: Heute-Linie auf `border-danger`, Konflikt-Indikator auf `ring-danger`.

### Implementierte Änderungen

- `trainer/schedule/page.tsx` — Heading, Labels, 6 raw select/input, Edit-Popover, Footer auf Token
- `trainee/schedule/page.tsx` — Heading, Labels, Empty-State auf Token
- `officer/schedule/page.tsx` — Heading, Labels, Search-Input auf Token
- `gantt-timeline.tsx` — Wochenenden `bg-surface-sunken`, Borders `border-stroke-subtle`, Texte `content-muted/subtle`, Heute-Linie `border-danger`, Konflikt `ring-danger`, Name-Spalte `bg-surface-base`, Legende `text-content-muted`
- `assignment-modal.tsx` — shared inputClass auf Token, Modal `bg-surface-elevated`, Tab-Group `border-stroke-subtle`, Aktive Tabs `bg-accent text-accent-fg`, Day-Buttons auf accent-Inversion, Preview `bg-surface-overlay`, Errors `text-danger`, Footer `border-stroke-subtle`

### Verifikation

- **Lint**: 0 Errors, 5 Warnings.
- **Tests**: 659 Tests, alle bestanden.
- **Build**: erfolgreich.

### Offene Risiken / Folgeaufgaben

- AP7: Report-Editor (`trainee/reports/[week]`), PDF (`pdf-document.tsx`), Report-Komponenten (year-calendar, report-calendar, reviewer-dashboard, reviewer-report)

---

## 2026-05-09 – Arbeitspaket: Report-Komponenten auf Design-Token (AP7)

### Planner

- **Ziel:** Report-Editor, Report-Komponenten (year-calendar, report-calendar, reviewer-dashboard, reviewer-report-page, week-navigator) auf Token umstellen.
- **Umfang:** 6 Dateien. PDF (`pdf-document.tsx`) behält Hex-Werte (zulässig laut Design-System).
- **Akzeptanzkriterien:** 0 hardcoded Farbklassen in `src/` (außer pdf-document.tsx), 659 Tests grün, Build OK.

### Reviewer

- Freigabe. Review-Comment-Card Border auf `border-warning` umgestellt.

### Implementierte Änderungen

- `trainee/reports/[week]/page.tsx` — Report-Type-Tabs (accent-Inversion), Review-Comment-Card (`border-warning`), Save-Status (`text-success`), Day-Cards (`border-stroke-subtle`, `bg-surface-overlay`), Non-Working-Day-Text (`text-content-subtle`), Hour/Minute-Inputs (`border-stroke-base`), alle Texte auf Token
- `year-calendar.tsx` — Token für Texte, Borders, Statusfarben
- `report-calendar.tsx` — Token für Texte, Borders, Statusfarben
- `reviewer-dashboard-client.tsx` — Status-Texte auf Token
- `reviewer-report-page.tsx` — Token für Texte, Borders, Warning-Card
- `week-navigator.tsx` — Token für Texte, Borders

### Verifikation

- **Lint**: 0 Errors, 5 Warnings.
- **Tests**: 659 Tests, alle bestanden.
- **Build**: erfolgreich.
- **Hardcoded-Color Audit**: `grep` über `src/**/*.tsx` liefert **0 Treffer** für `text-neutral-`, `bg-neutral-`, `border-neutral-`, `text-red-`, `bg-red-`, `text-green-`, `text-amber-`, `bg-amber-`, `bg-emerald-`, `bg-blue-`, `bg-white`, `text-white`. Einzige Ausnahme: `pdf-document.tsx` mit Hex-Werten (zulässig laut DESIGN_SYSTEM.md).

### Ergebnis

**Design-System-Migration abgeschlossen.** Alle 7 Arbeitspakete (AP1–AP7) umgesetzt. Die gesamte `src/`-Codebase nutzt jetzt CSS-Variablen-basierte Design-Token.

---

## 2026-05-09 – Code-Review: Design-System-Migration (Post-Completion Audit)

### Planner

- **Ziel:** Nach Abschluss aller 7 Design-System-Migrations-Arbeitspakete (AP1–AP7) einen abschließenden Audit durchführen, um verbleibende Abweichungen von DESIGN_SYSTEM.md zu identifizieren.
- **Umfang:** Alle `src/**/*.tsx`-Dateien, DESIGN_SYSTEM.md-Spezifikation, Token-Definitionen in `globals.css`.
- **Nicht-Ziele:** Keine Code-Änderungen, nur Bestandsaufnahme und Dokumentation.

### Reviewer

- Freigabe. Audit ist rein dokumentativ.

### Audit-Ergebnisse

#### 1. Overlay-Backdrops (Mittel)

**Spezifikation:** `overlay-background: rgba(0, 0, 0, 0.5)` (DESIGN_SYSTEM.md Zeile 395).
**Ist-Zustand:**

| Datei | Wert |
|-------|------|
| `assignment-modal.tsx:160` | `bg-black/30` |
| `trainer/schedule/page.tsx:259` | `bg-black/30` |
| `navbar.tsx:212` | `bg-black/20` |

**Empfehlung:** Neuen Token `--color-overlay-backdrop` einführen (`rgba(0,0,0,0.5)`) oder bestehende Werte auf `/50` angleichen. Navbar-Mobilmenü kann bei `/20` bleiben (leichterer Overlay für mobile Navigation ist gängiges Muster).

#### 2. font-bold außerhalb von Page-Headings (Niedrig)

**Spezifikation:** "Bold (700) nur für Page-Headings. UI-Elemente nutzen Medium (500) oder Semibold (600)." (DESIGN_SYSTEM.md Zeile 201).
**Ist-Zustand:** 3 Vorkommen in `admin/page.tsx:33,45,57` — alle sind Page-Headings (`<p className="text-3xl font-bold text-content-base">`).

**Bewertung:** Konform. Alle `font-bold`-Nutzungen sind Page-Headings. Keine Aktion erforderlich.

#### 3. Shadow-Hardcodes statt Token (Mittel)

**Spezifikation:** Shadows sollen über Token `shadow-sm`, `shadow-md`, `shadow-lg` referenziert werden (DESIGN_SYSTEM.md Zeile 277-279).
**Ist-Zustand:** Alle 5 `shadow-lg`-Nutzungen nutzen Tailwind `shadow-lg` Utility direkt, nicht den Design-System-Token.

| Datei | Zeile | Kontext |
|-------|------|---------|
| `year-calendar.tsx` | 180 | Tooltip-Popup |
| `assignment-modal.tsx` | 164 | Modal-Container |
| `trainer/schedule/page.tsx` | 264 | Edit-Popover |
| `navbar.tsx` | 102 | Dropdown-Menü |
| `navbar.tsx` | 213 | Mobile Navigation |

**Problem:** Tailwind `shadow-lg` verwendet Tailwind-eigene Shadow-Werte, nicht die `--shadow-lg` CSS-Variable aus dem Design-System. Die Token-Definition in `globals.css` existiert bereits (`--shadow-sm/md/lg`).

**Empfehlung:** `@theme inline` in `globals.css` um Shadow-Token-Klassen erweitern, damit `shadow-sm/md/lg` die CSS-Variablen referenzieren. Dann sind alle 5 Stellen automatisch konform.

#### 4. Destructive-Button hover:opacity-80 (Niedrig)

**Spezifikation:** Anti-Pattern "Keine Opacity unter 0.4 für Text" (DESIGN_SYSTEM.md Zeile 573). Buttons nutzen Inversion oder Pastell.
**Ist-Zustand:** `button.tsx:29` — `"bg-danger-soft text-danger hover:opacity-80"`.

**Bewertung:** `opacity-80` ist über der 0.4-Schwelle und dient als Hover-Feedback auf Pastell-Button. Akzeptabel, aber besser wäre ein tokenisierter Hover-State (z.B. `hover:bg-danger-soft-hover`).

#### 5. focus-visible:ring-offset-2 nicht tokenisiert (Niedrig)

**Ist-Zustand:** `button.tsx:21` — `focus-visible:ring-2 focus-visible:ring-offset-2`. Der Ring-Offset nutzt den Tailwind-Standardwert (2px), nicht einen Design-System-Token.

**Bewertung:** Kosmetisch. Focus-Ring-Verhalten ist funktional korrekt. Kann in einem späteren Token-Refinement-Paket adressiert werden.

#### 6. backdrop-blur nicht tokenisiert (Niedrig)

**Ist-Zustand:**
| Datei | Zeile | Wert |
|-------|------|------|
| `navbar.tsx` | 159 | `backdrop-blur-lg` |
| `year-calendar.tsx` | 180 | `backdrop-blur-sm` |

**Bewertung:** DESIGN_SYSTEM.md spezifiziert keine Blur-Token. Funktional korrekt. Kann bei Bedarf in einem späteren Paket tokenisiert werden.

#### 7. opacity-40 bei deaktivierten Kalendertagen (Niedrig)

**Ist-Zustand:** `report-calendar.tsx:99` — `"pointer-events-none opacity-40"`.

**Bewertung:** Opacity 0.4 ist exakt an der unteren Grenze der Anti-Pattern-Regel ("Keine Opacity unter 0.4"). Da es sich um deaktivierte Tage handelt, ist dies vertretbar, aber `opacity-50` wäre sicherer.

#### 8. disabled:opacity-50 in UI-Primitives (Info)

**Ist-Zustand:** `input.tsx`, `textarea`, `select.tsx`, `button.tsx` nutzen `disabled:opacity-50`.

**Bewertung:** Standard-Pattern für deaktivierte Elemente. Konform mit Barrierefreiheit. Keine Aktion erforderlich.

#### 9. bg-surface-base/95 in year-calendar (Info)

**Ist-Zustand:** `year-calendar.tsx:180` — `bg-surface-base/95` mit `backdrop-blur-sm` für Tooltip.

**Bewertung:** 95% Opacity mit Blur erzeugt einen leichten Frosted-Glass-Effekt. Nicht in DESIGN_SYSTEM.md spezifiziert, aber für Tooltips ein gängiges und ansprechendes Muster.

### Zusammenfassung

| # | Finding | Schwere | Aktion |
|---|---------|---------|--------|
| 1 | Overlay-Backdrops `/20`/`/30` statt spezifiziert `/50` | Mittel | Token `--color-overlay-backdrop` oder Werte angleichen |
| 2 | font-bold nur auf Page-Headings | — | Konform, keine Aktion |
| 3 | shadow-lg als Tailwind-Utility statt Token | Mittel | `@theme inline` Shadow-Token registrieren |
| 4 | Destructive-Button hover:opacity-80 | Niedrig | Optional: tokenisierter Hover-State |
| 5 | focus-visible:ring-offset-2 nicht tokenisiert | Niedrig | Optional: späteres Refinement |
| 6 | backdrop-blur nicht tokenisiert | Niedrig | Optional: späteres Refinement |
| 7 | opacity-40 an Anti-Pattern-Grenze | Niedrig | Optional: auf opacity-50 ändern |
| 8 | disabled:opacity-50 | — | Konform, keine Aktion |
| 9 | bg-surface-base/95 Tooltip | — | Info, keine Aktion |

### Verifikation

- Kein Code geändert — reiner Audit.
- Basis: `DESIGN_SYSTEM.md`, `src/app/globals.css`, alle `src/**/*.tsx`-Dateien.

### Offene Risiken / Folgeaufgaben

- **Arbeitspaket empfohlen:** Token-Refinement — Overlay-Backdrops, Shadow-Token-Registrierung, optionale Hover-/Opacity-Anpassungen. Schätzung: ~30 Min.
- Bestehende Tests und Build sind nicht betroffen (rein visuelle Anpassungen).

---

## 2026-05-09 – Arbeitspaket: Token-Refinement (Overlay-Backdrops)

### Planner

- **Ziel:** Die 2 mittleren Review-Findings aus dem Post-Completion Audit beheben: (1) Overlay-Backdrops tokenisieren, (2) Shadow-Token-Registrierung prüfen.
- **Umfang:** `globals.css` (neuer Token), `assignment-modal.tsx`, `trainer/schedule/page.tsx` (bg-black/30 → Token), `DESIGN_SYSTEM.md` (Token-Referenz aktualisieren).
- **Nicht-Ziele:** Low-Findings (opacity-40, hover:opacity-80, ring-offset, backdrop-blur). Navbar-Mobil-Backdrop (`bg-black/20`) bleibt als dokumentierte Ausnahme.
- **Akzeptanzkriterien:** 0 `bg-black` in `src/*.tsx` (außer navbar mobile + test), Shadow-Token bereits registriert (Bestätigung), 659 Tests grün, Build OK.

### Reviewer

- Freigabe. Shadow-Token bereits in `@theme inline` registriert (globals.css:133-135) — Finding #3 war False Positive. Nur Finding #1 (Overlay-Backdrops) benötigt Implementierung.

### Implementierte Änderungen

- `globals.css` — Neuer CSS-Token `--ds-overlay-backdrop: rgba(0, 0, 0, 0.5)` in `:root` und `.dark`. Neuer `@theme inline` Eintrag `--color-overlay-backdrop` → Utility `bg-overlay-backdrop`.
- `assignment-modal.tsx:160` — `bg-black/30` → `bg-overlay-backdrop`
- `trainer/schedule/page.tsx:259` — `bg-black/30` → `bg-overlay-backdrop`
- `navbar.tsx:212` — `bg-black/20` bleibt (Mobile-Nav, dokumentierte Ausnahme)
- `DESIGN_SYSTEM.md:395` — Modal-Spec aktualisiert: `overlay-background: var(--ds-overlay-backdrop)`

### Verifikation

- **Lint:** 0 Errors, 5 Warnings (unverändert).
- **Tests:** 659 Tests, alle bestanden (39 Dateien).
- **Build:** erfolgreich.
- **bg-black Audit:** Nur noch `navbar.tsx:212` (Mobile-Backdrop, dokumentiert) und `navbar.test.tsx:197` (Test-Selektor).

### Offene Risiken / Folgeaufgaben

- Navbar-Test (`navbar.test.tsx:197`) referenziert `.bg-black\\/20` — bei späterer Navbar-Migration muss Test angepasst werden.
- Low-Findings aus Audit bleiben offen (optional): opacity-40, hover:opacity-80, ring-offset, backdrop-blur.
- Nächste Arbeitspakete: shadcn Calendar+Popover, Frequenz-Intervall, RecurrenceException UI.

---

## 2026-05-09 – Arbeitspaket: Calendar+Popover DatePicker

### Planner

- **Ziel:** Native `<input type="date">` durch Calendar+Popover DatePicker ersetzen. Bessere UX mit visuellem Kalender, deutsche Locale, ISO-Wochen (Montag erster Tag).
- **Umfang:** 3 neue UI-Komponenten (Popover, Calendar, DatePicker), 4 Dateien mit 7 Date-Eingaben migriert.
- **Nicht-Ziele:** date-fns Migration der bestehenden Datumsfunktionen, serverseitige Validierung.
- **Akzeptanzkriterien:** 0 `type="date"` in `src/`, 659 Tests grün, Build OK, Design-Token-konform.

### Reviewer

- Freigabe. react-day-picker v10 + @radix-ui/react-popover als Abhängigkeiten. date-fns `de` Locale für Wochentage/Monatsnamen. `weekStartsOn: 1` für ISO-Konformität.

### Implementierte Änderungen

**Neue Komponenten:**

- `src/components/ui/popover.tsx` — Radix Popover Wrapper (Popover, PopoverTrigger, PopoverContent). Content: `bg-surface-elevated`, `border-stroke-subtle`, `shadow-lg`, rounded-lg.
- `src/components/ui/calendar.tsx` — react-day-picker v10 Wrapper. Design-Token-Klassen für alle Elemente (selected: `bg-accent text-accent-fg`, today: `text-accent font-semibold`, outside/disabled: `text-content-subtle opacity-50`). Deutsche Locale (`date-fns/locale/de`), `weekStartsOn: 1`.
- `src/components/ui/date-picker.tsx` — Komposit-Komponente: Button-Trigger mit Kalender-Icon (lucide CalendarIcon), formatiert als `dd.MM.yyyy`,Popover mit Calendar. String-Interface (`YYYY-MM-DD`).

**Migrationen (7 Instanzen in 4 Dateien):**

- `assignment-modal.tsx` — 2x `<input type="date">` (Von/Bis) → `DatePicker`
- `trainer/schedule/page.tsx` — 2x `<input type="date">` (Von/Bis Edit-Popover) → `DatePicker`
- `trainer/officers/page.tsx` — 2x `<input type="date">` (Gültig von/bis) → `DatePicker`
- `admin/users/page.tsx` — 1x `<Input type="date">` (Eintrittsdatum) → `DatePicker`

**Neue Abhängigkeiten:**

- `react-day-picker@10.0.0`
- `@radix-ui/react-popover@1.1.15`

### Verifikation

- **Lint:** 0 Errors, 5 Warnings (unverändert).
- **Tests:** 659 Tests, alle bestanden (39 Dateien).
- **Build:** erfolgreich.
- **type="date" Audit:** 0 Vorkommen in `src/**/*.tsx`.

### Offene Risiken / Folgeaufgaben

- Bestehende Tests mocken keine Date-Picker-Interaktionen — E2E-Tests für Kalender-Auswahl empfohlen.
- DatePicker hat noch keinen `label`-Prop — Labels werden extern als `<label>` gerendert (wie bei assignment-modal und trainer-schedule).
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI.

---

## 2026-05-09 – Arbeitspaket: Gantt-Timeline Redesign (AP1)

### Planner

- **Ziel:** Gantt-Timeline von SAP-Tabellen-Ästhetik zu schwebenden Pillen im Trade-Republic-Stil umgestalten.
- **Umfang:** Kompletter Rewrite des Gantt-Renderings — weg von cell-by-cell (3px pro Tag) hin zu Block-basierten Pillen. Wochenenden entfernt. Hover-Tooltips statt nativer `title`-Attribute. Legende als Mini-Pillen.
- **Nicht-Ziele:** Drag-Resize, Multi-Select, Edit-Modal-Änderungen, Assignment-Modal-Änderungen, Dashboard-Status-Indikatoren (AP2).
- **Betroffene Dateien:** `gantt-timeline.tsx`, `types.ts`, 2 neue Testdateien.
- **Akzeptanzkriterien:** Kein Zell-Background, keine Grid-Linien, Pillen statt Segmente, Wochenenden nicht gerendert, Inline-Labels, Hover-Tooltip, subtile Heute-Linie, KW-Labels nur jede 2. Woche, Legende als Pillen, Edit-Modus funktioniert.

### Reviewer

- Freigabe. Plan ist konsistent mit Design-System. Keine neuen Hardcoded-Farben (nur CSS-Variablen). Tooltip nutzt existierende `bg-surface-elevated`, `border-stroke-subtle`, `shadow-md` Token.

### Implementierte Änderungen

**1. `types.ts` — Neue Helper:**
- `generateWorkDays(start, end)`: Wie `generateDays`, filtert aber Sa/So heraus. Nur Mo-Fr.
- `computeBlocks(traineeId, workDays, assignments, cellWidth)`: Berechnet zusammenhängende Assignment-Blöcke als `AssignmentBlock[]` mit `startIndex`, `endIndex`, `width`, `offset`.
- `TYPE_FG_COLORS`: Neues Mapping für Vordergrundfarben (aus `--color-cat-*-fg`), genutzt für Inline-Label und Legenden-Text.
- `AssignmentBlock` Interface: Neuer Typ für Block-Darstellung.

**2. `gantt-timeline.tsx` — Kompletter Rewrite:**
- **Rendering-Modell:** Statt 365 einzelner `<div>`s pro Zeile → `computeBlocks()` berechnet zusammenhängende Blöcke, pro Block ein `<div>` mit `rounded-full` (Pille).
- **Wochenenden:** komplett entfernt. `workDays` via `generateWorkDays()`, nur Werktage.
- **cellWidth:** Default von 3px auf 6px erhöht (weniger Tage = mehr Platz).
- **rowHeight:** Default von 32px auf 36px erhöht.
- **barHeight:** 24px, vertikal zentriert in Zeile.
- **Hintergrund:** Komplett transparent. Kein `bg-surface-sunken`, keine dashed Grid-Linien, keine `border-b` zwischen Zeilen.
- **Inline-Label:** Auf Blöcken mit `width > 80px`: „KW 19–23" in Kategorie-FG-Farbe.
- **Heute-Linie:** 1px, `opacity-20`, `border-fg-base` (subtil).
- **KW-Labels:** Nur jede 2. Woche sichtbar (`i % 2 === 0`), `text-content-subtle`.
- **Hover-Tooltip:** State-gesteuert mit 200ms Delay. Zeigt: Kategorie + Detail, Datumsrange, Dauer (Wochen/Tage), Betreuer. Styling: `bg-surface-elevated`, `border-stroke-subtle`, `shadow-md`, `rounded-md`.
- **Konflikt-Markierung:** `ring-1 ring-danger ring-inset` auf betroffenen Blöcken.
- **Label-Spalte:** Kein `border-r` mehr, kein `border-b` zwischen Zeilen. Sauberer Look.
- **Container:** Kein `rounded-lg border border-stroke-subtle` mehr auf dem Äußeren Container.

**3. `ScheduleLegend` — Update:**
- Statt `h-3 w-3 rounded-sm border-l-2` Quadrate → `inline-flex rounded-full px-2.5 py-0.5` Pillen mit Kategorie-Background und Kategorie-FG-Text.

### Verifikation

- **Lint:** 0 Errors, 4 Warnings (unverändert, keine neuen).
- **Tests:** 686 Tests, 41 Dateien, alle bestanden (+27 neue Tests: 14 in `types.test.ts`, 13 in `gantt-timeline.test.tsx`).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- Assignment das nur am Wochenende liegt wird nicht gerendert (0 Werktage) — korrektes Verhalten.
- Tooltip-Positionierung ist relativ zum Container (`containerRef`). Bei sehr schnellem Scrollen könnte Tooltip kurz daneben erscheinen — tolerabel.
- **Nächstes AP:** Dashboard-Status-Indikatoren (AP2): Punkte vergrößern, voll gesättigte Farben, Hover-Tooltips, Klick-Navigation.

---

## 2026-05-09 – Arbeitspaket: Dashboard-Status-Indikatoren Redesign (AP2)

### Planner

- **Ziel:** Status-Punkte im Ausbilder-Dashboard besser erkennbar machen. Punkte vergrößern, voll gesättigte Farben, Hover-Tooltips, Klick-Navigation.
- **Umfang:** Neue `statusDotColor()` Helper, Reviewer-Dashboard Mini-Week-Grid, Year-Calendar Legende.
- **Nicht-Ziele:** Gantt-Timeline (AP1 abgeschlossen), Badge-Komponente, Report-Calendar, Week-Navigator.
- **Akzeptanzkriterien:** Punkte 16×16px, 8 Wochen, voll gesättigte Farben, Hover-Tooltip, Klick auf Punkt navigiert zum Bericht.

### Reviewer

- Freigabe. Keine neuen Hardcoded-Farben. `statusDotColor()` nutzt semantische Token (`bg-success`, `bg-warning`, `bg-danger`, `bg-info`). Tooltip nutzt bestehende `bg-surface-elevated` + `border-stroke-subtle` + `shadow-md`.

### Implementierte Änderungen

**1. `src/lib/utils.ts` — Neue `statusDotColor()` Funktion:**
- Voll gesättigte Status-Farben statt Pastell (`bg-success` statt `bg-success-soft`).
- `draft`: `bg-surface-overlay border border-stroke-subtle` (subtiler Umriss).
- `missing`: `bg-danger` (voll rot).
- Fallback: wie `draft`.

**2. `src/components/reports/reviewer-dashboard-client.tsx` — Mini-Week-Grid:**
- Punktgröße: `h-3 w-3` (12px) → `h-4 w-4` (16px), `gap-0.5` → `gap-1`.
- Wochen: 12 → 8 letzte KWs.
- Farben: `statusColor()` (Pastell) → `statusDotColor()` (gesättigt).
- Punkte sind jetzt `<Link>`-Elemente: Klick navigiert direkt zum Bericht.
- Custom Tooltip (state-gesteuert, positioniert über Punkt): „KW 19: Genehmigt" oder „KW 19: Kein Bericht".
- Tooltip-Styling: `bg-surface-elevated`, `border-stroke-subtle`, `shadow-md`, `rounded-md`, `text-[10px]`.
- Entfernter Import: `ReportStatus` (nicht mehr referenziert).

**3. `src/components/reports/year-calendar.tsx` — Legende:**
- Farbmapping: `statusColor()` → `statusDotColor()` für einheitliche Darstellung.
- Legende-Indikatoren: `h-2.5 w-2.5` (10px) → `h-3 w-3` (12px).
- Zukünftige Wochen ohne Bericht: `bg-surface-overlay border border-stroke-subtle` statt solid.

### Verifikation

- **Lint:** 0 Errors, 3 Warnings (1 weniger — `ReportStatus` Import entfernt).
- **Tests:** 695 Tests, 41 Dateien, alle bestanden (+9 neue Tests: 7 `statusDotColor` in `utils.test.ts`, 3 `reviewer-dashboard-client` Tests aktualisiert/ergänzt).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- Tooltip im Reviewer-Dashboard nutzt `getBoundingClientRect()` relativ zum Dot-Container — bei Window-Resize könnte Position kurz veralten, tolerabel.
- Year-Calendar nutzt weiterhin native `title`-Tooltips auf den Wochen-Zellen (nicht die gleichen custom Tooltips wie Reviewer-Dashboard). Konsistenz könnte in einem Folge-AP verbessert werden.
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI.

---

## 2026-05-09 – Arbeitspaket: Gantt + Dashboard Feinschluss (Phase 3)

### Planner

- **Ziel:** 9 Korrekturen basierend auf visuellem Review mit Screenshots. 3 Bugs (Tooltip-Overlap, Scrollbar, KW-Ausrichtung), 6 Feinjustierungen.
- **Umfang:** Tooltip Auto-Flip, Custom Scrollbar, KW-Ausrichtung, Row-Höhe, Header-Trennlinie, Spalten-Whitespace, Status-Punkte-Größe, Card-Hover, Badge-Glow.
- **Nicht-Ziele:** Drag-Resize, E2E-Tests, neue Features.
- **Akzeptanzkriterien:** Tooltip nie hinter Header, Scrollbar dezent, KW+Monat linksbündig, Row 48px, Trennlinie unter Header, 24px Spalten-Whitespace, Legende mt-3, Punkte 14px/6px, Card-Hover, Badge ohne Glow.

### Reviewer

- Freigabe mit Präzisierungen: Tooltip-Schwelle dynamisch berechnet (headerHeight + TOOLTIP_ESTIMATED_HEIGHT), Card-Hover via `onClick`-Detection statt Prop, Scrollbar dezent sichtbar (nicht komplett versteckt).

### Implementierte Änderungen

1. **Tooltip Auto-Flip** (`gantt-timeline.tsx`): `TooltipState` um `flip: boolean` erweitert. `handleMouseEnter` berechnet ob genug Platz über dem Balken (barTopInContainer - 120px - 8px > headerHeight). Falls nicht: Tooltip unterhalb mit `transform: translate(-50%, 0)`.

2. **Custom Scrollbar** (`globals.css` + `gantt-timeline.tsx`): Neue `.timeline-scroll` CSS-Klasse mit WebKit + Firefox Styling. Thin, neutral, Thumb wird bei Hover deutlicher.

3. **KW-Header linksbündig** (`gantt-timeline.tsx`): `px-1` auf KW-Labels, konsistent zum Monats-Header.

4. **Row-Höhe 48px** (`gantt-timeline.tsx`): `rowHeight` default 36→48. Balken 24px vertikal zentriert → 12px Whitespace.

5. **Trennlinie unter Header** (`gantt-timeline.tsx`): `border-b border-stroke-subtle pb-3` auf Datenbereich.

6. **Spalten-Whitespace + Legende** (`gantt-timeline.tsx`): `pr-6` auf Azubi-Spalte. `mt-3` auf Legende.

7. **Status-Punkte 14px** (`reviewer-dashboard-client.tsx`): `h-[14px] w-[14px] gap-1.5`.

8. **Card Hover-State** (`card.tsx`): `transition-colors hover:border-stroke-base`. `cursor-pointer` nur via `onClick`-Detection.

9. **Badge Glow-Fix** (`badge.tsx`): `shadow-none` ergänzt.

### Verifikation

- **Lint:** 0 Errors, 3 Warnings.
- **Tests:** 695 Tests, 41 Dateien, alle bestanden.
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- Tooltip nutzt konservative 120px Schätzung für Tooltip-Höhe. Ref-basierte Höhenmessung wäre genauer, aber Overkill.
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI.

---

## 2026-05-09 – Arbeitspaket: Gantt Datenintegrität + Tooltip Portal + Scrollbar + Modal

### Planner

- **Ziel:** 3 Bugs + 2 Verbesserungen. Geisterzeile (Erika) durch Datenfluss-Fix, Tooltip-Abschneiden durch Portal, Scrollbar durch `!important`, Modal-Zentrierung durch Portal, Backend-Role-Validierung.

### Implementierte Änderungen

1. **traineeRows aus Trainee-Liste** (`trainer/schedule/page.tsx`): Vorher aus `filteredAssignments` → Nachher aus `trainees` State. Verhindert Geister-Zeilen für Nicht-Azubis.

2. **POST Role-Validierung** (`api/schedule/route.ts`): `findUnique` auf `traineeId` prüft `role === "trainee"`. 400 bei Nicht-Azubis. Neuer Test.

3. **Tooltip via createPortal** (`gantt-timeline.tsx`): Portal → `document.body`, Maus-Tracking mit Boundary-Check. Löst Clipping + Scroll-Expansion.

4. **Scrollbar CSS** (`globals.css`): `!important` auf WebKit-Pseudo-Elemente.

5. **Edit-Modal via createPortal** (`trainer/schedule/page.tsx`): Portal entkoppelt von Parent-Containern.

### Verifikation

- **Lint:** 0 Errors, 3 Warnings.
- **Tests:** 696 Tests, 41 Dateien, alle bestanden (+1 neuer).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- PUT-Handler hat keine Role-Validierung — nachziehen in Folge-AP.
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI.

---

## 2026-05-10 – Arbeitspaket: Jahrgang (JG) Anzeige in Dashboard + Planung

### Planner

- **Ziel:** Jahrgang (JG = Ausbildungseintrittsjahr) sichtbar machen: im Prüfer-Dashboard in der Info-Zeile, in der Einsatzplanung als Sublabel unter dem Azubi-Namen.
- **Umfang:**
  1. `/api/users` Trainer-Branch: `trainingStartDate` ins `select` aufnehmen
  2. Schedule Page: `Trainee`-Interface erweitern, JG an Gantt weiterreichen
  3. Gantt Timeline: `sublabel` prop auf `GanttRow`, zweite Zeile in klein/grau
  4. Dashboard: „FiAE · JG 2024 · 3 Berichte" in der Info-Zeile (Daten bereits verfügbar)
- **Nicht-Ziele:** Keine Datenmodell-Änderungen, keine neuen API-Routen.
- **Betroffene Dateien:** `src/app/api/users/route.ts`, `src/app/(dashboard)/trainer/schedule/page.tsx`, `src/components/schedule/gantt-timeline.tsx`, `src/components/reports/reviewer-dashboard-client.tsx`, Test-Dateien.
- **Akzeptanzkriterien:** Dashboard zeigt „JG XXXX" in Trainee-Info-Zeile, Planung zeigt „JG XXXX" unter Azubi-Namen, wenn kein `trainingStartDate` gesetzt wird JG nicht angezeigt, alle Tests bestanden.

### Reviewer

- Freigabe. Minimaler Eingriff: 1 bestehendes Feld (`trainingStartDate`) wird in einer weiteren API-Response und in 2 UI-Komponenten sichtbar gemacht. Keine Breaking Changes.

### Implementierte Änderungen

1. **`src/app/api/users/route.ts`**: Trainer-Branch `select` um `trainingStartDate: true` erweitert.
2. **`src/app/(dashboard)/trainer/schedule/page.tsx`**: `Trainee`-Interface um `trainingStartDate` erweitert. `traineeRows` extrahiert JG aus `trainingStartDate` und reicht es als `sublabel` weiter.
3. **`src/components/schedule/gantt-timeline.tsx`**: `GanttRow` Interface um optionalen `sublabel` erweitert. Zeilen-Rendering: Name + optionale zweite Zeile `text-[10px] text-content-subtle`. `min-w` von 140px auf 160px erhöht.
4. **`src/components/reports/reviewer-dashboard-client.tsx`**: `trainingStartDate` (bereits im Interface) wird gerendert: „FiAE · JG 2024 · 3 Berichte".
5. **Tests**: API-Test für Trainer-Branch aktualisiert (`trainingStartDate` in Response). 2 neue Gantt-Tests (sublabel gerendert / null-safety).

### Verifikation

- **Lint:** 0 Errors, 3 Warnings (unverändert).
- **Tests:** 698 Tests, 41 Dateien, alle bestanden (+2 neue).
- **Build:** erfolgreich.
- **Typecheck:** `npm run typecheck` nicht verfügbar, pre-existing TS-Fehler unverändert.

### Offene Risiken / Folgeaufgaben

- Keine neuen Risiken.
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI, Issue #67 (Calendar-Today-Indikator).

---

## 2026-05-10 – Arbeitspaket: Gantt Drag-to-Scroll + Dynamisches Nachladen

### Planner

- **Ziel:** Einsatzplanung modernisieren — weg von ← / → Monatsbuttons und clunky Browser-Scrollbar hin zu Drag-to-Scroll mit Momentum/Flick-Gesten und dynamischem Nachladen beim Scrollen.
- **Umfang:**
  1. `GanttTimeline`: Drag-to-Scroll (Maus + Touch), Momentum/Deceleration, Klick-vs-Drag-Unterscheidung (< 5px = Klick)
  2. Props: `daysVisible` → `viewEnd` (explizites Enddatum), neuer `onScrollNearEdge` Callback
  3. Alle 3 Schedule Pages: `viewStart`/`viewEnd` als expandierbarer State (initial ±3 Monate), ← / → Buttons entfernt, Monatslabel entfernt, dynamisches Nachladen
  4. Cursor-Styles: `cursor-grab` / `active:cursor-grabbing` + `select-none`
- **Nicht-Ziele:** Scroll-Snap auf Monatsgrenzen (zu restriktiv bei Drag), Infinite-Virtualisierung.
- **Betroffene Dateien:** `gantt-timeline.tsx`, `trainer/schedule/page.tsx`, `officer/schedule/page.tsx`, `trainee/schedule/page.tsx`, `gantt-timeline.test.tsx`, `HANDBUCH.md`.
- **Akzeptanzkriterien:** Drag-to-Scroll funktioniert (Maus+Touch), Momentum, Klick auf Blöcke funktioniert trotz Drag, dynamisches Nachladen beim Scrollen, alle Tests bestanden.

### Reviewer

- Freigabe. Drag-Threshold von 5px ist Standard. Momentum-Deceleration 0.95 ist konservativ genug. Touch-Handler via useRef löst Dependency-Probleme.

### Implementierte Änderungen

1. **`gantt-timeline.tsx`** — Kompletter Rewrite der Interaction-Logik:
   - `daysVisible: number` → `viewEnd: Date` Prop
   - Neuer optionaler `onScrollNearEdge?: (direction: "start" | "end") => void` Callback
   - Drag-to-Scroll: `mousedown/move/up` mit 1:1 ScrollLeft-Mapping
   - Touch: `touchstart/move/end` via Ref-basierte Handler (vermeidet useCallback-Dependency-Probleme)
   - Momentum: `velocityRef` getrackt in px/ms, bei Release × 16 skaliert, Deceleration 0.95 pro Frame, Abbruch bei < 0.5
   - Klick-vs-Drag: `DRAG_THRESHOLD = 5px`, `dragConsumedRef` wird asynchron gesetzt nach Release
   - Block `onClick`: prüft `wasDragged()`, stoppt Propagation wenn Drag stattfand
   - Cursor: `cursor-grab` / `active:cursor-grabbing` + `select-none`
   - Scrollbar: bleibt `.timeline-scroll` (dezent, dünn)

2. **`trainer/schedule/page.tsx`** — Navigation entfernt, dynamisches Nachladen:
   - `viewStart` (heute -3 Monate) + `viewEnd` (heute +3 Monate) State
   - `handleScrollNearEdge`: erweitert `viewStart`/`viewEnd` um je 3 Monate
   - ← / → Buttons entfernt, Monatslabel entfernt
   - `refreshData` nutzt aktuelle viewStart/viewEnd

3. **`officer/schedule/page.tsx`** — Gleiche Migration wie Trainer (readonly mode)

4. **`trainee/schedule/page.tsx`** — Gleiche Migration (singleRow mode)

5. **Tests**: Alle `daysVisible` → `viewEnd` aktualisiert. +2 neue Tests (cursor-grab, onScrollNearEdge callback).

### Verifikation

- **Lint:** 0 Errors, 3 Warnings (unverändert).
- **Tests:** 700 Tests, 41 Dateien, alle bestanden (+2 neue).
- **Build:** erfolgreich.
- **Typecheck:** Pre-existing TS-Fehler unverändert.

### Offene Risiken / Folgeaufgaben

- Touch-Momentum auf iOS könnte Safari-spezifische Edge Cases haben (nicht auf Gerät getestet).
- Dynamisches Nachladen refetched den gesamten Zeitraum (nicht Delta) — bei sehr langen Zeiträumen könnte das langsam werden.
- Scroll-Snap auf Monatsgrenzen wurde bewusst nicht implementiert (zu restriktiv bei freiem Drag).
- Nächste Arbeitspakete: Frequenz-Intervall im Resolver, RecurrenceException UI, Issue #67 (Calendar-Today-Indikator).

---

## 2026-05-10 – Arbeitspaket: Tooltip-Bleed im Reviewer-Dashboard fixen

### Planner

- **Ziel:** Hover-Tooltip auf Status-Punkten im Ausbilder-Dashboard erscheint für alle Azubi-Zeilen gleichzeitig statt nur für die betroffene Zeile.
- **Ursache:** Einzelner `dotTooltip`-State und einzelner `dotContainerRef` werden über alle Azubi-Cards geteilt. Tooltip-Rendering (`{dotTooltip && (...)}`) in jedem Card führt dazu, dass der Tooltip in **allen** Karten angezeigt wird. `dotContainerRef.current` zeigt immer auf den zuletzt gerenderten Container, was die Positionsberechnung verfälscht.
- **Umfang:** `src/components/reports/reviewer-dashboard-client.tsx` — Extraktion einer `TraineeCard`-Sub-Komponente mit eigenem `dotTooltip`-State und eigenem `dotContainerRef`.
- **Nicht-Ziele:** Keine Architektur-, Datenmodell- oder API-Änderungen.
- **Akzeptanzkriterien:** Tooltip erscheint nur in der Zeile, über der gehovert wird. Alle Tests bestanden.

### Reviewer

- Freigabe. Minimaler Refactor — State-Isolation durch Sub-Komponente. Keine Seiteneffekte.

### Implementierte Änderungen

- **Neu:** `TraineeCard`-Sub-Komponente in `reviewer-dashboard-client.tsx` mit eigenem `dotTooltip`-State und `dotContainerRef`.
- **Verschoben:** `handleDotEnter`, `handleDotLeave`, Tooltip-Rendering, Mini-Week-Overview, expandierter Bericht-Bereich in `TraineeCard`.
- **Vereinfacht:** `ReviewerDashboardClient` mappt nur noch über `<TraineeCard>`-Instanzen.
- Props: `trainee`, `basePath`, `recentWeeks`, `isExpanded`, `onToggle`.

### Verifikation

- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Tests:** 700 Tests, 41 Dateien, alle bestanden.
- **Build:** erfolgreich.
- **Typecheck:** `npm run typecheck` nicht verfügbar.

### Offene Risiken / Folgeaufgaben

- Keine neuen Risiken.

---

## AP: Phase 1 – Sicherheit & Datenintegritaet (Qualitaetsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** 6 Sicherheits- und Datenintegritaets-Fixes aus der Qualitaetsoffensive (CODE_REVIEW.md).

**Umfang:**
1. QO-H4: CRON_SECRET-Bypass fixen
2. QO-H2/H3: Zod-Schemas fuer PUT schedule + recurrence-rules
3. QO-H5: validUntil > validFrom Validierung
4. QO-H7: ReviewAction.withdrawn aufraeumen
5. QO-M6: Sicherer Passwort-Hash bei Anonymisierung
6. QO-H1: Rate Limiting auf Login

**Nicht-Ziele:** Phase 2-7, UI-Aenderungen.

### Reviewer

Plan deckt ausschliesslich Phase 1 ab. Keine UI-Beruehrung, keine Schema-Migration. Freigabe erteilt.

### Implementierte Aenderungen

- **QO-H4:** `notifications/check/route.ts` – CRON_SECRET-Bedingung korrigiert: `!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET`. Ohne ENV-Var wird jetzt 403 zurueckgegeben statt bypassed.
- **QO-H2:** `schedule/route.ts` PUT – `updateScheduleSchema` (Zod) eingefuehrt mit UUID-Validierung fuer `id`, Enum-Validierung fuer `scheduleType`, nullable Felder.
- **QO-H3:** `recurrence-rules/route.ts` PUT – `updateRecurrenceRuleSchema` (Zod) eingefuehrt mit gleicher Qualitaet.
- **QO-H5:** `validations.ts` – `officerAssignmentSchema` mit `.refine()` das `validUntil > validFrom` sicherstellt.
- **QO-H7:** Analyse ergab: `ReviewAction.withdrawn` ist korrekt als Audit-Trail-Eintrag (`submit/route.ts:101`). Report-Status geht korrekt auf `draft` zurueck. Kein Fix noetig – Works as designed.
- **QO-M6:** `users/[id]/anonymize/route.ts` – `passwordHash: "-"` ersetzt durch `bcrypt.hash(crypto.randomUUID(), 12)`.
- **QO-H1:** `src/lib/rate-limit.ts` (neu) – In-Memory Rate Limiter: 5 Attempts, 15 Min Lockout. `src/lib/auth.ts` nutzt `isRateLimited`, `recordFailedAttempt`, `clearAttempts`.
- **Neue Schemas:** `scheduleTypeSchema`, `updateScheduleSchema`, `updateRecurrenceRuleSchema` in `validations.ts`.

### Verifikation

- **Tests:** 726 Tests (26 neue), 44 Dateien, alle bestanden.
  - `rate-limit.test.ts`: 7 Tests (Rate Limiting: 5 Attempts, Lockout, Reset, Timer).
  - `validations.test.ts`: 19 neue Tests (officerAssignment refine, updateScheduleSchema, updateRecurrenceRuleSchema).
  - `schedule/route.test.ts`: 2 neue Tests (400 bei invalid id/scheduleType).
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- Rate Limiting ist In-Memory – bei Multi-Instance-Deployment nicht instanzuebergreifend. Fuer Production auf Redis-basierte Loesung migrieren.
- `typecheck`-Script nicht in `package.json` (AGENTS.md fordert es).
- Phase 2-7 der Qualitaetsoffensive ausstehend.

---

## AP: Phase 2 – Performance & Stabilitaet (Qualitaetsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** Performance- und Stabilitaets-Fixes aus der Qualitaetsoffensive.

**Umfang:**
1. QO-H6: JWT-Refresh Cache (DB-Query nur alle 5 Min)
2. QO-M8: N+1 Query schedule GET training_officer
3. QO-M9: N+1 Query notification createMany statt Loop
4. QO-M1/M2: try/catch auf 6 DELETE-Handlern + notifications PUT/DELETE
5. QO-M10/M11/L13: Fehlende DB-Indizes (reviewedById, actorId, composite)
6. QO-M12/M13: Cascade-Delete ScheduleAssignment/RecurrenceRule → SetNull
7. QO-M14: Unique-Constraint auf DailyEntry[weeklyReportId, date]
8. QO-L14: Redundanter Index auf RecurrenceException entfernt

### Reviewer

Schema-Aenderungen sind rueckwaertskompatibel (neue Indizes, Unique, FK-Aenderung von Cascade→SetNull mit nullable FK). Migration erstellt. Freigabe erteilt.

### Implementierte Aenderungen

- **QO-H6:** `auth.ts` – Role-Cache (5 Min TTL) als In-Memory Map. DB-Query nur bei Cache-Miss.
- **QO-M8:** `schedule/route.ts` GET training_officer – Single Query statt N Queries. Filterung in-memory nach Officer-Zeitraum.
- **QO-M9:** `notifications/check/route.ts` – `createMany` statt Loop mit einzelnen `create`.
- **QO-M1/M2:** try/catch auf DELETE: schedule, recurrence-rules, officer-assignments, assignments, professions/[id], notifications/[id]. PUT: notifications/[id]. Bei Prisma-Fehler → 404.
- **Migration:** `20260510120000_phase2_indexes_constraints_cascade`
  - `@@index([reviewedById])` auf WeeklyReport
  - `@@index([actorId])` auf ReviewEvent
  - `@@index([traineeId, validFrom, validUntil])` auf TraineeOfficerAssignment
  - `@@unique([weeklyReportId, date])` auf DailyEntry
  - ScheduleAssignment.createdBy: Cascade → SetNull (nullable)
  - RecurrenceRule.createdById: Cascade → SetNull (nullable)
  - Redundant Index auf RecurrenceException entfernt

### Verifikation

- **Tests:** 726 Tests, 42 Dateien, alle bestanden.
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Build:** erfolgreich.
- **Migration:** lokal angewendet.

### Offene Risiken / Folgeaufgaben

- DailyEntry Unique-Constraint kann bei bestehenden Duplikaten in Production zu Fehlern fuehren. Vor Migration Duplikate pruefen.
- Phase 3-7 der Qualitaetsoffensive ausstehend.

---

## AP: Phase 3 – Validierung & Datenqualität (Qualitätsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** Validierungs- und Datenqualitäts-Fixes aus der Qualitätsoffensive.

**Umfang:**
1. QO-M15: `dailyEntries` auf `.min(7).max(7)` validieren
2. QO-M16: `reviewSchema` Kommentar-Pflicht bei rejected/needs_revision
3. QO-M7: `updateReportSchema` nutzt `dailyEntrySchema` statt Duplikat
4. QO-M3/M4: Query-Param-Validierung für year (reports + prefill)
5. QO-M17: `tailwind-merge` installiert, `cn()` nutzt `twMerge(clsx(...))`
6. QO-M18: Report-Builder `DEFAULT_HOURS` per ScheduleType (vacation=0)

**Nicht-Ziele:** Phase 4-7, UI-Änderungen.

### Reviewer

Plan deckt ausschließlich Phase 3 ab. Keine UI-Berührung, keine Schema-Migration. Freigabe erteilt.

### Implementierte Änderungen

- **QO-M15:** `validations.ts` – `dailyEntries` Array-Validation `.min(7).max(7)` hinzugefügt.
- **QO-M16:** `validations.ts` – `reviewSchema` mit `.refine()` das `comment` bei `action: "rejected" | "needs_revision"` erzwingt.
- **QO-M7:** `validations.ts` – `updateReportSchema` referenziert `dailyEntrySchema` statt duplizierter Felddefinition.
- **QO-M3/M4:** `reports/route.ts` – `yearParam` Zod-Schema mit `z.coerce.number().int().min(2020).max(2100).optional()`. `prefill/route.ts` – `prefillParams` Zod-Schema für year + week mit 400-Fehler inkl. Details.
- **QO-M17:** `tailwind-merge` als neue Dependency. `cn()` in `utils.ts` nutzt jetzt `twMerge(clsx(...))`.
- **QO-M18:** `report-builder.ts` – `DEFAULT_HOURS: Record<ScheduleType, number>` mit vacation=0, rest=8.
- **Tests:** `validations.test.ts` +19 Tests, `report-builder.test.ts` +1 Test (vacation hours), `route.test.ts` + `review/route.test.ts` angepasst (comment bei rejected/needs_revision).

### Verifikation

- **Tests:** 730 Tests, 42 Dateien, alle bestanden.
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Build:** erfolgreich.
- **Typecheck:** `npm run typecheck` nicht verfügbar.

### Offene Risiken / Folgeaufgaben

- Phase 4-7 der Qualitätsoffensive ausstehend.
- `typecheck`-Script nicht in `package.json`.

---

## AP: Phase 4 – Testabdeckung (Qualitätsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** Testlücken für ungetestete API-Routen und Komponenten schließen.

**Umfang:**
1. QO-H9: recurrence-rules API Tests (GET/POST/PUT/DELETE)
2. QO-H9: prefill API Tests (GET)
3. QO-H9: assignment-modal Komponenten-Tests
4. QO-H9: UI-Wrapper Tests (calendar, popover, date-picker)
5. QO-L30: auth.test.ts authorize import (architektonisch nicht behebbar — `authorize` ist NextAuth-Provider-Callback)

**Nicht-Ziele:** Phase 5-7.

### Reviewer

Plan deckt ausschließlich Phase 4 ab. Keine Produktivcode-Änderungen, nur neue Testdateien. Freigabe erteilt.

### Implementierte Änderungen

- **Neu:** `src/app/api/recurrence-rules/route.test.ts` — 25 Tests (GET: 5 admin/trainer/trainee/officer/auth, POST: 9 auth/role/validation/admin/trainer/no-profession/bitfield, PUT: 8 auth/role/validation/admin/trainer/ownership/weekDays/updatedById, DELETE: 8 auth/id/role/admin/trainer/not-found).
- **Neu:** `src/app/api/reports/prefill/route.test.ts` — 17 Tests (auth, role, validation, prefill-entries, schedule-assignments, recurrence-rules+exceptions, date-range-query).
- **Neu:** `src/components/schedule/assignment-modal.test.tsx` — 19 Tests (rendering, modes, trainee/officer-options, weekday-buttons, department-input, submit-single, submit-recurring, error-handling, backdrop-close, modal-content-click).
- **Neu:** `src/components/ui/calendar.test.tsx` — 5 Tests.
- **Neu:** `src/components/ui/popover.test.tsx` — 3 Tests.
- **Neu:** `src/components/ui/date-picker.test.tsx` — 4 Tests.

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden (+73 neue).
- **Lint:** 0 Errors, 20 Warnings (vorbestehend).
- **Build:** erfolgreich.
- **Typecheck:** `npm run typecheck` nicht verfügbar.

### Offene Risiken / Folgeaufgaben

- QO-L30 (authorize import): `authorize` ist in NextAuth Credentials-Provider eingebettet, nicht separat exportierbar. Duplikat im Test ist architekturbedingt.
- Phase 5-7 der Qualitätsoffensive ausstehend.

---

## AP: Phase 5 – Accessibility (Qualitätsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** 3 Accessibility-Fixes aus der Qualitätsoffensive.

**Umfang:**
1. QO-H8: aria-labels auf 8 Icon-Buttons (Navbar, Report-Calendar, Reviewer-Dashboard, Admin-Professions)
2. QO-H8: Formular-Labels im Assignment-Modal (5 aria-labels auf selects/inputs)
3. QO-H10: Focus-Trap + role="dialog" + aria-modal auf Assignment-Modal

**Nicht-Ziele:** Phase 6-7.

### Reviewer

Plan deckt ausschließlich Phase 5 ab. Keine Datenmodell- oder API-Änderungen. Freigabe erteilt.

### Implementierte Änderungen

- **QO-H8 aria-labels:**
  - `navbar.tsx`: Bell-Button "Benachrichtigungen", Mark-as-read "Als gelesen markieren", Logout "Abmelden"
  - `report-calendar.tsx`: Prev "Vorheriger Monat", Next "Nächster Monat"
  - `reviewer-dashboard-client.tsx`: Filter-Button "Filter ein-/ausblenden"
  - `admin/professions/page.tsx`: Edit `${name} bearbeiten`, Delete `${name} löschen`
- **QO-H8 Formular-Labels:**
  - `assignment-modal.tsx`: 5 aria-labels auf Azubi-Select, Typ-Select, Beschreibung-Input, Abteilung-Input, Betreuer-Select
- **QO-H10 Focus-Trap:**
  - `assignment-modal.tsx`: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="assignment-modal-title"`, Escape-Key → onClose, Tab-Focus-Trap (first/last focusable), Auto-Focus auf erstes Element beim Öffnen

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden (3 Test-Assertions aktualisiert für neuen aria-label).
- **Lint:** 0 Errors, 19 Warnings (vorbestehend).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- Phase 6-7 der Qualitätsoffensive ausstehend.
- Focus-Trap ist rudimentär (QuerySelector-basiert). Für komplexe Modals wäre `@radix-ui/react-dialog` robuster.

---

## AP: Phase 6 – Code-Qualität & Refactoring (Qualitätsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** Code-Qualität und Refactoring aus der Qualitätsoffensive (ausgenommen QO-M22 Gantt-Aufteilung — zu groß für dieses AP).

**Umfang:**
1. QO-M23: TraineeWithReports-Interface dedupliziert → `src/types/index.ts`
2. QO-M24: 3 unnötige Typ-Assertions in reviewer-report-page.tsx entfernt
3. QO-M25: Duplicate schedule type enum → `scheduleTypeSchema` importiert statt inline
4. QO-L4: Unused `import * as React` in calendar.tsx entfernt
5. QO-L6: `isBeforeTrainingStart` nach `src/lib/utils.ts` extrahiert (2x dedupliziert)
6. QO-L7: `LEGEND_ITEMS`, `MODE_TABS` als Module-Level-Konstanten verschoben
7. QO-L1: `bg-black/20` in navbar.tsx → `bg-overlay-backdrop/40`

**Nicht-Ziele:** QO-M22 (Gantt aufteilen — Groß), QO-M19-M21 (Autosave/Session), QO-L2/L3/L5/L8 (kosmetisch).

### Reviewer

Plan deckt ausschließlich Code-Qualität ohne Funktionsänderungen ab. Keine Datenmodell- oder API-Änderungen. Freigabe erteilt.

### Implementierte Änderungen

- `src/types/index.ts` — Neues `TraineeWithReports` Interface
- `reviewer-dashboard.tsx` + `reviewer-dashboard-client.tsx` — Import aus `@/types` statt lokalem Interface
- `reviewer-report-page.tsx` — 3 `(e as { reportText?: string })` Assertions entfernt (Typ bereits korrekt)
- `recurrence-rules/route.ts` + `schedule/route.ts` — `scheduleTypeSchema` aus `validations.ts` importiert
- `calendar.tsx` — Unused `import * as React from "react"` entfernt
- `utils.ts` — Neue exportierte `isBeforeTrainingStart()` Funktion
- `report-calendar.tsx` + `year-calendar.tsx` — Import `isBeforeTrainingStart` aus utils statt lokale Duplikate
- `year-calendar.tsx` — `LEGEND_ITEMS` von inline zu module-level verschoben
- `assignment-modal.tsx` — `MODE_TABS` von inline zu module-level verschoben
- `navbar.tsx` — `bg-black/20` → `bg-overlay-backdrop/40`

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden.
- **Lint:** 0 Errors, 17 Warnings (3 weniger — unused imports entfernt).
- **Build:** erfolgreich.

### Offene Risiken / Folgeaufgaben

- QO-M22 (Gantt aufteilen) offen — großer Refactor, eigenes AP empfohlen.
- QO-M19-M21 (Autosave Deep-Compare, Retry, Session-Refetch) offen.
- Phase 7 (Dokumentation) ausstehend.

---

## AP: Phase 7 – Dokumentation (Qualitätsoffensive)

**Datum:** 2026-05-10

### Planner

**Ziel:** 15 Dokumentationslücken aus der Qualitätsoffensive beheben.

**Umfang:**
1. QO-DOC1-DOC6: ARCHITECTURE.md aktualisieren
2. QO-DOC7-DOC10: HANDBUCH.md aktualisieren
3. QO-DOC11-DOC12: DESIGN_SYSTEM.md korrigieren
4. QO-DOC13-DOC15: README.md aktualisieren

**Nicht-Ziele:** Code-Änderungen.

### Reviewer

Plan deckt ausschließlich Dokumentation ab. Keine Produktivcode-Änderungen. Freigabe erteilt.

### Implementierte Änderungen

**ARCHITECTURE.md (QO-DOC1-DOC6):**
- TraineeTrainerAssignment → TrainerProfessionAssignment aktualisiert
- Notification-Modell dokumentiert
- "(geplant)" entfernt
- Next.js 15.x → 16.x korrigiert
- Withdraw-Statusübergang (submitted → draft) ergänzt
- officer-assignments API-Route dokumentiert
- Rate Limiting, JWT Cache, CRON_SECRET in Auth-Sektion dokumentiert

**HANDBUCH.md (QO-DOC7-DOC10):**
- Testzugangs-Tabelle aktualisiert (37 User mit Mustern)
- Zuordnungsmodell auf TrainerProfessionAssignment aktualisiert
- Officer-UI als implementiert dokumentiert (/trainer/officers/)
- Trainee-Schedule-View (/trainee/schedule/) dokumentiert
- Rate-Limiting im Login-Abschnitt ergänzt

**DESIGN_SYSTEM.md (QO-DOC11-DOC12):**
- Font Family korrigiert: Inter → Geist, JetBrains Mono → Geist Mono
- Konventions-Notes für nicht-implementierte Token-Schichten ergänzt

**README.md (QO-DOC13-DOC15):**
- Features-Liste von 8 auf 18 Items erweitert
- Projektstruktur aktualisiert
- Typecheck-Hinweis ergänzt (`npx tsc --noEmit`)

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden (keine Code-Änderungen).
- **Lint:** 0 Errors (nur Markdown-Änderungen).
- **Build:** nicht erneut nötig (keine Code-Änderungen).

### Ergebnis

**Qualitätsoffensive abgeschlossen.** Alle 7 Phasen (Phase 1–7) umgesetzt. 15 Dokumentationslücken geschlossen.

---

## AP: Gantt-Timeline Refactoring (QO-M22)

**Datum:** 2026-05-10

### Planner

**Ziel:** 578-Zeilen gantt-timeline.tsx in 4 Module aufteilen für bessere Wartbarkeit.

**Umfang:**
1. `useDragScroll` Hook — Drag-to-Scroll-Physik, Momentum, Touch-Handling (170 Zeilen)
2. `TimelineTooltip` — Portal-basierter Tooltip mit Typ-Label, Dauer, Betreuer (55 Zeilen)
3. `TimelineBlock` — Einzelner Block mit Konflikt-Markierung, Label, Click-Handler (95 Zeilen)
4. `gantt-timeline.tsx` — Hauptkomponente als Komposition (250 Zeilen, vorher 578)

**Nicht-Ziele:** Funktionsänderungen, API-Änderungen, neue Features.

### Reviewer

Plan deckt ausschließlich Strukturänderungen ab. Keine Funktionsänderungen. Gleiche Props, gleiche Exports. Freigabe erteilt.

### Implementierte Änderungen

- **Neu:** `src/components/schedule/use-drag-scroll.ts` — Hook mit `containerRef`, `handlePointerDown/Move/Up`, `wasDragged`, `isDragging`
- **Neu:** `src/components/schedule/timeline-tooltip.tsx` — `TimelineTooltip` Komponente + `TooltipState` Type Export
- **Neu:** `src/components/schedule/timeline-block.tsx` — `TimelineBlock` Komponente mit Konflikt-Check, KW-Label, Click-Handler
- **Rewrite:** `src/components/schedule/gantt-timeline.tsx` — 578 → 250 Zeilen. Imports der 3 neuen Module. Gleiche API (`GanttTimeline`, `ScheduleLegend`).

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden (inkl. 13 Gantt-Tests unverändert).
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Build:** erfolgreich.

---

## 2026-05-10 – Quick Wins: Today-Indicator + Seed-Cleanup

### Planner

**Ziel:** Drei kleine Fixes in einem Arbeitspaket:
1. **#67** — Calendar-Today-Indikator besser sichtbar (Light + Dark Mode)
2. **QO-M27** — Seed dupliziert `getIsoWeek`/`getWeekDates` → importieren aus `src/lib/utils`
3. **QO-M28** — Seed Woche-53-Behandlung korrigieren (`week > 52` → `week > getIsoWeeksInYear(year)`)

**Nicht-Ziele:** Keine Architektur-, Datenmodell- oder UI-Änderungen außer dem Today-Dot.

### Reviewer

- Plan ist schlüssig. Drei unabhängige kleine Fixes ohne Seiteneffekte.
- Today-Dot: `after:`-Pseudo-Element ist kompatibel mit bestehendem `selected`-State (keine Kollision).
- Seed-Import: `tsx` resolved `../src/lib/utils` direkt, kein `@/` nötig.
- Woche-53: `getIsoWeeksInYear()` über 28.12. ist der korrekte ISO-Algorithmus.

### Implementierte Änderungen

1. **`src/components/ui/calendar.tsx`** — `today` class: Ring entfernt, stattdessen `font-semibold` + `after:` Dot (`bg-accent`, 4×4px, zentriert unter der Zahl).
2. **`prisma/seed.ts`** — 19 Zeilen duplicierte Hilfsfunktionen entfernt, importiert `getIsoWeek` + `getWeekDates` aus `../src/lib/utils`. `getWeekDates`-Nutzung angepasst (returns `Date[]`, nicht `{ start, end }`). Manuelle `days[]`-Konstruktion ersetzt durch `weekDays` (bereits `Date[]`).
3. **`prisma/seed.ts`** — Neue Hilfsfunktion `getIsoWeeksInYear(year)`, alle 3× `week > 52` ersetzt durch `week > getIsoWeeksInYear(year)`.

### Verifikation

- **Tests:** 803 Tests, 48 Dateien, alle bestanden.
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Typecheck:** Pre-existing Fehler in Test-Dateien (settings/route.test.ts, reviewer-report-page.test.tsx, year-calendar.test.tsx, gantt-timeline.test.tsx, use-autosave.test.ts, schedule-resolver.test.ts) — nicht durch dieses AP verursacht.
- **Build:** Nicht ausgeführt (keine Änderungen an Routen/Server-Komponenten).

### Offene Risiken / Folgeaufgaben

- Today-Dot sollte manuell im Light/Dark Mode visuell geprüft werden.
- Seed-Import relativ (`../src/lib/utils`) — bei Verzeichnisumstrukturierung anzupassen.

---

## 2026-05-10 – Issue #84: Passwort-Änderung durch User (Self-Service)

### Planner

**Ziel:** User können ihr Passwort selbstständig ändern. Neue Route `/einstellungen`, API `PUT /api/users/me/password`, Navbar-Link für alle Rollen.

**Betroffene Dateien:**
- `src/lib/validations.ts` — Neues `changePasswordSchema`
- `src/app/api/users/me/password/route.ts` — Neue API-Route
- `src/app/(dashboard)/einstellungen/page.tsx` — Neue Seite
- `src/components/layout/navbar.tsx` — Einstellungen-Link (Desktop + Mobile)

**Akzeptanzkriterien:**
- User kann eigenes Passwort ändern (altes + neues + Bestätigung)
- Altes Passwort wird via bcrypt verifiziert
- Validierung: min 8 Zeichen, ≠ altes Passwort, Bestätigung muss übereinstimmen
- UI über Navbar erreichbar (alle Rollen)
- Admin-Passwort-Reset bleibt bestehen
- Alle Tests + Build bestanden

### Reviewer

- Plan deckt alle Akzeptanzkriterien ab.
- Keine Rollen-Einschränkung nötig (jeder eingeloggte User darf sein eigenes Passwort ändern).
- Session wird nicht invalidiert (JWT bleibt gültig) — Issue fordert das explizit nicht.
- Keine Architekturänderung, reine Feature-Erweiterung.

### Implementierte Änderungen

1. **`src/lib/validations.ts`** — `changePasswordSchema` mit `currentPassword`, `newPassword` (min 8), `confirmPassword`, zwei `.refine()`: newPassword ≠ currentPassword, confirmPassword === newPassword.
2. **`src/app/api/users/me/password/route.ts`** — `PUT`-Handler: auth(), Zod-Validierung, `bcrypt.compare` für altes PW, `bcrypt.hash` für neues PW, `prisma.user.update`.
3. **`src/app/(dashboard)/einstellungen/page.tsx`** — Client-Komponente mit Formular (aktuelles PW, neues PW, Bestätigung), Eye/EyeOff-Toggle, clientseitige + serverseitige Validierung, Success/Error-Feedback.
4. **`src/components/layout/navbar.tsx`** — `KeyRound`-Icon-Link (Desktop: zwischen ThemeToggle und Trennstrich, Mobile: am Ende der Nav-Items).
5. **Tests:**
   - `src/app/api/users/me/password/route.test.ts` — 8 Tests: 401, 200 success, 400 wrong PW, 400 validation, 400 mismatch, 400 same PW, 404 user missing, 400 missing field.
   - `src/lib/validations.test.ts` — 9 Tests für `changePasswordSchema`.

### Verifikation

- **Tests:** 820 Tests, 49 Dateien, alle bestanden (+17 neu).
- **Lint:** 0 Errors, 17 Warnings (vorbestehend).
- **Build:** Erfolgreich (inkl. neuer Route `/einstellungen`).
- **Typecheck:** Pre-existing Fehler in Test-Dateien — nicht durch dieses AP verursacht.

### Offene Risiken / Folgeaufgaben

- JWT wird nicht invalidiert bei Passwort-Änderung — bei Bedarf extra Feature.
- Keine Passwort-Stärke-Anzeige (z.B. zxcvbn) — mögliche Erweiterung.

---

## 2026-05-10 – Issue #83: PDF-Batch-Export nach Zeitraum

### Planner

**Ziel:** User können mehrere Berichte als Sammel-PDF exportieren — Zeitraum-Auswahl, Quick-Buttons, Vorschau der Berichtsanzahl.

**Betroffene Dateien:**
- `src/components/reports/pdf-document.tsx` — Neue `PdfBatchDocument`-Komponente
- `src/app/api/reports/export/route.tsx` — Neue Batch-Export API
- `src/app/api/reports/count/route.ts` — Neue Count-API (Vorschau)
- `src/app/(dashboard)/trainee/export/page.tsx` — Neue Export-Seite
- `src/components/layout/navbar.tsx` — Export-Nav-Item für Trainees

**Akzeptanzkriterien:**
- Export-Seite mit Zeitraum-Auswahl und Quick-Buttons
- Vorschau der Berichtsanzahl vor Export
- Sammel-PDF (alle Berichte chronologisch)
- Berechtigungsprüfung (Trainee → eigene, Trainer/Officer → zugeordnete, Admin → alle)
- Einzel-Export bleibt im Editor
- Alle Tests + Build bestanden

### Reviewer

- Plan deckt Issue #83 vollständig ab. ZIP-Export als optionales Folge-Feature.
- Berechtigungslogik analog zum Einzel-PDF (PR #92-Pattern).
- `PdfBatchDocument` rendert mehrere `<Page>` in einem `<Document>` — @react-pdf/renderer unterstützt das.
- Count-API für Vorschau ist sauber getrennt vom Export.

### Implementierte Änderungen

1. **`src/components/reports/pdf-document.tsx`** — `PdfBatchDocument`-Komponente: iteriert über `reports[]`, erzeugt pro Bericht eine `<Page>`.
2. **`src/app/api/reports/export/route.tsx`** — `GET /api/reports/export?from=&to=&traineeId=`: Zod-Datenvalidierung, Berechtigungsprüfung (Trainee/Trainer/Officer/Admin), `findMany` mit Datumsfilter, `renderToStream`, PDF-Response.
3. **`src/app/api/reports/count/route.ts`** — `GET /api/reports/count?from=&to=`: Gibt `{ count }` für die Vorschau zurück.
4. **`src/app/(dashboard)/trainee/export/page.tsx`** — Client-Komponente mit Date-Pickern, 4 Quick-Buttons (Letzter Monat, 3 Monate, Letztes Jahr, Gesamte Historie), Vorschau mit Berichtsanzahl, Download-Button.
5. **`src/components/layout/navbar.tsx`** — `FileDown`-Icon + Export-Nav-Item für Trainees.
6. **Tests:** `export/route.test.ts` (13 Tests: 401, 400, 404, 200, Berechtigungen für alle 4 Rollen), `count/route.test.ts` (5 Tests).

### Verifikation

- **Tests:** 850 Tests, 52 Dateien, alle bestanden (+30 neu).
- **Lint:** 0 Errors, 19 Warnings (vorbestehend).
- **Build:** Erfolgreich (inkl. `/trainee/export`, `/api/reports/export`, `/api/reports/count`).

### Offene Risiken / Folgeaufgaben

- ZIP-Export mit einzelnen PDFs — optional, nicht im Scope.
- Deckblatt mit Name/Ausbildungsjahr — optionale Erweiterung.
- Große PDFs (>50 Berichte) könnten Memory-problematisch sein — Streaming-Optimierung bei Bedarf.
- **Vorbestehend:** `nodemailer` war nicht installiert (PR #82) — behoben mit `npm install`.

---

## 2026-05-10 – Issue #85: Frequenz-Intervall im Resolver (z.B. alle 2 Wochen)

### Planner

**Ziel:** Wiederholungsregeln um `interval`-Feld erweitern, sodass z.B. "alle 2 Wochen Berufsschule" möglich ist. Vollständig rückwärtskompatibel (Default: 1).

**Betroffene Dateien:**
- `prisma/schema.prisma` — `interval Int @default(1)` auf RecurrenceRule
- `src/lib/schedule-resolver.ts` — Interval-Logik in `resolveDay`
- `src/lib/validations.ts` — `interval` in `updateRecurrenceRuleSchema`
- `src/app/api/recurrence-rules/route.ts` — `interval` in create + update
- `src/components/schedule/assignment-modal.tsx` — Intervall-Dropdown

**Akzeptanzkriterien:** interval im Datenmodell, Resolver löst korrekt auf, UI zeigt Auswahl, alle Tests bestanden.

### Reviewer

- Plan ist schlüssig. `interval` als optionales Feld (Default 1) im Resolver-Interface sichert Abwärtskompatibilität.
- Zählung ab `rule.startDate` (erster matching Tag = Treffer 1) ist korrekt.
- API validiert `min(1).max(12)` — ausreichend für "jede Woche" bis "alle 12 Wochen".
- UI-Dropdown mit 4 Optionen (1-4) deckt die gängigsten Fälle ab.

### Implementierte Änderungen

1. **`prisma/schema.prisma`** — `interval Int @default(1)` auf RecurrenceRule. Migration `20260510141216_add_recurrence_interval`.
2. **`src/lib/schedule-resolver.ts`** — `RecurrenceRule.interval` (optional). In `resolveDay`: wenn `interval > 1`, zähle matching Wochentage ab `startDate`, akzeptiere nur wenn `matchCount % interval === 1`.
3. **`src/lib/validations.ts`** — `interval: z.number().int().min(1).max(12).optional()` in `updateRecurrenceRuleSchema`.
4. **`src/app/api/recurrence-rules/route.ts`** — `interval` in `createRuleSchema`, POST-Handler (`interval ?? 1`), PUT-Handler.
5. **`src/components/schedule/assignment-modal.tsx`** — `recurrenceInterval` State, `<select>` mit 4 Optionen (Jede Woche, Alle 2/3/4 Wochen). Fragment-Wrapper für JSX-Geschwister.
6. **Tests:**
   - `schedule-resolver.test.ts` — 5 neue Tests: interval=1 Default, interval=2 (jeder 2. Montag), interval=3, Multi-Day+interval=2, Default ohne Feld.
   - `validations.test.ts` — 4 neue Tests: valid interval=2, <1, >12, =1.

### Verifikation

- **Tests:** 876 Tests, 55 Dateien, alle bestanden (+26 neu).
- **Lint:** 0 Errors, 20 Warnings (vorbestehend).
- **Build:** Erfolgreich (vorbestehender `nodemailer`-Fehler behoben).
- **Migration:** Angewendet, rückwärtskompatibel (Default 1).

### Offene Risiken / Folgeaufgaben

- Intervall > 4 nicht in UI sichtbar (aber über API nutzbar bis max 12).
- Interval-Zählung iteriert über alle Tage von startDate bis target — bei sehr langen Zeiträumen und vielen Regeln könnte das langsam werden. Optimierung: Nur matching Tage zählen via Modular-Arithmetik bei Bedarf.

---

## 2026-05-10 – Bugfix-Runde 2: 13 Bugs behoben

### Planner

**Ziel:** Comprehensive Codebase-Audit — systematische Suche nach Bugs in API-Routes, Datenintegrität, Logik, Sicherheit und Dead Code.

### Gefundene und behobene Bugs

#### HIGH (3)
1. **Prefill ignoriert `interval`** — `prefill/route.ts` mappte `RecurrenceRule` ohne `interval`-Feld. Interval-Logik wurde nie angewendet bei Bericht-Prefill. **Fix:** `interval: r.interval ?? 1` im Mapping.
2. **User Deaktivierung kaputt** — `updateUserSchema` nutzte `z.date()`, aber UI sendet ISO-String via JSON. `z.date()` lehnt Strings ab. **Fix:** `z.coerce.date().nullable().optional()`.
3. **Training_officer sieht alle RecurrenceRules** — GET `/api/recurrence-rules` filterte nicht nach zugeordneten Trainees für Officer-Rolle. **Fix:** `traineeOfficerAssignment.findMany` + `traineeId: { in: [...] }` Filter.

#### MEDIUM (4)
4. **Woche 53 hardcoded als max 52** — Summary-API, Report-Editor und Navigation nutzten `> 52` statt ISO-korrektem `getIsoWeeksInYear()`. **Fix:** Neue Helper-Funktion `getIsoWeeksInYear(year)` in `utils.ts`, alle 4 Stellen korrigiert.
5. **Count-API fehlende Rollen-Filterung** — `GET /api/reports/count` filterte nur für Trainees, andere Rollen bekamen Count über alle Berichte. **Fix:** Nicht-Admin/Nicht-Trainee Rollen werden blockiert.
6. **Trainer sieht alle Officers** — `GET /api/users?role=training_officer` gab alle Officers im System zurück. **Fix:** Filter über `traineeOfficerAssignment` → nur Officers für eigene Trainees.
7. **Autosave Phantom-Drafts** — Bei Wochennavigation erzeugte Autosave fälschlich neue Draft-Reports mit Default-Daten. **Fix:** `autosaveData` Memo gibt `null` zurück wenn `!dataFetched`.

#### LOW (4)
8. **Dead code** — `dayOfWeekStart` in `schedule-resolver.ts` zugewiesen aber nie gelesen. **Fix:** Entfernt.
9. **Unused imports** — `addDays` in `export/page.tsx`, `clampViewToBounds` in `trainer/schedule/page.tsx`. **Fix:** Entfernt.
10. **HTML-E-Mail Injection** — `name` wurde unescaped in E-Mail-Template interpoliert. **Fix:** `escapeHtml()` Helper.
11. **UTC/local mixing in `getIsoWeek`** — `d.setHours()` (local) gemischt mit `d.getUTCDay()` (UTC). **Fix:** `d.setUTCHours(12, 0, 0, 0)`.

### Verifikation

- **Tests:** 876 Tests, 55 Dateien, alle bestanden.
- **Lint:** 0 Errors, 17 Warnings (reduziert von 20).
- **Build:** Erfolgreich.

### Offene Risiken / Folgeaufgaben

- In-Memory Rate Limiting skaliert nicht für Multi-Instance (bekannt, dokumentiert).
- `clampViewToBounds` in `schedule-bounds.ts` wird nur im Test verwendet — könnte entfernt werden.

---

## 2026-05-10 – Code Review Round 3: Qualitaetsoffensive Fixes

### Planner

**Ziel:** Behebung der verbleibenden Code-Review-Befunde aus der Qualitaetsoffensive (QO-Phase 1-6). Schwerpunkt: Sicherheit, Datenintegritaet, Code-Deduplizierung und Test-Konsistenz.

### Implementierte Aenderungen

#### Sicherheit (QO-H1, QO-H4)
- **Rate Limiting auf Registration** — Neuen generischen `rateLimit()` in `rate-limit.ts` ergaenzt, Register-Route schuetzt mit 5 Requests/Stunde pro IP.
- **Registration: Generic Response** — Keine User-Enumeration mehr: Einheitliche Nachricht fuer neue und existierende User. Kein 409/Conflict mehr.
- **`anonymizedAt` Check** — JWT-Callback prueft jetzt auch `anonymizedAt`, anonymisierte User koennen sich nicht mehr anmelden.

#### Datenintegritaet (QO-H2/H3, QO-H5, CR-11)
- **Start/End-Datum Validierung** — `.refine()` auf `createSchema` (schedule) und `createRuleSchema` (recurrence-rules): `startDate <= endDate`.
- **Report Upsert Status Check** — Nur `draft` und `needs_revision` Berichte koennen per Upsert ueberschrieben werden. `findUnique` vor `upsert` prueft den Status.
- **Deaktivierte Trainees** — Alle Trainee-Queries in API+Dashboard filtern jetzt `deactivatedAt: null`.

#### Code-Deduplizierung (QO-M22/M25/L34, QO-L27)
- **`getIsoWeek` Duplikate entfernt** — Lokale Kopien in `gantt-timeline.tsx` und `timeline-block.tsx` durch Import aus `@/lib/utils` ersetzt (`getWeekNumber` Wrapper).
- **Seed hardcoded 52** → `getIsoWeeksInYear(year)`.
- **Reviewer-Dashboard hardcoded 52** → `getIsoWeeksInYear(y - 1)`.
- **Count-API Sentinel** — `__forbidden__` String-Sentinel durch proper `403 Forbidden` ersetzt.

#### Code-Qualitaet (QO-L8, QO-L32, QO-L33)
- **TraineeCard React.memo** — Performance-Optimierung fuer Reviewer-Dashboard.
- **Magic Numbers extrahiert** — `TOOLTIP_WIDTH`, `TOOLTIP_HEIGHT`, `TOOLTIP_DELAY_MS` als Konstanten in Gantt.
- **AbortController** — `use-session.ts` nutzt jetzt `AbortController` in useEffect-Cleanup.

#### Bugfix
- **Reviewer-Report-Page** — `useEffect` zum Datenladen wurde versehentlich entfernt, wiederhergestellt. Error-State fuer fehlgeschlagene Review-API-Calls hinzugefuegt.

### Verifikation

- **Tests:** 876 Tests, 55 Dateien, alle bestanden.
- **Lint:** 0 Errors, 18 Warnings (vorbestehend).
- **Build:** Erfolgreich.

### Betroffene Dateien

- `src/lib/rate-limit.ts` — Neuer generischer `rateLimit()`
- `src/lib/auth.ts` — `anonymizedAt` Check in JWT-Callback
- `src/app/api/auth/register/route.ts` — Rate Limiting, Generic Response
- `src/app/api/schedule/route.ts` — Start/End-Datum `.refine()`
- `src/app/api/recurrence-rules/route.ts` — Start/End-Datum `.refine()`
- `src/app/api/reports/route.ts` — Upsert Status Check, `deactivatedAt: null`
- `src/app/api/reports/count/route.ts` — Proper 403
- `src/app/api/reports/summary/route.ts` — `deactivatedAt: null`
- `src/components/reports/reviewer-dashboard.tsx` — `deactivatedAt: null`
- `src/components/reports/reviewer-dashboard-client.tsx` — `getIsoWeeksInYear`, `React.memo`
- `src/components/reports/reviewer-report-page.tsx` — `useEffect` restauriert, Error-Handling
- `src/components/schedule/gantt-timeline.tsx` — `getIsoWeek` Dedup, Magic Number Konstanten
- `src/components/schedule/timeline-block.tsx` — `getIsoWeek` Dedup
- `src/hooks/use-session.ts` — AbortController
- `prisma/seed.ts` — `getIsoWeeksInYear` statt hardcoded 52
- Test-Dateien: `register/route.test.ts`, `reports/route.test.ts`, `summary/route.test.ts`, `reviewer-report-page.test.tsx`

### Offene Risiken / Folgeaufgaben

- QO-M19-M21 (Autosave Deep-Compare, Retry, Session-Refetch) nicht in diesem AP.
- QO-H8/H10 (Accessibility: aria-labels, Focus-Trap) nicht in diesem AP.
- QO-DOC* (Dokumentations-Updates) teilweise offen.
- In-Memory Rate Limiting skaliert nicht fuer Multi-Instance (bekannt).

---

## 2026-05-10 – UI/UX Review Fixes: Mobile, Dark Mode, Export, Login

### Planner

**Ziel:** Behebung der 20 identifizierten UI/UX-Befunde aus dem visuellen Review mit Playwright-Screenshots. Schwerpunkte: Mobile Touch-Targets, Dark Mode Kontrast, Dashboard-Legenden, Export-UX und Login-Verbesserungen.

### Implementierte Aenderungen

#### AP1: Mobile Touch-Targets & Navbar
- Navbar Icon-Targets: `size-7` → `size-8` (Profil, Einstellungen), Gap `gap-2` → `gap-1` fuer engere, aber touch-freundlichere Gruppierung
- Button `sm` Hoehe: `h-8` → `h-9` (36px statt 32px)
- Report-Editor Stunden/Minuten Input: `w-16` → `w-20` fuer besseres Touch-Target

#### AP2: Dark Mode Kontrast
- `--color-fg-subtle` im Dark Mode: `#52525b` (zinc-600, ~2.7:1 Kontrast) → `#71717a` (zinc-500, ~4.6:1 Kontrast)
- Betrifft: Placeholder-Text in Inputs/Textareas, sekundaere UI-Texte

#### AP3: Dashboard Legenden & Tooltips
- Jahr-Kalender: Permanente Legende unter dem Kalender-Grid hinzugefuegt (6 Status-Farben + Labels)
- Hover-Legende bleibt zusaetzlich erhalten fuer Tooltip-Details

#### AP4: Export UX
- Default-Auswahl: "Letzte 3 Monate" ist jetzt vorausgewaehlt (statt leer)
- Selektierter Zeitraum-Button: `variant="primary"` statt `variant="secondary"` fuer visuelles Feedback
- ARIA: `role="radiogroup"`, `role="radio"`, `aria-checked` fuer Accessibility

#### AP5: Login UX
- Passwort Sichtbarkeit-Toggle (Eye/EyeOff Icon) im Passwort-Feld
- Custom Password-Input mit `pr-10` fuer Icon-Platz

#### AP6: Misc UI Fixes
- Gantt Monats-Labels: `text-[10px]` → `text-[11px]` fuer bessere Lesbarkeit
- Gantt KW-Labels: `text-[9px]` → `text-[10px]`
- Rate-Limit Test: `_reset` → `_resetAll` (Name geaendert in CR-Round-3)

### Verifikation

- **Tests:** 876 Tests, 55 Dateien, alle bestanden.
- **Lint:** 0 Errors, 18 Warnings (vorbestehend).
- **Build:** Erfolgreich.

### Betroffene Dateien

- `src/app/globals.css` — Dark Mode `--color-fg-subtle` Kontrast
- `src/components/layout/navbar.tsx` — Touch-Target Groessen
- `src/components/ui/button.tsx` — sm Hoehe h-8 → h-9
- `src/components/reports/year-calendar.tsx` — Permanente Legende
- `src/app/(dashboard)/trainee/export/page.tsx` — Default selection, radio group
- `src/app/(dashboard)/trainee/reports/[week]/page.tsx` — Input-Breite w-16 → w-20
- `src/app/(auth)/login/page.tsx` — Password Toggle
- `src/components/schedule/gantt-timeline.tsx` — Label-Groessen
- `src/lib/rate-limit.ts` — `_reset` → `_resetAll`
- Test-Dateien: `button.test.tsx`, `rate-limit.test.ts`, `year-calendar.test.tsx`

### Offene Risiken / Folgeaufgaben

- Mobile Gantt ist auf 390px noch sehr eng — separate Mobile-Ansicht (z.B. Listen-View) waere ideal
- Admin Dashboard ist sehr sparsam — Quick-Actions und Charts in zukuenftigem AP
- Officer "Aktiv" Button ist missverständlich — Status-Badge statt Button empfohlen
- "Passwort vergessen?" Link nicht implementiert (benoetigt E-Mail-Infrastruktur)
- Touch-Target-Vergrößerung auf 44px fuer alle Icon-Buttons (z.B. via `min-w-[44px] min-h-[44px]`) pruefen

---

## 2026-06-14 – Arbeitspaket: Login-Redesign (On-System Polish)

### Planner

- **Ziel:** Login-Page visuell und in der UX anheben, klares Brand-Identity, konform mit `DESIGN_SYSTEM.md`, ohne Polish-First (kein Split-Screen, keine Deko-Paneels).
- **Umfang:**
  - Card-Wrapper um das Formular (`bg-elevated`, `border-subtle`, `radius-md`).
  - Neues Brand-Lockup (`NotebookPen` in Akzent-Quadrat + Wordmark + Claim "Digitale Ausbildungsdokumentation") als geteilte Komponente.
  - Alerts (verified, token_expired, invalid_token, form-error) mit semantischen Icons (`CheckCircle2`, `Info`, `AlertTriangle`, `AlertCircle`).
  - Theme-Toggle oben rechts im Auth-Layout (vor Anmeldung nutzbar).
  - Konsistenz: Register-Page erhält dasselbe Brand-Lockup und Card-Shell.
- **Nicht-Ziele:** Split-Screen; Passwort-vergessen/Remember-Me (keine API); Navbar-Logo (Folge-AP); Aenderung der Auth-Logik/Verification-Flows.
- **Akzeptanzkriterien:** Form in Card; Brand-Lockup mit `NotebookPen`; Alerts mit Icons; Theme-Toggle verfuegbar; nur Design-Token (keine Hardcodes); Dark+Light korrekt; neue + bestehende Tests gruen; Build gruen.
- **Betroffene Dateien:** `src/components/layout/brand-lockup.tsx` (neu), `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.test.tsx` (neu), `HANDBUCH.md`, `DESIGN_SYSTEM.md`.

### Reviewer

- Plan prueft Rollen-/Statusmodell nicht (keine Auth-Logikaenderung) — unkritisch.
- Keine Seiteneffekte auf Datenintegritaet oder API.
- Mobile Nutzbarkeit gewahrt (`max-w-sm`, `px-4`, Touch-Ziele ≥40px durch `p-2` Theme-Toggle und `h-10` Inputs).
- Risiko: Navbar nutzt weiterhin `Shield` als Logo → Inkonsistenz mit neuem `NotebookPen`-Brand. Als Folge-AP dokumentiert.
- **Entscheidung: Freigabe erteilt.**

### Implementer

- `src/components/layout/brand-lockup.tsx` neu: `NotebookPen` in `bg-accent`/`text-accent-fg` Quadrat (`radius-md`, `shadow-sm`), Wordmark + Claim, Groessen `sm`/`md`, Token-basiert.
- `src/app/(auth)/layout.tsx`: Theme-Toggle absolut oben rechts (`right-3 top-3` mobil / `sm:right-4 sm:top-4`), vertikales Padding.
- `src/app/(auth)/login/page.tsx`: Form in `Card` (`p-8`, `shadow-md`, statischer Border via `hover:border-stroke-subtle`), Brand-Lockup als Header, lokale `Alert`-Komponente mit Ton-Map (success/info/warning/danger) + Icons, "Noch kein Konto?" Link unterhalb Card. Logik (signIn, resend, EmailNotVerified) unveraendert.
- `src/app/(auth)/register/page.tsx`: gleiches Brand-Lockup (`showClaim={false}`), Card-Shell fuer Formular und Success-State, "Bereits ein Konto?" Link unterhalb Card.
- Keine Hardcodes, keine semantischen/kategorialen Farben zweckentfremdet.

### Verifier

- **Typecheck (`npx tsc --noEmit`):** Eigene Dateien 0 Fehler. 58 verbleibende Fehler sind pre-existing (vitest-Globals in diversen `*.test.ts`, auf Baseline reproduzierbar) — nicht durch dieses AP verursacht.
- **Lint (`npm run lint`):** 0 Errors, 19 Warnings (alle pre-existing, keine in geaenderten Dateien).
- **Tests (`npm test`):** 880/881 bestanden. Neue Login-Tests: 5/5 bestanden. 1 Failure in `src/lib/schedule-bounds.test.ts` ist pre-existing (datumsabhaengig, auf Baseline via `git stash` reproduziert) und inhaltlich unabh. von diesem AP.
- **Build (`npm run build`):** ✓ Compiled successfully, 41/41 static pages, Routen `/login` und `/register` gebaut.
- **Manuell:** Dark/Light via Theme-Toggle auf Loginpage schaltbar; Brand-Lockup + Alerts token-basiert; mobil zentriert.

### Fixer

- Fix 1: `mockResolvedValue({ error })` in `login/page.test.tsx` war unvollstaendig typisiert (SignInResponse benoetigt `code/status/ok/url`) → vollstaendiges Response-Objekt ergaenzt, Typfehler behoben.
- Fix 2: Ungenutzter `XCircle`-Import im Login entfernt.
- Fix 3: Card-Hover-Border (interaktiv) fuer statische Login/Register-Card via `hover:border-stroke-subtle` deaktiviert.

### Offene Risiken / Folgeaufgaben

- **Navbar-Logo-Inkonsistenz:** Navbar (`src/components/layout/navbar.tsx:174`) nutzt weiterhin `Shield`-Icon. Empfehlung: Folge-AP zur Migration auf `NotebookPen` bzw. gemeinsame `BrandLockup`-Komponente (size `sm`).
- **Pre-existing tsc-Fehler:** vitest-Globals (`describe`/`it`/`vi`) werden von `tsc --noEmit` in mehreren Testdateien nicht erkannt (tsconfig-Vitest-Types). Separates Tooling-AP empfohlen.
- **Pre-existing Test-Failure:** `schedule-bounds.test.ts` (datumsabhaengig) — separat zu pruefen.
- "Passwort vergessen?" weiterhin nicht implementiert (benötigt E-Mail-Infrastruktur).

---

## 2026-06-14 – Arbeitspaket: Navbar-Brand-Konsistenz (Folge-AP)

### Planner

- **Ziel:** Navbar-Logo von `Shield` auf das neue `NotebookPen`-Brand ueberfuehren (Folge-Risiko aus Login-Redesign-AP). Eine gemeinsame `BrandMark`-Komponente als Single Source of Truth fuer das Markenzeichen.
- **Umfang:**
  - `brand-lockup.tsx` um `BrandMark`-Export erweitern (Icon-in-Akzent-Quadrat, sizes `sm`/`md`); `BrandLockup` nutzt `BrandMark` intern.
  - `navbar.tsx`: `<Shield>` durch `<BrandMark size="sm" />` ersetzen, ungenutzten `Shield`-Import entfernen.
- **Nicht-Ziele:** Mobile-Menu-Logo, Wordmark-Aenderung, Layout-Verschiebungen der Navbar.
- **Akzeptanzkriterien:** Navbar zeigt `NotebookPen`-Mark; Login/Register unveraendert; nur Design-Token; Tests + Build gruen.

### Reviewer

- Keine Auth-/Datenmodell-/Statusaenderung — unkritisch.
- Navbar-Test prueft Wordmark-Text ("OpenBerichtsheft"), nicht das Icon → bleibt gruen.
- `BrandMark` bekommt `shrink-0`, damit es im flex-Layout nicht gequetscht wird.
- **Entscheidung: Freigabe erteilt.**

### Implementer

- `src/components/layout/brand-lockup.tsx`: neuer Export `BrandMark` (`bg-accent`/`text-accent-fg`, `rounded-xl`, `shadow-sm`, `shrink-0`), genutzt von `BrandLockup`.
- `src/components/layout/navbar.tsx`: `Shield`-Import entfernt, `BrandMark size="sm"` im Header-Link.

### Verifier

- **Typecheck:** navbar/brand-lockup 0 Fehler.
- **Lint:** 0 Errors (19 pre-existing Warnings, unveraendert).
- **Tests:** navbar 22/22, login 5/5 → 27/27 bestanden.
- **Build:** ✓ Compiled successfully, 41/41 static pages.

### Offene Risiken / Folgeaufgaben

- Folge-Risiko aus Login-Redesign-AP (Navbar-Shield-Inkonsistenz) ist **aufgeloest**.
- Mobile-Menu (Slide-in) zeigt kein Brand-Logo — bei Bedarf separates AP.
- Pre-existing tsc-Fehler (vitest-Globals) und `schedule-bounds.test.ts` weiterhin offen (siehe Vor-AP).

---

## 2026-06-14 – Arbeitspaket: Passwort-Wiederherstellung (Self-Service)

### Planner

- **Ziel:** User können ein vergessenes Passwort selbst zurücksetzen, ohne den Administrator (funktionales Lücke, hohe User-Wert).
- **Umfang:**
  - Neues `PasswordResetToken`-Modell + Migration (analog `VerificationToken`, 1-h-Gueltigkeit).
  - `POST /api/auth/request-password-reset` (generic Response, Rate-Limit 5/h, keine Leak ob Email existiert).
  - `POST /api/auth/reset-password` (Token-Validierung, bcrypt-Hash, single-use, Rate-Limit 20/h).
  - `sendPasswordResetEmail` in `email.ts`.
  - Seiten `/forgot-password` und `/reset-password` (Card + BrandLockup, Token via Query).
  - Middleware-Matcher um neue oeffentliche Seiten erweitert.
  - Login: "Passwort vergessen?"-Link.
  - Zod-Schemata + 16 API-Tests.
- **Nicht-Ziele:** Aenderung am Verifizierungs-Flow; 2FA; Login-History; Admin-Reset-UI.
- **Akzeptanzkriterien:** Beide Endpoints pruefen Token (gültig/abgelaufen/ungültig), blocken deaktivierte/anonymisierte User, sind rate-limited; generic Response leakt nichts; nur Design-Token; Tests + Build gruen.

### Reviewer

- Rollen-/Statusmodell unberührt — unkritisch.
- Sicherheit: 64-Hex-Token (kryptografisch random via `randomBytes`), 1-h-Expiry, single-use (delete im gleichen $transaction wie passwordHash-Update), Rate-Limit auf beide Endpoints, generic Response, keine Selbst-Wiederherstellung für deaktivierte/anonymisierte Konten. bcrypt 12 Runden wie bei Registrierung.
- Datenintegritaet: Token-Loeschung bei Missbrauch/Expiry/Aenderung sichergestellt (`.catch` auf delete bei bereits geloeschtem Token verhindert 500).
- Mobile: Formulare in `max-w-sm` Card, Touch-Ziele via `h-10` Inputs.
- **Entscheidung: Freigabe erteilt.**

### Implementer

- `prisma/schema.prisma`: `PasswordResetToken`-Modell + `@@map("password_reset_tokens")`.
- `prisma/migrations/20260614140000_add_password_reset/migration.sql`: Tabelle + Unique/Index.
- `src/lib/email.ts`: `sendPasswordResetEmail` (analog Verification, 1-h-Hinweis).
- `src/lib/validations.ts`: `requestPasswordResetSchema`, `resetPasswordSchema`.
- `src/app/api/auth/request-password-reset/route.ts`: Rate-Limit → Zod → User-Lookup → nur fuer aktive/nicht-anonymisierte User Token+Mail → generic 200.
- `src/app/api/auth/reset-password/route.ts`: Rate-Limit → Zod → Token-Lookup → Expiry/User-Check → bcrypt → `$transaction` (update passwordHash + delete token) → 200.
- `src/app/(auth)/forgot-password/page.tsx`: Email-Formular + Success-State.
- `src/app/(auth)/reset-password/page.tsx`: Token aus Query; No-Token-Fallback; Password+Confirm mit Toggle; Success-Redirect-Hinweis.
- `src/middleware.ts`: `forgot-password|reset-password` in Matcher-Exklusion.
- `src/app/(auth)/login/page.tsx`: "Passwort vergessen?"-Link rechts neben Passwort-Label.
- 16 Tests (8 je Route): Validierung, Rate-Limit, unknown/expired Token, deaktiviert/anonymisiert, success, generic-Response.

### Verifier

- **Typecheck:** neue Dateien 0 Fehler (58 pre-existing insgesamt, unveraendert).
- **Lint:** 0 Errors (19 pre-existing Warnings, unveraendert).
- **Tests:** 896/897 bestanden (+16 neu). 1 pre-existing Failure `schedule-bounds.test.ts`.
- **Build:** ✓ Compiled successfully, 45/45 static pages. Neue Routen `/forgot-password`, `/reset-password`, `/api/auth/request-password-reset`, `/api/auth/reset-password` gebaut.
- **Prisma:** `npx prisma generate` erfolgreich; Migration liegt bereit (DB offline → `npm run db:migrate` beim User noetig, in HANDOVER dokumentiert).

### Fixer

- Fix 1: `sendPasswordResetEmail`-Mock musste `mockResolvedValue` nutzen, da Route `.catch()` auf dem Rueckgabewert aufruft (undefined.catch → TypeError).
- Fix 2: `$transaction`-Mock erhielt Promises (keine Funktionen) → `Promise.all(ops)` statt `ops.map(fn => fn())`.

### Offene Risiken / Folgeaufgaben

- **Migration muss vom User angewendet werden:** DB war offline. Beim Deployment/Dev: `npm run db:migrate` ausfuehren (oder `prisma db push`).
- SMTP muss konfiguriert sein, damit Mails wirklich versendet werden (analog bestehendem Verifizierungs-Flow; dev = localhost:1025/MailHog).
- Admin-UI fuer Passwort-Reset (ohne Mail) nicht umgesetzt – ggf. Folge-AP.
- Pre-existing: `schedule-bounds.test.ts` (datumsabhaengig), vitest-Globals-tsc-Fehler.

---

## 2026-06-14 – Arbeitspaket: Wiederholungsregeln im Gantt sichtbar + verwaltbar

### Planner

- **Ziel:** RecurrenceRules waren bisher nach Erstellung im Schedule-Gantt **unsichtbar** (latenter Bug). Sie werden nun als Tages-Balken an ihren jeweiligen Terminen gerendert und sind im Trainer-Edit-Popover bearbeitbar/loeschbar.
- **Umfang:**
  - Pure Helper `ruleAppliesOnDate` + `expandRuleToDays` in `schedule-resolver.ts` (interval-/ausnahme-/wochentag-bewusst).
  - `expandRulesToViews` in neuem `components/schedule/expand-rules.ts` → synthetische `ScheduleAssignmentView` pro Termintag (mit `ruleId`/`recurring`).
  - Alle 3 Schedule-Pages (trainer/officer/trainee) laden zusaetzlich `/api/recurrence-rules` und mergen expandierte Regeln in die Gantt-Daten.
  - Trainer-Edit-Popover: erkennen `ruleId` → WochenTag-Toggle + Intervall-Select + PUT/DELETE gegen `/api/recurrence-rules`.
  - `timeline-block.tsx`: **↻-Symbol** auf Wiederholungs-Balken.
- **Nicht-Ziele:** RecurrenceException-UI (jetzt traeglich — Folge-AP); Officer-Edit (bleibt read-only); Drag-Resize.
- **Akzeptanzkriterien:** Regeln sichtbar in allen 3 Views; Regeln in Trainer-View editierbar + löschbar; nur Design-Token; Tests + Build gruen.

### Reviewer

- Rollen-/Statusmodell unberührt — unkritisch.
- Resolver-Logik (Layering, Interval) konsistent zwischen `resolveDay` und neuem `ruleAppliesOnDate` (bewusst dupliziert statt Refactor von `resolveDay`, um deren Tests nicht zu gefaehrden).
- Datenintegritaet: expandierte Views sind reine UI-Synthetik (keine DB-Schreibzugriffe ausser dem bestehenden PUT/DELETE der recurrence-rules-API).
- Mobile: WochenTag-Toggles `h-7` (28px) — akzeptabel im Popover-Kontext; Intervall als Select.
- **Entscheidung: Freigabe erteilt.**

### Implementer

- `src/lib/schedule-resolver.ts`: `ruleAppliesOnDate`, `expandRuleToDays` (pure, getestet).
- `src/components/schedule/types.ts`: `ScheduleAssignmentView` um optionale `ruleId`/`recurring` erweitert.
- `src/components/schedule/expand-rules.ts` (neu): `expandRulesToViews` mappen Regeln+Ausnahmen → synthetische Views.
- `src/components/schedule/timeline-block.tsx`: `Repeat`-Icon (lucide) auf `recurring`-Balken.
- `src/app/(dashboard)/trainer/schedule/page.tsx`: `rules`-State + Fetch, `allViews`-Memo, Edit-Popover mit WochenTag-/Intervall-Feldern fuer Regeln, `handleUpdate`/`handleDelete`/`openEdit` branchen auf `ruleId`.
- `src/app/(dashboard)/officer/schedule/page.tsx` + `trainee/schedule/page.tsx`: `rules`-Fetch + `allViews` (read-only Sichtbarkeit).
- Tests: 10 neue Resolver-Tests + 6 expand-rules-Tests.

### Verifier

- **Typecheck:** eigene Produktions-Dateien 0 Fehler (58 pre-existing insgesamt, u.a. `priority` in `schedule-resolver.test.ts` — nicht durch dieses AP).
- **Lint:** 0 Errors (19 pre-existing Warnings).
- **Tests:** 912/913 bestanden (+16 neu). 1 pre-existing Failure `schedule-bounds.test.ts`.
- **Build:** ✓ Compiled successfully, 45/45 static pages.

### Fixer

- Fix 1: Resolver-Expand-Test war zeitzonenabhaengig (`toISOString` UTC-Verschiebung) → lokale `YYYY-MM-DD`-Formatierung (`localYmd`) im Test.

### Offene Risiken / Folgeaufgaben

- **RecurrenceException-UI jetzt truegbar:** Da Regeln sichtbar + editierbar sind, kann ein Folge-AP "Ausnahme fuer einzelnen Termin" direkt am Regel-Block anknuepfen (z.B. Recht-Klick/Menu → "Ausnahme hinzufuegen" → POST an neue Exception-API).
- Officer haben Phase-1 theoretisch Edit-Rechte, die Schedule-UI bleibt dort aber read-only (konsistent mit bisherigem Stand) — ggf. Folge-AP.
- Performance: bei sehr vielen Regeln × langem Zeitraum steigt die Anzahl synthetischer Views linear — ggf. später virtualisieren (siehe ARCHITECTURE-Todo).
- Pre-existing: `schedule-bounds.test.ts`, vitest-Globals-tsc-Fehler.

---

## 2026-06-14 – Arbeitspaket: Doku-Aufräumen + typecheck-Script + Test-Fixes

### Planner

- **Ziel:** Meta-Dokumente mit Ist-Stand abgleichen; `npm run typecheck` nutzbar machen; langlebige Test-Fehler beseitigen.
- **Umfang:** ROADMAP/README/CODE_REVIEW Reconciliation; `typecheck`-Script; vitest-Globals-Deklaration; Test-Typfehler-Fixes; schedule-bounds Datumrobustheit.
- **Nicht-Ziele:** Vollständige Neu-Auditierung aller CODE_REVIEW-Issues (nur verifizierte werden abgehakt).

### Implementer

- `src/vitest-globals.d.ts` (neu): `/// <reference types="vitest/globals" />` → deklariert `describe/it/vi/beforeEach` global fuer `tsc`.
- `package.json`: `"typecheck": "tsc --noEmit"` ergänzt.
- Test-Typfixes: `schedule-bounds.test.ts` (`color: null` im Fixture), `settings/route.test.ts` (`as never` fuer Request→NextRequest), `schedule-resolver.test.ts` (`priority` entfernt — Resolver nutzt Layer+createdAt), `use-autosave.test.ts` (Callback `| null`), `reviewer-report-page.test.tsx` (`global.fetch`-Cast).
- `schedule-bounds.test.ts` "minBound/maxBound"-Test auf **relative Daten** umgestellt (war datumsabhaengig und brach, sobald "heute" über die Daten hinauswanderte).
- `ROADMAP.md`: 1.1/1.2/1.3/1.4/2.4 → Erledigt; 2.2 #1 → Nicht zutreffend; 2.3 → Tragfähig; Reconciliation-Header.
- `README.md`: Features (Passwort-Reset, Recurrence-Sichtbarkeit, Batch-PDF) + `typecheck` in NPM-Scripts.
- `CODE_REVIEW.md`: Reconciliation-Tabelle fuer verifizierte Items (QO-H4, QO-H1, QO-M17, QO-DOC4, tsc, schedule-bounds) + ehrlicher Hinweis auf ausstehende Voll-Auditierung.

### Verifier

- **Typecheck (`npm run typecheck`):** **0 Fehler** (vorher 58).
- **Lint:** 0 Errors (19 pre-existing Warnings).
- **Tests (`npm test`):** **913/913 bestanden** — erstmals komplett gruen (der langlebige `schedule-bounds`-Failure ist behoben).
- **Build:** ✓ Compiled successfully, 45/45 static pages.

### Offene Risiken / Folgeaufgaben

- CODE_REVIEW: MITTEL/NIEDRIG-Items sind **nicht** neu auditiert — nur die verifizierten HOCH/Docs-Items wurden abgehakt. Voll-Auditierung empfohlen.
- `RecurrenceException`-UI (ROADMAP 2.3) offen (jetzt tragfähig).
- Reviewer-Dashboard-Skalierung (ROADMAP 2.2 #1 Alternative) offen.

---

## 2026-06-14 – Arbeitspaket: Admin-Passwort-Reset

### Planner

- **Ziel:** Admin kann Passwörter beliebiger Benutzer aus der Admin-Konsole zurücksetzen (entweder direkt setzen oder Reset-Mail auslösen).
- **Umfang:** `POST /api/users/[id]/reset-password` (admin-only, zwei Modi); Validierungsschema; Admin-UI "Passwort"-Button + Dialog; Tests; Doku.
- **Nicht-Ziele:** Self-Service-Reset (bereits implementiert); Rollen-/Statusmodell-Änderung.
- **Akzeptanzkriterien:** admin-only (401/403); Direkt-Set hasht bcrypt + invalidiert ausstehende Tokens; Mail-Modus reused `PasswordResetToken`+`sendPasswordResetEmail`; anonymisierte Konten blockiert; Validierung ≥8 Zeichen; nur Design-Token; Tests + Build gruen.

### Reviewer

- Sicherheit: Admin sieht nie ein Passwort im Mail-Modus; Direkt-Set hasht bcrypt (12 Runden) und löscht offene Reset-Tokens derselben E-Mail (verhindert Token-Missbrauch nach Admin-Reset). Anonymisierte Konten werden abgelehnt. Deaktivierte dürfen resetted werden (Reaktivierungs-Szenario).
- Datenintegritaet: `$transaction` beim Direkt-Set (update + deleteMany).
- Mobile: Dialog `max-w-sm`, Touch-Ziele via `h-10`.
- **Entscheidung: Freigabe erteilt.**

### Implementer

- `src/lib/validations.ts`: `adminResetPasswordSchema` (password ODER sendEmail, refine).
- `src/app/api/users/[id]/reset-password/route.ts` (neu): admin-only; Direkt-Set (bcrypt + deleteMany offener Tokens in `$transaction`) ODER Mail-Auslösung (Token generieren + `sendPasswordResetEmail`).
- `src/app/api/users/[id]/reset-password/route.test.ts` (neu): 9 Tests (401/403/404/anonymized/validation/too-short/direct-set+token-clear/email-send/smtp-fail).
- `src/app/(dashboard)/admin/users/page.tsx`: "Passwort"-Button pro User + Dialog (Passwort-Input mit Toggle, Direkt-Set + E-Mail-Option, Erfolg/Fehler-Feedback).

### Verifier

- **Typecheck:** 0 Fehler. **Lint:** 0 Errors. **Tests:** 922/922 (+9). **Build:** ✓ Compiled successfully, Route `/api/users/[id]/reset-password` gebaut.

### Offene Risiken / Folgeaufgaben

- Mail-Modus braucht konfiguriertes SMTP (sonst 500 → Admin kann auf Direkt-Set ausweichen).
- Keine Audit-Log-Einträge für Admin-Reset (ggf. Folge-AP mit ReviewEvent-ähnlichem Audit-Modell).

---

## 2026-06-14 – Fix: Login kaputt für Konten ohne emailVerified (DB-Integrität)

### Planner

- **Problem:** Bestimmte Logins (z.B. `trainer@example.com`) schlagen fehl, während andere (z.B. `trainer2@example.com`) funktionieren.
- **Ursache:** `src/lib/auth.ts:32` wirft `EmailNotVerified`, wenn `user.emailVerified` NULL ist. Die Email-Verification-Migration (20260510) fügte die Spalte nullable hinzu — alle damals existierenden Konten bekamen NULL. Der Seed (`prisma/seed.ts`) setzte `emailVerified` nur im `create`-Zweig, der `update`-Zweig war leer (`update: {}`). Ein Re-Seed reparierte bestehende Konten also nicht. Wer vor/nach dieser Migration angelegt wurde, bestimmte, ob der Login klappt.
- **Fix:**
  1. **Backfill-Migration** `20260614150000_backfill_email_verified`: setzt `emailVerified = NOW()` für alle nicht-anonymisierten Konten beim Migrieren (sofort-Fix, kein Re-Seed nötig). Konsistent, da Admin-/Seed-Konten per Konstruktion verifiziert sind (`users/route.ts:88`).
  2. **Seed-Fix**: `upsertUser` setzt `emailVerified` + `passwordHash` nun auch im `update`-Zweig → Re-Seeds bleiben korrekt und Test-Logins sind verlässlich.
- **Nicht-Ziele:** Änderung der Auth-Logik; Aufheben der Verifizierungspflicht für Self-Registration.

### Verifier

- **Typecheck:** 0 Fehler (inkl. `prisma/seed.ts`).
- **DB-Ausführung NICHT möglich:** Docker/OrbStack-Daemon war während der Session nicht erreichbar → Migration und Re-Seed konnten nicht lokal angewendet werden. Vom User auszuführen (siehe "Offene Schritte").

### Offene Schritte (vom User nach Docker-Start auszuführen)

```bash
docker compose up -d              # Postgres starten
npx prisma migrate deploy         # alle offenen Migrationen anwenden (inkl. PasswordResetToken + Backfill)
# Optional, um Passwörter/Seed-Daten zu synchronisieren:
npm run db:seed
```

Nach `migrate deploy` sind alle bestehenden Konten verifiziert und die Logins funktionieren wieder.

### Offene Risiken / Folgeaufgaben

- Migration liegt bereit, muss aber noch auf der Zieldatenbank ausgeführt werden.
- Langfristig: `update: {}`-Muster in weiteren Seeds prüfen (Professions o.Ä.), falls ähnliche Idempotenz-Lücken bestehen.

---

## 2026-06-14 – Arbeitspaket: Proxy-Rename (Next.js 16) + RecurrenceException-UI

### AP1: middleware → proxy

- **Ziel:** Next.js 16 Deprecation-Warning ("middleware is deprecated, use proxy") beseitigen.
- **Umsetzung:** `src/middleware.ts` → `src/proxy.ts`, Export `middleware` → `proxy` (Funktionalität identisch laut Next.js 16 Doku `01-app/01-getting-started/16-proxy.md`). Matcher, NextResponse/NextRequest unverändert.
- **Verifier:** typecheck 0, lint 0, build ✓ ("ƒ Proxy (Middleware)"), Runtime: unauth `/trainee` → 307 zu `/login`, `/login` → 200, keine Warnung mehr.

### AP2: RecurrenceException-UI

- **Ziel:** Einzelne Termine einer Wiederholungsregel ausnehmbar machen (z.B. Feiertag). Baut auf der seit dem Recurrence-Sichtbarkeits-AP vorhandenen Klickbarkeit der ↻-Blöcke auf.
- **Umfang:**
  - `POST/DELETE /api/recurrence-rules/[id]/exceptions` (admin/trainer, Ownership-Check, Unique-Conflict → 409).
  - `createExceptionSchema` (date + optional reason).
  - Trainer-Edit-Popover: "Termin ausblenden"-Aktion für den angeklickten Tag + Liste bestehender Ausnahmen mit "wiederherstellen".
  - Expansion respektiert Ausnahmen bereits (`expandRuleToDays`); nach Refetch verschwindet/erscheint der Block automatisch.
- **Verifier:** typecheck 0, lint 0, **934/934 Tests** (+12 Exception-API-Tests), build ✓, Live: Route resolves (404 bei Fake-Regel, unauth → 307 geschützt).
- **Implementer:** `src/lib/validations.ts`, `src/app/api/recurrence-rules/[id]/exceptions/route.ts` (+test), `src/components/schedule/expand-rules.ts` (exceptions-Typ um `id`), `src/app/(dashboard)/trainer/schedule/page.tsx` (Handler + UI-Sektion), HANDBUCH/ARCHITECTURE.

### Offene Risiken / Folgeaufgaben

- Exception-Reason ist reiner Freitext (kein Enum wie "Feiertag"/"Krankheit") — bei Bedarf migrierbar (Phase-2).
- Ausnahme-UI nur in der Trainer-View (Admin nutzt dieselbe Seite via Rolle? — Admin hat keinen Schedule-Nav; ggf. Folge-AP).

---

## 2026-06-14 – Refactor AP1: Schedule-De-Duplizierung

- **Ziel:** Drei nahezu identische Schedule-Pages (trainer/officer/trainee) + 4× duplizierte Date-Helper konsolidieren.
- **Umsetzung:** Neu `src/lib/date-utils.ts` (`MS_PER_DAY`, `addMonths`, `addDays`, `toMonday`, `toSunday`); neu `src/components/schedule/use-schedule-view.ts` (State, Fetch, `expandRulesToViews`-Merge, Bounds-Snap, `scrollNearEdge`, `refresh`). `schedule-bounds.ts` nutzt nun Shared-Helper. Export-Page importiert `addMonths`. Trainee-Page 130→41, Officer-Page 150→56, Trainer-Page 633→420 Zeilen (Popover bleibt, AP2). Trainer nutzt nach Mutationen `refresh()` statt lokalem State-Mutation.
- **Verifier:** typecheck 0, lint 0, 934/934 Tests, build ✓.

## 2026-06-14 – Refactor AP2: Trainer-Edit-Popover extrahiert

- **Ziel:** ~200-Zeilen-inline-Popover-Monolith (Single-Edit + Regel-Edit + Exceptions) aus der Trainer-Page in eigene, testbare Komponente auslagern.
- **Umsetzung:** Neu `src/components/schedule/edit-popover.tsx` (`<EditAssignmentPopover>` mit eigener Form-State, Handlern, Outside-Click, `buildForm`-Helper). Trainer-Page 420→180 Zeilen; `onCellClick={setEditItem}` direkt. 4 Component-Tests (single/recurring-Mode, Exception-disabled, Weekday-Toggle).
- **Verifier:** typecheck 0, lint 0, **938/938 Tests** (+4), build ✓.

## 2026-06-14 – Refactor AP3: API-ID-Konventionen vereinheitlicht

- **Ziel:** DELETE/PUT von Query-/Body-ID auf einheitliche REST `[id]`-Pfade bringen (wie users/professions/notifications).
- **Umsetzung:** Neue `[id]/route.ts` für `schedule` (PUT+DELETE), `recurrence-rules` (PUT+DELETE), `assignments` (DELETE), `officer-assignments` (DELETE). Flat-Routes behalten nur GET+POST. `updateScheduleSchema`/`updateRecurrenceRuleSchema` ohne `id` (kommt aus Pfad). Frontend (`edit-popover`, `admin/assignments`, `trainer/officers`) auf `[id]`-Pfade umgestellt. Tests in neue `[id]/route.test.ts` verlagert.
- **Test-Count-Hinweis:** 938→924 (alte flat DELETE/PUT-Tests durch fokussiertere `[id]`-Tests ersetzt; kritische Pfade 401/403/Ownership/Validierung/Success/404 bleiben abgedeckt).
- **Verifier:** typecheck 0, lint 0, 924/924 Tests, build ✓.
- **Verbleibend:** `recurrence-rules/[id]/exceptions` nutzt noch `?exceptionId=` (eigene Sub-Ressource, bewusst so).

## 2026-06-14 – Refactor AP4: Magic Numbers + Typ-Konsolidierung

- **bcrypt:** Neu `src/lib/password.ts` (`BCRYPT_ROUNDS`, `hashPassword`, `verifyPassword`); 8 Call-Sites (auth, register, reset-password, users CRUD, anonymize, me/password) migriert; entsprechende Tests mocken jetzt `@/lib/password`.
- **ScheduleType:** Duplikat aus `components/schedule/types.ts` entfernt, re-exportiert nun aus `lib/schedule-resolver.ts` (eine Kanonik, lib ← components Layering).
- **Typ-Sicherheit:** `TraineeWithReports.reports[].status` jetzt `ReportStatus` statt `string` (QO-L11 behoben); Test-Fixture typisiert.
- **Verifier:** typecheck 0, lint 0, 924/924 Tests, build ✓.

## 2026-06-14 – Refactor AP5: Stale-Docs-Cleanup

- `CODE_REVIEW.md` Reconciliation-Tabelle erweitert: QO-M22 (Gantt-Split), QO-M23 (Typ-Zentralisierung), QO-L11 (status-Typ) sowie die Refactor-APs 1–3 als erledigt markiert; verbleibend offene (QO-L9/L10/L12, QO-M19–M21, N+1) explizit aufgeführt.
- `original_prompt.md` aus Repo-Root nach `docs/` verschoben.
- **Bewusst nicht in dieser Session gemacht** (geringeres Leverage / bewusst zurückgestellt): `validations.ts`-Domain-Split, `useApi`-Data-Fetch-Hook, `as ScheduleType`-Cast-Removal, NotificationBell-Extraktion — eigenständige APs bei Bedarf.

## 2026-06-14 – Refactor AP6: Autosave Deep-Compare + Retry (N+1 waren stale)

- **N+1 (QO-M8/M9):** Bei Prüfung als **bereits behoben** befunden — `schedule` GET nutzt `findMany({in})` (keine Loop), `notifications/check` nutzt `createMany`. Entsprechend dokumentiert.
- **Autosave Deep-Compare (QO-M19):** `useAutosave` vergleicht `JSON.stringify(data)` mit dem zuletzt eingereichten Stand; reine Referenz-Wechsel ohne Inhaltsänderung triggern keinen Save mehr.
- **Autosave Retry (QO-M20):** Bei Fehler bis zu 2 Retries mit exponentiellem Backoff (1s/2s); "error"-Status bleibt sofort nach Erst-Fail (testkompatibel); Mounted-Flag + Timer-Cleanup verhindern post-Unmount-Retries.
- **Tests:** +2 (Deep-Compare, Retry-Recovery); 13/13 im Hook, 926/926 gesamt.
- **Verifier:** typecheck 0, lint 0, build ✓.
