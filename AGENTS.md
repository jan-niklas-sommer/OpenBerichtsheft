<!-- BEGIN:nextjs-agent-rules -->
# Next.js Local-Version-Regel

This project may use a Next.js version whose APIs, conventions, routing behavior, server/client boundaries, and file structure differ from prior model knowledge.

Before writing or modifying any Next.js-related code, inspect:
- the existing project structure
- relevant files in `node_modules/next/dist/docs/`
- deprecation notices and framework warnings

Do not assume older Next.js conventions unless they are already used consistently in this repository.
<!-- END:nextjs-agent-rules -->


<!-- BEGIN:agent-workflow-rules -->
# Agentischer Arbeitsmodus

Alle Änderungen MÜSSEN in kleinen, abgeschlossenen Arbeitspaketen erfolgen.

Für jedes Arbeitspaket gilt folgender Ablauf:

1. **Planner**
   - Beschreibt Ziel, Umfang und Nicht-Ziele des Arbeitspakets.
   - Nennt betroffene Dateien, Datenmodelle, Routen, Rollen, Status oder UI-Bereiche.
   - Definiert Akzeptanzkriterien.
   - Darf noch keinen produktiven Code ändern.

2. **Reviewer**
   - Prüft den Plan auf Lücken, Widersprüche, Seiteneffekte und fehlende Tests.
   - Muss explizit auf Rollenmodell, Statusmodell, Datenintegrität und mobile Nutzbarkeit achten.
   - Gibt entweder Freigabe oder fordert Plananpassung.

3. **Implementer**
   - Implementiert nur den freigegebenen Umfang.
   - Darf keine ungeplanten Architektur-, Rollen-, Datenmodell- oder UI-Änderungen einführen.
   - Muss bestehende Projektkonventionen übernehmen.

4. **Verifier**
   - Prüft die Änderung gegen die Akzeptanzkriterien.
   - Führt verfügbare Checks aus, z. B. Typecheck, Linting, Tests oder Build.
   - Dokumentiert, welche Checks erfolgreich waren und welche nicht ausgeführt werden konnten.

5. **Fixer**
   - Wird nur aktiv, wenn der Verifier konkrete Mängel findet.
   - Behebt ausschließlich die gefundenen Mängel.
   - Danach muss erneut verifiziert werden.

Ein Arbeitspaket ist erst abgeschlossen, wenn Implementierung, Verifikation und Dokumentation abgeschlossen sind.
<!-- END:agent-workflow-rules -->


<!-- BEGIN:documentation-rules -->
# Dokumentationspflichten

Bei jeder Änderung an der Anwendung MÜSSEN die relevanten Dokumentationsdateien aktualisiert werden.

## Immer aktualisieren

- **`HANDOVER.md`**
  - Muss nach jedem Arbeitspaket um einen neuen Eintrag ergänzt werden.
  - Der Eintrag muss enthalten:
    - Datum/Zeit
    - Arbeitspaket
    - Planner-Zusammenfassung
    - Reviewer-Ergebnis
    - Implementierte Änderungen
    - Verifikationsergebnis
    - Offene Risiken oder Folgeaufgaben

## Architekturbezogen aktualisieren

- **`ARCHITECTURE.md`**
  - Muss aktualisiert werden, wenn sich eines der folgenden Themen ändert:
    - Architektur
    - Datenmodell
    - API-Routen
    - Authentifizierung
    - Rollenmodell
    - Berechtigungen
    - Statusmodell
    - Statusübergänge
    - Persistenzlogik
    - Validierungslogik
    - Seed-Daten mit architekturrelevanter Bedeutung

## Benutzerbezogen aktualisieren

- **`HANDBUCH.md`**
  - Muss aktualisiert werden, wenn sich für Benutzer sichtbare Features, Workflows, Status, Rollen, Navigation oder UI-Texte ändern.
  - Dazu gehören:
    - Neue oder geänderte Seiten/Routen
    - Neue oder geänderte Navigation
    - Neue oder geänderte Statusübergänge
    - Neue oder geänderte Rollen/Berechtigungen
    - Änderungen an Wochenberichten
    - Änderungen an Tageseinträgen
    - Änderungen an Tagestypen
    - Änderungen an Stunden-/Minutenvalidierung
    - Neue oder geänderte Fehlermeldungen
    - Neue oder geänderte UI-Texte
    - Neue Testzugänge oder geänderte Seed-Daten
    - Änderungen am Dark/Light Mode Verhalten
    - Neue FAQ-Einträge bei wiederkehrenden Nutzerfragen

