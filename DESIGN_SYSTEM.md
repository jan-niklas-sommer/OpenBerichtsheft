# Design-System – OpenBerichtsheft

Letzte Aktualisierung: 2026-05-09

---

## Designprinzipien

**1. Reduktion vor Dekoration.** Jedes UI-Element muss eine funktionale Begründung haben. Visuelle Akzente, die nur ästhetisch sind, werden entfernt. Das Produkt erkennt man an der Klarheit, nicht an einer Brand-Farbe.

**2. Semantische Trennung der Farbschichten.** Neutralfarben tragen Layout. Semantische Farben tragen Status. Kategoriale Farben tragen Daten-Klassifizierung. Diese drei Schichten dürfen sich in Hue und Sättigung nicht überschneiden, damit der Nutzer Status nie mit Kategorie verwechselt.

**3. Token-Architektur ohne Hardcodes.** Alle Farben, Abstände, Border-Radien, Schriftgrößen und Schatten werden ausschließlich als CSS-Variablen referenziert. Keine direkten Tailwind-Color-Klassen wie `bg-emerald-500` und keine Hex-Werte im JSX. Wer eine neue Komponente baut, baut sie aus Tokens.

**4. Light- und Dark-Mode sind Schwestern, nicht Inversionen.** Beide Modi werden separat kalibriert. Dark Mode hat reduzierte Sättigung, andere Helligkeitsverhältnisse, eigene Token-Werte. Eine 1:1-Inversion erzeugt das Neon-Problem.

**5. kein Drag, kein Polish-First, kein Feature-Creep.** Interaktion bleibt klick-basiert. Optimierungen folgen Use-Case-Daten, nicht Bauchgefühl. Iterationen am Designsystem werden zentral entschieden, nicht pro Komponente.

---

## Farbsystem

### Schicht 1: Neutrale Skala

Basis: `zinc` aus dem Tailwind-Spektrum.

**Light Mode (`:root`):**

```css
--color-bg-base: #ffffff;           /* zinc-0 */
--color-bg-elevated: #fafafa;       /* zinc-50 */
--color-bg-overlay: #f4f4f5;        /* zinc-100 */
--color-bg-sunken: #e4e4e7;         /* zinc-200 */

--color-fg-base: #18181b;           /* zinc-900 */
--color-fg-muted: #52525b;          /* zinc-600 */
--color-fg-subtle: #a1a1aa;         /* zinc-400 */
--color-fg-on-inverted: #fafafa;    /* zinc-50 */

--color-border-subtle: #e4e4e7;     /* zinc-200 */
--color-border-base: #d4d4d8;       /* zinc-300 */
--color-border-strong: #71717a;     /* zinc-500 */
```

**Dark Mode (`.dark`):**

```css
--color-bg-base: #09090b;           /* zinc-950 */
--color-bg-elevated: #18181b;       /* zinc-900 */
--color-bg-overlay: #27272a;        /* zinc-800 */
--color-bg-sunken: #000000;         /* pure black */

--color-fg-base: #fafafa;           /* zinc-50 */
--color-fg-muted: #a1a1aa;          /* zinc-400 */
--color-fg-subtle: #52525b;         /* zinc-600 */
--color-fg-on-inverted: #18181b;    /* zinc-900 */

--color-border-subtle: #27272a;     /* zinc-800 */
--color-border-base: #3f3f46;       /* zinc-700 */
--color-border-strong: #71717a;     /* zinc-500 */
```

### Schicht 2: Akzent (Inversion)

Keine Brand-Akzentfarbe. Primary-Aktionen durch Inversion der Neutral-Skala markiert.

```css
--color-action-primary-bg: var(--color-fg-base);
--color-action-primary-fg: var(--color-bg-base);
--color-action-primary-bg-hover: var(--color-fg-muted);
--color-action-secondary-bg: transparent;
--color-action-secondary-fg: var(--color-fg-base);
--color-action-secondary-border: var(--color-border-base);
```

Light: Schwarzer Button, weißer Text. Dark: Weißer Button, schwarzer Text.

### Schicht 3: Semantische Farben

Vier Status-Farben, kalibriert für beide Modi. Je zwei Sättigungsstufen: Vollfarbe (fg, für Indikatoren/Borders/Icons) und Hintergrund (bg, für Pills/Badges).

**Light Mode:**

```css
--color-success-fg: #15803d;        /* green-700 */
--color-success-bg: #dcfce7;        /* green-100 */

--color-warning-fg: #b45309;        /* amber-700 */
--color-warning-bg: #fef3c7;        /* amber-100 */

--color-danger-fg: #b91c1c;         /* red-700 */
--color-danger-bg: #fee2e2;         /* red-100 */

--color-info-fg: #1d4ed8;           /* blue-700 */
--color-info-bg: #dbeafe;           /* blue-100 */
```

