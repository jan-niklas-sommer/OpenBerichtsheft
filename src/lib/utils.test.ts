import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cn,
  getWeekDates,
  formatDayName,
  formatDate,
  getCurrentWeek,
  getIsoWeek,
  getTrainingStartWeek,
  getWeeksInMonth,
  statusColor,
  ROLE_LABELS,
  STATUS_LABELS,
  DAY_TYPE_LABELS,
  DAY_TYPES,
  statusVariant,
} from "./utils";

describe("cn", () => {
  it("verkettet Klassen", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filtert falsy Werte heraus", () => {
    expect(cn("foo", false && "bar", undefined, null, "")).toBe("foo");
  });

  it("gibt leeren String bei keinem Argument", () => {
    expect(cn()).toBe("");
  });
});

describe("getWeekDates", () => {
  it("liefert genau 7 Daten", () => {
    const dates = getWeekDates(2025, 10);
    expect(dates).toHaveLength(7);
  });

  it("erster Tag ist Montag", () => {
    const dates = getWeekDates(2025, 10);
    expect(dates[0].getDay()).toBe(1);
  });

  it("letzter Tag ist Sonntag", () => {
    const dates = getWeekDates(2025, 10);
    expect(dates[6].getDay()).toBe(0);
  });

  it("Woche 1 eines Jahres mit Jan 4 als Sonntag (getDay === 0) nutzt ||7-Pfad", () => {
    const dates = getWeekDates(2032, 1);
    expect(dates[0].getDay()).toBe(1);
    expect(dates).toHaveLength(7);
  });

  it("Woche 52 liefert gültige Daten im Dezember", () => {
    const dates = getWeekDates(2025, 52);
    expect(dates).toHaveLength(7);
    expect(dates[0].getMonth()).toBe(11);
  });

  it("Woche 53 für ein Jahr mit 53 Wochen", () => {
    const dates = getWeekDates(2020, 53);
    expect(dates).toHaveLength(7);
    expect(dates[0].getFullYear()).toBe(2020);
  });

  it("alle 7 Tage sind aufeinanderfolgend", () => {
    const dates = getWeekDates(2025, 15);
    for (let i = 1; i < 7; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("Woche 1 2025 beginnt am 30. Dezember 2024", () => {
    const dates = getWeekDates(2025, 1);
    expect(dates[0].getDate()).toBe(30);
    expect(dates[0].getMonth()).toBe(11);
    expect(dates[0].getFullYear()).toBe(2024);
  });

  it("Woche 2 2025 beginnt am 6. Januar 2025", () => {
    const dates = getWeekDates(2025, 2);
    expect(dates[0].getDate()).toBe(6);
    expect(dates[0].getMonth()).toBe(0);
    expect(dates[0].getFullYear()).toBe(2025);
  });

  it("funktioniert für Schaltjahre", () => {
    const dates = getWeekDates(2024, 9);
    expect(dates).toHaveLength(7);
    expect(dates[0].getDay()).toBe(1);
  });
});

describe("formatDayName", () => {
  it("gibt deutschen Kurznamen für Wochentag zurück", () => {
    const montag = new Date(2025, 0, 6);
    expect(formatDayName(montag)).toBe("Mo");
  });

  it("gibt 'So' für Sonntag", () => {
    const sonntag = new Date(2025, 0, 12);
    expect(formatDayName(sonntag)).toBe("So");
  });
});

describe("formatDate", () => {
  it("formatiert Datum im deutschen Format dd.MM.yyyy", () => {
    const date = new Date(2025, 0, 6);
    expect(formatDate(date)).toBe("06.01.2025");
  });

  it("formatiert Datum am Monatsende korrekt", () => {
    const date = new Date(2025, 2, 31);
    expect(formatDate(date)).toBe("31.03.2025");
  });

  it("formatiert Datum mit einstelligem Tag und Monat", () => {
    const date = new Date(2025, 3, 1);
    expect(formatDate(date)).toBe("01.04.2025");
  });
});

describe("getCurrentWeek", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("gibt ein Objekt mit year und week zurück", () => {
    const result = getCurrentWeek();
    expect(result).toHaveProperty("year");
    expect(result).toHaveProperty("week");
    expect(typeof result.year).toBe("number");
    expect(typeof result.week).toBe("number");
  });

  it("week ist zwischen 1 und 53", () => {
    const result = getCurrentWeek();
    expect(result.week).toBeGreaterThanOrEqual(1);
    expect(result.week).toBeLessThanOrEqual(53);
  });

  it("year ist die aktuelle vierstellige Jahreszahl", () => {
    const result = getCurrentWeek();
    expect(result.year).toBe(new Date().getFullYear());
  });

  it("nutzt ||7-Pfad wenn Jan 4 ein Sonntag ist (getDay === 0)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    const result = getCurrentWeek();
    expect(result.year).toBe(2026);
    expect(result.week).toBeGreaterThanOrEqual(1);
    expect(result.week).toBeLessThanOrEqual(53);
  });
});

describe("ROLE_LABELS", () => {
  it("enthält alle erwarteten Rollen", () => {
    expect(ROLE_LABELS.admin).toBe("Administrator");
    expect(ROLE_LABELS.trainer).toBe("Ausbilder");
    expect(ROLE_LABELS.training_officer).toBe("Ausbildungsbeauftragter");
    expect(ROLE_LABELS.trainee).toBe("Auszubildende(r)");
  });

  it("hat genau 4 Einträge", () => {
    expect(Object.keys(ROLE_LABELS)).toHaveLength(4);
  });
});

describe("STATUS_LABELS", () => {
  it("enthält alle erwarteten Status", () => {
    expect(STATUS_LABELS.draft).toBe("Entwurf");
    expect(STATUS_LABELS.submitted).toBe("Eingereicht");
    expect(STATUS_LABELS.approved).toBe("Genehmigt");
    expect(STATUS_LABELS.rejected).toBe("Abgelehnt");
    expect(STATUS_LABELS.needs_revision).toBe("Überarbeitung erforderlich");
  });

  it("hat genau 5 Einträge", () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(5);
  });
});

