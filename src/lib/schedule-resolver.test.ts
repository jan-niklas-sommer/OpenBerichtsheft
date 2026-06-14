import { describe, it, expect } from "vitest";
import {
  weekdayToBit,
  bitfieldContainsWeekday,
  resolveDay,
  resolveWeek,
  ruleAppliesOnDate,
  expandRuleToDays,
  type SingleAssignment,
  type RecurrenceRule,
  type RecurrenceException,
} from "./schedule-resolver";

describe("weekdayToBit", () => {
  it("konvertiert Montag (1) zu Bitwert 1", () => {
    expect(weekdayToBit(1)).toBe(1);
  });

  it("konvertiert Dienstag (2) zu Bitwert 2", () => {
    expect(weekdayToBit(2)).toBe(2);
  });

  it("konvertiert Sonntag (7) zu Bitwert 64", () => {
    expect(weekdayToBit(7)).toBe(64);
  });

  it("wirft bei ungültigem Wochentag (0 oder 8)", () => {
    expect(() => weekdayToBit(0)).toThrow(RangeError);
    expect(() => weekdayToBit(8)).toThrow(RangeError);
  });
});

describe("bitfieldContainsWeekday", () => {
  it("erkennt enthaltenen Wochentag (Mo in 21)", () => {
    expect(bitfieldContainsWeekday(21, 1)).toBe(true);
  });

  it("erkennt nicht enthaltenen Wochentag (Di in 21)", () => {
    expect(bitfieldContainsWeekday(21, 2)).toBe(false);
  });

  it("erkennt alle 7 Tage bei Bitfeld 127", () => {
    for (let d = 1; d <= 7; d++) {
      expect(bitfieldContainsWeekday(127, d)).toBe(true);
    }
  });
});

const noAssignments: SingleAssignment[] = [];
const noRules: RecurrenceRule[] = [];
const noExceptions: RecurrenceException[] = [];

function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("resolveDay (Auflösungsalgorithmus)", () => {
  it("liefert Default-Eintrag wenn keine Regeln und keine Einzeleinsätze existieren", () => {
    const result = resolveDay(new Date("2025-06-16"), noAssignments, noRules, noExceptions);
    expect(result.scheduleType).toBe("department");
    expect(result.date.getFullYear()).toBe(2025);
    expect(result.date.getMonth()).toBe(5);
    expect(result.date.getDate()).toBe(16);
  });

  it("liefert Einzeleinsatz wenn Datum im Bereich liegt", () => {
    const assignment: SingleAssignment = {
      id: "a1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-06-16"),
      endDate: new Date("2025-06-20"),
    };
    const result = resolveDay(new Date("2025-06-18"), [assignment], noRules, noExceptions);
    expect(result.scheduleType).toBe("school");
  });

  it("liefert nichts für Einzeleinsatz außerhalb des Datumbereichs", () => {
    const assignment: SingleAssignment = {
      id: "a1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-06-16"),
      endDate: new Date("2025-06-20"),
    };
    const result = resolveDay(new Date("2025-06-23"), [assignment], noRules, noExceptions);
    expect(result.scheduleType).toBe("department");
  });

  it("liefert RecurrenceRule-Treffer wenn Wochentag im Bitfeld enthalten und Datum im Zeitraum", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(1) | weekdayToBit(3),
      createdAt: new Date("2025-01-01"),
    };
    const result = resolveDay(new Date("2025-06-16"), noAssignments, [rule], noExceptions);
    expect(result.scheduleType).toBe("school");
  });

  it("liefert nichts wenn Wochentag nicht im Bitfeld", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(1),
      createdAt: new Date("2025-01-01"),
    };
    const result = resolveDay(new Date("2025-06-17"), noAssignments, [rule], noExceptions);
    expect(result.scheduleType).toBe("department");
  });

  it("Einzeleinsatz hat höhere Priorität als RecurrenceRule", () => {
    const assignment: SingleAssignment = {
      id: "a1",
      traineeId: "t1",
      scheduleType: "vacation",
      startDate: new Date("2025-06-16"),
      endDate: new Date("2025-06-20"),
    };
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "department",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
      createdAt: new Date("2025-01-01"),
    };
    const result = resolveDay(new Date("2025-06-16"), [assignment], [rule], noExceptions);
    expect(result.scheduleType).toBe("vacation");
  });

  it("jüngere RecurrenceRule gewinnt bei Konflikt mit älterer Regel", () => {
    const olderRule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "department",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
      createdAt: new Date("2025-01-01"),
    };
    const newerRule: RecurrenceRule = {
      id: "r2",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
      createdAt: new Date("2025-06-01"),
    };
    const result = resolveDay(new Date("2025-06-16"), noAssignments, [olderRule, newerRule], noExceptions);
    expect(result.scheduleType).toBe("school");
  });

  it("verwendet ScheduleType-Layering: school > vacation > other > department", () => {
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
      weekDays: 127,
      createdAt: new Date("2025-01-01"),
    };
    const result = resolveDay(new Date("2025-06-16"), noAssignments, [deptRule, schoolRule], noExceptions);
    expect(result.scheduleType).toBe("school");
  });

  it("überspringt RecurrenceRule wenn Ausnahme (RecurrenceException) für das Datum existiert", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: 127,
      createdAt: new Date("2025-01-01"),
    };
    const exception: RecurrenceException = {
      id: "e1",
      ruleId: "r1",
      date: new Date("2025-06-16"),
      reason: "Feiertag",
    };
    const result = resolveDay(new Date("2025-06-16"), noAssignments, [rule], [exception]);
    expect(result.scheduleType).toBe("department");
  });

  it("liefert korrektes Ergebnis für historisches Datum mit aktueller Planung", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(2) | weekdayToBit(4),
      createdAt: new Date("2025-06-01"),
    };
    const result = resolveDay(new Date("2025-03-11"), noAssignments, [rule], noExceptions);
    expect(result.scheduleType).toBe("school");
  });
});

