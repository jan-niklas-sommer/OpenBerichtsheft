# Code Review – OpenBerichtsheft

## Reconciliation-Stand 2026-06-14

Diese Review stammt vom **2026-05-10**. Seitdem sind zahlreiche Issues durch Folge-Commits (Code-Review-Runden, UI/UX-Fixes, Login-/Auth-APs) erledigt worden, ohne dass die Tabelle unten aktuell gehalten wurde. Bei der Durchsicht am 2026-06-14 **verifiziert erledigt**:

| Issue | Status | Nachweis |
|-------|--------|---------|
| QO-H4 (CRON_SECRET-Bypass) | Erledigt | `notifications/check/route.ts` |
| QO-H1 (Rate Limiting) | Erledigt | `src/lib/rate-limit.ts` aktiv |
| QO-H8 (aria-labels) | Erledigt | Icon-Buttons + Edit-Popover haben aria-labels |
| QO-H9 (fehllende Tests recurrence-rules/prefill) | Erledigt | recurrence-rules + exceptions + [id] vollständig getestet |
| QO-H10 (Modal Focus-Trap) | Erledigt | AssignmentModal + EditAssignmentPopover (role=dialog/Focus-Trap/ESC) |
| QO-M8/M9 (N+1) | Erledigt | schedule `findMany({in})`, notifications `createMany` |
| QO-M17 (cn twMerge) | Erledigt | `src/lib/utils.ts` |
| QO-M22 (Gantt 578 Zeilen) | Erledigt | aufgeteilt in TimelineBlock/Tooltip/useDragScroll |
| QO-M23 (TraineeWithReports dupliziert) | Erledigt | zentral in `src/types/index.ts` |
| QO-M19/M20 (Autosave Deep-Compare/Retry) | Erledigt | `use-autosave.ts` + reset() gegen Phantom-Saves |
| QO-L9 (as ScheduleType casts) | Erledigt | `isScheduleType`-Guard |
| QO-L11 (status: string) | Erledigt | `TraineeWithReports.reports[].status: ReportStatus` |
| QO-L12 (NotificationBell eigene Datei) | Erledigt | `src/components/layout/notification-bell.tsx` |
| QO-L31 (Cross-File-Test-Duplizierung) | Erledigt | check-Tests dediziert in `check/route.test.ts` |
| QO-DOC4 (Next.js-Version) | Erledigt | ARCHITECTURE.md 16.x |
| tsc-Fehler / schedule-bounds / API-Konvention / Schedule-Dup / Popover-Monolith / bcrypt-Streuung | Erledigt | Refactor-Offensive 2026-06-14 (siehe HANDOVER) |
| Full-Review 2026-06-14: C1 (Token-Race), C2 (Exception-Cross-Regel), C3 (Cron-Auth), C4 (Popover-Close), H1 (Doppel-Fetch), H2 (Autosave-Hash), H3 (Phantom-Save), H4/H5 (Hook/Password-Tests), H6 (Role-Cache), H7 (stale Helper), H8 (Ownership=Profession), M2 (Export-TZ), M4 (users 404), M5 (Officer-403-Tests), M6 (Popover-A11y), M7 (Timeline-Keyboard), M8 (404/403), M9 (displayLabel), L1 (Exception-[exceptionId]), L2 (Dead Code), L3/L4 (Token-Invalidierung/Transaktionen), L8 (Konflikt-Logik extrahiert+getestet) | Erledigt | Alle Critical/High/Medium aus dem Full-Review behoben (siehe HANDOVER 2026-06-14) |

> **Noch offen (bewusst zurückgestellt — geringes Leverage / architektonisch):** QO-L10 (`NavbarProps.role: string` statt Role-Enum — kosmetisch), M1 (notifications/check Jahreswechsel-Logik — funktioniert, Rewrite riskant), M3 (users PUT Mass-Assignment — admin-only, alle Schema-Felder intendiert), L5 (prefill reportType-Check + totes Promise.all-Element), L6 (Datumsformat YYYY-MM-DD vs ISO — brittel aber funktioniert), L7 (drag-scroll setTimeout-Race — theoretisch).

---

## Review-Historie

| Datum | Review | Basis |
|-------|--------|-------|
| 2026-05-07 | Initial-Review | Commit 887f445 (MVP) |
| 2026-05-10 | **Qualitätsoffensive** | Stand nach PR #58-#73, 700 Tests |

---

## Qualitätsoffensive – 2026-05-10

### Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| **Hoch** | 10 |
| **Mittel** | 28 |
| **Niedrig** | 35 |

### Alte Issues – Aufloesungsstatus

Folgende Issues aus dem Initial-Review (2026-05-07) wurden **behoben**:

