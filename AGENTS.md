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


<!-- BEGIN:ui-rules -->
# UI/UX-Regeln

Die Anwendung soll eine moderne, reduzierte, hochwertige Oberfläche erhalten.

Designreferenz:
- minimalistisch
- hoher Weißraum
- klare Typografie
- starke Schwarz-Weiß-Kontraste
- Light Mode und Dark Mode
- mobil und Desktop nutzbar
- keine überladenen Admin-Oberflächen

Die UI darf sich an der Anmutung moderner Fintech-Apps orientieren, aber keine geschützten Markenbestandteile, Logos oder exakte Kopien übernehmen.

Alle zentralen Workflows müssen mobil bedienbar sein.
<!-- END:ui-rules -->

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
