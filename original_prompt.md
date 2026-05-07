# Open Code Prompt: Berichtsheft-Anwendung für Ausbildung

## Zielbild

Baue eine moderne Berichtsheft-Anwendung für Auszubildende, Ausbilder, Ausbildungsbeauftragte und Administratoren. Die Anwendung soll mobil und im Webbrowser nutzbar sein. Ziel ist ein schlanker, hochwertiger Workflow, mit dem Auszubildende Wochenberichte erfassen, automatisch speichern, einreichen und durch zuständige Personen prüfen lassen können.

Die Anwendung soll sich visuell an einer sehr reduzierten, hochwertigen Fintech-Ästhetik orientieren: klare Typografie, starke Kontraste, großzügige Abstände, wenig visuelle Unruhe, präzise Interaktionen, Dark Mode und Light Mode. Als grobe Referenz dient eine reduzierte Black-and-White-Optik moderner Finanz-Apps, ohne Markenassets zu kopieren.

Das Projekt soll iterativ entwickelt werden. Arbeite nicht in einem großen Monolith-Schritt, sondern in kleinen, überprüfbaren Arbeitspaketen. Jede Iteration soll geplant, geprüft, implementiert, verifiziert und bei Bedarf korrigiert werden.

---

## Produktumfang

### Kernfunktionen

Die Anwendung muss folgende Kernfunktionen bereitstellen:

1. Benutzerverwaltung mit Rollen und Zuständigkeiten.
2. Wochenbasierte Berichtsheft-Erfassung.
3. Automatisches Speichern als Entwurf bei Änderungen.
4. Manuelles Speichern als Entwurf.
5. Einreichen eines Wochenberichts an zuständige Prüfer.
6. Dashboard für offene Prüfaufgaben.
7. Zuordnung von Ausbildern, Ausbildungsbeauftragten und Auszubildenden.
8. Statusmodell für Berichte.
9. Responsive Nutzung auf Mobilgeräten und im Webbrowser.
10. Light Mode und Dark Mode.
11. Saubere technische Dokumentation während der Entwicklung.

---

## Rollenmodell

### Rollen

Es gibt vier primäre Rollen:

#### Administrator

Administratoren verwalten die globale Struktur der Anwendung. Sie können Benutzer anlegen, Rollen vergeben und Ausbilder Auszubildenden zuordnen.

Berechtigungen:

- Benutzer erstellen, bearbeiten und deaktivieren.
- Rollen vergeben.
- Ausbilder zu Auszubildenden zuordnen.
- Ausbildungsbeauftragte optional Ausbildern oder Auszubildenden zuordnen, sofern dies für das Datenmodell sinnvoller ist.
- Alle Berichte einsehen, falls dies für Administration und Compliance erforderlich ist.
- Systemeinstellungen verwalten.

#### Ausbilder

Ausbilder sind fachlich übergeordnete Prüfer. Sie verantworten die Ausbildung bestimmter Auszubildender und können Ausbildungsbeauftragte unterhalb ihrer Ebene zuordnen.

Berechtigungen:

- Eigene zugeordnete Auszubildende sehen.
- Berichte zugeordneter Auszubildender prüfen.
- Berichte genehmigen, ablehnen oder zur Überarbeitung zurückgeben.
- Ausbildungsbeauftragte zu Auszubildenden zuordnen.
- Prüfaufgaben an Ausbildungsbeauftragte delegieren, sofern vorgesehen.
- Dashboard mit offenen Berichten sehen.

#### Ausbildungsbeauftragter

Ausbildungsbeauftragte stehen organisatorisch unterhalb der Ausbilder. Sie können Berichte prüfen, wenn sie einem Auszubildenden oder einer Abteilung zugeordnet sind.

Berechtigungen:

- Berichte der ihnen zugeordneten Auszubildenden sehen.
- Offene Prüfaufgaben im Dashboard sehen.
- Berichte genehmigen, kommentieren, ablehnen oder zur Überarbeitung zurückgeben, abhängig vom finalen Genehmigungsmodell.
- Keine globale Benutzerverwaltung.
- Keine Zuordnung von Ausbildern.