**Dark Mode:**

```css
--color-success-fg: #4ade80;        /* green-400 */
--color-success-bg: rgba(34, 197, 94, 0.15);

--color-warning-fg: #fbbf24;        /* amber-400 */
--color-warning-bg: rgba(245, 158, 11, 0.15);

--color-danger-fg: #f87171;         /* red-400 */
--color-danger-bg: rgba(239, 68, 68, 0.15);

--color-info-fg: #60a5fa;           /* blue-400 */
--color-info-bg: rgba(59, 130, 246, 0.15);
```

**Mapping Bericht-Status:**

| Status | Token | Bedeutung |
|--------|-------|-----------|
| Genehmigt | Success | Freigegeben |
| Eingereicht | Warning | Noch nicht genehmigt |
| Abgelehnt | Danger | Endgültig abgelehnt |
| Überarbeitung | Info | Zurückgegeben |
| Entwurf | Neutral (`fg-muted` auf `bg-overlay`) | In Bearbeitung |
| Fehlt | Neutral mit reduzierter Opacity | Nicht erstellt |

### Schicht 4: Kategoriale Farben

Vier Lernort-Kategorien. Hue-Spektrum bewusst getrennt von semantischen Farben.

**Light Mode:**

```css
--color-cat-department-fg: #0f766e;     /* teal-700 */
--color-cat-department-bg: #ccfbf1;     /* teal-100 */

--color-cat-school-fg: #4338ca;         /* indigo-700 */
--color-cat-school-bg: #e0e7ff;         /* indigo-100 */

--color-cat-vacation-fg: #a16207;       /* yellow-700 */
--color-cat-vacation-bg: #fef9c3;       /* yellow-100 */

--color-cat-other-fg: #be185d;          /* pink-700 */
--color-cat-other-bg: #fce7f3;          /* pink-100 */
```

**Dark Mode:**

```css
--color-cat-department-fg: #5eead4;     /* teal-300 */
--color-cat-department-bg: rgba(20, 184, 166, 0.20);

--color-cat-school-fg: #a5b4fc;         /* indigo-300 */
--color-cat-school-bg: rgba(99, 102, 241, 0.20);

--color-cat-vacation-fg: #fde047;       /* yellow-300 */
--color-cat-vacation-bg: rgba(234, 179, 8, 0.18);

--color-cat-other-fg: #f9a8d4;          /* pink-300 */
--color-cat-other-bg: rgba(236, 72, 153, 0.20);
```

**Migration:**

| Alt | Neu | Grund |
|-----|-----|-------|
| Smaragd-Grün (emerald) | Teal | Trennung von Status-Grün |
| Royal-Blau (blue) | Indigo | Trennung von Info-Blau |
| Orange (amber/orange) | Yellow (wärmer) | Trennung von Warning-Amber |
| Lila (violet) | Pink | Klar kategorial |

---

## Typografie

**Schriftfamilien:**

```css
--font-family-base: 'Inter', system-ui, -apple-system, sans-serif;
--font-family-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Größenskala (modular 1.125):**

```css
--font-size-xs: 0.75rem;    /* 12px — Labels, Captions */
--font-size-sm: 0.875rem;   /* 14px — Body small, Forms */
--font-size-base: 1rem;      /* 16px — Body */
--font-size-lg: 1.125rem;    /* 18px — Subheadings */
--font-size-xl: 1.5rem;      /* 24px — Section headings */
--font-size-2xl: 2rem;       /* 32px — Page headings */
```

**Gewichte:**

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

**Regel:** Bold (700) nur für Page-Headings. UI-Elemente nutzen Medium (500) oder Semibold (600).

**Zeilenhöhen:**

```css
--line-height-tight: 1.2;     /* Headings */
--line-height-base: 1.5;      /* Body */
--line-height-relaxed: 1.7;   /* Long-form text */
```

---

## Abstände

4px-Grid:

```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.5rem;     /* 24px */
--space-6: 2rem;       /* 32px */
--space-7: 3rem;       /* 48px */
--space-8: 4rem;       /* 64px */
```

**Verwendungsregeln:**

| Kontext | Token |
|---------|-------|
| Innerhalb Komponenten | `space-2` bis `space-4` |
| Zwischen verwandten Elementen | `space-4` bis `space-5` |
| Zwischen Sektionen | `space-6` bis `space-7` |
| Page-Padding | `space-6` horizontal, `space-7` vertikal |

---

## Border-Radien

Drei Stufen + Full:

```css
--radius-sm: 0.375rem;    /* 6px — Buttons, Inputs, Badges */
--radius-md: 0.5rem;      /* 8px — Cards, Modals */
--radius-lg: 0.75rem;     /* 12px — Großflächige Container */
--radius-full: 9999px;    /* Pills, Avatare */
```

**Regel:** Innerer Radius darf nie größer sein als der äußere Container-Radius.

---

## Schatten

Sparsam einsetzen. Dark Mode meist gar nicht.

**Light Mode:**

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.08);
```