| Issue | Beschreibung | Behoben in |
|-------|-------------|-----------|
| #7 | PUT ohne Eingabevalidierung | Code-Review-Fixes AP |
| #11 | Nicht-transaktionaler Submit | Code-Review-Fixes AP |
| #14 | Nicht-transaktionaler Review | Code-Review-Fixes AP |
| #26 | Officer-Assignment DELETE Ownership | Code-Review-Fixes AP |
| #35 | statusVariant dreifach dupliziert | Code-Review-Fixes AP |
| #37 | Submit schlägt fehl bei neuen Berichten | Code-Review-Fixes AP |
| #52/#53 | Dashboard-Duplizierung entfernt | Design-System APs |
| #63 | Side Effect waehrend Render (ThemeProvider) | Code-Review-Fixes AP |
| #68 | Autosave Race Condition | Code-Review-Fixes AP |
| #72 | JWT-Rolle wird nie aktualisiert | Code-Review-Fixes AP |
| #82 | ReviewEvent onDelete Cascade | Code-Review-Fixes AP |
| #85 | Kein Soft Delete fuer WeeklyReports | Code-Review-Fixes AP |
| #88 | date-fns installiert aber nicht genutzt | Code-Review-Fixes AP |
| #90 | Kein Middleware-Auth-Guard | Code-Review-Fixes AP |
| #89 | Keine Security Headers | Code-Review-Fixes AP |
| #93 | Kein CSRF-Schutz | Code-Review-Fixes AP |

Folgende Issues aus dem Initial-Review sind **weiterhin offen**:

| Issue | Beschreibung | Status |
|-------|-------------|--------|
| #1 | Keine Paginierung auf GET /api/reports | Offen |
| #4 | Upsert mit deleteMany + create nicht atomar | Offen |
| #10 | TOCTOU Race Condition bei PUT | Teilweise behoben (Transactions) |
| #30 | Kein Rate Limiting auf Login | Offen |
| #39 | Report-Editor zu groß | Offen |
| #40 | Hartkodierte 52-Wochen-Grenze | Offen |
| #44 | Wochen-Navigation verwirft ungespeicherte Aenderungen | Offen |
| #51 | Kein Fehler-Feedback bei Review | Offen |
| #55 | handleToggleActive sendet Date-Objekt | Unbekannt |
| #79 | Manuelle ISO-Woche-Berechnung | Teilweise behoben |

---

## Neue Befunde – Qualitaetsoffensive 2026-05-10

---

### HOCH (10)

#### QO-H1 – Kein Rate Limiting auf irgendeinem Endpunkt

- **Dateien:** Alle `src/app/api/**/route.ts`
- **Kategorie:** Sicherheit
- **Beschreibung:** Kein einziges Rate Limiting implementiert. Login-Endpunkt ist gegen Brute-Force-Angriffe ungeschuetzt (TODO in `src/lib/auth.ts:16` bestaetigt). PDF-Generierung ist CPU-intensiv und kann fuer DoS missbraucht werden.
- **Fix:** Serverseitiges Rate Limiting (z.B. `rate-limiter-flexible` oder Upstash). Mindestens Login, PDF-Export und POST-Routen absichern.

#### QO-H2 – Fehlende Zod-Validierung auf PUT `/api/schedule`

- **Datei:** `src/app/api/schedule/route.ts:217-234`
- **Kategorie:** Sicherheit
- **Beschreibung:** PUT-Body wird manuell destrukturiert ohne Zod-Schema. `scheduleType`-Werte werden nicht gegen das Enum validiert, Datumsstrings ungueltig. Beliebige Felder koennen uebergeben werden.
- **Fix:** `updateScheduleSchema` mit Zod erstellen und anwenden, analog zu `updateReportSchema`.

#### QO-H3 – Fehlende Zod-Validierung auf PUT `/api/recurrence-rules`

- **Datei:** `src/app/api/recurrence-rules/route.ts:145-167`
- **Kategorie:** Sicherheit
- **Beschreibung:** Gleiche Problematik wie QO-H2. PUT-Body ohne Schema-Validierung.
- **Fix:** `updateRecurrenceRuleSchema` mit Zod erstellen.

#### QO-H4 – CRON_SECRET-Bypass wenn ENV-Var nicht gesetzt

- **Datei:** `src/app/api/notifications/check/route.ts:13`
- **Kategorie:** Sicherheit
- **Beschreibung:** `if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET)` – wenn `CRON_SECRET` nicht in der Environment gesetzt ist, wird die Pruefung komplett uebersprungen. Jeder Admin kann Notifications triggern.
- **Fix:** `if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET)` – Fehler werfen wenn ENV-Var fehlt.

#### QO-H5 – officerAssignmentSchema validiert validUntil > validFrom nicht

- **Datei:** `src/lib/validations.ts:73-78`, `prisma/schema.prisma:112-113`
- **Kategorie:** Datenintegritaet
- **Beschreibung:** Weder Zod-Schema noch DB-Constraint verhindern `validUntil < validFrom`. Logisch ungueltige Zeitspannen koennen erstellt werden.
- **Fix:** `.refine(data => new Date(data.validUntil) > new Date(data.validFrom))` im Schema. DB-Seite via Application-Layer.

