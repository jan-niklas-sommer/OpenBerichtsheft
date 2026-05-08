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

  it("renders minutes when > 0", () => {
    const withMinutes = {
      ...report,
      dailyEntries: [{ date: "2025-03-03T00:00:00.000Z", dayType: "company", hours: 7, minutes: 30 }],
    };
    const { container } = render(<PdfDocument report={withMinutes as ReportData} />);
    expect(container.textContent).toContain("30min");
  });

  it("renders no minutes when 0", () => {
    const { container } = render(<PdfDocument report={report as ReportData} />);
    expect(container.textContent).toContain("8h");
    expect(container.textContent).not.toContain("0min");
  });

  it("renders fallback when reportText is null", () => {
    const noText = { ...report, reportText: null };
    const { container } = render(<PdfDocument report={noText as ReportData} />);
    expect(container.textContent).toContain("Kein Berichtstext vorhanden.");
  });

  it("renders review comment when present", () => {
    const withComment = { ...report, reviewComment: "Bitte überarbeiten" };
    const { container } = render(<PdfDocument report={withComment as ReportData} />);
    expect(container.textContent).toContain("Kommentar des Prüfers");
    expect(container.textContent).toContain("Bitte überarbeiten");
  });

  it("renders Unbekannt when no trainee", () => {
    const noTrainee = { ...report, trainee: null };
    const { container } = render(<PdfDocument report={noTrainee as ReportData} />);
    expect(container.textContent).toContain("Unbekannt");
  });

  it("renders without profession", () => {
    const noProf = { ...report, trainee: { name: "Anna", profession: null } };
    const { container } = render(<PdfDocument report={noProf as ReportData} />);
    expect(container.textContent).toContain("Anna");
    expect(container.textContent).not.toContain("|");
  });

  it("renders raw dayType for unknown type", () => {
    const unknownType = {
      ...report,
      dailyEntries: [{ date: "2025-03-03T00:00:00.000Z", dayType: "unknown_type", hours: 8, minutes: 0 }],
    };
    const { container } = render(<PdfDocument report={unknownType as ReportData} />);
    expect(container.textContent).toContain("unknown_type");
  });

  it("renders raw status for unknown status", () => {
    const unknownStatus = { ...report, status: "weird_status" };
    const { container } = render(<PdfDocument report={unknownStatus as ReportData} />);
    expect(container.textContent).toContain("weird_status");
  });

  it("renders without submittedAt and reviewedAt", () => {
    const noDates = { ...report, submittedAt: null, reviewedAt: null };
    const { container } = render(<PdfDocument report={noDates as ReportData} />);
    expect(container.textContent).not.toContain("Eingereicht am");
    expect(container.textContent).not.toContain("Geprüft am");
  });
});