#### Auszubildender

Auszubildende schreiben und verwalten ihre eigenen Wochenberichte.

Berechtigungen:

- Eigene Wochenberichte erstellen, bearbeiten und als Entwurf speichern.
- Wochenberichte einreichen.
- Status eigener Berichte einsehen.
- Kommentare und Rückmeldungen von Prüfern sehen.
- Zur Überarbeitung zurückgegebene Berichte erneut bearbeiten und wieder einreichen.

---

## Zuständigkeitsmodell

Das System muss Zuordnungen zwischen Auszubildenden und Prüfern unterstützen.

Mindestmodell:

- Ein Auszubildender kann einem Ausbilder zugeordnet sein.
- Ein Auszubildender kann zusätzlich einem oder mehreren Ausbildungsbeauftragten zugeordnet sein.
- Ein Ausbilder kann mehrere Auszubildende betreuen.
- Ein Ausbilder kann mehrere Ausbildungsbeauftragte verwalten oder für bestimmte Auszubildende einsetzen.

Regeln:

- Administratoren können Ausbilder Auszubildenden zuordnen.
- Ausbilder können Ausbildungsbeauftragte Auszubildenden zuordnen.
- Eingereichte Berichte erscheinen im Dashboard der zuständigen Prüfer.
- Die finale Prüfzuständigkeit muss eindeutig modelliert werden. Wenn mehrere Prüfer zuständig sind, muss definiert sein, ob eine Genehmigung genügt oder ob mehrere Freigaben nötig sind.

Empfohlene Standardregel für MVP:

- Ein Bericht wird an den primär zuständigen Ausbilder eingereicht.
- Zusätzlich zugeordnete Ausbildungsbeauftragte sehen den Bericht ebenfalls im Dashboard.
- Sowohl Ausbilder als auch zugeordnete Ausbildungsbeauftragte können prüfen.
- Eine Genehmigung durch einen zuständigen Prüfer setzt den Bericht auf `approved`.
- Eine Ablehnung oder Rückgabe setzt ihn auf `needs_revision`.

---

## Berichtsheft-Erfassung

### Wochenauswahl

Auszubildende wählen eine Kalenderwoche aus. Die Anwendung zeigt die sieben Tage dieser Woche an.

Erwartetes Verhalten:

- Auswahl einer Kalenderwoche über Date Picker, Week Picker oder Kalendernavigation.
- Anzeige von Montag bis Sonntag.
- Pro Woche genau ein Bericht pro Auszubildendem.
- Bereits existierende Entwürfe oder eingereichte Berichte werden beim Öffnen der Woche geladen.
- Für Wochen ohne Bericht wird automatisch ein neuer Entwurf vorbereitet.

### Tageszeilen

Jeder der sieben Tage besitzt folgende Eingaben:

- Tag und Datum.
- Auswahl des Tagestyps.
- Stundenfeld.
- Minutenfeld.

Tagestypen:

- Betrieb
- Berufsschule
- Urlaub
- Sonstiges

Zeitfelder:

- Stunden als numerischer Wert.
- Minuten als numerischer Wert.
- Minuten sollten idealerweise auf 0 bis 59 validiert werden.
- Stunden sollten nicht negativ sein.
- Optional kann eine Maximalgrenze gesetzt werden, zum Beispiel 24 Stunden pro Tag.

### Wochenbericht-Text

Oben in der Eingabemaske befindet sich ein großes Textfeld für den Wochenbericht.

Anforderungen:

- Mehrzeiliges Textfeld.
- Gute mobile Bedienbarkeit.
- Autosize oder ausreichend Höhe.
- Speicherung als Rich Text ist für das MVP nicht nötig; Plain Text genügt.
- Optional später Markdown-Unterstützung.

### Speichern und Einreichen

Die Anwendung soll Änderungen automatisch speichern.

Verhalten:

- Jede relevante Änderung triggert Autosave mit Debounce.
- Während des Speicherns wird ein dezenter Status angezeigt, zum Beispiel „Speichert…“.
- Nach erfolgreichem Speichern wird „Gespeichert“ oder ein unaufdringlicher Timestamp angezeigt.
- Fehler beim Autosave müssen sichtbar, aber nicht aufdringlich sein.
- Zusätzlich gibt es eine explizite Aktion „Als Entwurf speichern“.
- Es gibt eine Aktion „Einreichen“.

Beim Einreichen:

- Der Bericht wird validiert.
- Der Status wechselt von `draft` zu `submitted`.
- Der Bericht wird für Auszubildende gesperrt oder nur noch eingeschränkt editierbar, bis er zurückgegeben wird.
- Zuständige Prüfer sehen ihn in ihrem Dashboard.

---

## Statusmodell

Ein Bericht soll mindestens folgende Status besitzen:

- `draft`: Entwurf, noch nicht eingereicht.
- `submitted`: Eingereicht und wartet auf Prüfung.
- `approved`: Genehmigt.
- `rejected`: Abgelehnt, falls eine harte Ablehnung benötigt wird.
- `needs_revision`: Zur Überarbeitung zurückgegeben.

Empfohlene MVP-Nutzung:

- `draft`: frei bearbeitbar.
- `submitted`: durch Auszubildenden nicht bearbeitbar.
- `approved`: final gesperrt.
- `needs_revision`: wieder bearbeitbar, mit Kommentar des Prüfers.
- `rejected`: optional, nur wenn fachlich benötigt.

Statusübergänge:

```text
draft -> submitted
submitted -> approved
submitted -> needs_revision
submitted -> rejected
needs_revision -> submitted
```

---

## Dashboard

### Prüfer-Dashboard

Ausbilder und Ausbildungsbeauftragte benötigen ein Dashboard für offene Prüfaufgaben.

Inhalte:

- Liste offener eingereichter Berichte.
- Filter nach Auszubildendem.
- Filter nach Kalenderwoche.
- Filter nach Status.
- Sortierung nach Einreichungsdatum.
- Schneller Zugriff auf Detailansicht.

Aktionen:

- Bericht öffnen.
- Bericht genehmigen.
- Bericht zur Überarbeitung zurückgeben.
- Kommentar hinzufügen.
- Optional ablehnen.

### Auszubildenden-Dashboard

Auszubildende benötigen eine Übersicht über ihre eigenen Berichte.

Inhalte:

- Kalenderwochen.
- Status je Woche.
- Letzte Änderung.
- Eingereicht am.
- Geprüft am.
- Kommentarhinweise.

### Admin-Dashboard

Administratoren benötigen Verwaltungssichten.

Inhalte:

- Benutzerliste.
- Rollenverwaltung.
- Zuordnungen zwischen Auszubildenden, Ausbildern und Ausbildungsbeauftragten.
- Optional Audit- oder Aktivitätsübersicht.

---

## UX- und Designanforderungen

### Allgemeine Designrichtung

Die Anwendung soll modern, ruhig und hochwertig wirken. Vermeide überladene UI, bunte Dashboard-Optik und klassische Enterprise-Schwere.

Designprinzipien:

- Reduzierte Farbpalette.
- Hoher Weißraumanteil.
- Klare Hierarchie.
- Große, gut lesbare Typografie.
- Präzise Buttons.
- Abgerundete Cards, aber nicht verspielt.
- Dezente Borders statt schwerer Schatten.
- Schnelle, ruhige Microinteractions.
- Mobile-first Layout.

### Light Mode

- Hintergrund: sehr hell, nahezu weiß.
- Text: schwarz oder sehr dunkles Grau.
- Flächen: weiß oder leicht abgesetztes Grau.
- Borders: subtil.
- Primäraktionen: schwarz auf weiß oder weiß auf schwarz.

### Dark Mode

- Hintergrund: schwarz oder sehr dunkles Grau.
- Text: weiß oder sehr helles Grau.
- Flächen: dunkle Cards mit subtiler Abgrenzung.
- Borders: dunkle Graustufen.
- Primäraktionen: weiß auf schwarz oder schwarz auf weiß, je nach Kontrastlogik.

### Mobile UX