#### QO-H6 – DB-Query bei JEDEM JWT-Refresh

- **Datei:** `src/lib/auth.ts:41-54`
- **Kategorie:** Performance
- **Beschreibung:** Der `jwt`-Callback ruft `prisma.user.findUnique` bei jedem Request auf, um die Rolle zu aktualisieren. Bei haeufigen API-Calls (Autosave, Session-Polling) ist das ein signifikanter Flaschenhals.
- **Fix:** Rolle im JWT cachen und nur periodisch (z.B. alle 5 Minuten) oder bei expliziter Rollenänderung erneuern.

#### QO-H7 – ReviewAction.withdrawn ohne korrespondierenden ReportStatus

- **Datei:** `prisma/schema.prisma:36` vs `prisma/schema.prisma:32-40`
- **Kategorie:** Datenintegritaet
- **Beschreibung:** `ReviewAction`-Enum enthaelt `withdrawn`, aber `ReportStatus` hat keinen `withdrawn`-Wert. Ein Bericht kann per ReviewEvent "withdrawn" werden, aber sein Status-Feld kann diesen Zustand nicht darstellen.
- **Fix:** Entweder `withdrawn` aus `ReviewAction` entfernen oder `withdrawn` zu `ReportStatus` hinzufuegen.

#### QO-H8 – Accessibility: 7 fehlende aria-labels, 5 fehlende Formular-Labels

- **Dateien:** `navbar.tsx:131,199,212`, `reviewer-dashboard-client.tsx:243-245`, `report-calendar.tsx:67-75`, `assignment-modal.tsx:190-299`
- **Kategorie:** Accessibility
- **Beschreibung:** Icon-only Buttons ohne `aria-label` (Logout, Filter, Monatsnavigation). Assignment-Modal hat 5 Formularfelder ohne `<label>`.
- **Fix:** `aria-label` auf allen Icon-Buttons. `<label htmlFor>` auf allen Formularfeldern.

#### QO-H9 – Fehlende Tests fuer 2 API-Routen + 4 Komponenten

- **Dateien:** `src/app/api/recurrence-rules/route.ts` (208 Zeilen), `src/app/api/reports/prefill/route.ts` (84 Zeilen)
- **Kategorie:** Testabdeckung
- **Beschreibung:** `recurrence-rules` hat GET/POST/PUT/DELETE ohne einzige Testdatei. `prefill` hat GET ohne Tests. Komponenten ohne Tests: `calendar.tsx`, `popover.tsx`, `date-picker.tsx`, `assignment-modal.tsx`.
- **Fix:** Testdateien erstellen. Mindestens Auth, Validierung und Erfolgsfall abdecken.

#### QO-H10 – Kein Focus-Trap und kein role="dialog" auf Modal

- **Datei:** `src/components/schedule/assignment-modal.tsx:159-163`
- **Kategorie:** Accessibility
- **Beschreibung:** Modal hat kein `role="dialog"`, kein `aria-modal="true"`, keinen Focus-Trap. Tab-Taste entweicht in den Hintergrund.
- **Fix:** `role="dialog"`, `aria-modal="true"`, Focus-Trap mit `useEffect` oder Library.

---

### MITTEL (28)

#### QO-M1 – Unbehandelte Prisma-Fehler auf DELETE (6 Handler)

- **Dateien:** `schedule/route.ts:268`, `recurrence-rules/route.ts:206`, `officer-assignments/route.ts:109`, `assignments/route.ts:77`, `professions/[id]/route.ts:39`, `notifications/[id]/route.ts:31`
- **Fix:** try/catch mit P2025-Fehlerabfang und 404-Response.

#### QO-M2 – notifications/[id] PUT/DELETE: 500 statt 404

- **Datei:** `src/app/api/notifications/[id]/route.ts:14,31`
- **Fix:** try/catch um Prisma-Aufrufe, bei P2025 → 404.

#### QO-M3 – Unvalidierte Query-Params: parseInt ohne Bereichspruefung

- **Dateien:** `reports/route.ts:20,61`, `reports/prefill/route.ts:16-17`
- **Beschreibung:** `parseInt(year)` ohne Bereichsvalidierung. `parseInt("abc")` → `NaN`.
- **Fix:** Zod: `z.coerce.number().int().min(2020).max(2100)`.

#### QO-M4 – schedule PUT/DELETE: UUID-Validierung fehlt

- **Dateien:** `schedule/route.ts:268`, `recurrence-rules/route.ts:206`, `officer-assignments/route.ts:109`, `assignments/route.ts:77`
- **Beschreibung:** Query-Param `id` wird nur auf Existenz geprueft, nicht auf UUID-Format. Beliebige Strings → 500.
- **Fix:** `z.string().uuid()` Validierung.

#### QO-M5 – Jeder authentifizierte User kann ALLE Settings lesen

- **Datei:** `src/app/api/settings/route.ts:10`
- **Beschreibung:** GET hat keine Rollenbeschraenkung. Azubis koennen alle AppSetting-Key-Value-Paare lesen.
- **Fix:** Mindestens auf Admin/Trainer beschraenken, oder nur `workingDays` freigeben.