Wenn unklar ist, ob eine Dokumentation aktualisiert werden muss, muss konservativ aktualisiert werden.
<!-- END:documentation-rules -->


<!-- BEGIN:quality-rules -->
# Qualitäts- und Prüfpflichten

Nach jedem Arbeitspaket müssen verfügbare Checks ausgeführt werden.

Bevorzugte Reihenfolge:

1. Typecheck
2. Linting
3. Unit Tests
4. Integration Tests
5. Build
6. Manuelle Prüfung der betroffenen User Flows

Wenn ein Check nicht existiert oder nicht ausgeführt werden kann, muss der Grund in `HANDOVER.md` dokumentiert werden.

Keine Änderung gilt als abgeschlossen, wenn bekannte Fehler verschwiegen oder nicht dokumentiert wurden.
<!-- END:quality-rules -->


<!-- BEGIN:test-rules -->
# Test-Regeln

## Grundprinzip

Alle Codepfade MÜSSEN durch Tests abgedeckt sein. 100% Branch Coverage ist das Ziel für:
- `src/lib/**` (Utils, Validierungen, Auth-Konfiguration)
- `src/hooks/**` (Custom React Hooks)
- `src/app/api/**` (Alle API-Routen)

## Test-Stack

| Schicht | Werkzeug | Zweck |
|---------|----------|-------|
| Unit Tests | Vitest | Funktionen, Validierungen, Hooks |
| Component Tests | Vitest + React Testing Library | UI-Komponenten, User-Interaktionen |
| API Tests | Vitest + Mock-Prisma | API-Routen mit gemockter Datenbank |
| E2E Tests | Playwright | Komplette User-Flows im Browser |

## Verfügbare Befehle

```bash
npm test              # Unit + API + Component Tests
npm run test:watch    # Tests im Watch-Modus
npm run test:coverage # Tests mit Coverage-Report
npm run test:e2e      # Playwright E2E Tests
```

## Pflichten bei jedem Arbeitspaket

1. **Neuer Code MUSS neue Tests enthalten.**
   - Jede neue Funktion, Route, Komponente oder Hook braucht mindestens einen Test.
   - Edge Cases und Fehlerpfade müssen getestet werden.

2. **Bestehende Tests MÜSSEN weiterhin durchlaufen.**
   - Wenn ein Test durch eine Änderung bricht, MUSS der Test angepasst ODER die Änderung korrigiert werden.
   - Ein broken Test ist ein Blocker.

3. **Coverage darf nicht sinken.**
   - Vor dem Commit muss `npm run test:coverage` ausgeführt werden.
   - Wenn Coverage sinkt, MUSS erklärt werden warum (in `HANDOVER.md`).

4. **API-Route Tests müssen abgedeckt werden:**
   - Erfolgsfall (200/201)
   - Auth-Fehler (401)
   - Berechtigungsfehler (403)
   - Validierungsfehler (400)
   - Nicht gefunden (404)
   - Statusübergänge (nur erlaubte Übergänge)

5. **E2E Tests für kritische User-Flows:**
   - Login / Logout
   - Bericht erstellen, bearbeiten, einreichen
   - Bericht prüfen (genehmigen, zurückgeben, ablehnen)
   - PDF-Export
   - Admin: User erstellen, Anonymisieren

## Test-Datei-Konvention

```
src/
  lib/
    utils.ts          → src/lib/utils.test.ts
    validations.ts    → src/lib/validations.test.ts
  hooks/
    use-autosave.ts   → src/hooks/use-autosave.test.ts
  app/api/
    reports/route.ts  → src/app/api/reports/route.test.ts
  components/
    ui/badge.tsx      → src/components/ui/badge.test.tsx
```

## Mock-Strategie

- **Prisma**: Gesamter Client wird per `vi.mock("@/lib/prisma")` gemockt.
- **Auth**: `vi.mock("@/lib/auth")` für Session-Simulation.
- **Next.js**: `next/navigation` für `useRouter`, `useParams`.
- **Externe APIs**: Nicht in Tests aufrufen, immer mocken.

## Was bei CI/CD geprüft wird

Jeder Push/PR MUSS bestehen in:
1. `npm run typecheck` (falls vorhanden)
2. `npm run lint`
3. `npm test`
4. `npm run build`

Fehlgeschlagene Checks = kein Merge.
<!-- END:test-rules -->


<!-- BEGIN:domain-rules -->
# Fachliche Domänenregeln OpenBerichtsheft

Die Anwendung verwaltet Wochenberichte für Auszubildende.

## Rollen

