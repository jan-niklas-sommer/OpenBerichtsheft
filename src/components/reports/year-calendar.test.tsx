import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YearCalendar } from "./year-calendar";

vi.mock("@/lib/utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...original,
    getIsoWeek: vi.fn(),
  };
});

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { getIsoWeek } from "@/lib/utils";

const mockGetIsoWeek = getIsoWeek as unknown as ReturnType<typeof vi.fn>;

function setupIsoWeekMock() {
  mockGetIsoWeek.mockImplementation((date: Date) => {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime();
    const oneDay = 86400000;
    const dayOfYear = Math.floor(diff / oneDay) + 1;
    const week = Math.ceil((dayOfYear + (new Date(d.getFullYear(), 0, 1).getDay() || 7) - 1) / 7);
    return { year: d.getFullYear(), week: Math.min(week, 53) };
  });
}

const reports = [
  { calendarYear: 2026, calendarWeek: 1, status: "approved" as const },
  { calendarYear: 2026, calendarWeek: 2, status: "submitted" as const },
  { calendarYear: 2026, calendarWeek: 5, status: "draft" as const },
  { calendarYear: 2026, calendarWeek: 10, status: "rejected" as const },
  { calendarYear: 2026, calendarWeek: 15, status: "needs_revision" as const },
];

describe("YearCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupIsoWeekMock();
  });

  it("renders month labels", () => {
    render(
      <YearCalendar
        year={2026}
        reports={[]}
        trainingStartDate={null}
      />
    );
    expect(screen.getByText("Jan")).toBeInTheDocument();
  });

  it("renders links to report editor", () => {
    render(
      <YearCalendar
        year={2026}
        reports={reports}
        trainingStartDate={null}
      />
    );
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs.some((h) => h?.includes("/trainee/reports/2026-1"))).toBe(true);
    expect(hrefs.some((h) => h?.includes("/trainee/reports/2026-10"))).toBe(true);
  });

  it("disables weeks before training start date", () => {
    render(
      <YearCalendar
        year={2026}
        reports={reports}
        trainingStartDate="2026-03-01"
      />
    );
    const links = screen.getAllByRole("link");
    const disabledLinks = links.filter((l) => l.getAttribute("href") === "#");
    expect(disabledLinks.length).toBeGreaterThan(0);
  });

  it("renders tooltips with date range and status", () => {
    render(
      <YearCalendar
        year={2026}
        reports={reports}
        trainingStartDate={null}
      />
    );
    const tooltips = screen.getAllByTitle(/KW \d+/);
    expect(tooltips.length).toBeGreaterThan(0);
    const approvedTooltips = tooltips.filter((t) => t.getAttribute("title")?.includes("Genehmigt"));
    expect(approvedTooltips.length).toBeGreaterThan(0);
  });

  it("renders with no reports", () => {
    const { container } = render(
      <YearCalendar
        year={2026}
        reports={[]}
        trainingStartDate={null}
      />
    );
    expect(container.querySelectorAll("a").length).toBeGreaterThan(0);
  });

  it("renders with empty grid for leap year", () => {
    const { container } = render(
      <YearCalendar
        year={2024}
        reports={[]}
        trainingStartDate={null}
      />
    );
    expect(container.querySelectorAll("a").length).toBeGreaterThan(0);
  });

  it("shows legend on hover", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <YearCalendar
        year={2026}
        reports={[]}
        trainingStartDate={null}
      />
    );
    await user.hover(container.firstElementChild!);
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
    expect(screen.getByText("Genehmigt")).toBeInTheDocument();
    expect(screen.getByText("Fehlt")).toBeInTheDocument();
  });

  it("renders responsive flex cells", () => {
    const { container } = render(
      <YearCalendar
        year={2026}
        reports={[]}
        trainingStartDate={null}
      />
    );
    const cells = container.querySelectorAll("a");
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => {
      expect(cell.className).toContain("flex-1");
    });
  });
});