describe("DAY_TYPE_LABELS", () => {
  it("enthält alle erwarteten Tagestypen", () => {
    expect(DAY_TYPE_LABELS.company).toBe("Betrieb");
    expect(DAY_TYPE_LABELS.vocational_school).toBe("Berufsschule");
    expect(DAY_TYPE_LABELS.vacation).toBe("Urlaub");
    expect(DAY_TYPE_LABELS.other).toBe("Sonstiges");
  });

  it("hat genau 4 Einträge", () => {
    expect(Object.keys(DAY_TYPE_LABELS)).toHaveLength(4);
  });
});

describe("DAY_TYPES", () => {
  it("enthält alle 4 Tagestypen in der richtigen Reihenfolge", () => {
    expect(DAY_TYPES).toEqual([
      "company",
      "vocational_school",
      "vacation",
      "other",
    ]);
  });

  it("hat genau 4 Einträge", () => {
    expect(DAY_TYPES).toHaveLength(4);
  });
});

describe("statusVariant", () => {
  it("gibt 'default' für 'draft' zurück", () => {
    expect(statusVariant("draft")).toBe("default");
  });

  it("gibt 'warning' für 'submitted' zurück", () => {
    expect(statusVariant("submitted")).toBe("warning");
  });

  it("gibt 'success' für 'approved' zurück", () => {
    expect(statusVariant("approved")).toBe("success");
  });

  it("gibt 'danger' für 'rejected' zurück", () => {
    expect(statusVariant("rejected")).toBe("danger");
  });

  it("gibt 'info' für 'needs_revision' zurück", () => {
    expect(statusVariant("needs_revision")).toBe("info");
  });

  it("gibt 'default' für unbekannten Status zurück", () => {
    expect(statusVariant("unknown_status")).toBe("default");
  });

  it("gibt 'default' für leeren String zurück", () => {
    expect(statusVariant("")).toBe("default");
  });
});

describe("getIsoWeek", () => {
  it("returns correct week for a known date", () => {
    const result = getIsoWeek(new Date("2026-01-05"));
    expect(result.year).toBe(2026);
    expect(result.week).toBe(2);
  });

  it("returns correct week for mid-year", () => {
    const result = getIsoWeek(new Date("2026-03-09"));
    expect(result.year).toBe(2026);
    expect(result.week).toBe(11);
  });

  it("handles year boundary - late December", () => {
    const result = getIsoWeek(new Date("2026-12-28"));
    expect(result.year).toBe(2026);
    expect(result.week).toBe(53);
  });

  it("handles early January", () => {
    const result = getIsoWeek(new Date("2026-01-01"));
    expect(result.year).toBe(2026);
    expect(result.week).toBe(1);
  });
});

describe("getTrainingStartWeek", () => {
  it("returns null for null input", () => {
    expect(getTrainingStartWeek(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getTrainingStartWeek(undefined)).toBeNull();
  });

  it("returns ISO week for a valid date", () => {
    const result = getTrainingStartWeek(new Date("2026-01-05"));
    expect(result).toEqual({ year: 2026, week: 2 });
  });

  it("returns correct week for mid-year date", () => {
    const result = getTrainingStartWeek(new Date("2026-03-01"));
    expect(result).toEqual({ year: 2026, week: 9 });
  });
});

describe("statusColor", () => {
  it("returns emerald for approved", () => {
    expect(statusColor("approved")).toContain("emerald");
  });

  it("returns amber for submitted", () => {
    expect(statusColor("submitted")).toContain("amber");
  });

  it("returns red for rejected", () => {
    expect(statusColor("rejected")).toContain("red");
  });

  it("returns blue for needs_revision", () => {
    expect(statusColor("needs_revision")).toContain("blue");
  });

  it("returns neutral for draft", () => {
    expect(statusColor("draft")).toContain("neutral");
  });

  it("returns red for missing", () => {
    expect(statusColor("missing")).toContain("red");
  });

  it("returns neutral for unknown status", () => {
    expect(statusColor("unknown_status" as never)).toContain("neutral");
  });
});

describe("getWeeksInMonth", () => {
  it("returns weeks for January 2026", () => {
    const weeks = getWeeksInMonth(2026, 0);
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    expect(weeks[0].year).toBeDefined();
    expect(weeks[0].week).toBeDefined();
    expect(weeks[0].startDate).toBeInstanceOf(Date);
    expect(weeks[0].label).toBeTruthy();
  });

  it("all weeks have valid week numbers", () => {
    const weeks = getWeeksInMonth(2026, 5);
    for (const w of weeks) {
      expect(w.week).toBeGreaterThanOrEqual(1);
      expect(w.week).toBeLessThanOrEqual(53);
    }
  });

  it("returns no duplicate weeks", () => {
    const weeks = getWeeksInMonth(2026, 11);
    const keys = weeks.map((w) => `${w.year}-${w.week}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("covers December with week 52/53", () => {
    const weeks = getWeeksInMonth(2026, 11);
    const weekNums = weeks.map((w) => w.week);
    expect(weekNums.some((w) => w >= 48)).toBe(true);
  });
});
