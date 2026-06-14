# Erweiterungspfade – OpenBerichtsheft

Stand: 2026-06-14

> **Reconciliation 2026-06-14:** Die unten als „Erledigt" markierten Punkte wurden bei der Überprüfung als bereits implementiert festgestellt. „Nicht zutreffend" bedeutet, dass das Item zur tatsächlichen Architektur nicht passt (siehe Begründung).

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

**Status:** Erledigt (2026-06-14)

`RecurrenceRule.interval` ist im Schema, Resolver (`ruleAppliesOnDate`/`expandRuleToDays`), der API (`POST/PUT /api/recurrence-rules`) und der UI (Assignment-Modal + Trainer-Edit-Popover) vollständig umgesetzt.

### 1.2 Passwort-Änderung durch User

**Status:** Erledigt

Umgesetzt via `/einstellungen` (Seite) + `PUT /api/users/me/password` + Schüssel-Symbol in der Navbar.

### 1.3 E-Mail-Verifikation bei Registrierung

**Status:** Erledigt

Verifizierungs-Flow (`/api/auth/register`, `/api/auth/verify`, `/api/auth/resend-verification`, `VerificationToken`) inkl. `sendVerificationEmail` umgesetzt. Zusätzlich (2026-06-14) eigenständiger **Passwort-Wiederherstellungs-Flow** (`PasswordResetToken`, `/api/auth/request-password-reset`, `/api/auth/reset-password`, `/forgot-password`, `/reset-password`).

### 1.4 PDF-Export-Menü mit Batch-Export

**Status:** Erledigt

Umgesetzt via `/trainee/export` (Seite mit Zeitraum-Auswahl) + `GET /api/reports/export` (Batch-PDF/ZIP) + `/api/reports/count` (Vorschau).

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

**Status:** Teilweise offen

- #1: Paginierung auf GET /api/reports — **Nicht zutreffend** (2026-06-14): der Endpunkt wird ausschließlich vom Trainee-Jahreskalender konsumiert, der alle Berichte benötigt. Reviewer laden serverseitig direkt via Prisma. Paginierung würde den Kalender kaputt machen; der echte Skalierungshebel wäre ein Jahres-Filter / Lazy-Loading im Reviewer-Dashboard.
- #4: Nicht-atomarer Upsert (deleteMany + create)
- #39: Report-Editor zu groß (UX-Redesign)
- #40: Hartkodierte 52-Wochen-Grenze
- #44: Ungespeicherte Änderungen bei Navigation
- #51: Fehler-Feedback bei Review

### 2.3 RecurrenceException UI

**Status:** Tragfähig (2026-06-14)

Schema + Resolver + API-Inklusion bestehen seit Längerem. Seit 2026-06-14 sind RecurrenceRules im Gantt sichtbar + editierbar, sodass ein Ausnahme-UI direkt am Regel-Block anknüpfen kann (z.B. Rechts-Klick → „Ausnahme hinzufügen" → POST an eine neue Exception-API). Letzteres ist noch offen.

### 2.4 typecheck-Script

**Status:** Erledigt (2026-06-14)

`npm run typecheck` (`tsc --noEmit`) ergänzt; `tsc` läuft nach Fix der vitest-Globals und mehrerer Test-Typfehler mit **0 Fehlern**.

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
