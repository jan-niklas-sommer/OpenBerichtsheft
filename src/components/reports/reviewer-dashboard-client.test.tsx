import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewerDashboardClient } from "./reviewer-dashboard-client";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

const trainees = [
  {
    id: "t-1",
    name: "Anna Müller",
    profession: "FiAE",
    trainingStartDate: null,
    reports: [
      { id: "r-1", calendarYear: 2026, calendarWeek: 10, status: "submitted", submittedAt: "2026-03-10" },
      { id: "r-2", calendarYear: 2026, calendarWeek: 9, status: "approved", submittedAt: "2026-03-03" },
      { id: "r-3", calendarYear: 2026, calendarWeek: 8, status: "draft", submittedAt: null },
    ],
  },
  {
    id: "t-2",
    name: "Ben Schmidt",
    profession: null,
    trainingStartDate: null,
    reports: [],
  },
];

const defaultProps = {
  title: "Ausbilder-Dashboard",
  basePath: "/trainer/report",
  trainees,
  currentYear: 2026,
  currentWeek: 10,
};

describe("ReviewerDashboardClient", () => {
  it("renders title", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.getByText("Ausbilder-Dashboard")).toBeInTheDocument();
  });

  it("renders submitted count badge", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.getByText("1 offen")).toBeInTheDocument();
  });

  it("hides badge when no submitted reports", () => {
    const noSubmitted = trainees.map((t) => ({
      ...t,
      reports: t.reports.map((r) => ({ ...r, status: "approved" as const })),
    }));
    render(<ReviewerDashboardClient {...defaultProps} trainees={noSubmitted} />);
    expect(screen.queryByText(/offen/)).not.toBeInTheDocument();
  });

  it("renders trainee names", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.getByText("Anna Müller")).toBeInTheDocument();
    expect(screen.getByText("Ben Schmidt")).toBeInTheDocument();
  });

  it("shows profession or fallback", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.getByText(/FiAE/)).toBeInTheDocument();
    expect(screen.getByText(/Kein Beruf/)).toBeInTheDocument();
  });

  it("shows report count per trainee", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.getByText(/3 Berichte/)).toBeInTheDocument();
    expect(screen.getByText(/0 Berichte/)).toBeInTheDocument();
  });

  it("expands trainee on click showing submitted reports first", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    await user.click(screen.getByText("Anna Müller"));
    expect(screen.getByText("Zu prüfen")).toBeInTheDocument();
    expect(screen.getByText("KW 10/2026")).toBeInTheDocument();
  });

  it("shows approved reports in expanded section", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    await user.click(screen.getByText("Anna Müller"));
    expect(screen.getByText("KW 9/2026")).toBeInTheDocument();
  });

  it("shows empty state when trainee has no reports", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    await user.click(screen.getByText("Ben Schmidt"));
    expect(screen.getByText("Keine Berichte vorhanden.")).toBeInTheDocument();
  });

  it("collapses trainee on second click", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    await user.click(screen.getByText("Anna Müller"));
    expect(screen.getByText("Zu prüfen")).toBeInTheDocument();
    await user.click(screen.getByText("Anna Müller"));
    expect(screen.queryByText("Zu prüfen")).not.toBeInTheDocument();
  });

  it("toggles filter panel", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    expect(screen.queryByText("Eingereicht")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filter ein-/ausblenden" }));
    expect(screen.getByText("Eingereicht")).toBeInTheDocument();
    expect(screen.getByText("Alle")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    const filterBtn = screen.getByRole("button", { name: "Filter ein-/ausblenden" });
    await user.click(filterBtn);
    await user.click(screen.getByText("Abgelehnt"));
    expect(screen.queryByText("Anna Müller")).not.toBeInTheDocument();
    expect(screen.queryByText("Ben Schmidt")).not.toBeInTheDocument();
  });

  it("shows empty state when filter yields no results", async () => {
    const user = userEvent.setup();
    render(<ReviewerDashboardClient {...defaultProps} />);
    const filterBtn = screen.getByRole("button", { name: "Filter ein-/ausblenden" });
    await user.click(filterBtn);
    await user.click(screen.getByText("Abgelehnt"));
    expect(screen.getByText("Keine offenen Berichte.")).toBeInTheDocument();
  });

  it("shows empty state when no trainees at all", () => {
    render(<ReviewerDashboardClient {...defaultProps} trainees={[]} />);
    expect(screen.getByText("Keine offenen Berichte.")).toBeInTheDocument();
  });

  it("renders mini week overview dots", async () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    const dots = document.querySelectorAll("a[class*='rounded-sm']");
    expect(dots.length).toBeGreaterThan(0);
  });

  it("renders exactly 8 week dots per trainee", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    const dots = document.querySelectorAll("a[class*='rounded-sm']");
    expect(dots.length).toBe(16);
  });

  it("renders dots as links when report exists", () => {
    render(<ReviewerDashboardClient {...defaultProps} />);
    const links = document.querySelectorAll("a[class*='rounded-sm'][href*='/trainer/report/']");
    expect(links.length).toBeGreaterThan(0);
  });
});
