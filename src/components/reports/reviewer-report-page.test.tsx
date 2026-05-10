import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewerReportPage } from "./reviewer-report-page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "report-1" }),
  useRouter: () => ({ push: mockPush }),
}));

const mockReport = {
  id: "report-1",
  traineeId: "t-1",
  weekStartDate: "2026-03-09",
  weekEndDate: "2026-03-15",
  calendarYear: 2026,
  calendarWeek: 11,
  reportText: "Berichtstext für KW 11",
  status: "submitted",
  submittedAt: "2026-03-15T10:00:00Z",
  reviewedAt: null,
  reviewedById: null,
  reviewComment: null,
  createdAt: "2026-03-09T08:00:00Z",
  updatedAt: "2026-03-15T10:00:00Z",
  trainee: { id: "t-1", name: "Anna Müller", email: "anna@example.com", profession: { id: "p-1", name: "FiAE" } },
  dailyEntries: [
    { id: "d-1", date: "2026-03-09", dayType: "company", hours: 8, minutes: 0 },
    { id: "d-2", date: "2026-03-10", dayType: "vocational_school", hours: 6, minutes: 30 },
    { id: "d-3", date: "2026-03-11", dayType: "company", hours: 8, minutes: 0 },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

describe("ReviewerReportPage", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    mockPush.mockClear();
  });

  it("shows loading state initially", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<ReviewerReportPage basePath="/trainer" />);
    expect(screen.getByText("Laden...")).toBeInTheDocument();
  });

  it("shows not found when report is null", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(null) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Bericht nicht gefunden")).toBeInTheDocument();
    });
  });

  it("renders report details", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText(/KW 11\/2026/)).toBeInTheDocument();
    });
    expect(screen.getByText("Berichtstext für KW 11")).toBeInTheDocument();
    expect(document.body.textContent).toContain("Anna Müller");
    expect(document.body.textContent).toContain("FiAE");
  });

  it("renders daily entries", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText(/KW 11\/2026/)).toBeInTheDocument();
    });
    expect(screen.getByText("6h 30min")).toBeInTheDocument();
    expect(screen.getAllByText("8h 0min").length).toBe(2);
  });

  it("renders status badge", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Eingereicht")).toBeInTheDocument();
    });
  });

  it("renders PDF download button", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("PDF")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("PDF"));
    expect(openSpy).toHaveBeenCalledWith("/api/reports/report-1/pdf", "_blank");
    openSpy.mockRestore();
  });

  it("navigates back on Zurück button click", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Zurück")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Zurück"));
    expect(mockPush).toHaveBeenCalledWith("/trainer");
  });

  it("renders review section for submitted reports", async () => {
    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Prüfung")).toBeInTheDocument();
    });
    expect(screen.getByText("Genehmigen")).toBeInTheDocument();
    expect(screen.getByText("Zurückgeben")).toBeInTheDocument();
    expect(screen.getByText("Ablehnen")).toBeInTheDocument();
  });

  it("does not render review section for approved reports", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ ...mockReport, status: "approved" }),
    });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText(/KW 11\/2026/)).toBeInTheDocument();
    });
    expect(screen.queryByText("Prüfung")).not.toBeInTheDocument();
  });

  it("calls review API and redirects on approve", async () => {
    fetchMock
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) })
      .mockResolvedValueOnce({ ok: true });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Genehmigen")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Genehmigen"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/reports/report-1/review", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "approved" }),
      }));
    });
    expect(mockPush).toHaveBeenCalledWith("/trainer");
  });

  it("calls review API with comment", async () => {
    fetchMock
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) })
      .mockResolvedValueOnce({ ok: true });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Zurückgeben")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    const textarea = screen.getByPlaceholderText("Kommentar für den Azubi...");
    await user.type(textarea, "Bitte überarbeiten");
    await user.click(screen.getByText("Zurückgeben"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/reports/report-1/review", expect.objectContaining({
        body: JSON.stringify({ action: "needs_revision", comment: "Bitte überarbeiten" }),
      }));
    });
  });

  it("calls review API for reject action", async () => {
    fetchMock
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) })
      .mockResolvedValueOnce({ ok: true });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Ablehnen")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Ablehnen"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/reports/report-1/review", expect.objectContaining({
        body: JSON.stringify({ action: "rejected" }),
      }));
    });
  });

  it("does not redirect when review API fails", async () => {
    fetchMock
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockReport) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ error: "Fehler" }) });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Genehmigen")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Genehmigen"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders review comment when present", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({
        ...mockReport,
        status: "needs_revision",
        reviewComment: "Bitte mehr Details",
      }),
    });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Letzter Prüfungskommentar")).toBeInTheDocument();
    });
    expect(screen.getByText("Bitte mehr Details")).toBeInTheDocument();
  });

  it("renders no report text fallback", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({ ...mockReport, reportText: null }),
    });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText("Kein Berichtstext vorhanden.")).toBeInTheDocument();
    });
  });

  it("renders entry key using date when id is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({
        ...mockReport,
        dailyEntries: [{ date: "2026-03-09", dayType: "company", hours: 8, minutes: 0 }],
      }),
    });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText(/KW 11\/2026/)).toBeInTheDocument();
    });
    expect(screen.getByText("8h 0min")).toBeInTheDocument();
  });

  it("renders trainee without profession", async () => {
    fetchMock.mockResolvedValueOnce({
      json: () => Promise.resolve({
        ...mockReport,
        trainee: { id: "t-1", name: "Anna Müller", email: "anna@example.com", profession: null },
      }),
    });
    render(<ReviewerReportPage basePath="/trainer" />);
    await waitFor(() => {
      expect(screen.getByText(/KW 11\/2026/)).toBeInTheDocument();
    });
    expect(screen.queryByText("FiAE")).not.toBeInTheDocument();
  });
});
