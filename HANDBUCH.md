# Benutzerhandbuch – OpenBerichtsheft

Letzte Aktualisierung: 2026-05-10

---

## Inhaltsverzeichnis

1. [Einführung](#1-einführung)
2. [Erstanmeldung und Zugang](#2-erstanmeldung-und-zugang)
3. [Allgemeine Bedienung](#3-allgemeine-bedienung)
4. [Rolle: Auszubildende(r)](#4-rolle-auszubildender)
5. [Rolle: Ausbilder](#5-rolle-ausbilder)
6. [Rolle: Ausbildungsbeauftragte(r)](#6-rolle-ausbildungsbeauftragter)
7. [Rolle: Administrator](#7-rolle-administrator)
8. [Statusübersicht der Berichte](#8-statusübersicht-der-berichte)
9. [Benachrichtigungen](#9-benachrichtigungen)
10. [Dark Mode / Light Mode](#10-dark-mode--light-mode)
11. [Häufige Fragen (FAQ)](#11-häufige-fragen-faq)

---

## 1. Einführung

OpenBerichtsheft dient der Erfassung, Einreichung und Prüfung von Wochen- und Tagesberichten während der Ausbildung. Es ersetzt den papierbasierten Ausbildungsnachweis und bietet einen strukturierten Workflow zwischen Auszubildenden, Ausbildern, Ausbildungsbeauftragten und Administratoren.

**Vorteile:**

- Automatisches Speichern beim Schreiben
- Sofortige Einreichung an den zuständigen Prüfer
- Transparenter Status für alle Beteiligten
- Nutzung auf Smartphone, Tablet und Desktop
- Dark Mode und Light Mode

---

## 2. Erstanmeldung und Zugang

### Zugang erhalten

Ein Administrator erstellt Ihren Zugang und teilt Ihnen E-Mail-Adresse und Initialpasswort mit.

### Anmelden

1. Öffnen Sie die Anwendung im Browser.
2. Geben Sie Ihre **E-Mail-Adresse** und Ihr **Passwort** ein.
3. Klicken Sie auf **Anmelden**.

Nach der Anmeldung werden Sie automatisch in die Ihrem Rolle entsprechende Übersicht weitergeleitet.

**Hilfen auf der Anmeldeseite:**

- Über dem Anmeldeformular erscheint das **OpenBerichtsheft-Logo** (Notizbuch-Symbol) mit dem Untertitel *Digitale Ausbildungsdokumentation*.
- Das **Augen-Symbol** rechts im Passwortfeld blendet das Passwort ein oder aus.
- Oben rechts kann der **Dark-/Light-Mode** über das Sonne-/Mond-Symbol auch vor der Anmeldung gewechselt werden.
- Bei fehlerhaften Anmeldedaten erscheint eine Hinweisbox mit dem Fehlergrund.

### Registrieren (Selbstregistrierung)

Über den Link *Noch kein Konto? Jetzt registrieren* unter dem Anmeldeformular können sich Auszubildende selbst ein Konto anlegen. Nach der Registrierung erhalten Sie eine E-Mail mit einem Verifizierungslink (24 Stunden gültig), den Sie bestätigen müssen, bevor die Anmeldung möglich ist.

### Login-Schutz (Rate Limiting)

Nach **5 fehlgeschlagenen Anmeldeversuchen** wird der Login für **15 Minuten gesperrt**. Warten Sie die Sperrzeit ab und versuchen Sie es erneut. Bei anhaltenden Problemen wenden Sie sich an den Administrator.

### Passwort ändern

Die Passwortänderung erfolgt aktuell über den Administrator. Wenden Sie sich an diesen, wenn Sie Ihr Passwort ändern möchten.

### Rollenänderungen

Wenn ein Administrator Ihre Rolle ändert, wird die neue Rolle beim nächsten Seitenladen automatisch übernommen. Ein erneutes Einloggen ist nicht zwingend erforderlich.

---

## 3. Allgemeine Bedienung

### Navigation

Oben sehen Sie die Navigationsleiste mit den für Ihre Rolle verfügbaren Menüpunkten.

- **Desktop**: Alle Menüpunkte sind direkt sichtbar.
- **Mobil**: Tippen Sie auf das Menü-Symbol (drei Striche) oben links, um die Navigation zu öffnen.

### Abmelden

Klicken Sie auf das Logout-Symbol (Pfeil aus dem Kasten) oben rechts in der Navigationsleiste.

### Passwort ändern

Klicken Sie auf das Schlüssel-Symbol oben rechts in der Navigationsleiste (neben dem Theme-Umschalter). Geben Sie Ihr aktuelles Passwort, das neue Passwort (mindestens 8 Zeichen) und die Bestätigung ein. Das neue Passwort muss sich vom aktuellen unterscheiden.

---

## 4. Rolle: Auszubildende(r)

Als Auszubildende(r) schreiben und verwalten Sie Ihre eigenen Wochen- und Tagesberichte.

### 4.1 Übersicht

Nach der Anmeldung sehen Sie Ihre **Berichtsübersicht** mit einer **Jahreskalender-Ansicht** und einer Monatsansicht darunter.

**Jahreskalender:**

- Wochenleiste (1 Zeile, 52 Wochen pro Jahr), jede Zelle stellt eine Woche dar
- Farbcodierung nach Status, Wochen vor Ausbildungsbeginn ausgegraut
- Aktuelle Woche mit Rahmen hervorgehoben
- Bewegen Sie die Maus über eine Zelle, um Datumsbereich und Status zu sehen (Tooltip)
- Klicken Sie auf eine Woche, um den Bericht zu öffnen
- Die Statuslegende wird über das Info-Icon eingeblendet

**Monatsansicht:**

Darunter sehen Sie die detaillierte Monatsansicht mit Wochen und Status-Labels.

| Status | Bedeutung |
|--------|-----------|
| **Entwurf** | Bericht wird bearbeitet, noch nicht eingereicht |
| **Eingereicht** | Bericht wurde eingereicht und wartet auf Prüfung |
| **Genehmigt** | Bericht wurde vom Prüfer freigegeben |
| **Überarbeitung erforderlich** | Prüfer hat den Bericht mit Kommentar zurückgegeben |
| **Abgelehnt** | Bericht wurde endgültig abgelehnt |

### 4.2 Neuen Bericht erstellen

1. Klicken Sie auf **Neuer Bericht** (oben rechts).
2. Die aktuelle Kalenderwoche wird automatisch geöffnet.
3. Wenn für diese Woche bereits ein Entwurf existiert, wird dieser geladen.
4. Wenn **kein Bericht existiert**, werden die Tageseinträge automatisch aus der Einsatzplanung **vorausgefüllt** (z.B. Berufsschultage, Abteilungseinsatz). Sie können alle Felder frei bearbeiten.

**Hinweis:** Der Prefill basiert auf der aktuellen Einsatzplanung — wenn Ihr Ausbilder die Planung ändert, wirkt sich das nur auf noch nicht erstellte Berichte aus. Bereits erstellte Berichte bleiben unverändert.

### 4.3 Wochen- oder Tagesbericht schreiben

Sie können im Editor zwischen zwei Berichtstypen wechseln:

- **Wochenbericht**: Ein großer Freitextbereich für die Wochenbeschreibung + Tageseinträge.
- **Tagesbericht**: Kein globaler Freitext, stattdessen ein Freitextfeld **pro Arbeitstag** unter den Tageseinträgen.

Die Umschaltung erfolgt über die beiden Buttons **Wochenbericht** / **Tagesbericht** oberhalb des Editors.

**Nicht-Arbeitstage** (z.B. Samstag, Sonntag) werden automatisch ausgegraut und mit "–" und 0 Stunden vorbelegt. Die Standard-Arbeitstage werden vom Administrator konfiguriert (Standard: Montag–Freitag).

#### Wochenbericht-Text (nur Wochenbericht-Modus)

- Großes Textfeld oben im Editor.
- Hier beschreiben Sie Ihre Tätigkeiten der Woche.
- Der Text wird **automatisch gespeichert** während Sie tippen.

#### Tageseinträge

Für jeden der sieben Tage (Montag bis Sonntag) erfassen Sie:

| Feld | Erklärung |
|------|-----------|
| **Tag/Datum** | Wird automatisch angezeigt, nicht editierbar |
| **Tagestyp** | Art des Tages: Betrieb, Berufsschule, Urlaub oder Sonstiges |
| **Stunden** | Gearbeitete Stunden (0–24) |
| **Minuten** | Zusätzliche Minuten (0–59) |

Die **Wochensumme** der Stunden wird rechts oben in der Tageseinträge-Karte angezeigt (z.B. "40h 0min").

**Tagestypen:**

| Typ | Wann wählen? |
|-----|-------------|
| **Betrieb** | Normaler Arbeitstag im Unternehmen |
| **Berufsschule** | Berufsschultag |
| **Urlaub** | Urlaubstag |
| **Sonstiges** | Feiertag, Krankheit, etc. |

### 4.4 Wochennavigation

- Mit den Pfeiltasten links und rechts neben der Wochennummer navigieren Sie zu **vorherigen** oder **nächsten** Wochen.
- Die URL zeigt das Format `trainee/reports/JAHR-WOCHE`, z. B. `trainee/reports/2026-19`.

### 4.5 Speichern

**Automatisches Speichern (Autosave):**

- Jede Änderung wird nach 20 Sekunden automatisch gespeichert.
- Der Speicherstatus wird oben rechts angezeigt:
  - **Speichert...** = Daten werden übertragen
  - **Zuletzt gespeichert vor X Sekunden** = Erfolgreich gespeichert, mit relativer Zeitangabe
  - **Fehler** = Speichern fehlgeschlagen (bitte manuell speichern)

**Manuell speichern:**

- Klicken Sie auf **Speichern** (Disketten-Symbol), um sofort zu speichern.

### 4.6 Bericht einreichen

Wenn der Bericht fertig ist:

1. Klicken Sie auf **Einreichen** (Pfeil-Symbol).
2. Der Status wechselt zu **Eingereicht**.
3. Der Bericht ist nun **gesperrt** – Sie können ihn nicht mehr bearbeiten.
4. Der zuständige Prüfer erhält den Bericht in seinem Dashboard.

**Eingereichten Bericht zurückziehen:**

Wenn Sie den Bericht nochmal überarbeiten möchten, bevor der Prüfer ihn sieht:

1. Öffnen Sie den eingereichten Bericht.
2. Klicken Sie auf **Zurückziehen** (Rückgängig-Symbol).
3. Der Status wechselt zurück zu **Entwurf** und der Bericht ist wieder editierbar.

**Hinweis:** Ein bereits genehmigter oder abgelehnter Bericht kann nicht zurückgezogen werden.

**Wichtig:** Nur Berichte im Status **Entwurf** oder **Überarbeitung erforderlich** können eingereicht werden.

### 4.7 Rückmeldung des Prüfers

Wenn ein Prüfer Ihren Bericht zur Überarbeitung zurückgibt:

1. Der Status wechselt zu **Überarbeitung erforderlich**.
2. In der Berichtsübersicht sehen Sie einen **Kommentar-Hinweis**.
3. Im Editor wird der **Kommentar des Prüfers** gelb hervorgehoben angezeigt.
4. Der Bericht ist wieder **editierbar**.
5. Bearbeiten Sie den Bericht und reichen Sie ihn **erneut ein**.

### 4.8 Bericht als PDF exportieren

1. Klicken Sie auf **PDF** (Download-Symbol) oben rechts im Editor.
2. Das PDF wird generiert und in einem neuen Tab/Download geöffnet.
3. Das PDF enthält alle Daten: Name, Ausbildungsberuf, KW, Tageseinträge, Berichtstext, Status und ggf. Prüferkommentar.

**Hinweis:** Der PDF-Export ist nur verfügbar, wenn der Bericht bereits gespeichert wurde.

### 4.9 Einsatzplanung einsehen

Unter **Planung** (Navigation, `/trainee/schedule/`) sehen Sie Ihre persönliche Einsatzplanung als **read-only Gantt-Timeline**.

**Funktionen:**

- **Drag-to-Scroll**: Ziehen Sie die Timeline mit der Maus oder dem Finger (Touch), um horizontal zu scrollen
- **Momentum**: Schnelles Wischen (Flick-Geste) scrollt mit Schwung weiter
- **Hierarchischer Header**: Monatszeile oben, Wochenzeile (KW) darunter
- **Rote Heute-Linie** markiert das aktuelle Datum
- **Tagesgenaue Balken**, Farbe automatisch aus Zuweisungstyp abgeleitet (Abteilung, Schule, Urlaub, Sonstiges)
- Die Ansicht wird automatisch erweitert, wenn Sie an den Rand scrollen
- **Legende** unterhalb der Timeline erklärt die Farbcodierung

**Hinweis:** Sie können die Einsatzplanung nur einsehen. Änderungen werden durch Ihren Ausbilder vorgenommen (siehe Abschnitt 5.5).

### PDF-Export

Unter **Export** (Navigation, `/trainee/export/`) können Sie mehrere Wochenberichte als Sammel-PDF herunterladen.

1. Wählen Sie einen Zeitraum über die Datumsfelder "Von" / "Bis" oder nutzen Sie die Quick-Buttons:
   - **Letzter Monat**, **Letzte 3 Monate**, **Letztes Jahr**, **Gesamte Historie**
2. Die Vorschau zeigt an, wie viele Berichte im gewählten Zeitraum liegen.
3. Klicken Sie auf **Als PDF herunterladen** — alle Berichte werden chronologisch in einer PDF-Datei zusammengefasst.

Der Einzel-Export (ein Bericht als PDF) bleibt weiterhin im Berichtseditor verfügbar.

---

## 5. Rolle: Ausbilder

Als Ausbilder prüfen Sie die Berichte der Ihnen zugeordneten Auszubildenden.

### 5.1 Dashboard

Nach der Anmeldung sehen Sie Ihr **Ausbilder-Dashboard**. Es zeigt alle **eingereichten** Berichte Ihrer zugeordneten Auszubildenden.

Jeder Eintrag zeigt:

- **Name** des Auszubildenden
- **Ausbildungsberuf** und **Jahrgang** (JG, abgeleitet vom Ausbildungseintrittsdatum)
- **Anzahl der Berichte** und offene Einreichungen
- **Mini-Wochenübersicht** (letzte 8 Wochen, farbcodierte Punkte)

### 5.2 Bericht prüfen

1. Klicken Sie auf einen Bericht im Dashboard.
2. Die Detailansicht öffnet sich mit:
   - **Wochenbericht-Text** des Auszubildenden
   - **Tageseinträge** (Datum, Tagestyp, Stunden/Minuten)
   - **Status** und **Einreichungsdatum**
   - Ggf. **vorherige Prüfungskommentare**
3. Klicken Sie auf **PDF**, um den Bericht als PDF herunterzuladen.

### 5.3 Bewertung durchführen

Unterhalb der Berichtsdetails sehen Sie den Bereich **Prüfung**:

#### Genehmigen

- Klicken Sie auf **Genehmigen**.
- Der Bericht erhält den Status **Genehmigt**.
- Der Auszubildende kann den Bericht nicht mehr bearbeiten.

#### Zurückgeben

- Schreiben Sie optional einen **Kommentar**, was überarbeitet werden soll.
- Klicken Sie auf **Zurückgeben**.
- Der Bericht erhält den Status **Überarbeitung erforderlich**.
- Der Auszubildende kann den Bericht wieder bearbeiten und erneut einreichen.

#### Ablehnen

- Schreiben Sie optional einen **Kommentar** zur Begründung.
- Klicken Sie auf **Ablehnen**.
- Der Bericht erhält den Status **Abgelehnt**.
- Dieser Status sollte nur in Ausnahmefällen verwendet werden.

### 5.4 Ausbildungsbeauftragte zuordnen

Unter **Officer** (Navigation) können Sie Ausbildungsbeauftragte Ihren Auszubildenden zuordnen. Wählen Sie den Auszubildenden, den Ausbildungsbeauftragten und den Zeitraum (von/bis) über die Kalender-Picker.

### 5.5 Einsatzplanung

Unter **Planung** (Navigation) können Sie die Einsatzplanung für Ihre Auszubildenden verwalten.

**Gantt-Chart Ansicht:**

- **Drag-to-Scroll**: Ziehen Sie die Timeline mit der Maus oder dem Finger (Touch), um horizontal zu scrollen
- **Momentum**: Schnelles Wischen (Flick-Geste) scrollt mit Schwung weiter
- Hierarchischer Header: Monatszeile (Monat + Jahr) oben, Wochenzeile (KW) darunter
- Unter jedem Azubi-Namen wird der **Jahrgang** (JG, Ausbildungseintrittsjahr) in kleiner Schrift angezeigt
- Rote **Heute-Linie** markiert das aktuelle Datum
- Tagesgenaue Balken für jeden Auszubildenden, Farbe automatisch aus Zuweisungstyp abgeleitet
- Die Ansicht wird automatisch erweitert, wenn Sie an den Rand scrollen

**Zuweisung erstellen:**

1. Klicken Sie auf **"Eintrag hinzufügen"**.
2. Wählen Sie den Erstellungsmodus:
   - **Einzeleinsatz**: Einmaliger Einsatz für einen Zeitraum
   - **Wiederholung**: Regelmäßiger Einsatz an bestimmten Wochentagen (z.B. jeden Dienstag + Donnerstag Berufsschule)
3. Wählen Sie den Auszubildenden aus.
4. Wählen Sie den **Zuweisungstyp** — die Farbe wird automatisch bestimmt:
   - **Abteilung**: Betrieblicher Einsatz (Blautöne)
   - **Schule**: Berufsschule (Orange)
   - **Urlaub**: Urlaub (Gelb)
   - **Sonstiges**: Feiertag, Krankheit, etc. (Lila)
5. Setzen Sie Start- und Enddatum über den Kalender-Picker (Klick öffnet den Kalender, deutsches Format `dd.MM.yyyy`).
6. Optional: Wählen Sie einen Ausbildungsbeauftragten als Betreuer.
7. Bei **Wiederholung**: Wählen Sie die Wochentage und das **Intervall** (z.B. "Alle 2 Wochen" für jeden zweiten Besuch). Das System zeigt eine Vorschau der nächsten 12 Termine.
8. Klicken Sie auf **Erstellen** bzw. **Regel erstellen**.

**Konflikterkennung:** Überlappende Zuweisungen am selben Tag werden mit einem roten Ring markiert. Die angezeigte Zuweisung wird durch Layering bestimmt: Schule > Urlaub > Sonstiges > Abteilung. Bei gleichem Typ gewinnt die zuletzt erstellte Regel.

**Wiederholungsregeln** gelten für alle Tage im gewählten Zeitraum, die den konfigurierten Wochentagen entsprechen. Das **Intervall** steuert die Frequenz: "Jede Woche" (Standard), "Alle 2 Wochen", "Alle 3 Wochen" oder "Alle 4 Wochen".

**Hinweis:** Wenn Sie einen Ausbildungsbeauftragten als Betreuer auswählen, wird dieser automatisch für den Zeitraum dem Auszubildenden zugeordnet.

**Zuweisung bearbeiten/löschen:** Klicken Sie auf eine Zuweisung im Gantt-Chart, um sie zu bearbeiten oder zu löschen.

---

## 6. Rolle: Ausbildungsbeauftragte(r)

Als Ausbildungsbeauftragte(r) prüfen Sie Berichte der Ihnen zugeordneten Auszubildenden.

### 6.1 Dashboard

Das Dashboard funktioniert wie das des Ausbilders (siehe Abschnitt 5.1). Sie sehen alle eingereichten Berichte der Auszubildenden, die Ihnen zugeordnet sind.

### 6.2 Bericht prüfen und bewerten

Die Prüfung funktioniert identisch zum Ausbilder (siehe Abschnitt 5.2 und 5.3). Sie können Berichte:

- **Genehmigen**
- **Zurückgeben** (mit Kommentar)
- **Ablehnen** (mit Kommentar)

**Hinweis:** Eine einzige Genehmigung durch einen zuständigen Prüfer (Ausbilder oder Ausbildungsbeauftragter) genügt, um den Bericht auf "Genehmigt" zu setzen.

### 6.3 Einsatzplanung einsehen

Unter **Planung** (Navigation) sehen Sie eine read-only Ansicht der Einsatzplanung für Ihre zugeordneten Auszubildenden. Sie können die Planungen einsehen, aber nicht bearbeiten.

---

## 7. Rolle: Administrator

Administratoren verwalten die globale Struktur der Anwendung.

### 7.1 Admin-Dashboard

Das Dashboard zeigt eine Übersicht mit:

- **Anzahl der Benutzer**
- **Anzahl der Berichte**
- **Anzahl der Zuordnungen**

### 7.2 Benutzerverwaltung

Unter **Benutzer** (Navigation) können Sie:

#### Benutzer erstellen

1. Klicken Sie auf **Benutzer erstellen**.
2. Füllen Sie das Formular aus:
   - **Name**: Vollständiger Name
   - **E-Mail**: Wird als Login verwendet
   - **Rolle**: Administrator, Ausbilder, Ausbildungsbeauftragter oder Auszubildende(r)
   - **Passwort**: Mindestens 8 Zeichen
   - **Ausbildungsberuf** (nur bei Rolle Auszubildende(r)): Wählen Sie den Beruf aus dem Dropdown
   - **Eintrittsdatum** (nur bei Rolle Auszubildende(r)): Wählen Sie das Datum über den Kalender-Picker
3. Klicken Sie auf **Erstellen**.

#### Benutzer deaktivieren/aktivieren

- Jeder Benutzer hat einen Aktiv/Inaktiv-Status.
- Klicken Sie auf **Deaktivieren** neben dem Benutzer.
- Deaktivierte Benutzer können sich nicht mehr anmelden.
- Klicken Sie auf **Aktivieren**, um den Zugang wiederherzustellen.

#### Benutzer anonymisieren (DSGVO)

- Nur **deaktivierte Auszubildende** können anonymisiert werden.
- Klicken Sie auf **Anonymisieren** (roter Button) neben dem deaktivierten Benutzer.
- Bestätigen Sie den Vorgang im Dialog.
- Name und E-Mail werden durch generische Werte ersetzt.
- **Achtung:** Dies kann nicht rückgängig gemacht werden!
- Die Berichte des Auszubildenden bleiben mit "Anonym" als Name erhalten.

#### Rolle ändern

Aktuell erfolgt die Rollenänderung über den Bearbeiten-Button beim jeweiligen Benutzer.

### 7.3 Zuordnungen verwalten

Unter **Zuordnungen** (Navigation) verwalten Sie die Zuordnung von Ausbildern zu Ausbildungsberufen. Ein Ausbilder, der einem Beruf zugeordnet ist, sieht alle Auszubildenden dieses Berufs in seinem Dashboard und kann deren Berichte prüfen.

#### Ausbilder einem Beruf zuordnen

1. Wählen Sie den **Ausbilder** aus dem Dropdown.
2. Wählen Sie den **Ausbildungsberuf** aus dem Dropdown.
3. Klicken Sie auf **Zuordnung erstellen**.

Die Zuordnung erscheint in der Liste darunter (z.B. "Max Mustermann → Fachinformatiker für Anwendungsentwicklung").

#### Zuordnung entfernen

- Klicken Sie auf **Entfernen** neben der entsprechenden Zuordnung.

### 7.4 Ausbildungsbeauftragte zuordnen

Ausbildungsbeauftragte können durch Ausbilder zugeordnet werden. Die Zuordnung erfolgt über die Seite **Beauftragte** in der Ausbilder-Navigation (`/trainer/officers/`). Dort wählt der Ausbilder den Auszubildenden, den Ausbildungsbeauftragten und den Zeitraum (Gültig von/bis).

Administratoren können Ausbildungsbeauftragte ebenfalls über die API zuordnen.

### 7.5 Ausbildungsberufe verwalten

Unter **Berufe** (Navigation) verwalten Sie die verfügbaren Ausbildungsberufe.

#### Beruf anlegen

1. Klicken Sie auf **Beruf anlegen**.
2. Geben Sie die Bezeichnung ein (z.B. "Fachinformatiker für Anwendungsentwicklung").
3. Klicken Sie auf **Anlegen**.

#### Beruf bearbeiten

- Klicken Sie auf das Stift-Symbol neben dem Beruf.
- Ändern Sie den Namen und klicken Sie auf **Speichern**.

#### Beruf löschen

- Klicken Sie auf das Mülleimer-Symbol neben dem Beruf.
- Der Beruf wird von allen zugeordneten Auszubildenden entfernt.

**Hinweis:** Die Anzahl der zugeordneten Auszubildenden wird neben jedem Beruf angezeigt.

### 7.6 Einstellungen

Unter **Einstellungen** (Navigation) konfigurieren Sie die Standard-Arbeitstage.

#### Arbeitstage konfigurieren

1. Wählen Sie die Tage aus, die als **Arbeitstage** gelten (Standard: Montag–Freitag).
2. Klicken Sie auf einen Tag, um ihn ein- oder auszuschalten.
3. Klicken Sie auf **Speichern**.

**Auswirkung:** Wenn ein Auszubildender einen neuen Wochenbericht anlegt, werden die Nicht-Arbeitstage (z.B. Samstag, Sonntag) automatisch mit 0 Stunden und als freier Tag ("–") vorbelegt. Arbeitstage erhalten standardmäßig 8 Stunden.

### 7.7 Ausbildungsfortschritt

Unter **Fortschritt** (Navigation) sehen Sie eine Übersicht des Ausbildungsfortschritts aller Auszubildenden.

Die Übersicht zeigt pro Auszubildendem:

- **Name und Ausbildungsberuf**
- **Fortschrittsbalken**: Prozentsatz der genehmigten Wochenberichte
- **Status-Verteilung**: Wie viele Berichte sind genehmigt, eingereicht, Entwurf, etc.
- **Fehlende Wochen**: Welche Kalenderwochen der letzten 12 Wochen noch keinen Bericht haben (rot markiert)

Oben werden Zusammenfassungen angezeigt: Anzahl Azubis, Berichte gesamt, genehmigte Berichte und fehlende Wochen.

---

## 8. Statusübersicht der Berichte

### Statusübergänge

```
Entwurf ──► Eingereicht ──► Genehmigt
                         ──► Überarbeitung erforderlich ──► Eingereicht (erneut)
                         ──► Abgelehnt
```

### Was passiert bei jedem Status?

| Status | Azubi kann bearbeiten? | Prüfer sieht im Dashboard? |
|--------|----------------------|---------------------------|
| Entwurf | Ja | Nein |
| Eingereicht | Nein | Ja |
| Genehmigt | Nein | Ja (archiviert) |
| Überarbeitung erforderlich | Ja | Ja |
| Abgelehnt | Nein | Ja |

---

## 9. Benachrichtigungen

Alle Benutzer sehen in der Navigationsleiste eine **Glocke** (Benachrichtigungen). Klicken Sie darauf, um das Dropdown zu öffnen.

### Fehlende Wochenberichte

- Das System erkennt automatisch, wenn Auszubildende Wochenberichte für die letzten 2 Wochen noch nicht erstellt haben.
- Betroffene Auszubildende erhalten eine Benachrichtigung "Fehlender Wochenbericht für KW X/YEAR".
- Benachrichtigungen werden einmal pro Woche erstellt (7-Tage-Deduplication).

### Benachrichtigungen verwalten

- **Als gelesen markieren**: Klicken Sie auf das Häkchen-Symbol neben der Benachrichtigung.
- **Badge**: Die Anzahl ungelesener Benachrichtigungen wird als rote Zahl an der Glocke angezeigt.

### Check manuell auslösen (Admin)

Administratoren können die Prüfung auf fehlende Berichte manuell auslösen über `POST /api/notifications/check`.

---

## 10. Dark Mode / Light Mode

### Umschalten

- Klicken Sie auf das **Mond-/Sonnensymbol** oben rechts in der Navigationsleiste.
- **Mond** = Wechsel zu Dark Mode
- **Sonne** = Wechsel zu Light Mode

### Systemeinstellung

Wenn Sie die App zum ersten Mal öffnen, wird automatisch Ihre Systemeinstellung (Dark/Light Mode Ihres Betriebssystems) übernommen. Sie können jederzeit manuell umschalten. Ihre Wahl wird gespeichert.

---

## 11. Häufige Fragen (FAQ)

### Meine Änderungen werden nicht gespeichert

- Prüfen Sie den Speicherstatus oben rechts im Editor.
- Bei **Fehler**: Klicken Sie auf **Speichern**, um manuell zu speichern.
- Überprüfen Sie Ihre Internetverbindung.

### Ich kann meinen Bericht nicht mehr bearbeiten

- Berichte mit dem Status **Eingereicht**, **Genehmigt** oder **Abgelehnt** können nicht bearbeitet werden.
- Nur **Entwurf** und **Überarbeitung erforderlich** sind editierbar.

### Ich sehe keine Berichte im Prüfer-Dashboard

- Es befinden sich keine Berichte im Status **Eingereicht**.
- Prüfen Sie, ob die Zuordnung zum Auszubildenden korrekt ist.
- Wenden Sie sich an den Administrator.

### Wie erstelle ich einen neuen Benutzer?

- Nur Administratoren können Benutzer erstellen.
- Navigieren Sie zu **Benutzer** und klicken Sie auf **Benutzer erstellen**.

### Wie ordne ich einen Ausbilder zu?

- Administratoren ordnen Ausbilder Ausbildungsberufen zu unter **Zuordnungen**.
- Ein zugeordneter Ausbilder sieht alle Auszubildenden dieses Berufs in seinem Dashboard.

### Ist die Anwendung auch auf dem Smartphone nutzbar?

Ja, die Anwendung ist responsive und für mobile Geräte optimiert. Die Navigation öffnen Sie über das Menü-Symbol oben links.

### Werden meine Daten sicher gespeichert?

- Alle Daten werden in einer verschlüsselten PostgreSQL-Datenbank gespeichert.
- Die Zugangskontrolle erfolgt serverseitig – kein Prüfer kann Berichte fremder Auszubildender einsehen.
- Passwörter werden gehasht gespeichert (bcrypt).

---

## Testzugänge (nur Entwicklung)

Alle Zugänge verwenden das Passwort **password123**. Das E-Mail-Schema folgt dem Muster `<rolle>@example.com` bzw. `<rolle><nummer>@example.com`.

### Übersicht

| Rolle | Anzahl | E-Mail-Muster | Beispiele |
|-------|--------|---------------|-----------|
| Administrator | 1 | `admin@example.com` | admin@example.com |
| Ausbilder | 4 | `trainer@example.com` / `trainer2–4@example.com` | trainer@example.com (Max Mustermann), trainer2@example.com (Dr. Katharina Weber), trainer3@example.com (Stefan Krüger), trainer4@example.com (Petra Hoffmann) |
| Ausbildungsbeauftragte(r) | 10 | `officer@example.com` / `officer2–10@example.com` | officer@example.com (Erika Mustermann), officer2@example.com (Thomas Schmidt), …, officer10@example.com (Holger Richter) |
| Auszubildende(r) | 22 | `trainee@example.com` / `trainee2–22@example.com` | trainee@example.com (Anna Schulz, FIAE), trainee2@example.com (Ben Müller, FISI), …, trainee22@example.com (Vera Lange, KvF) |

### Auszubildende – Berufe und Eintrittsdaten

| E-Mail | Name | Ausbildungsberuf | Eintrittsdatum |
|--------|------|-------------------|----------------|
| trainee@example.com | Anna Schulz | Fachinformatiker für Anwendungsentwicklung | 05.01.2026 |
| trainee2@example.com | Ben Müller | Fachinformatiker für Systemintegration | 01.03.2026 |
| trainee6@example.com | Felix Wagner | Kaufmann/-frau für Versicherungen und Finanzanlagen | 01.09.2025 |
| trainee22@example.com | Vera Lange | Kaufmann/-frau für Versicherungen und Finanzanlagen | 01.03.2026 |

**Achtung:** Diese Zugänge sind nur für die Entwicklungsumgebung gedacht. In der Produktion müssen sichere Passwörter verwendet werden.
