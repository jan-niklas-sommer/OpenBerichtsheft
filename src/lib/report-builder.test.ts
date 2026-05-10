import { describe, it, expect } from "vitest";
import { buildDefaultEntries } from "./report-builder";
import { weekdayToBit, type RecurrenceRule, type SingleAssignment, type RecurrenceException } from "./schedule-resolver";

const noAssignments: SingleAssignment[] = [];
const noRules: RecurrenceRule[] = [];
const noExceptions: RecurrenceException[] = [];

describe("buildDefaultEntries (Prefill)", () => {
  it("erzeugt 7 DailyEntry-Zeilen für eine Woche ohne Planung (alle default)", () => {
    const entries = buildDefaultEntries(2025, 10, noAssignments, noRules, noExceptions);
    expect(entries).toHaveLength(7);
    for (const entry of entries) {
      expect(entry.dayType).toBe("company");
      expect(entry.hours).toBe(8);
      expect(entry.minutes).toBe(0);
      expect(entry.reportText).toBe("");
    }
  });

  it("füllt dayType aus aufgelöstem ScheduleType korrekt", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(1) | weekdayToBit(2),
    
      createdAt: new Date("2025-01-01"),
    };
    const entries = buildDefaultEntries(2025, 10, noAssignments, [rule], noExceptions);
    expect(entries[0].dayType).toBe("vocational_school");
    expect(entries[1].dayType).toBe("vocational_school");
    expect(entries[2].dayType).toBe("company");
  });

  it("füllt Stunden/Minuten aus den Default-Werten", () => {
    const entries = buildDefaultEntries(2025, 10, noAssignments, noRules, noExceptions);
    for (const entry of entries) {
      expect(entry.hours).toBe(8);
      expect(entry.minutes).toBe(0);
    }
  });

  it("setzt 0 Stunden für Urlaub", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "vacation",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
      createdAt: new Date("2025-01-01"),
    };
    const entries = buildDefaultEntries(2025, 10, noAssignments, [rule], noExceptions);
    for (const entry of entries) {
      expect(entry.hours).toBe(0);
      expect(entry.dayType).toBe("vacation");
    }
  });

  it("lässt reportText-Felder leer (kein automatischer Text)", () => {
    const entries = buildDefaultEntries(2025, 10, noAssignments, noRules, noExceptions);
    for (const entry of entries) {
      expect(entry.reportText).toBe("");
    }
  });

  it("setzt korrektes Datum pro Wochentag (Mo-So)", () => {
    const entries = buildDefaultEntries(2025, 10, noAssignments, noRules, noExceptions);
    expect(entries[0].date).toBe("2025-03-03");
    expect(entries[6].date).toBe("2025-03-09");
  });

  it("wendet Layering an: Schultag überdeckt Abteilung am selben Tag", () => {
    const deptRule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "department",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
    
      createdAt: new Date("2025-01-01"),
    };
    const schoolRule: RecurrenceRule = {
      id: "r2",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(1),
    
      createdAt: new Date("2025-01-01"),
    };
    const entries = buildDefaultEntries(2025, 10, noAssignments, [deptRule, schoolRule], noExceptions);
    expect(entries[0].dayType).toBe("vocational_school");
    expect(entries[1].dayType).toBe("company");
  });

  it("erzeugt keinen Eintrag mit gelockten Feldern (Soft-Prefill)", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
    
      createdAt: new Date("2025-01-01"),
    };
    const entries = buildDefaultEntries(2025, 10, noAssignments, [rule], noExceptions);
    for (const entry of entries) {
      expect(entry.hours).toBeDefined();
      expect(typeof entry.hours).toBe("number");
    }
  });
});
