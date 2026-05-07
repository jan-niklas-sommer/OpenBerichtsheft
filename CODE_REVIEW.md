# Code Review – OpenBerichtsheft

Datum: 2026-05-07
Reviewer: Automatisiertes Code-Review
Codebase: Initial MVP (Commit 887f445)

---

## Zusammenfassung

| Schweregrad | Anzahl |
|-------------|--------|
| **Kritisch** | 3 |
| **Hoch** | 11 |
| **Mittel** | 39 |
| **Niedrig** | 23 |

### Top 5 dringendste Probleme

1. **Submit-Button schlägt stillschweigend fehl** bei neuen Berichten wegen Stale-State-Closure (Issue #37)
2. **PUT `/api/reports/[id]` hat keine Eingabevalidierung** – beliebige Daten können geschrieben werden (Issue #7)
3. **Autosave Race Condition** kann zu Datenverlust führen (Issue #68)
4. **Kein Middleware-Auth-Guard** – ein einziger vergessener `auth()`-Check ist ein Auth-Bypass (Issue #90)
5. **JWT-Rolle wird nie aktualisiert** – Rollenänderungen erfordern erneute Anmeldung (Issue #72)

---

## Erweiterbarkeit und Wartbarkeit

### Architektur-Einschätzung

**Positiv:**

- Klare Trennung zwischen API-Routen, Seiten, Komponenten und Utilities.
- Prisma-Schema ist sauber modelliert mit Enums und Constraints.
- TypeScript strict mode aktiviert.
- Konsistente Rollenprüfung in (fast) allen API-Routen.
- Designsystem ist konsistent (Button, Card, Input, Badge).

**Verbesserungspotenzial:**

| Bereich | Problem | Empfehlung |
|---------|---------|------------|
| **Komponentengröße** | Report-Editor ist 335 Zeilen, verantwortlich für Navigation, Fetching, Editing, Autosave, Submit | Aufteilen in `WeekNavigator`, `ReportTextEditor`, `DailyEntryEditor`, `ReportActionBar` und Hooks `useReportData`, `useWeekNavigation` |
| **Code-Duplizierung** | Trainer- und Officer-Dashboard sind zu 95 % identisch | Gemeinsame `ReviewerDashboard`-Komponente erstellen, die rollenspezifisch konfiguriert wird |
| **Code-Duplizierung** | `statusVariant`-Funktion in 3 Dateien identisch | Nach `src/lib/utils.ts` extrahieren |
| **Code-Duplizierung** | Trainer- und Officer-Report-Review-Seiten nahezu identisch | Gemeinsame `ReviewerReportPage`-Komponente |
| **Fehlende Fehlerbehandlung** | Nahezu alle API-Routen ohne try/catch | Zentraler Error-Handler oder Wrapper-Funktion |
| **Fehlende Validierung** | PUT-Route für Berichte hat keine Zod-Validierung | `updateReportSchema` erstellen und anwenden |
| **Fehlende Middleware** | Kein zentraler Auth-Guard auf Edge-Ebene | `src/middleware.ts` mit NextAuth-Middleware |
| **Enge Kopplung** | Autosave-Hook direkt mit Fetch-Logik gekoppelt | Abstraktere Persistenzschnittstelle |
| **Fehlende Paginierung** | Alle List-Endpunkte liefern ungefiltert alle Datensätze | `take`/`skip` mit `hasMore`-Envelope |
| **Fehlende Error Boundaries** | Keine `error.tsx`-Dateien | Mindestens für Dashboard-Bereich |
| **Types duplizieren Prisma-Enums** | `Role`, `DayType` manuell definiert, obwohl Prisma sie generiert | Direkt aus `@prisma/client` importieren |

### Skalierbarkeit

- **Autosave** funktioniert für einzelne Nutzer, aber gleichzeitige Requests sind nicht abgesichert. Bei wachsender Nutzerzahl steigt die Wahrscheinlichkeit von Race Conditions.
- **Dashboard-Abfragen** ohne Paginierung werden mit der Zeit langsamer. Bei 50 Azubis × 52 Wochen/Jahr = 2.600 Berichte pro Jahr pro Prüfer.
- **Keine Caching-Strategie** für häufig abgefragte Daten (z. B. Zuordnungen).

---

## Alle gefundenen Probleme

---

### KRITISCH

#### Issue #37 – Submit schlägt fehl bei neuen Berichten

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx:121-139`
- **Kategorie:** Bug
- **Beschreibung:** Wenn ein Azubi einen neuen Bericht (noch nicht in DB) einreicht:
  1. `handleSubmit` ruft `handleSave()` auf.
  2. `handleSave` erstellt den Bericht per POST und ruft `setReport(data)` auf.
  3. React-State-Updates sind asynchron – `report` im Closure von `handleSubmit` ist noch `null`.
  4. `report?.id` ist `undefined`, Funktion kehrt früh zurück.
  5. Bericht wird als Entwurf gespeichert, aber **nie eingereicht**. Keine Fehlermeldung.
- **Fix:** Return-Value von `handleSave()` nutzen: `const result = await handleSave(); const reportId = result?.id || report?.id;`

#### Issue #7 – PUT ohne Eingabevalidierung

- **Datei:** `src/app/api/reports/[id]/route.ts:70-71`
- **Kategorie:** Sicherheit
- **Beschreibung:** PUT-Handler parst Body direkt mit `req.json()` ohne Zod-Validierung. Beliebige Felder, falsche Typen oder malformede Daten werden ungeprüft an Prisma übergeben.
- **Fix:** `updateReportSchema` mit Zod definieren und `safeParse` anwenden.

#### Issue #68 – Autosave Race Condition

- **Datei:** `src/hooks/use-autosave.ts:13-30`
- **Kategorie:** Bug / Race Condition
- **Beschreibung:** Wenn ein Save länger als das Debounce-Intervall dauert, startet ein zweiter Save parallel. Der spätere (ältere) Save kann den neueren überschreiben.
- **Fix:** In-flight-Tracking mit Ref. Neuen Save queuen oder alten abbrechen (AbortController).

---

### HOCH

#### Issue #1 – Keine Paginierung auf GET /api/reports

- **Datei:** `src/app/api/reports/route.ts:22-59`
- **Kategorie:** Performance
- **Beschreibung:** `findMany` ohne `take`/`skip`. Bei wachsender Datenmenge werden immer alle Berichte inkl. DailyEntries geladen.
- **Fix:** `take`/`skip` Query-Parameter mit `{ data, total, hasMore }` Envelope.

#### Issue #4 – Upsert mit deleteMany + create nicht atomar

- **Datei:** `src/app/api/reports/route.ts:112-119`
- **Kategorie:** Race Condition
- **Beschreibung:** Concurrent Autosave-Requests können interleaven. `deleteMany` + `create` in einem Upsert ist zwar transaktional, aber zwei parallele Upserts auf denselben Bericht nicht.
- **Fix:** `$transaction` mit explizitem Locking oder optimistischem Locking (Versionspalte).

#### Issue #10 – TOCTOU Race Condition bei PUT

- **Datei:** `src/app/api/reports/[id]/route.ts:63-90`
- **Kategorie:** Race Condition
- **Beschreibung:** Status wird gelesen, geprüft, dann aktualisiert – ohne Locking. Zwischen Read und Write kann ein Submit den Status ändern.
- **Fix:** Bedingtes Update: `where: { id, status: { in: ["draft", "needs_revision"] } }`.

#### Issue #11 – Nicht-transaktionaler Submit

- **Datei:** `src/app/api/reports/[id]/submit/route.ts:27-44`
- **Kategorie:** Datenintegrität
- **Beschreibung:** Status-Update und ReviewEvent-Erstellung sind zwei separate Operationen. Schlägt das Event fehl, ist der Bericht "submitted" ohne Audit-Trail.
- **Fix:** Beides in `prisma.$transaction([...])` wrappen.

#### Issue #14 – Nicht-transaktionaler Review

- **Datei:** `src/app/api/reports/[id]/review/route.ts:56-73`
- **Kategorie:** Datenintegrität
- **Beschreibung:** Gleiches Problem wie #11. Status-Update und Event-Erstellung nicht atomar.
- **Fix:** `$transaction` verwenden.

#### Issue #26 – Trainer kann beliebige Officer-Assignments löschen

- **Datei:** `src/app/api/officer-assignments/route.ts:82-97`
- **Kategorie:** Sicherheit
- **Beschreibung:** DELETE prüft nicht, ob die Zuordnung zum Trainer gehört. Jeder Trainer kann jede Officer-Zuordnung per ID löschen.
- **Fix:** Vor dem Löschen prüfen: `assignment.trainerId === session.user.id`.

#### Issue #30 – Kein Rate Limiting auf Login

- **Datei:** `src/app/(auth)/login/page.tsx` und `src/lib/auth.ts`
- **Kategorie:** Sicherheit
- **Beschreibung:** Keine Drosselung von Login-Versuchen. Brute-Force-Angriffe sind möglich.
- **Fix:** Serverseitiges Rate Limiting implementieren (z. B. `rate-limiter-flexible`). Account-Lockout nach N fehlgeschlagenen Versuchen.

#### Issue #72 – JWT-Rolle wird nie aktualisiert

- **Datei:** `src/lib/auth.ts:38-43`
- **Kategorie:** Sicherheit
- **Beschreibung:** Die Rolle wird nur beim ersten Login ins JWT geschrieben. Rollenänderungen durch Admins werden erst nach erneutem Login wirksam.
- **Fix:** Rolle bei jedem JWT-Refresh aus DB neu laden, oder kürzere Token-Lebensdauer mit Refresh-Strategie.

#### Issue #89 – Keine Security Headers

- **Datei:** `next.config.ts`
- **Kategorie:** Sicherheit
- **Beschreibung:** Keine Security-Header konfiguriert: X-Frame-Options, X-Content-Type-Options, HSTS, CSP, Referrer-Policy.
- **Fix:** `headers()` Funktion in next.config.ts hinzufügen.

#### Issue #90 – Kein Middleware-Auth-Guard

- **Datei:** Fehlt (`src/middleware.ts` existiert nicht)
- **Kategorie:** Sicherheit
- **Beschreibung:** Kein zentraler Auth-Schutz auf Edge-Ebene. Jede API-Route muss individuell `auth()` aufrufen. Ein vergessener Check = Auth-Bypass.
- **Fix:** `src/middleware.ts` mit NextAuth-Middleware erstellen.

#### Issue #93 – Kein CSRF-Schutz auf Custom-API-Routen

- **Datei:** Alle API-Routen außer `/api/auth/`
- **Kategorie:** Sicherheit
- **Beschreibung:** NextAuth sichert nur eigene Routen gegen CSRF. Custom-Routen (POST/PUT/DELETE) haben keinen CSRF-Schutz.
- **Fix:** CSRF-Token aus NextAuth-Cookie validieren oder Token im Request-Body/Header prüfen.

---

### MITTEL

#### Issue #2 – Unvalidiertes parseInt auf year-Parameter

- **Datei:** `src/app/api/reports/route.ts:20, 50`
- **Kategorie:** Bug
- **Fix:** Zod-Validierung: `z.coerce.number().int().min(2020).max(2100).optional().parse(year)`.

#### Issue #3 – Kein try/catch in API-Routen

- **Datei:** Alle API-Routen
- **Kategorie:** Wartbarkeit
- **Fix:** try/catch mit strukturierten Fehlerantworten und serverseitigem Logging.

#### Issue #5 – Keine Validierung dass DailyEntry-Daten zur Woche passen

- **Datei:** `src/app/api/reports/route.ts:81, 102`
- **Kategorie:** Datenintegrität
- **Fix:** Nach Parsing prüfen: jedes `dailyEntries[].date` muss innerhalb `weekStartDate`–`weekEndDate` liegen.

#### Issue #8 – deleteMany + create bei jedem Autosave

- **Datei:** `src/app/api/reports/[id]/route.ts:78-86`
- **Kategorie:** Performance
- **Fix:** Diff berechnen und `update`/`create`/`delete` gezielt einsetzen.

#### Issue #16 – Redundantes statusMap

- **Datei:** `src/app/api/reports/[id]/review/route.ts:50-54`
- **Kategorie:** Wartbarkeit
- **Fix:** Action direkt als `ReportStatus` validieren und verwenden.

#### Issue #18 – Kein Duplicate-Email-Handling

- **Datei:** `src/app/api/users/route.ts:45-50`
- **Kategorie:** Bug
- **Fix:** `Prisma.PrismaClientKnownRequestError` mit Code P2002 abfangen und 409 zurückgeben.

#### Issue #20 – Keine Existenzprüfung bei User-Update

- **Datei:** `src/app/api/users/[id]/route.ts:30-34`
- **Kategorie:** Bug
- **Fix:** P2025-Fehler abfangen und 404 zurückgeben.

#### Issue #23 – Trainer sieht alle Zuordnungen

- **Datei:** `src/app/api/assignments/route.ts:15-23`
- **Kategorie:** Sicherheit
- **Fix:** `where: { trainerId: session.user.id }` für Trainer-Rolle.

#### Issue #29 – Keine Cache-Header auf Session-Endpoint

- **Datei:** `src/app/api/auth/session/route.ts:4-10`
- **Kategorie:** Sicherheit
- **Fix:** `Cache-Control: no-store, max-age=0` Header hinzufügen.

#### Issue #34 – Kein Error-Handling auf Fetch (Trainee-Übersicht)

- **Datei:** `src/app/(dashboard)/trainee/page.tsx:17-23`
- **Kategorie:** Bug
- **Fix:** Error-State hinzufügen, `r.ok` prüfen, `.catch()` hinzufügen.

#### Issue #39 – Report-Editor zu groß (335 Zeilen)

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx`
- **Kategorie:** Wartbarkeit / Erweiterbarkeit
- **Fix:** In kleinere Komponenten und Hooks aufteilen.

#### Issue #40 – Hartkodierte 52-Wochen-Grenze

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx:152-157`
- **Kategorie:** Bug
- **Fix:** ISO-Jahre mit 53 Wochen berücksichtigen. `date-fns` nutzen.

#### Issue #44 – Wochen-Navigation verwirft ungespeicherte Änderungen

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx:149-174`
- **Kategorie:** UX
- **Fix:** Dirty-State tracken, Bestätigungsdialog anzeigen.

#### Issue #45 – Fetch lädt alle Jahresberichte, filtert dann clientseitig

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx:64-78`
- **Kategorie:** Performance
- **Fix:** `week`-Query-Parameter an API hinzufügen, serverseitig filtern.

#### Issue #51 – Kein Fehler-Feedback bei Review

- **Datei:** `src/app/(dashboard)/trainer/report/[id]/page.tsx:29-40`
- **Kategorie:** UX
- **Fix:** Error-State und Fehlermeldung anzeigen bei `!res.ok`.

#### Issue #55 – handleToggleActive sendet Date-Objekt gegen Zod-String-Schema

- **Datei:** `src/app/(dashboard)/admin/users/page.tsx:47-59`
- **Kategorie:** Bug
- **Fix:** ISO-String senden und Schema auf `z.string().nullable()` ändern oder coerce verwenden.

#### Issue #58 – Keine Bestätigung vor Zuordnungs-Löschung

- **Datei:** `src/app/(dashboard)/admin/assignments/page.tsx:103`
- **Kategorie:** UX
- **Fix:** Bestätigungsdialog.

#### Issue #63 – Side Effect während Render (Theme-Provider)

- **Datei:** `src/components/ui/theme-provider.tsx:51-53`
- **Kategorie:** Bug
- **Fix:** `classList.toggle` in `useEffect` verschieben.

#### Issue #69 – onSave-Instabilität triggert unnötige Autosave-Resets

- **Datei:** `src/hooks/use-autosave.ts:22-30`
- **Kategorie:** Performance
- **Fix:** Ref für onSave-Callback statt Dependency-Array.

#### Issue #76 – Datums-Validierung zu lose

- **Datei:** `src/lib/validations.ts:24`
- **Kategorie:** Datenintegrität
- **Fix:** `z.string().datetime()` oder Regex für ISO-Datumsformat.

#### Issue #78 – dailyEntries hat kein Min/Max

- **Datei:** `src/lib/validations.ts:34`
- **Kategorie:** Bug
- **Fix:** `.min(1).max(7)` oder `.length(7)` hinzufügen.

#### Issue #79 – Manuelle ISO-Woche-Berechnung fehleranfällig

- **Datei:** `src/lib/utils.ts:7-38`
- **Kategorie:** Bug
- **Fix:** `date-fns` verwenden (`getISOWeek`, `startOfISOWeek`).

#### Issue #82 – ReviewEvent.onDelete: Cascade zerstört Audit-Trail

- **Datei:** `prisma/schema.prisma:147`
- **Kategorie:** Datenintegrität
- **Fix:** `onDelete: SetNull` und `actorId` optional machen.

---

### NIEDRIG

#### Issue #6 – reportText ohne Längenbegrenzung

- **Datei:** `src/lib/validations.ts:33`
- **Fix:** `.max(50000)` hinzufügen.

#### Issue #31 – Login-Fehlermeldung ohne ARIA

- **Datei:** `src/app/(auth)/login/page.tsx:66-68`
- **Fix:** `role="alert"` hinzufügen.

#### Issue #35 – statusVariant dreifach dupliziert

- **Datei:** `trainee/page.tsx`, `trainer/page.tsx`, `officer/page.tsx`
- **Fix:** Nach `src/lib/utils.ts` extrahieren.

#### Issue #43 – Number-Inputs ohne accessible Labels

- **Datei:** `src/app/(dashboard)/trainee/reports/[week]/page.tsx:303-326`
- **Fix:** `aria-label` hinzufügen.

#### Issue #60 – Spinner-SVG ohne aria-hidden

- **Datei:** `src/components/ui/button.tsx:47-66`
- **Fix:** `aria-hidden="true"` am SVG.

#### Issue #65 – Mobiles Menü ohne Focus-Trapping und ARIA

- **Datei:** `src/components/layout/navbar.tsx:102-123`
- **Fix:** `role="dialog"`, `aria-modal`, `aria-expanded`, Focus-Trap.

#### Issue #66 – Kein Skip-to-Content-Link

- **Datei:** `src/components/layout/navbar.tsx`
- **Fix:** Visuell versteckter Link "Zum Inhalt springen" oben.

#### Issue #71 – use-session.ts redundant mit NextAuth useSession

- **Datei:** `src/hooks/use-session.ts`
- **Fix:** `SessionProvider` und `useSession` von next-auth verwenden.

#### Issue #81 – Types duplizieren Prisma-Enums

- **Datei:** `src/types/index.ts:1, 10`
- **Fix:** Aus `@prisma/client` importieren.

#### Issue #85 – Kein Soft Delete für WeeklyReports

- **Datei:** `prisma/schema.prisma:109`
- **Fix:** `onDelete: Restrict` oder Soft Deletes implementieren.

#### Issue #88 – date-fns installiert aber nicht genutzt

- **Datei:** `package.json`
- **Fix:** Entweder für ISO-Woche-Berechnung nutzen oder entfernen.

---

## Priorisierung für nächsten Sprint

### Sofort beheben (Critical + High Security)

1. Issue #37 – Submit-Bug bei neuen Berichten
2. Issue #7 – PUT ohne Validierung
3. Issue #68 – Autosave Race Condition
4. Issue #90 – Middleware erstellen
5. Issue #89 – Security Headers
6. Issue #93 – CSRF-Schutz
7. Issue #72 – JWT-Rollen-Refresh
8. Issue #30 – Rate Limiting Login
9. Issue #26 – Officer-Assignment DELETE Ownership-Check

### Als nächstes beheben (High Performance + Data Integrity)

10. Issue #11/#14 – Transaktionale Submit/Review
11. Issue #1/#48 – Paginierung
12. Issue #82 – Audit-Trail-Schutz

### Danach (Medium)

13. Issue #39 – Report-Editor aufteilen
14. Issue #52/#53 – Dashboard-Duplizierung entfernen
15. Issue #79 – date-fns für ISO-Woche nutzen
16. Issue #40 – 53-Wochen-Jahre unterstützen
17. Alle fehlenden Error-Handler in API-Routen
18. Alle fehlenden Error-States in Client-Komponenten

### Optionally (Low)

19. Accessibility-Verbesserungen (ARIA, Focus-Management, Skip-Link)
20. Loading-Skeletons
21. Redundante Dependencies entfernen
22. Types aus Prisma importieren statt duplizieren