Die mobile Ansicht ist kein nachträglicher Kompromiss. Die App soll auf Smartphones sauber bedienbar sein.

Mobile Anforderungen:

- Wochenbericht-Textfeld gut erreichbar.
- Tageszeilen kompakt, aber nicht gequetscht.
- Tagestyp-Auswahl als Segmented Control, Select oder Bottom Sheet.
- Stunden und Minuten als einfache numerische Eingaben.
- Sticky Action Bar für Speichern und Einreichen optional.
- Dashboard-Listen als Cards statt breite Tabellen.

### Web UX

Die Webansicht kann mehr horizontale Fläche nutzen.

Web Anforderungen:

- Berichtstext prominent oben oder links.
- Tagesdetails darunter oder rechts als strukturierte Wochenkarte.
- Dashboard-Listen optional als Tabelle.
- Verwaltungssichten dürfen tabellarisch sein, müssen aber visuell reduziert bleiben.

---

## Technische Zielarchitektur

Wähle eine Architektur, die mobil und im Browser funktioniert. Bevorzuge eine moderne Web-App mit responsivem Design. Falls keine Vorgabe für den Stack existiert, triff eine begründete Entscheidung und dokumentiere sie in `ARCHITECTURE.md`.

Empfohlener Stack für MVP:

- Frontend: React oder Next.js.
- Styling: Tailwind CSS oder ein vergleichbares Utility-first-System.
- Backend: Next.js API Routes, Node.js Backend oder vergleichbare API-Schicht.
- Datenbank: PostgreSQL.
- ORM: Prisma oder vergleichbares ORM.
- Authentifizierung: rollenbasierte Authentifizierung, zum Beispiel NextAuth/Auth.js oder eigene JWT/Session-Lösung.
- Deploymentfähigkeit: Docker oder klar dokumentierte lokale Entwicklungsumgebung.

Wenn ein anderer Stack besser zum bestehenden Repository passt, verwende den bestehenden Stack. Keine unnötige Migration ohne Grund.

---

## Datenmodell, konzeptionell

Das konkrete Schema soll im Projekt sauber ausgearbeitet werden. Als Mindestmodell gelten folgende Entitäten.

### User

Felder:

- `id`
- `email`
- `name`
- `role`
- `createdAt`
- `updatedAt`
- `deactivatedAt` optional

Rollenwerte:

- `admin`
- `trainer`
- `training_officer`
- `trainee`

Hinweis: Falls deutsche Rollennamen im UI verwendet werden, kann das interne Modell trotzdem englische stabile Keys verwenden.

### Assignment

Modelliert Zuständigkeiten.

Felder:

- `id`
- `traineeId`
- `trainerId`
- `trainingOfficerId` optional
- `createdAt`
- `updatedAt`

Alternativ können zwei getrennte Tabellen verwendet werden:

- `TraineeTrainerAssignment`
- `TraineeTrainingOfficerAssignment`

Wähle die Variante, die im konkreten Stack sauberer ist.

### WeeklyReport

Felder:

- `id`
- `traineeId`
- `weekStartDate`
- `weekEndDate`
- `calendarYear`
- `calendarWeek`
- `reportText`
- `status`
- `submittedAt`
- `reviewedAt`
- `reviewedById`
- `reviewComment`
- `createdAt`
- `updatedAt`

Constraints:

- Pro Auszubildendem und Kalenderwoche darf es nur einen Bericht geben.
- `weekStartDate` sollte Montag sein.
- `weekEndDate` sollte Sonntag sein.

### DailyEntry

Felder:

- `id`
- `weeklyReportId`
- `date`
- `dayType`
- `hours`
- `minutes`
- `createdAt`
- `updatedAt`

DayType-Werte:

- `company`
- `vocational_school`
- `vacation`
- `other`

### ReviewEvent oder AuditLog optional

Für Nachvollziehbarkeit sollte mittelfristig ein Audit- oder Review-Log vorgesehen werden.

Felder:

- `id`
- `weeklyReportId`
- `actorId`
- `action`
- `comment`
- `createdAt`

Mögliche Actions:

- `created`
- `autosaved`
- `submitted`
- `approved`
- `needs_revision`
- `rejected`