#### QO-M6 – Schwaches Passwort-Hash-Placeholder bei Anonymisierung

- **Datei:** `src/app/api/users/[id]/anonymize/route.ts:25`
- **Beschreibung:** `passwordHash` wird auf `"-"` gesetzt statt auf einen sicheren Zufalls-Hash. Erkennbarer Platzhalter.
- **Fix:** `bcrypt.hash(crypto.randomUUID(), 12)` verwenden.

#### QO-M7 – Inkonsistente Validierungsfehler-Details

- **Dateien:** `officer-assignments/route.ts:42`, `assignments/route.ts:36`, `reports/[id]/review/route.ts:55`
- **Beschreibung:** Drei Routen returnen `{ error: "Validation failed" }` ohne `details: parsed.error.flatten()`, waehrend andere Routen dies mitliefern.
- **Fix:** `details` konsistent hinzufuegen.

#### QO-M8 – N+1 Query: schedule GET fuer training_officer

- **Datei:** `src/app/api/schedule/route.ts:62-81`
- **Beschreibung:** Schleife mit einzelnen Queries pro Assignment statt Sammelabfrage.
- **Fix:** Alle traineeIds sammeln, dann einzelnes `findMany` mit `where: { traineeId: { in: ids } }`.

#### QO-M9 – N+1 Query: Notification-Erstellung in Schleife

- **Datei:** `src/app/api/notifications/check/route.ts:59-66`
- **Beschreibung:** `prisma.notification.create()` in Schleife statt `createMany()`.
- **Fix:** `prisma.notification.createMany({ data: [...] })`.

#### QO-M10 – Fehlender Index auf WeeklyReport.reviewedById

- **Datei:** `prisma/schema.prisma:138`
- **Fix:** `@@index([reviewedById])` hinzufuegen.

#### QO-M11 – Fehlender Composite-Index auf TraineeOfficerAssignment

- **Datei:** `prisma/schema.prisma:107-124`
- **Beschreibung:** Kein Index auf `[traineeId, validFrom, validUntil]` fuer Overlap-Detection-Queries.
- **Fix:** `@@index([traineeId, validFrom, validUntil])` hinzufuegen.

#### QO-M12 – Cascade-Delete auf ScheduleAssignment.creator zerstoert aktive Schedules

- **Datei:** `prisma/schema.prisma:233`
- **Beschreibung:** `onDelete: Cascade` auf `creator`-Relation. Wenn der Ersteller geloescht wird, werden ALLE seine Schedule-Assignments geloescht – auch aktiv genutzte.
- **Fix:** `onDelete: SetNull` und `createdBy` optional machen.

#### QO-M13 – Cascade-Delete auf RecurrenceRule.createdBy/trainee

- **Datei:** `prisma/schema.prisma:257-258`
- **Beschreibung:** Gleiche Problematik wie QO-M12.
- **Fix:** `onDelete: SetNull` fuer `createdBy`. `onDelete: Restrict` fuer `trainee`.

#### QO-M14 – Kein @@unique auf DailyEntry[weeklyReportId, date]

- **Datei:** `prisma/schema.prisma:156-171`
- **Beschreibung:** Ohne Unique-Constraint koennen doppelte Tageseintrage fuer dasselbe Datum in demselben Bericht eingefuegt werden.
- **Fix:** `@@unique([weeklyReportId, date])` hinzufuegen.

#### QO-M15 – weeklyReportSchema validiert nicht auf genau 7 dailyEntries

- **Datei:** `src/lib/validations.ts:48`
- **Fix:** `.min(7).max(7)` oder `.length(7)` auf dem Array.

#### QO-M16 – reviewSchema erfordert keinen Kommentar bei rejected/needs_revision

- **Datei:** `src/lib/validations.ts:51-54`
- **Beschreibung:** Kommentar ist immer optional. Bei Ablehnung sollte ein Begruendungstext Pflicht sein.
- **Fix:** Bedingte Validierung: `.refine()` das `comment` erforderlich macht wenn `action` nicht `approved`.

#### QO-M17 – cn() fehlt tailwind-merge

- **Datei:** `src/lib/utils.ts:1-5`
- **Beschreibung:** `cn()` nutzt nur `clsx` ohne `twMerge`. Konfliktierende Tailwind-Klassen werden nicht aufgeloest.
- **Fix:** `import { twMerge } from 'tailwind-merge'` und `return twMerge(clsx(...inputs))`.

#### QO-M18 – report-builder.ts: Hartkodierte 8 Stunden fuer alle Tagestypen

- **Datei:** `src/lib/report-builder.ts:34`
- **Beschreibung:** `hours: 8` unabhaengig von `dayType`. Urlaub sollte 0 oder konfigurierbare Stunden haben.
- **Fix:** Nach `dayType` differenzieren oder konfigurierbar machen.

