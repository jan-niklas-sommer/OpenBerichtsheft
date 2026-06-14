import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditAssignmentPopover } from "./edit-popover";
import type { ScheduleAssignmentView } from "./types";
import type { RecurrenceRuleExpandInput } from "./expand-rules";

const baseItem = (over: Partial<ScheduleAssignmentView>): ScheduleAssignmentView => ({
  id: "a1",
  traineeId: "t1",
  scheduleType: "department",
  startDate: "2025-01-13",
  endDate: "2025-01-13",
  department: null,
  color: null,
  trainee: { id: "t1", name: "Anna", profession: null },
  supervisor: null,
  ...over,
});

const officers = [{ id: "o1", name: "Off" }];

describe("EditAssignmentPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollTo = vi.fn();
  });

  it("renders single-assignment mode without recurring fields", () => {
    render(
      <EditAssignmentPopover
        item={baseItem({ recurring: false })}
        rules={[]}
        officers={officers}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("Bearbeiten")).toBeInTheDocument();
    expect(screen.queryByText("Wochentage")).not.toBeInTheDocument();
  });

  it("renders recurring fields and exception section for rule items", () => {
    const rules: RecurrenceRuleExpandInput[] = [
      {
        id: "r1",
        traineeId: "t1",
        scheduleType: "school",
        startDate: "2025-01-06",
        endDate: "2025-01-31",
        weekDays: 0b0000001,
        interval: 1,
        trainee: { id: "t1", name: "Anna", profession: null },
        supervisor: null,
        exceptions: [],
      },
    ];
    render(
      <EditAssignmentPopover
        item={baseItem({ id: "r1", ruleId: "r1", recurring: true, scheduleType: "school" })}
        rules={rules}
        officers={officers}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("Wiederholungsregel")).toBeInTheDocument();
    expect(screen.getByText("Wochentage")).toBeInTheDocument();
    expect(screen.getByText("Intervall")).toBeInTheDocument();
    expect(screen.getByText(/Ausnahme für diesen Termin/)).toBeInTheDocument();
    // Mo should be active (weekDays = bit 0)
    expect(screen.getByText("Mo")).toHaveClass("bg-accent");
  });

  it("disables exception button when date already excepted", () => {
    const rules: RecurrenceRuleExpandInput[] = [
      {
        id: "r1",
        traineeId: "t1",
        scheduleType: "school",
        startDate: "2025-01-06",
        endDate: "2025-01-31",
        weekDays: 0b0000001,
        interval: 1,
        trainee: { id: "t1", name: "Anna", profession: null },
        supervisor: null,
        exceptions: [{ id: "e1", ruleId: "r1", date: "2025-01-13" }],
      },
    ];
    render(
      <EditAssignmentPopover
        item={baseItem({ id: "r1", ruleId: "r1", recurring: true, scheduleType: "school" })}
        rules={rules}
        officers={officers}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("Termin bereits ausgeblendet")).toBeDisabled();
  });

  it("toggles a weekday", async () => {
    const user = userEvent.setup();
    const rules: RecurrenceRuleExpandInput[] = [
      {
        id: "r1",
        traineeId: "t1",
        scheduleType: "school",
        startDate: "2025-01-06",
        endDate: "2025-01-31",
        weekDays: 0b0000001,
        interval: 1,
        trainee: { id: "t1", name: "Anna", profession: null },
        supervisor: null,
        exceptions: [],
      },
    ];
    render(
      <EditAssignmentPopover
        item={baseItem({ id: "r1", ruleId: "r1", recurring: true, scheduleType: "school" })}
        rules={rules}
        officers={officers}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );
    const di = screen.getByText("Di");
    expect(di).not.toHaveClass("bg-accent");
    await user.click(di);
    expect(di).toHaveClass("bg-accent");
  });
});
