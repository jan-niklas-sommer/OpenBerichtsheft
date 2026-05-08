import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportCalendar } from "./report-calendar";

vi.mock("@/lib/utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...original,
    getIsoWeek: vi.fn().mockReturnValue({ year: 2026, week: 10 }),
  };
});

const mockReports = [
  { calendarYear: 2026, calendarWeek: 9, status: "approved" as const },
  { calendarYear: 2026, calendarWeek: 10, status: "submitted" as const },
  { calendarYear: 2026, calendarWeek: 11, status: "draft" as const },
];

describe("ReportCalendar", () => {
  const onPrevMonth = vi.fn();
  const onNextMonth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders month name and year", () => {
    render(
      <ReportCalendar
        year={2026}
        month={4}
        reports={mockReports}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    expect(screen.getByText("Mai 2026")).toBeInTheDocument();
  });

  it("renders week entries for the month", () => {
    render(
      <ReportCalendar
        year={2026}
        month={0}
        reports={[]}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    expect(screen.getByText(/Januar 2026/)).toBeInTheDocument();
  });

  it("shows report status label for existing reports", () => {
    render(
      <ReportCalendar
        year={2026}
        month={2}
        reports={mockReports}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    expect(screen.getByText("Genehmigt")).toBeInTheDocument();
    expect(screen.getByText("Eingereicht")).toBeInTheDocument();
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
  });

  it("calls onPrevMonth when left arrow clicked", async () => {
    const user = userEvent.setup();
    render(
      <ReportCalendar
        year={2026}
        month={4}
        reports={[]}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onPrevMonth).toHaveBeenCalledOnce();
  });

  it("calls onNextMonth when right arrow clicked", async () => {
    const user = userEvent.setup();
    render(
      <ReportCalendar
        year={2026}
        month={4}
        reports={[]}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);
    expect(onNextMonth).toHaveBeenCalledOnce();
  });

  it("shows 'Vor Eintritt' for weeks before training start", () => {
    render(
      <ReportCalendar
        year={2026}
        month={0}
        reports={[]}
        trainingStartDate="2026-02-01"
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    expect(screen.getAllByText("Vor Eintritt").length).toBeGreaterThan(0);
  });

  it("marks current week", () => {
    render(
      <ReportCalendar
        year={2026}
        month={2}
        reports={[]}
        trainingStartDate={null}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    expect(screen.getByText("Aktuell")).toBeInTheDocument();
  });
});