#### QO-M19 – Autosave triggert bei Referenzwechsel auch ohne Inhaltsaenderung

- **Datei:** `src/hooks/use-autosave.ts:55-63`
- **Beschreibung:** `useEffect` auf `data` feuert bei jedem neuen Objekt-Referenz, auch wenn Inhalt identisch ist.
- **Fix:** Deep-Compare oder Hash-Vergleich vor Save.

#### QO-M20 – Autosave: Kein Retry bei Fehler

- **Datei:** `src/hooks/use-autosave.ts:35-36`
- **Beschreibung:** Fehlerhafter Save → Status "error", aber keine Wiederholung. Daten koennen verloren gehen.
- **Fix:** Retry-Logik mit exponentiellem Backoff.

#### QO-M21 – Session wird nach Initial-Fetch nie erneuert

- **Datei:** `src/hooks/use-session.ts:1-21`
- **Beschreibung:** Kein `refetchInterval`. Wenn Admin User deaktiviert, bleibt Client-Session aktiv.
- **Fix:** NaechstAuth `useSession` mit `refetchInterval: 300` nutzen, oder manuell nachbauen.

#### QO-M22 – Gantt-Timeline: 578 Zeilen, sollte aufgeteilt werden

- **Datei:** `src/components/schedule/gantt-timeline.tsx`
- **Beschreibung:** Enthaelt Drag-Scroll-Physik, Tooltip-Logik, Header/Row/Block-Rendering in einer Datei.
- **Fix:** Aufteilen in `useDragScroll`-Hook, `TimelineHeader`, `TimelineRow`, `TimelineBlock`, `TimelineTooltip`.

#### QO-M23 – TraineeWithReports-Interface dupliziert

- **Dateien:** `reviewer-dashboard.tsx:12-24`, `reviewer-dashboard-client.tsx:11-23`
- **Fix:** Einmal definieren und aus Shared-Types exportieren.

#### QO-M24 – 4 unnötige Typ-Assertions in reviewer-report-page.tsx

- **Datei:** `src/components/reports/reviewer-report-page.tsx:88,91,98`
- **Beschreibung:** `(e as { reportText?: string }).reportText` – die Assertion ist unnötig, da `DailyEntryData` bereits `reportText` enthaelt.
- **Fix:** Typ des API-Responses korrekt definieren, Assertions entfernen.

#### QO-M25 – Duplicate schedule type enum in 2 Dateien

- **Dateien:** `schedule/route.ts:8`, `recurrence-rules/route.ts:9`
- **Fix:** In `src/lib/validations.ts` oder `types.ts` zentral definieren und importieren.

#### QO-M26 – Keine Seed-Daten fuer RecurrenceRules, Notifications, ReviewEvents

- **Datei:** `prisma/seed.ts`
- **Beschreibung:** RecurrenceRules, Notifications und ReviewEvents werden nicht geseedet. Diese Features sind mit Seed-Daten nicht testbar.
- **Fix:** Mindestens je 3-5 Beispieldaten hinzufuegen.

#### QO-M27 – Seed: getIsoWeek/getWeekDates dupliziert utils.ts

- **Datei:** `prisma/seed.ts:208-226`
- **Fix:** Aus `src/lib/utils.ts` importieren.

#### QO-M28 – Seed: Woche-53-Behandlung fehlerhaft

- **Datei:** `prisma/seed.ts:259-260`
- **Beschreibung:** `if (week > 52)` geht von max 52 Wochen aus. ISO-Jahre koennen 53 Wochen haben (z.B. 2020, 2026).
- **Fix:** Korrekte ISO-Woche-53-Behandlung.

---

### NIEDRIG (35)

#### QO-L1 – bg-black/20 Hardcode in navbar.tsx

- **Datei:** `src/components/layout/navbar.tsx:212`
- **Fix:** Durch Design-Token ersetzen (z.B. `bg-overlay-backdrop`).

#### QO-L2 – Opacity < 0.4 in button.tsx und gantt-timeline.tsx

- **Dateien:** `button.tsx:54` (opacity-25), `gantt-timeline.tsx:460` (opacity-20)
- **Fix:** Mindestens 0.4 verwenden oder Token verwenden.

#### QO-L3 – Gleiche Input-Klassen 4x dupliziert

- **Dateien:** `input.tsx:25,60`, `select.tsx:28`, `date-picker.tsx:57`
- **Fix:** Gemeinsame Konstante `INPUT_CLASSES` extrahieren.

#### QO-L4 – Unused import: React in calendar.tsx

- **Datei:** `src/components/ui/calendar.tsx:3`
- **Fix:** `import * as React from "react"` entfernen.

#### QO-L5 – Tooltip-Positionierung 3x unterschiedlich implementiert

- **Dateien:** `reviewer-dashboard-client.tsx:60-73`, `year-calendar.tsx:117-123`, `gantt-timeline.tsx:295-316`
- **Fix:** Gemeinsame `useTooltipPosition`-Hook oder Utility.

#### QO-L6 – isBeforeTrainingStart 2x dupliziert