- **Admin**
  - Kann Ausbilder verwalten.
  - Kann Auszubildende Ausbildern zuordnen.
  - Hat systemweite Verwaltungsrechte.

- **Ausbilder**
  - Kann Ausbildungsbeauftragte verwalten oder zuordnen.
  - Kann Auszubildende betreuen.
  - Kann eingereichte Berichte prüfen, freigeben oder zurückweisen.

- **Ausbildungsbeauftragter**
  - Steht fachlich unterhalb eines Ausbilders.
  - Kann ihm zugeordnete Auszubildende betreuen.
  - Kann eingereichte Berichte prüfen, sofern zugeordnet.

- **Auszubildender**
  - Kann eigene Wochenberichte erstellen, automatisch speichern, als Entwurf behalten und einreichen.
  - Kann eigene zurückgewiesene Berichte bearbeiten und erneut einreichen.

## Wochenbericht

Ein Wochenbericht besteht aus:

- Kalenderwoche
- sieben Tagen
- pro Tag ein Tagestyp:
  - Betrieb
  - Berufsschule
  - Urlaub
  - Sonstiges
- pro Tag Stunden und Minuten
- einem großen Freitextfeld für den Wochenbericht
- Status
- zuständiger Prüfer
- Zeitstempeln für Erstellung, Änderung, Einreichung und Prüfung

## Statusmodell

Mindestens folgende Status müssen konsistent behandelt werden:

- `draft`
- `submitted`
- `approved`
- `rejected`

Statusübergänge müssen berechtigungsabhängig geprüft werden.
<!-- END:domain-rules -->


<!-- BEGIN:design-system-rules -->
# Design-System-Regeln

Verbindliche Referenz: **`DESIGN_SYSTEM.md`**

Jede UI-Änderung MUSS den dort definierten Token-Schichten folgen. Die folgenden Regeln sind nicht verhandelbar:

## Token-Pflicht

- Alle Farben, Abstände, Radien, Schriften und Schatten werden ausschließlich über CSS-Variablen referenziert.
- Keine direkten Tailwind-Color-Klassen mit konkreten Farben (z. B. `bg-emerald-500`, `text-blue-600`).
- Keine Hex-Werte in Komponenten-Code. Einzige Ausnahme: `pdf-document.tsx` (`@react-pdf/renderer` unterstützt keine Tailwind-Klassen).

## Farbschichten

Die vier Schichten aus `DESIGN_SYSTEM.md` MÜSSEN strikt getrennt werden:

1. **Neutral** — Layout, Hintergründe, Texte, Borders
2. **Akzent (Inversion)** — Primary-Buttons (Schwarz/Weiß-Inversion)
3. **Semantisch** — Status-Farben (Success/Warning/Danger/Info) für Bericht-Status, Feedback, Fehler
4. **Kategorial** — Lernort-Farben (Teal/Indigo/Yellow/Pink) für Einsatzplanung

Status-Farben dürfen NIEMALS für Kategorien verwendet werden und umgekehrt.

## Komponenten-Spezifikation

Neue und geänderte Komponenten MÜSSEN der Spezifikation in `DESIGN_SYSTEM.md` entsprechen:
- Buttons: Primary (Inversion), Secondary, Ghost, Destructive (Pastell-Hintergrund, nicht vollflächig rot)
- Inputs: Token-basierte Borders, Focus-States
- Cards: `bg-elevated`, `border-subtle`, `radius-md`
- Badges/Pills: Status-Mapping über semantische Token
- Modals: `bg-elevated`, `radius-md`, Footer mit Trennlinie
- Navigation: Header 4rem, Tab-Group, Trennlinie vor Theme/Logout

## Anti-Patterns

- Keine vollflächig gefüllten Status-Buttons
- Kein Bold (700) außer für Page-Headings
- Keine Opacity unter 0.4 für Text
- Keine Schatten mit farbigem Tint
- Keine mehr als zwei Akzentfarben pro Bildschirm
- Keine Animationen außer für State-Übergänge

## Migration

Das bestehende Codebase enthält noch hardcoded Tailwind-Color-Klassen. Diese werden schrittweise in separaten Arbeitspaketen migriert (AP2–AP7). Bis zur Migration einer Komponente gilt: keine neuen Hardcodes hinzufügen.

## UI/UX-Grundregeln

- minimalistisch, hoher Weißraum, klare Typografie
- starke Schwarz-Weiß-Kontraste
- Light Mode und Dark Mode
- mobil und Desktop nutzbar
- keine überladenen Admin-Oberflächen
- Alle zentralen Workflows müssen mobil bedienbar sein.
<!-- END:design-system-rules -->