Für das MVP kann ein vollständiger Audit-Log optional sein, aber die Architektur soll ihn nicht verhindern.

---

## Validierungsregeln

Mindestvalidierungen:

- Ein Bericht muss einer gültigen Kalenderwoche zugeordnet sein.
- Es darf nur einen Bericht pro Auszubildendem und Woche geben.
- Minuten müssen zwischen 0 und 59 liegen.
- Stunden dürfen nicht negativ sein.
- Tagestyp muss einer der definierten Werte sein.
- Nur der Besitzer darf eigene Entwürfe bearbeiten.
- Eingereichte oder genehmigte Berichte dürfen nicht ohne Statusänderung bearbeitet werden.
- Nur zuständige Ausbilder oder Ausbildungsbeauftragte dürfen prüfen.
- Nur Administratoren dürfen Ausbilder Auszubildenden zuordnen.
- Nur Ausbilder dürfen Ausbildungsbeauftragte zuordnen, sofern diese unter ihrer Zuständigkeit stehen.

---

## Nicht-funktionale Anforderungen

### Sicherheit

- Rollenbasierte Zugriffskontrolle serverseitig erzwingen, nicht nur im Frontend.
- Jede API-Route muss Authentifizierung und Autorisierung prüfen.
- Keine Berichte fremder Auszubildender an unzuständige Nutzer ausliefern.
- Eingaben validieren und serverseitig absichern.
- Keine vertraulichen Fehlerdetails an den Client senden.

### Datenintegrität

- Eindeutige Constraints für Wochenberichte.
- Transaktionen bei Einreichung und Review-Aktionen.
- Autosave darf keine doppelten Berichte erzeugen.
- Race Conditions beim Autosave berücksichtigen.

### Performance

- Dashboard-Abfragen paginieren oder sinnvoll begrenzen.
- Keine unnötigen Full-Table-Scans bei Berichten.
- Indizes auf `traineeId`, `status`, `calendarYear`, `calendarWeek`, `weekStartDate`.

### Barrierearmut

- Tastaturbedienbarkeit.
- Ausreichende Kontraste in Light und Dark Mode.
- Labels für Formularfelder.
- Fokuszustände sichtbar machen.

---

## Agentenbasierter Arbeitsprozess

Arbeite in jedem Arbeitspaket mit folgenden Rollen. Diese Rollen sind als Denk- und Arbeitsphasen zu verstehen, nicht zwingend als echte separate Programme.

### 1. Planner

Aufgabe:

- Analysiert das nächste Arbeitspaket.
- Zerlegt es in konkrete technische Schritte.
- Identifiziert Dateien, Module, Datenmodelle, API-Routen und UI-Komponenten, die betroffen sind.
- Formuliert Akzeptanzkriterien.
- Schreibt einen kurzen Plan in die Übergabe.

Output:

- Ziel des Arbeitspakets.
- Betroffene Dateien.
- Umsetzungsschritte.
- Risiken.
- Akzeptanzkriterien.

### 2. Reviewer

Aufgabe:

- Prüft den Plan auf Lücken, falsche Annahmen und Risiken.
- Achtet auf Rollenmodell, Datenintegrität, Sicherheit und UI-Konsistenz.
- Ergänzt fehlende Anforderungen.
- Gibt den Plan frei oder fordert Anpassungen.

Output:

- Review-Kommentar.
- Gefundene Lücken.
- Freigabe oder Korrekturanforderung.

### 3. Implementer

Aufgabe:

- Implementiert nur das freigegebene Arbeitspaket.
- Vermeidet Scope Creep.
- Schreibt lesbaren, wartbaren Code.
- Aktualisiert Tests oder legt neue Tests an, wenn sinnvoll.
- Aktualisiert Dokumentation, wenn Architektur oder Verhalten betroffen sind.

Output:

- Implementierte Änderungen.
- Geänderte Dateien.
- Offene Fragen oder technische Schulden.

### 4. Verifier

Aufgabe:

- Prüft die Implementierung gegen Akzeptanzkriterien.
- Führt Tests, Linting und Typechecks aus, sofern vorhanden.
- Prüft relevante UI-Flows logisch, auch wenn keine Browser-Automation vorhanden ist.
- Achtet besonders auf Berechtigungen und Statusübergänge.

Output:

- Testergebnisse.
- Gefundene Fehler.
- Freigabe oder Fix-Anforderung.

### 5. Fixer

Aufgabe:

- Behebt nur die konkret gefundenen Fehler.
- Führt danach erneut minimale Verifikation aus.
- Dokumentiert die Korrektur.

Output:

- Fixbeschreibung.
- Erneute Testergebnisse.
- Restunsicherheiten.

---

## Pflichtdokumentation während der Entwicklung

Das Projekt muss während der Entwicklung mindestens zwei Markdown-Dateien pflegen.

### `ARCHITECTURE.md`

Diese Datei beschreibt die aktuelle Architektur.

Mindestinhalt:

- Gewählter Tech Stack.
- Projektstruktur.
- Datenmodell.
- Rollen- und Berechtigungsmodell.
- Wichtige API-Routen.
- Statusmodell der Berichte.
- Autosave-Strategie.
- Authentifizierungs- und Autorisierungslogik.
- Designsystem-Grundlagen.
- Bekannte technische Schulden.

Diese Datei muss aktualisiert werden, wenn sich Architekturentscheidungen ändern.

### `HANDOVER.md`

Diese Datei enthält die fortlaufenden Übergaben zwischen den Agentenphasen.

Jeder Eintrag soll enthalten:

```markdown
## YYYY-MM-DD HH:mm - Arbeitspaket: <Name>

### Planner
- Ziel:
- Betroffene Dateien:
- Schritte:
- Risiken:
- Akzeptanzkriterien:

### Reviewer
- Bewertung:
- Lücken:
- Entscheidung:

### Implementer
- Änderungen:
- Geänderte Dateien:
- Hinweise:

### Verifier
- Prüfungen:
- Ergebnis:
- Fehler:

### Fixer
- Fixes:
- Ergebnis nach Fix:
- Restunsicherheiten:
```

---

## Arbeitspaket-Struktur

Bearbeite das Projekt in kleinen, kontrollierten Paketen. Nutze ungefähr folgende Reihenfolge, sofern das bestehende Repository nichts anderes nahelegt.

### Arbeitspaket 1: Projektanalyse und Architekturentscheidung

Ziel:

- Bestehendes Repository analysieren.
- Tech Stack erkennen oder festlegen.
- `ARCHITECTURE.md` initial erstellen.
- `HANDOVER.md` initial erstellen.

Akzeptanzkriterien:

- Projektstruktur ist dokumentiert.
- Tech Stack ist begründet.
- Nächste Arbeitspakete sind ableitbar.

### Arbeitspaket 2: Grundlayout und Designsystem

Ziel:

- App-Shell erstellen.
- Light und Dark Mode vorbereiten.
- Typografie, Abstände, Cards, Buttons, Inputs definieren.
- Mobile-first Layout etablieren.

Akzeptanzkriterien:

- Grundlayout funktioniert mobil und im Web.
- Dark und Light Mode sind umschaltbar oder systembasiert verfügbar.
- UI wirkt reduziert, hochwertig und konsistent.

### Arbeitspaket 3: Authentifizierung und Rollenmodell

Ziel:

- Benutzerrollen modellieren.
- Authentifizierung anbinden oder vorbereiten.
- Serverseitige Autorisierung etablieren.

Akzeptanzkriterien:

- Rollen `admin`, `trainer`, `training_officer`, `trainee` existieren.
- Geschützte Bereiche sind nur mit passender Rolle erreichbar.
- Autorisierung wird serverseitig geprüft.

### Arbeitspaket 4: Datenmodell und Persistenz

Ziel:

- Datenbankschema für User, Assignments, WeeklyReports und DailyEntries erstellen.
- Migrationen erzeugen.
- Constraints und Indizes setzen.

Akzeptanzkriterien:

- Pro Auszubildendem und Woche kann nur ein Bericht existieren.
- DailyEntries hängen sauber am WeeklyReport.
- Rollen- und Zuständigkeitsdaten sind persistierbar.

