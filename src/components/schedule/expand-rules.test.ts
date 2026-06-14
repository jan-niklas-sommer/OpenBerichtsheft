import { describe, it, expect } from "vitest";
import { expandRulesToViews, type RecurrenceRuleExpandInput } from "./expand-rules";

function makeRule(over: Partial<RecurrenceRuleExpandInput>): RecurrenceRuleExpandInput {
  return {
    id: "r1",
    traineeId: "t1",
    scheduleType: "school",
    startDate: "2025-01-06",
    endDate: "2025-01-31",
    weekDays: 0b0000001,
    interval: 1,
    department: null,
    trainee: { id: "t1", name: "Anna", profession: null },
    supervisor: null,
    ...over,
  };
}

describe("expandRulesToViews", () => {
  it("expandiert eine Regel in synthetische Views pro Termin", () => {
    const views = expandRulesToViews(
      [makeRule({ weekDays: 0b0000001 })],
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
    expect(views.length).toBe(4);
    expect(views.every((v) => v.recurring === true && v.ruleId === "r1")).toBe(true);
  });

  it("setzt startDate und endDate auf denselben Termintag", () => {
    const views = expandRulesToViews(
      [makeRule({ weekDays: 0b0000001 })],
      new Date("2025-01-01"),
      new Date("2025-01-12"),
    );
    expect(views.length).toBe(1);
    expect(views[0].startDate).toBe(views[0].endDate);
  });

  it("übergibt trainee, supervisor und department", () => {
    const views = expandRulesToViews(
      [makeRule({ department: "IT", supervisor: { id: "o1", name: "Off" } })],
      new Date("2025-01-01"),
      new Date("2025-01-12"),
    );
    expect(views[0].department).toBe("IT");
    expect(views[0].supervisor?.id).toBe("o1");
  });

  it("schließt Ausnahmen aus", () => {
    const views = expandRulesToViews(
      [makeRule({
        weekDays: 0b0000001,
        exceptions: [{ id: "e1", ruleId: "r1", date: new Date("2025-01-13") }],
      })],
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
    expect(views.length).toBe(3);
    expect(views.some((v) => v.startDate === "2025-01-13")).toBe(false);
  });

  it("liefert leer bei Regeln außerhalb der Range", () => {
    const views = expandRulesToViews(
      [makeRule({ startDate: "2025-06-02", endDate: "2025-06-30" })],
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
    expect(views).toEqual([]);
  });

  it("respektiert Intervall 2", () => {
    const views = expandRulesToViews(
      [makeRule({ weekDays: 0b0000001, interval: 2 })],
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
    expect(views.length).toBe(2);
  });
});
