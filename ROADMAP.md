# Erweiterungspfade – OpenBerichtsheft

Stand: 2026-05-10

---

## Legende

| Status | Bedeutung |
|--------|-----------|
| **Bereit** | Keine Abhängigkeiten, kann sofort begonnen werden |
| **Vorbereitet** | Schema/Backend teilweise vorhanden, UI fehlt |
| **Geplant** | Konzept steht, Implementierung ausstehend |
| **Vision** | Langfristige Idee, kein detailliertes Konzept yet |

---

## Pfad 1: Kern-Features (Hohe Priorität)

### 1.1 Frequenz-Intervall im Resolver

**Status:** Bereit

Wiederholungsregeln unterstützen aktuell nur wöchentliche Ausführung. Ein Intervall-Feld (z.B. "alle 2 Wochen") erweitert die Einsatzplanung deutlich.

- **Umfang:** `RecurrenceRule` um `interval`-Feld erweitern, Resolver anpassen, UI-Feld im Wiederholungs-Modal
- **Aufwand:** Mittel (Resolver + UI + Migration + Tests)

### 1.2 Passwort-Änderung durch User

**Status:** Bereit

Aktuell können Passwörter nur durch Administratoren geändert werden. User sollten ihr eigenes Passwort ändern können.

- **Umfang:** Neue Seite `/settings`, API-Route `PUT /api/users/me/password`, UI in Navbar
- **Aufwand:** Klein (1 API-Route + 1 Seite)

### 1.3 E-Mail-Verifikation bei Registrierung

**Status:** Bereit

In ARCHITECTURE.md als technische Schuld dokumentiert. Aktuell erstellt der Admin Accounts — bei Self-Registration wäre Verifikation nötig.

- **Umfang:** E-Mail-Provider (Resend/SendGrid), Verifikations-Flow, Token-Generierung
- **Aufwand:** Mittel (Auth-Flow + Mail-Integration + UI)

### 1.4 PDF-Export-Menü mit Batch-Export

**Status:** Bereit

Aktuell: Einzelterteinreichung → Ein PDF. Ziel: Menü-gesteuerter Export mit Zeitraum-Auswahl oder ganzer Historie. Einzel-Export bleibt als Convenience-Feature.

- **Umfang:** Neue Export-Seite `/trainee/export`, API `GET /api/reports/export?from=...&to=...` (ZIP mit PDFs oder ein Sammel-PDF), Zeitraum-Picker, "Gesamte Historie"-Button
- **Aufwand:** Mittel (1 Seite + 1 API-Route + PDF-Generierung für Batch)

### 1.5 Bericht-Vorlagen / Templates

**Status:** Bereit

Wiederverwendbare Textbausteine für häufige Tätigkeiten (z.B. "Sprint Planning", "Code Review", "Schulung XY").

- **Umfang:** Neues `ReportTemplate`-Modell (userId, title, text), CRUD-API, Template-Picker im Editor (Autocomplete/Dropdown)
- **Aufwand:** Mittel (Modell + API + UI-Integration im Editor)

---

## Pfad 2: Offene Qualitätsarbeit

### 2.1 Qualitätsoffensive Phase 6-7

**Status:** Bereit

Noch offene Phasen aus CODE_REVIEW.md.

### 2.2 Offene Initial-Review Issues

**Status:** Bereit

- #1: Paginierung auf GET /api/reports
- #4: Nicht-atomarer Upsert (deleteMany + create)
- #39: Report-Editor zu groß (UX-Redesign)
- #40: Hartkodierte 52-Wochen-Grenze
- #44: Ungespeicherte Änderungen bei Navigation
- #51: Fehler-Feedback bei Review

### 2.3 RecurrenceException UI

**Status:** Vorbereitet

Schema und Resolver existieren. UI zum Anlegen/Bearbeiten von Ausnahmen fehlt.

### 2.4 typecheck-Script

**Status:** Bereit