**Dark Mode:**

```css
--shadow-sm: none;
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.5);
```

| Einsatz | Token |
|---------|-------|
| Hover auf Cards | `shadow-sm` |
| Modals, Popovers, Dropdowns | `shadow-md` |
| Top-Layer-Overlays | `shadow-lg` |

---

## Komponenten-Spezifikation

### Buttons

**Primary:**

```css
background: var(--color-action-primary-bg);
color: var(--color-action-primary-fg);
border: none;
padding: var(--space-2) var(--space-4);
border-radius: var(--radius-sm);
font-weight: var(--font-weight-medium);
height: 2.5rem;
```

**Secondary:**

```css
background: transparent;
color: var(--color-fg-base);
border: 1px solid var(--color-border-base);
padding: var(--space-2) var(--space-4);
border-radius: var(--radius-sm);
font-weight: var(--font-weight-medium);
height: 2.5rem;
```

**Ghost (Tertiary):**

```css
background: transparent;
color: var(--color-fg-muted);
border: none;
padding: var(--space-2) var(--space-3);
border-radius: var(--radius-sm);
height: 2.5rem;
hover: background var(--color-bg-overlay);
```

**Destructive:**

```css
background: var(--color-danger-bg);
color: var(--color-danger-fg);
border: 1px solid transparent;
hover: background-darker;
```

Roter Text auf Pastell-Hintergrund, niemals weißer Text auf vollrotem Hintergrund.

### Inputs

```css
background: var(--color-bg-base);
color: var(--color-fg-base);
border: 1px solid var(--color-border-base);
padding: var(--space-2) var(--space-3);
border-radius: var(--radius-sm);
font-size: var(--font-size-sm);
height: 2.5rem;
```

**Focus:**

```css
border-color: var(--color-fg-base);
outline: 2px solid var(--color-fg-base);
outline-offset: 1px;
```

**Placeholder:** `--color-fg-subtle`.

### Cards

```css
background: var(--color-bg-elevated);
border: 1px solid var(--color-border-subtle);
border-radius: var(--radius-md);
padding: var(--space-5);
```

**Hover (klickbar):**

```css
border-color: var(--color-border-base);
shadow: var(--shadow-sm); /* nur Light */
```

### Pills / Status-Badges

```css
display: inline-flex;
align-items: center;
gap: var(--space-1);
padding: var(--space-1) var(--space-2);
border-radius: var(--radius-full);
font-size: var(--font-size-xs);
font-weight: var(--font-weight-medium);
```

| Status | background | color |
|--------|-----------|-------|
| Genehmigt | `--color-success-bg` | `--color-success-fg` |
| Eingereicht | `--color-warning-bg` | `--color-warning-fg` |
| Abgelehnt | `--color-danger-bg` | `--color-danger-fg` |
| Überarbeitung | `--color-info-bg` | `--color-info-fg` |
| Entwurf | `--color-bg-overlay` | `--color-fg-muted` |

### Modals

```css
overlay-background: rgba(0, 0, 0, 0.5); /* beide Modi */
modal-background: var(--color-bg-elevated);
border: 1px solid var(--color-border-subtle);
border-radius: var(--radius-md);
padding: var(--space-6);
shadow: var(--shadow-lg);
max-width: 32rem;
```

**Footer:**

```css
border-top: 1px solid var(--color-border-subtle);
padding-top: var(--space-4);
display: flex;
justify-content: flex-end;
gap: var(--space-3);
```

### Navigation Header

```css
height: 4rem;
background: var(--color-bg-base);
border-bottom: 1px solid var(--color-border-subtle);
padding: 0 var(--space-6);
```

**Tab-Group:**

```css
display: flex;
gap: var(--space-1);
background: var(--color-bg-overlay);
padding: var(--space-1);
border-radius: var(--radius-full);
```

| Tab | background | color |
|-----|-----------|-------|
| Aktiv | `--color-bg-base` | `--color-fg-base` + `shadow-sm` |
| Inaktiv | transparent | `--color-fg-muted` |
| Inaktiv:hover | transparent | `--color-fg-base` |

**Trennung Theme-Toggle / Logout:** Vertikale Trennlinie mit `--color-border-subtle`, mindestens `space-3` Abstand.

