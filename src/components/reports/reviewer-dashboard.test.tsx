import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...original,
    getIsoWeek: vi.fn().mockReturnValue({ year: 2026, week: 10 }),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeTrainerAssignment: {
      findMany: vi.fn().mockResolvedValue([
        { traineeId: "t-1", trainee: { id: "t-1", name: "Anna", profession: { name: "FiAE" }, trainingStartDate: null } },
      ]),
    },
    traineeOfficerAssignment: {
      findMany: vi.fn().mockResolvedValue([
        { traineeId: "t-1", trainee: { id: "t-1", name: "Anna", profession: { name: "FiAE" }, trainingStartDate: null } },
      ]),
    },
    weeklyReport: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "r-1",
          calendarWeek: 10,
          calendarYear: 2026,
          traineeId: "t-1",
          status: "submitted",
          submittedAt: new Date("2026-03-10"),
        },
      ]),
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { ReviewerDashboard } from "./reviewer-dashboard";

describe("ReviewerDashboard", () => {
  it("renders dashboard title", async () => {
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Ausbilder-Dashboard",
      basePath: "/trainer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("Ausbilder-Dashboard");
  });

  it("renders trainee name and report count", async () => {
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Dashboard",
      basePath: "/trainer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("Anna");
    expect(container.textContent).toContain("1 Berichte");
    expect(container.textContent).toContain("1 offen");
  });

  it("renders empty state when no trainees exist", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.traineeTrainerAssignment.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    (prisma.weeklyReport.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Dashboard",
      basePath: "/trainer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("Keine offenen Berichte");
  });

  it("shows open count badge when submitted reports exist", async () => {
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Dashboard",
      basePath: "/trainer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("1 offen");
  });

  it("expands trainee to show reports on click", async () => {
    const user = userEvent.setup();
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Dashboard",
      basePath: "/trainer/report",
    });
    render(result);
    const annaButton = screen.getByText("Anna").closest("button")!;
    await user.click(annaButton);
    expect(screen.getByText(/Zu prüfen/)).toBeInTheDocument();
    expect(screen.getByText("KW 10/2026")).toBeInTheDocument();
  });

  it("renders for training_officer role", async () => {
    const result = await ReviewerDashboard({
      userId: "officer-1",
      role: "training_officer",
      title: "Officer-Dashboard",
      basePath: "/officer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("Officer-Dashboard");
    expect(container.textContent).toContain("Anna");
  });
});
