import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GanttTimeline, ScheduleLegend } from "./gantt-timeline";
import type { ScheduleAssignmentView } from "./types";

function makeAssignment(overrides: Partial<ScheduleAssignmentView> & { id: string; traineeId: string }): ScheduleAssignmentView {
  return {
    scheduleType: "department",
    startDate: "2026-05-04",
    endDate: "2026-05-08",
    department: null,
    color: null,
    trainee: { id: "t1", name: "Test Trainee" },
    supervisor: null,
    ...overrides,
  };
}

const mockViewStart = new Date("2026-05-04");
const mockDaysVisible = 28;

describe("GanttTimeline", () => {
  it("renders without crashing", () => {
    render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
      />,
    );
  });

  it("renders trainee labels in multi-row mode", () => {
    render(
      <GanttTimeline
        rows={[
          { traineeId: "t1", label: "Alice" },
          { traineeId: "t2", label: "Bob" },
        ]}
        assignments={[]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Azubi")).toBeInTheDocument();
  });

  it("does not render Azubi header in singleRow mode", () => {
    render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "" }]}
        assignments={[]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
        singleRow
      />,
    );
    expect(screen.queryByText("Azubi")).not.toBeInTheDocument();
  });

  it("renders assignment blocks as pills", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-15",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
      />,
    );

    const pills = container.querySelectorAll(".rounded-full");
    expect(pills.length).toBeGreaterThanOrEqual(1);
  });

  it("renders inline label on wide blocks", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-29",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        cellWidth={10}
        mode="readonly"
      />,
    );

    const pill = container.querySelector(".rounded-full span");
    expect(pill).toBeTruthy();
    expect(pill?.textContent).toMatch(/KW \d+/);
  });

  it("does not render inline label on narrow blocks", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-05",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        cellWidth={6}
        mode="readonly"
      />,
    );

    const pill = container.querySelector(".rounded-full span");
    expect(pill).not.toBeTruthy();
  });

  it("renders month headers", () => {
    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
      />,
    );

    expect(container.textContent).toContain("Mai 2026");
  });

  it("adds cursor-pointer in edit mode with onCellClick", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="edit"
        onCellClick={() => {}}
      />,
    );

    const pill = container.querySelector(".cursor-pointer");
    expect(pill).toBeInTheDocument();
  });

  it("does not add cursor-pointer in readonly mode", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
      />,
    );

    expect(container.querySelector(".cursor-pointer")).not.toBeInTheDocument();
  });

  it("renders conflict indicator when showConflicts is true and conflicts exist", () => {
    const a1 = makeAssignment({
      id: "a1",
      traineeId: "t1",
      scheduleType: "department",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });
    const a2 = makeAssignment({
      id: "a2",
      traineeId: "t1",
      scheduleType: "school",
      startDate: "2026-05-04",
      endDate: "2026-05-08",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[a1, a2]}
        viewStart={mockViewStart}
        daysVisible={mockDaysVisible}
        mode="readonly"
        showConflicts
      />,
    );

    const ring = container.querySelector(".ring-danger");
    expect(ring).toBeInTheDocument();
  });

  it("filters out weekends from workDays", () => {
    const assignment = makeAssignment({
      id: "a1",
      traineeId: "t1",
      startDate: "2026-05-04",
      endDate: "2026-05-10",
    });

    const { container } = render(
      <GanttTimeline
        rows={[{ traineeId: "t1", label: "Test" }]}
        assignments={[assignment]}
        viewStart={mockViewStart}
        daysVisible={7}
        cellWidth={10}
        mode="readonly"
      />,
    );

    const pill = container.querySelector(".rounded-full") as HTMLElement;
    expect(pill).toBeTruthy();
    expect(pill.style.width).toBe("50px");
  });
});

describe("ScheduleLegend", () => {
  it("renders all category labels", () => {
    render(<ScheduleLegend />);
    expect(screen.getByText("Abteilung")).toBeInTheDocument();
    expect(screen.getByText("Berufsschule")).toBeInTheDocument();
    expect(screen.getByText("Urlaub")).toBeInTheDocument();
    expect(screen.getByText("Sonstiges")).toBeInTheDocument();
  });

  it("renders as pill elements", () => {
    const { container } = render(<ScheduleLegend />);
    const pills = container.querySelectorAll(".rounded-full");
    expect(pills.length).toBe(4);
  });
});