`npm run typecheck` existiert nicht in `package.json`. Sollte `"typecheck": "tsc --noEmit"` ergänzt werden.

---

## Pfad 3: UX & Mobile

### 3.1 PWA / Offline-Modus

**Status:** Vision

Service Worker für Offline-Berichtserstellung. Änderungen werden synchronisiert wenn wieder online.

### 3.2 Unsaved-Changes-Warnung

**Status:** Bereit

Warnung beim Navigieren wenn ungespeicherte Änderungen im Editor vorhanden.

### 3.3 Keyboard-Shortcuts

**Status:** Vision

Strg+S zum Speichern, Pfeiltasten-Optimierung im Editor, Tab-Navigation in Tageseinträgen.

### 3.4 Touch-optimierter Editor

**Status:** Vision

Bessere mobile Eingabeerfahrung, Swipe-Gesten für Wochennavigation.

---

## Pfad 4: Infrastruktur & DevOps

### 4.1 CI/CD Pipeline

**Status:** Bereit

GitHub Actions: `typecheck` → `lint` → `test` → `build` bei jedem PR. Merge-Blocker bei Fehlern.

### 4.2 Redis-basiertes Rate Limiting

**Status:** Bereit

Aktuell In-Memory. Für Multi-Instance-Deployment auf Redis oder Upstash umstellen.

### 4.3 Monitoring / Error Tracking

**Status:** Vision

Sentry o.ä. für Production-Fehler-Tracking.

### 4.4 Backup-Strategie

**Status:** Vision

Automatische PostgreSQL-Backups, Restore-Getestet.

---

## Pfad 5: Skalierung & Enterprise

### 5.1 Multi-Tenancy

**Status:** Vision

Mehrere Ausbildungsbetriebe auf einer Instanz. Datentrennung auf Schema- oder Row-Level.

### 5.2 Audit-Log / History

**Status:** Vorbereitet

ReviewEvent-Modell existiert. Vollständige Änderungshistorie pro Bericht ausbauen (Diff-Ansicht, Restore).

### 5.3 Erweitertes Benachrichtigungssystem

**Status:** Vorbereitet

Issue #7 (E-Mail-Benachrichtigungen) existiert. WebSocket für Echtzeit-Updates ergänzen.

### 5.4 Statistiken / Analytics

**Status:** Vision

Bericht-Statistiken für Ausbilder und Admins: Trends, Durchschnittliche Bearbeitungszeit, Genehmigungsquote.

### 5.5 iCal-Export

**Status:** Vision

Einsatzplanung als iCal exportieren für Kalender-Integration (Google Calendar, Outlook).

### 5.6 API für externe Systeme

**Status:** Vision

REST-API mit API-Keys für HR-Systeme, LMS, IHK-Schnittstellen.

### 5.7 Digitale Signatur

**Status:** Vision

Rechtssichere digitale Signatur für PDF-Export (qualifizierte elektronische Signatur).

---

## Pfad 6: Regulatorisch / DSGVO

### 6.1 Datenaufbewahrungsrichtlinien

**Status:** Vision

Automatische Löschung/Anonymisierung nach X Jahren (konfigurierbar).

### 6.2 Datenexport auf User-Anfrage

**Status:** Vision

User können alle ihre personenbezogenen Daten als ZIP exportieren (DSGVO-Recht auf Datenübertragbarkeit).

### 6.3 Erweitertes Anonymisierungs-Konzept

**Status:** Vorbereitet

Aktuell nur für Azubis. Auf Ausbilder/Officer ausdehnen.

---

## Priorisierungsempfehlung

1. **Sofort (Sprint 1):** 1.1, 1.2, 1.4, 2.4, 4.1
2. **Kurzfristig (Sprint 2-3):** 1.3, 1.5, 2.1, 2.2, 2.3
3. **Mittelfristig (Sprint 4-6):** 3.1, 3.2, 4.2, 4.3, 5.3, 5.4
4. **Langfristig:** 5.1, 5.5, 5.6, 5.7, 6.x
