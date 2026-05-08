import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReportData } from "./pdf-document";

vi.mock("@react-pdf/renderer", () => ({
  Font: { register: vi.fn() },
  Document: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (s: Record<string, unknown>) => s },
}));

import { PdfDocument } from "./pdf-document";

describe("PdfDocument", () => {
  const report = {
    id: "r-1",
    calendarWeek: 10,
    calendarYear: 2025,
    reportText: "Test Wochenbericht",
    status: "approved",
    submittedAt: "2025-03-10T00:00:00.000Z",
    reviewedAt: "2025-03-11T00:00:00.000Z",
    reviewComment: null,
    weekStartDate: "2025-03-03T00:00:00.000Z",
    weekEndDate: "2025-03-09T00:00:00.000Z",
    trainee: { name: "Anna Azubi", profession: { name: "FiAE" } },
    reviewedBy: { name: "Thomas Ausbilder" },
    dailyEntries: [
      { date: "2025-03-03T00:00:00.000Z", dayType: "company", hours: 8, minutes: 0 },
    ],
  };

  it("renders PDF with report data", () => {
    const { container } = render(<PdfDocument report={report as ReportData} />);
    expect(container.textContent).toContain("Anna Azubi");
    expect(container.textContent).toContain("10");
    expect(container.textContent).toContain("2025");
  });

  it("renders without reviewer", () => {
    const noReviewer = { ...report, reviewedBy: null };
    const { container } = render(<PdfDocument report={noReviewer as ReportData} />);
    expect(container.textContent).toContain("Anna Azubi");
  });
});
