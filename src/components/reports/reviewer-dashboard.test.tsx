import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    traineeTrainerAssignment: {
      findMany: vi.fn().mockResolvedValue([
        { traineeId: "t-1", trainee: { id: "t-1", name: "Anna" } },
      ]),
    },
    traineeOfficerAssignment: {
      findMany: vi.fn().mockResolvedValue([
        { traineeId: "t-1", trainee: { id: "t-1", name: "Anna" } },
      ]),
    },
    weeklyReport: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "r-1",
          calendarWeek: 10,
          calendarYear: 2025,
          traineeId: "t-1",
          submittedAt: new Date("2025-03-10"),
          trainee: { id: "t-1", name: "Anna" },
        },
      ]),
    },
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a>,
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

  it("renders submitted reports", async () => {
    const result = await ReviewerDashboard({
      userId: "trainer-1",
      role: "trainer",
      title: "Dashboard",
      basePath: "/trainer/report",
    });
    const { container } = render(result);
    expect(container.textContent).toContain("Anna");
    expect(container.textContent).toContain("10");
  });

  it("renders empty state when no reports", async () => {
    const { prisma } = await import("@/lib/prisma");
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
});