<!-- BEGIN:git-workflow-rules -->
# Git-Workflow

Dieses Projekt verwendet Git mit Remote-Repository. Agenten MÜSSEN Änderungen versionskontrolliert und arbeitspaketbezogen durchführen.

## Grundregeln

- Niemals direkt auf `main` oder `master` arbeiten, außer der User fordert es explizit.
- Für jedes Arbeitspaket muss ein eigener Branch verwendet werden.
- Branch-Namen müssen kurz, beschreibend und technisch sein.
- Keine ungeprüften Änderungen committen.
- Keine sensiblen Daten committen, insbesondere:
  - `.env`
  - `.env.local`
  - Secrets
  - Tokens
  - API Keys
  - private Zertifikate
  - lokale Datenbankdateien
- Vor jedem Commit muss `git diff` geprüft werden.
- Vor jedem Commit muss geprüft werden, ob versehentlich generierte Dateien, Logs oder lokale Artefakte enthalten sind.
- `git push` darf nur ausgeführt werden, wenn der User es explizit erlaubt.

## Branch-Konvention

Branch-Format:

```txt
work/<kurzes-arbeitspaket>
fix/<kurzer-fehlername>
docs/<kurze-doku-aenderung>
refactor/<kurzer-refactor-name>

Beispiele:
work/report-editor
work/role-dashboard
fix/status-transition-validation
docs/update-handbook
refactor/auth-permissions

## Commit-Konvention

Commits müssen klein, nachvollziehbar und arbeitspaketbezogen sein.

Commit-Format:

```txt
type(scope): summary
```

Erlaubte Types:

| Type | Bedeutung |
|------|-----------|
| `feat` | Neues Feature |
| `fix` | Fehlerbehebung |
| `docs` | Dokumentation |
| `refactor` | Strukturänderung ohne fachliche Funktionsänderung |
| `test` | Tests |
| `chore` | Build, Tooling, Konfiguration |
| `style` | Reine UI-/Formatänderung ohne Logikänderung |

Beispiele:

```txt
feat(reports): add weekly report draft editor
fix(auth): restrict report approval to assigned reviewers
docs(handover): add work package summary
test(reports): cover report status transitions
```

## Ablauf pro Arbeitspaket

### 1. Aktuellen Stand prüfen

```bash
git status
git branch --show-current
git remote -v
```

### 2. Falls auf main oder master, neuen Branch erstellen

```bash
git checkout -b work/<kurzes-arbeitspaket>
```

### 3. Änderungen implementieren

### 4. Vor dem Commit prüfen

```bash
git status
git diff
```

### 5. Verfügbare Checks ausführen

```bash
npm run typecheck   # falls vorhanden
npm run lint
npm test            # falls vorhanden
npm run build
```

Wenn ein Script nicht existiert, darf es nicht erfunden werden.
Stattdessen muss in `HANDOVER.md` dokumentiert werden, dass der Check nicht verfügbar war.

### 6. Dokumentation aktualisieren

- `HANDOVER.md` – immer
- `ARCHITECTURE.md` – bei Architektur-, Datenmodell-, API-, Auth-, Rollen- oder Statusänderungen
- `HANDBUCH.md` – bei sichtbaren Feature-, Workflow-, Rollen-, Status-, Navigations- oder UI-Änderungen

### 7. Finalen Diff prüfen

```bash
git diff --staged
git diff
```

### 8. Commit erstellen

```bash
git add <relevante-dateien>
git commit -m "type(scope): summary"
```

### 9. Nach dem Commit prüfen

```bash
git status
git log --oneline -5
```

## Push-Regel

Agenten dürfen **NICHT** automatisch pushen.

`git push` ist nur erlaubt, wenn der User ausdrücklich sagt, dass gepusht werden soll.

Wenn Push erlaubt wurde:

```bash
git push -u origin <branch-name>
```

Danach muss der Agent dem User mitteilen:

- Branch-Name
- Commit-Hash
- Ausgeführte Checks
- Bekannte offene Risiken
- Ob Dokumentation aktualisiert wurde

## Pull-/Sync-Regel

Vor größeren Arbeitspaketen muss geprüft werden, ob der lokale Branch aktuell ist.

```bash
git fetch origin
git status
```

Kein automatisches Rebase, Merge oder Pull mit Konfliktauflösung ohne explizite User-Freigabe.
Bei Merge-Konflikten muss der Agent stoppen, den Konflikt beschreiben und eine konkrete Lösung vorschlagen.