### Arbeitspaket 5: Wochenbericht-Editor

Ziel:

- Kalenderwochenauswahl bauen.
- Sieben Tageszeilen anzeigen.
- Tagestyp, Stunden und Minuten erfassen.
- Großes Textfeld für Wochenbericht bereitstellen.

Akzeptanzkriterien:

- Eine Woche zeigt Montag bis Sonntag korrekt an.
- Alle Tagesdaten sind editierbar.
- Der Berichtstext ist editierbar.
- Validierung verhindert offensichtlich ungültige Zeitwerte.

### Arbeitspaket 6: Autosave und Entwurfslogik

Ziel:

- Änderungen automatisch speichern.
- Entwurfsstatus verwalten.
- Speichern-Status in der UI anzeigen.

Akzeptanzkriterien:

- Änderungen erzeugen oder aktualisieren einen Draft.
- Autosave verwendet Debounce.
- Fehler werden sichtbar angezeigt.
- Keine doppelten Wochenberichte entstehen.

### Arbeitspaket 7: Einreichen und Statusübergänge

Ziel:

- Einreichungsaktion implementieren.
- Status von `draft` zu `submitted` wechseln.
- Bearbeitung nach Einreichung einschränken.

Akzeptanzkriterien:

- Nur eigene Drafts können eingereicht werden.
- Eingereichte Berichte erscheinen für zuständige Prüfer.
- Eingereichte Berichte sind für Auszubildende gesperrt.

### Arbeitspaket 8: Prüfer-Dashboard

Ziel:

- Dashboard für Ausbilder und Ausbildungsbeauftragte bauen.
- Offene Berichte anzeigen.
- Detailansicht bereitstellen.

Akzeptanzkriterien:

- Prüfer sehen nur Berichte, für die sie zuständig sind.
- Offene Berichte sind nach Status filterbar.
- Detailansicht zeigt Wochenbericht und Tagesdaten.

### Arbeitspaket 9: Review-Aktionen

Ziel:

- Genehmigen, Zurückgeben und optional Ablehnen implementieren.
- Review-Kommentar speichern.

Akzeptanzkriterien:

- Zuständige Prüfer können Berichte genehmigen.
- Zuständige Prüfer können Berichte mit Kommentar zur Überarbeitung zurückgeben.
- Statusübergänge sind validiert.
- Auszubildende sehen Rückmeldungen.

### Arbeitspaket 10: Admin- und Zuordnungsverwaltung

Ziel:

- Admin-Oberfläche für Benutzer und Zuordnungen bauen.
- Ausbilder-Ausbildungsbeauftragten-Ausbildungsstruktur abbilden.

Akzeptanzkriterien:

- Administratoren können Ausbilder Auszubildenden zuordnen.
- Ausbilder können Ausbildungsbeauftragte Auszubildenden zuordnen.
- Unberechtigte Nutzer können keine Zuordnungen ändern.

### Arbeitspaket 11: Qualitätssicherung

Ziel:

- Tests, Typechecks, Linting und manuelle Flow-Prüfung durchführen.
- Kritische Edge Cases prüfen.

Akzeptanzkriterien:

- Zentrale Berechtigungsfälle sind getestet oder nachvollziehbar geprüft.
- Autosave und Einreichung funktionieren stabil.
- Mobile und Web-Layout sind verwendbar.
- `ARCHITECTURE.md` und `HANDOVER.md` sind aktuell.

---

## Akzeptanzkriterien für das MVP

Das MVP ist akzeptabel, wenn folgende Bedingungen erfüllt sind:

- Auszubildende können eine Kalenderwoche öffnen.
- Die Woche zeigt sieben Tage.
- Für jeden Tag können Tagestyp, Stunden und Minuten gepflegt werden.
- Ein Wochenbericht kann im großen Textfeld geschrieben werden.
- Änderungen werden automatisch als Entwurf gespeichert.
- Ein Bericht kann eingereicht werden.
- Zuständige Ausbilder oder Ausbildungsbeauftragte sehen eingereichte Berichte im Dashboard.
- Zuständige Prüfer können genehmigen oder zur Überarbeitung zurückgeben.
- Administratoren können Ausbilder Auszubildenden zuordnen.
- Ausbilder können Ausbildungsbeauftragte zu Auszubildenden zuordnen.
- Rollenbasierte Zugriffskontrolle funktioniert serverseitig.
- Die Anwendung funktioniert mobil und im Browser.
- Light und Dark Mode sind vorhanden.
- Die visuelle Gestaltung ist reduziert, modern und konsistent.
- `ARCHITECTURE.md` und `HANDOVER.md` sind gepflegt.

---

## Explizite Nicht-Ziele für das MVP

Folgende Funktionen sind nicht zwingend Teil des MVP, dürfen aber architektonisch vorbereitet werden:

- PDF-Export des Berichtshefts.
- Digitale Signatur.
- E-Mail-Benachrichtigungen.
- Push Notifications.
- Komplexe Mandantenfähigkeit.
- Mehrstufige Genehmigungsketten.
- Rich-Text-Editor.
- Offline-first Synchronisation.
- Import aus bestehenden HR-Systemen.

Diese Funktionen nicht ohne ausdrücklichen Grund implementieren. Lieber das MVP stabil und sauber bauen.

---

## Implementierungsregeln

Halte dich während der Umsetzung an folgende Regeln:

1. Arbeite immer in kleinen Arbeitspaketen.
2. Vor jeder Implementierung muss ein Plan formuliert werden.
3. Der Plan muss durch eine Reviewer-Phase geprüft werden.
4. Implementiere nur den freigegebenen Scope.
5. Nach der Implementierung muss verifiziert werden.
6. Bei Fehlern folgt eine gezielte Fixer-Phase.
7. Aktualisiere `HANDOVER.md` nach jedem Arbeitspaket.
8. Aktualisiere `ARCHITECTURE.md`, wenn Architektur, Datenmodell, API, Auth oder UI-System betroffen sind.
9. Sicherheit und Datenintegrität haben Vorrang vor UI-Feinschliff.
10. Keine rein clientseitige Autorisierung für geschützte Daten.
11. Keine doppelten Wochenberichte durch Autosave erzeugen.
12. Keine unklare Rollenlogik implizit lassen; dokumentiere jede Regel.
13. Vermeide Scope Creep.
14. Wenn eine fachliche Entscheidung unklar ist, triff für das MVP eine plausible, dokumentierte Standardentscheidung und markiere sie als Annahme.

---

## Erwartetes Verhalten des Coding-Agenten

Wenn du dieses Prompt in Open Code verwendest, soll der Agent zuerst das Repository analysieren und dann mit Arbeitspaket 1 beginnen. Er soll nicht sofort die komplette Anwendung auf einmal bauen.

Der Agent soll bei jedem Arbeitspaket nach folgendem Muster arbeiten:

```markdown
# Arbeitspaket <Nummer>: <Titel>

## Planner
<Plan>

## Reviewer
<Review des Plans>

## Implementer
<Implementierungsschritte und Änderungen>

## Verifier
<Prüfung gegen Akzeptanzkriterien>

## Fixer
<Falls nötig: Korrekturen>

## Übergabe
<Zusammenfassung für das nächste Arbeitspaket>
```

Wenn Tests oder Checks vorhanden sind, sollen sie ausgeführt werden. Wenn keine Tests vorhanden sind, soll der Agent sinnvolle minimale Tests oder zumindest eine nachvollziehbare manuelle Verifikationsliste ergänzen.

---

## Erste Anweisung an den Agenten

Beginne jetzt mit Arbeitspaket 1.

Analysiere das vorhandene Repository. Erkenne den bestehenden Tech Stack, die Projektstruktur und mögliche Einstiegspunkte. Erstelle oder aktualisiere `ARCHITECTURE.md` und `HANDOVER.md`. Formuliere danach den Plan für Arbeitspaket 2, aber implementiere Arbeitspaket 2 noch nicht, bevor Arbeitspaket 1 sauber abgeschlossen und verifiziert ist.