- **Dateien:** `report-calendar.tsx:55-58`, `year-calendar.tsx:47-49`
- **Fix:** Nach `src/lib/utils.ts` extrahieren.

#### QO-L7 – STATUS_FILTERS, LEGEND_ITEMS, modeTabs als Inline-Konstanten

- **Dateien:** `reviewer-dashboard-client.tsx:35-42`, `year-calendar.tsx:125-132`, `assignment-modal.tsx:150-156`
- **Fix:** Als Module-Level-Konstanten ausserhalb der Komponente definieren.

#### QO-L8 – TraineeCard fehlt React.memo

- **Datei:** `src/components/reports/reviewer-dashboard-client.tsx:44-193`
- **Fix:** `export default React.memo(TraineeCard)`.

#### QO-L9 – Unsafe Cast: e.target.value as ScheduleType

- **Datei:** `src/components/schedule/assignment-modal.tsx:206`
- **Fix:** Zod-Validierung oder Typ-Guard verwenden.

#### QO-L10 – NavbarProps.role als string statt Role

- **Datei:** `src/components/layout/navbar.tsx:147`
- **Fix:** `role: Role` aus `@/types` importieren.

#### QO-L11 – status: string statt ReportStatus in TraineeWithReports

- **Dateien:** `reviewer-dashboard-client.tsx:16-23`, `reviewer-dashboard.tsx:17-23`
- **Fix:** `status: ReportStatus` verwenden.

#### QO-L12 – NotificationBell sollte eigene Datei sein

- **Datei:** `src/components/layout/navbar.tsx:56-145`
- **Fix:** Nach `src/components/layout/notification-bell.tsx` extrahieren.

#### QO-L13 – Fehlender Index auf ReviewEvent.actorId

- **Datei:** `prisma/schema.prisma:176`
- **Fix:** `@@index([actorId])` hinzufuegen.

#### QO-L14 – Fehlende Indizes auf ScheduleAssignment.createdBy, RecurrenceRule.createdById

- **Dateien:** `schema.prisma:227,252-253`
- **Fix:** `@@index` hinzufuegen.

#### QO-L15 – Redundanter @@index auf RecurrenceException (schon UNIQUE)

- **Datei:** `prisma/schema.prisma:278-279`
- **Fix:** `@@index` entfernen (UNIQUE erstellt automatisch einen Index).

#### QO-L16 – DailyEntry.hours als Int erlaubt negative Werte auf DB-Ebene

- **Datei:** `prisma/schema.prisma:161`
- **Fix:** Application-Layer-Validierung vorhanden, aber `@Check` waere sicherer (Prisma untestuetzt nicht nativ → Dokumentieren).

#### QO-L17 – weekStartDate/weekEndDate redundant mit calendarYear/calendarWeek

- **Datei:** `prisma/schema.prisma:129-130`
- **Fix:** Dokumentieren dass dies bewusste Denormalisierung fuer Query-Convenience ist.

#### QO-L18 – Notification.type als freier String statt Enum

- **Datei:** `prisma/schema.prisma:191`
- **Fix:** Enum `NotificationType` erstellen.

#### QO-L19 – ScheduleAssignment/RecurrenceRule color-Feld unvalidiert

- **Datei:** `prisma/schema.prisma:226,250`
- **Fix:** Entweder validieren oder in Migration entfernen (API ignoriert es bereits).

#### QO-L20 – officerAssignmentSchema: validFrom/validUntil ohne Format-Validierung

- **Datei:** `src/lib/validations.ts:76-77`
- **Fix:** `z.string().datetime()` oder ISO-Date-Regex.

#### QO-L21 – createUserSchema: professionId nicht required fuer trainee

- **Datei:** `src/lib/validations.ts:8-15`
- **Fix:** `.refine()` das professionId erforderlich macht wenn role = "trainee".

#### QO-L22 – updateReportSchema: dailyEntry dupliziert dailyEntrySchema

- **Datei:** `src/lib/validations.ts:64-70`
- **Fix:** `dailyEntrySchema` wiederverwenden.

#### QO-L23 – reportText ohne max-Laenge

- **Datei:** `src/lib/validations.ts:46,62`
- **Fix:** `.max(50000)` hinzufuegen.

#### QO-L24 – workingDays-Validierung: max(6) inkonsistent mit ISO-Tagen (1-7)

- **Datei:** `src/lib/validations.ts:81`
- **Fix:** Pruefen ob JS-Day (0-6) oder ISO-Day (1-7) verwendet wird und validieren entsprechend.

#### QO-L25 – Auth: Unsafe Type-Assertions auf session.user

- **Datei:** `src/lib/auth.ts:58-60`
- **Fix:** NextAuth-Module-Augmentation korrekt einrichten.

#### QO-L26 – getWeekDates nutzt Local-Time, getIsoWeek UTC

- **Datei:** `src/lib/utils.ts:7-20 vs 30-46`
- **Fix:** Konsistent UTC oder Local-Time verwenden.