### Gantt-Timeline

```css
--gantt-day-width: 18px;
--gantt-row-height: 40px;
--gantt-header-height: 56px;
```

**Header:** Obere Reihe Monat (`font-size-sm`, `fg-muted`), untere Reihe KW (`font-size-xs`, `fg-subtle`).

**Wochenenden:** `background: var(--color-bg-sunken); opacity: 0.5;`

**Wochengrenzen:** `border-left: 1px dashed var(--color-border-subtle);`

**Heute-Linie:** `width: 1px; background: var(--color-fg-base); opacity: 0.4;`

**Einsatzbalken:**

```css
height: 70% der Row-Höhe;
border-radius: var(--radius-sm);
background: var(--color-cat-{type}-bg);
border-left: 3px solid var(--color-cat-{type}-fg);
```

**Konflikt-Indikator:** `border: 1px solid var(--color-danger-fg);`

### Heatmap (Wochenübersicht)

Zelle: `16x16px`, `border-radius: var(--radius-sm)`, `margin: 1px`.

| Status | Farbe |
|--------|-------|
| Genehmigt | `--color-success-bg` |
| Eingereicht | `--color-warning-bg` |
| Abgelehnt | `--color-danger-bg` |
| Überarbeitung | `--color-info-bg` |
| Entwurf | `--color-bg-overlay` |
| Fehlt | `--color-bg-overlay` Opacity 0.5 |
| Zukunft | transparent + `border: 1px solid var(--color-border-subtle)` |

---

## Layout-Regeln

**Page-Container:**

```css
max-width: 80rem;
margin: 0 auto;
padding: var(--space-7) var(--space-6);
```

**Page-Heading + Action:**

```css
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: var(--space-6);
```

**Empty State:**

```css
display: flex;
flex-direction: column;
align-items: center;
gap: var(--space-3);
padding: var(--space-7);
color: var(--color-fg-muted);
text-align: center;
```

Inhalt: Icon (24px, `--color-fg-subtle`), Headline (`font-size-base`, `--color-fg-base`), Erklärung (`font-size-sm`, `--color-fg-muted`).

---

## Iconographie

Icon-Library: `lucide-react`. Stroke-Width: 1.5. Default-Farbe: `currentColor`.

```css
--icon-size-sm: 16px;
--icon-size-base: 20px;
--icon-size-lg: 24px;
```

**App-Icons:**

| Kontext | Icon |
|---------|------|
| Logo | Zu prüfen — Alternative: Kalender, Klemmbrett |
| Übersicht | `LayoutGrid` |
| Planung | `Calendar` |
| Beauftragte | `Users` |
| Theme-Toggle | `Sun` / `Moon` |
| Logout | `LogOut` |

---

## Animation

Sparsam. Nur für State-Übergänge.

```css
--motion-duration-fast: 100ms;
--motion-duration-base: 150ms;
--motion-duration-slow: 250ms;
--motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

| Einsatz | Duration |
|---------|----------|
| Button-Hover, Input-Focus | `fast` |
| Modal-Open, Dropdown-Open | `base` |
| Page-Transition | `slow` |

Keine Bounce-Effekte, keine Spring-Physics, keine Parallax.

---

## Anti-Patterns

Folgendes ist im System ausdrücklich **nicht erlaubt**:

- Hex-Werte in Komponenten-Code (Ausnahme: `pdf-document.tsx` für `@react-pdf/renderer`)
- Tailwind-Color-Klassen mit konkreten Farben (`bg-emerald-500`, `text-blue-600`)
- Multiple Schriftarten gleichzeitig
- Border-Radien außerhalb der definierten Skala
- Schatten mit farbigem Tint
- Opacity unter 0.4 für Text (Lesbarkeit)
- Bold (700) für Body-Text oder UI-Elemente
- Vollflächig gefüllte Status-Buttons (z. B. vollroter Entfernen-Button)
- Mehr als zwei Akzentfarben pro Bildschirm
- Custom-Breakpoints außerhalb der Tailwind-Defaults

---

## Warnungen

Dieses Designsystem ist ein Schnitt durch den aktuellen Stand. Wenn ein Use-Case nicht durch das System abgedeckt ist (z. B. mehr als vier Kategorien), wird das System **erweitert**, nicht umgangen. Erweiterungen werden hier dokumentiert mit Begründung, bevor sie im Code landen.

Die Versuchung, später eine Brand-Akzentfarbe einzuführen, ist die häufigste Form der Verschlimmbesserung in TR-inspirierten Designs. Die Nüchternheit ist das Feature, nicht der Bug. Änderungen nur nach mindestens drei Monaten produktiver Nutzung und basierend auf konkretem Nutzer-Feedback.