describe("resolveWeek", () => {
  it("liefert 7 DailyEntry-Vorlagen für eine komplette ISO-Woche", () => {
    const results = resolveWeek(2025, 10, noAssignments, noRules, noExceptions);
    expect(results).toHaveLength(7);
    expect(results[0].date.getDay()).toBe(1);
  });

  it("berücksichtigt Wochenwechsel bei Monats- oder Jahresgrenzen korrekt", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      weekDays: weekdayToBit(1),
      createdAt: new Date("2024-01-01"),
    };
    const results = resolveWeek(2024, 52, noAssignments, [rule], noExceptions);
    expect(results).toHaveLength(7);
    const monday = results[0];
    expect(monday.scheduleType).toBe("school");
  });
});

describe("resolveDay mit Intervall", () => {
  const baseRule: RecurrenceRule = {
    id: "r1",
    traineeId: "t1",
    scheduleType: "school",
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-12-31"),
    weekDays: weekdayToBit(1),
    createdAt: new Date("2025-01-01"),
  };

  it("liefert jeden Montag bei interval=1 (Default)", () => {
    const rule = { ...baseRule };
    expect(resolveDay(new Date("2025-01-06"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-13"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-20"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
  });

  it("liefert nur jeden 2. Montag bei interval=2", () => {
    const rule = { ...baseRule, interval: 2 };
    expect(resolveDay(new Date("2025-01-06"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-13"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
    expect(resolveDay(new Date("2025-01-20"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-27"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
  });

  it("liefert nur jeden 3. Montag bei interval=3", () => {
    const rule = { ...baseRule, interval: 3 };
    expect(resolveDay(new Date("2025-01-06"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-13"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
    expect(resolveDay(new Date("2025-01-20"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
    expect(resolveDay(new Date("2025-01-27"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
  });

  it("funktioniert mit mehreren Wochentagen und interval=2", () => {
    const rule: RecurrenceRule = {
      ...baseRule,
      weekDays: weekdayToBit(1) | weekdayToBit(3),
      interval: 2,
    };
    expect(resolveDay(new Date("2025-01-06"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-08"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
    expect(resolveDay(new Date("2025-01-13"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-15"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
    expect(resolveDay(new Date("2025-01-20"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-22"), noAssignments, [rule], noExceptions).scheduleType).toBe("department");
  });

  it("default interval=1 funktioniert ohne explizites Feld", () => {
    const rule: RecurrenceRule = {
      id: "r1",
      traineeId: "t1",
      scheduleType: "school",
      startDate: new Date("2025-01-06"),
      endDate: new Date("2025-01-20"),
      weekDays: weekdayToBit(1),
      createdAt: new Date("2025-01-01"),
    };
    expect(resolveDay(new Date("2025-01-06"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-13"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
    expect(resolveDay(new Date("2025-01-20"), noAssignments, [rule], noExceptions).scheduleType).toBe("school");
  });
});

describe("ruleAppliesOnDate", () => {
  const rule: RecurrenceRule = {
    id: "r1",
    traineeId: "t1",
    scheduleType: "school",
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-01-31"),
    weekDays: weekdayToBit(1),
    createdAt: new Date("2025-01-01"),
  };

  it("gilt an einem passenden Montag innerhalb der Range", () => {
    expect(ruleAppliesOnDate(rule, new Date("2025-01-13"), noExceptions)).toBe(true);
  });

  it("gilt nicht an einem Dienstag (falscher Wochentag)", () => {
    expect(ruleAppliesOnDate(rule, new Date("2025-01-07"), noExceptions)).toBe(false);
  });

  it("gilt nicht vor dem Startdatum", () => {
    expect(ruleAppliesOnDate(rule, new Date("2024-12-30"), noExceptions)).toBe(false);
  });

  it("gilt nicht nach dem Enddatum", () => {
    expect(ruleAppliesOnDate(rule, new Date("2025-02-03"), noExceptions)).toBe(false);
  });

  it("gilt nicht an einem Ausnahmedatum", () => {
    const exceptions: RecurrenceException[] = [
      { id: "e1", ruleId: "r1", date: new Date("2025-01-13") },
    ];
    expect(ruleAppliesOnDate(rule, new Date("2025-01-13"), exceptions)).toBe(false);
  });

  it("beachtet Intervall 2 (nur jeder 2. übereinstimmende Wochentag)", () => {
    const intervalRule = { ...rule, interval: 2 };
    expect(ruleAppliesOnDate(intervalRule, new Date("2025-01-06"), noExceptions)).toBe(true);
    expect(ruleAppliesOnDate(intervalRule, new Date("2025-01-13"), noExceptions)).toBe(false);
    expect(ruleAppliesOnDate(intervalRule, new Date("2025-01-20"), noExceptions)).toBe(true);
  });
});

describe("expandRuleToDays", () => {
  const rule: RecurrenceRule = {
    id: "r1",
    traineeId: "t1",
    scheduleType: "school",
    startDate: new Date("2025-01-06"),
    endDate: new Date("2025-01-31"),
    weekDays: weekdayToBit(1) | weekdayToBit(3),
    createdAt: new Date("2025-01-01"),
  };

  it("expandiert alle Mo/Mi im Bereich", () => {
    const days = expandRuleToDays(rule, new Date("2025-01-01"), new Date("2025-01-31"), noExceptions);
    const isoDays = days.map(localYmd);
    expect(isoDays).toEqual([
      "2025-01-06", "2025-01-08",
      "2025-01-13", "2025-01-15",
      "2025-01-20", "2025-01-22",
      "2025-01-27", "2025-01-29",
    ]);
  });

  it("schließt Ausnahmedaten aus", () => {
    const exceptions: RecurrenceException[] = [
      { id: "e1", ruleId: "r1", date: new Date("2025-01-13") },
    ];
    const days = expandRuleToDays(rule, new Date("2025-01-01"), new Date("2025-01-31"), exceptions);
    expect(days.some((d) => localYmd(d) === "2025-01-13")).toBe(false);
    expect(days.length).toBe(7);
  });

  it("respektiert Range-Grenzen (vor Rule-Start)", () => {
    const days = expandRuleToDays(rule, new Date("2025-01-01"), new Date("2025-01-05"), noExceptions);
    expect(days).toEqual([]);
  });

  it("liefert leeres Array bei invertierter Range", () => {
    const days = expandRuleToDays(rule, new Date("2025-01-31"), new Date("2025-01-01"), noExceptions);
    expect(days).toEqual([]);
  });
});