#### QO-L27 – schedule-resolver: SingleAssignment hardcoded createdAt: new Date(0)

- **Datei:** `src/lib/schedule-resolver.ts:111`
- **Fix:** Dokumentieren dass Single-Assignments bei Layer-Konflikten immer verlieren.

#### QO-L28 – Seed: week > 52 statt korrekter ISO-53-Wochen-Logik

- **Datei:** `prisma/seed.ts:259-260`
- **Fix:** Korrekte ISO-Wochenanzahl verwenden.

#### QO-L29 – Seed: Keine ReviewEvents fuer geseedete Berichte

- **Datei:** `prisma/seed.ts:277-296`
- **Fix:** ReviewEvents fuer approved/rejected/needs_revision-Berichte erstellen.

#### QO-L30 – auth.test.ts: authorize-Funktion kopiert statt importiert

- **Datei:** `src/lib/auth.test.ts:20-41`
- **Fix:** Funktion aus `auth.ts` importieren und testen.

#### QO-L31 – Cross-File-Test-Duplizierung (Route-Tests importieren andere Routen)

- **Dateien:** `users/route.test.ts:4-5`, `reports/[id]/route.test.ts:4-5`, `notifications/route.test.ts:5-6`
- **Fix:** Dedizierte Tests in den jeweiligen Test-Dateien belassen, nicht querverweisen.

#### QO-L32 – Magic Numbers: 8 Wochen, 200ms Tooltip, 320px Tooltip-Breite

- **Dateien:** `reviewer-dashboard-client.tsx:222,300`, `gantt-timeline.tsx:302-303`
- **Fix:** Als benannte Konstanten extrahieren.

#### QO-L33 – Kein AbortController in use-session.ts

- **Datei:** `src/hooks/use-session.ts:10-18`
- **Fix:** `AbortController` in useEffect-Cleanup nutzen.

#### QO-L34 – Duplicate schedule type enum (siehe QO-M25)

- **Dateien:** `schedule/route.ts:8`, `recurrence-rules/route.ts:9`

#### QO-L35 – E2E-Tests decken nicht alle kritischen User-Flows ab

- **Datei:** `e2e/`
- **Beschreibung:** Fehlende E2E-Tests fuer: Report-Submission, Review-Workflow, PDF-Export, Admin-User-CRUD, Schedule-Planning, Withdraw.
- **Fix:** Weitere E2E-Tests hinzufuegen.

---

## Dokumentations-Befunde

### QO-DOC1 – ARCHITECTURE.md: TraineeTrainerAssignment-Modell falsch dokumentiert

- **Datei:** `ARCHITECTURE.md` (Modell heisst jetzt `TrainerProfessionAssignment` mit `trainerId + professionId`)
- **Fix:** Modell-Sektion komplett aktualisieren.

### QO-DOC2 – ARCHITECTURE.md: Notification-Modell nicht dokumentiert

- **Fix:** `Notification`-Modell mit Feldern und Relationen hinzufuegen.

### QO-DOC3 – ARCHITECTURE.md: "Projektstruktur (geplant)" ist veraltet

- **Fix:** Aktualisierte Struktur dokumentieren, "(geplant)" entfernen.

### QO-DOC4 – ARCHITECTURE.md: Next.js 15.x → tatsaechlich 16.x

- **Fix:** Version korrigieren.

### QO-DOC5 – ARCHITECTURE.md: Withdraw-Statusuebergang (submitted → draft) fehlt

- **Fix:** Im Statusmodell ergaenzen.

### QO-DOC6 – ARCHITECTURE.md: officer-assignments API-Route nicht dokumentiert

- **Fix:** Route zur API-Tabelle hinzufuegen.

### QO-DOC7 – HANDBUCH.md: Testzugangs-Tabelle unvollstaendig (nur 5 von 37 Usern)

- **Fix:** Alle User auflisten oder Muster dokumentieren.

### QO-DOC8 – HANDBUCH.md: Abschnitt 7.3 beschreibt altes Zuordnungsmodell

- **Fix:** Aktualisieren auf Trainer-to-Profession-Modell.

### QO-DOC9 – HANDBUCH.md: Abschnitt 7.4 "Officer-UI in zukuenftigen Versionen" – bereits implementiert

- **Fix:** Auf `/trainer/officers/` verweisen.

### QO-DOC10 – HANDBUCH.md: Trainee-Schedule-View nicht dokumentiert

- **Fix:** `/trainee/schedule/` dokumentieren.

### QO-DOC11 – DESIGN_SYSTEM.md: Font Family falsch (Inter → Geist, JetBrains Mono → Geist Mono)

- **Fix:** Korrigieren.

### QO-DOC12 – DESIGN_SYSTEM.md: Viele dokumentierte Tokens nicht als CSS-Variablen implementiert

- **Beschreibung:** Font-Size, Font-Weight, Line-Height, Space, Icon-Size, Motion-Token sind dokumentiert aber nicht in globals.css.
- **Fix:** Entweder als CSS-Variablen implementieren oder als "Konvention" markieren.

### QO-DOC13 – README.md: Features-Liste fehlt 15+ implementierte Features

- **Fix:** PDF-Export, Schedule, Notifications, Professions, Settings, Progress, etc. ergaenzen.

### QO-DOC14 – README.md: Projektstruktur stark veraltet

- **Fix:** Aktualisieren.

### QO-DOC15 – README.md: typecheck-Script in AGENTS.md referenziert aber nicht in package.json

- **Fix:** Script erstellen oder AGENTS.md korrigieren.

---

## Priorisierung der Qualitaetsoffensive

### Phase 1 – Sicherheit & Datenintegritaet (Sofort)

| # | Issue | Aufwand |
|---|-------|---------|
| 1 | QO-H4: CRON_SECRET-Bypass | Klein |
| 2 | QO-H2/H3: Zod-Validierung auf PUT schedule/recurrence-rules | Mittel |
| 3 | QO-H5: validUntil > validFrom Validierung | Klein |
| 4 | QO-H7: ReviewAction.withdrawn aufraeumen | Klein |
| 5 | QO-M6: Schwacher Passwort-Hash bei Anonymisierung | Klein |
| 6 | QO-H1: Rate Limiting (mindestens Login) | Mittel |

### Phase 2 – Performance & Stabilitaet

| # | Issue | Aufwand |
|---|-------|---------|
| 7 | QO-H6: DB-Query bei jedem JWT-Refresh | Mittel |
| 8 | QO-M8/M9: N+1 Queries beheben | Klein |
| 9 | QO-M1/M2: try/catch auf DELETE-Handlern | Klein |
| 10 | QO-M10/M11: Fehlende DB-Indizes | Klein |
| 11 | QO-M12/M13: Cascade-Delete auf Schedule/Recurrence | Klein |
| 12 | QO-M14: Unique-Constraint auf DailyEntry | Klein |

### Phase 3 – Validierung & Datenqualitaet

| # | Issue | Aufwand |
|---|-------|---------|
| 13 | QO-M15: dailyEntries genau 7 | Klein |
| 14 | QO-M16: Kommentar bei rejected/needs_revision erforderlich | Klein |
| 15 | QO-M3/M4: Query-Param-Validierung | Klein |
| 16 | QO-M17: twMerge in cn() | Klein |
| 17 | QO-M18: Report-Builder Stunden nach Typ | Klein |

### Phase 4 – Testabdeckung

| # | Issue | Aufwand |
|---|-------|---------|
| 18 | QO-H9: recurrence-rules Tests | Mittel |
| 19 | QO-H9: prefill Tests | Klein |
| 20 | QO-H9: assignment-modal Tests | Mittel |
| 21 | QO-L30: auth.test.ts authorize importieren | Klein |
| 22 | QO-M26: Seed-Daten vervollstaendigen | Mittel |

### Phase 5 – Accessibility

| # | Issue | Aufwand |
|---|-------|---------|
| 23 | QO-H8: aria-labels auf Icon-Buttons | Klein |
| 24 | QO-H8: Formular-Labels im Assignment-Modal | Klein |
| 25 | QO-H10: Focus-Trap + role="dialog" auf Modal | Mittel |

### Phase 6 – Code-Qualitaet & Refactoring

| # | Issue | Aufwand |
|---|-------|---------|
| 26 | QO-M22: Gantt-Timeline aufteilen | Groß |
| 27 | QO-L1-L7: Hardcodes, Duplikate, Inline-Konstanten | Mittel |
| 28 | QO-M19-M21: Autosave & Session-Verbesserungen | Mittel |
| 29 | QO-M23-M25: Interface-Duplikate, Typ-Assertions, Enums | Klein |

### Phase 7 – Dokumentation

| # | Issue | Aufwand |
|---|-------|---------|
| 30 | QO-DOC1-DOC6: ARCHITECTURE.md aktualisieren | Mittel |
| 31 | QO-DOC7-DOC10: HANDBUCH.md aktualisieren | Mittel |
| 32 | QO-DOC11-DOC12: DESIGN_SYSTEM.md korrigieren | Klein |
| 33 | QO-DOC13-DOC15: README.md aktualisieren | Klein |

---

## Altes Initial-Review (2026-05-07) – Archiv

*Das Initial-Review vom 2026-05-07 ist oben im Aufloesungsstatus dokumentiert. Die urspruenglichen Issue-Beschreibungen waren:*

### Top 5 dringendste Probleme (Initial-Review)

1. Submit-Button schlaegt stillschweigend fehl bei neuen Berichten (#37) – **BEHOBEN**
2. PUT ohne Eingabevalidierung (#7) – **BEHOBEN**
3. Autosave Race Condition (#68) – **BEHOBEN**
4. Kein Middleware-Auth-Guard (#90) – **BEHOBEN**
5. JWT-Rolle wird nie aktualisiert (#72) – **BEHOBEN**
