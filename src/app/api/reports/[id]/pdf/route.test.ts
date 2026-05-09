import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Readable } from "stream";
import { GET } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    weeklyReport: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    trainerProfessionAssignment: {
      findFirst: vi.fn(),
    },
    traineeOfficerAssignment: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToStream: vi.fn(),
}));

vi.mock("@/components/reports/pdf-document", () => ({
  PdfDocument: () => null,
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.weeklyReport.findUnique as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockTrainerProfessionAssignment = prisma.trainerProfessionAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockOfficerAssignment = prisma.traineeOfficerAssignment.findFirst as ReturnType<typeof vi.fn>;
const mockRenderToStream = renderToStream as unknown as ReturnType<typeof vi.fn>;

const traineeSession = {
  user: { id: "trainee-1", role: "trainee", email: "trainee@test.de", name: "Trainee" },
};

const otherTraineeSession = {
  user: { id: "trainee-2", role: "trainee", email: "trainee2@test.de", name: "Trainee 2" },
};

const trainerSession = {
  user: { id: "trainer-1", role: "trainer", email: "trainer@test.de", name: "Trainer" },
};

const officerSession = {
  user: { id: "officer-1", role: "training_officer", email: "officer@test.de", name: "Officer" },
};

const adminSession = {
  user: { id: "admin-1", role: "admin", email: "admin@test.de", name: "Admin" },
};

const baseReport = {
  id: "report-1",
  traineeId: "trainee-1",
  calendarYear: 2025,
  calendarWeek: 10,
  status: "approved",
  reportText: "Test report",
  weekStartDate: new Date("2025-03-03"),
  weekEndDate: new Date("2025-03-09"),
  submittedAt: new Date("2025-03-10"),
  reviewedAt: new Date("2025-03-11"),
  reviewedById: "trainer-1",
  reviewComment: null,
  createdAt: new Date("2025-03-02"),
  updatedAt: new Date("2025-03-11"),
  dailyEntries: [
    {
      id: "entry-1",
      weeklyReportId: "report-1",
      date: new Date("2025-03-03"),
      dayType: "company",
      hours: 8,
      minutes: 0,
      createdAt: new Date("2025-03-02"),
      updatedAt: new Date("2025-03-02"),
    },
  ],
  trainee: { id: "trainee-1", name: "Trainee", profession: { id: "prof-1", name: "FISI" } },
  reviewedBy: { id: "trainer-1", name: "Trainer" },
};

function makePdfStream(): Readable {
  return new Readable({
    read() {
      this.push(Buffer.from("%PDF-1.4 fake"));
      this.push(null);
    },
  });
}

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/reports/report-1/pdf");
}

const params = Promise.resolve({ id: "report-1" });

describe("GET /api/reports/[id]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRenderToStream.mockResolvedValue(makePdfStream());
  });

  it("returns 401 without session", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when report not found", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });

  it("returns 403 when trainee accesses other trainee's report", async () => {
    mockAuth.mockResolvedValue(otherTraineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 when trainer is not assigned", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockUserFindUnique.mockResolvedValue({ professionId: "prof-1" });
    mockTrainerProfessionAssignment.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 403 when training_officer is not assigned", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockOfficerAssignment.mockResolvedValue(null);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Forbidden");
  });

  it("returns 200 with application/pdf for trainee's own report", async () => {
    mockAuth.mockResolvedValue(traineeSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("berichtsheft-KW10-2025.pdf");
    const body = await res.arrayBuffer();
    expect(new Uint8Array(body)).toBeInstanceOf(Uint8Array);
    expect(body.byteLength).toBeGreaterThan(0);
  });

  it("returns 200 for assigned trainer", async () => {
    mockAuth.mockResolvedValue(trainerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockUserFindUnique.mockResolvedValue({ professionId: "prof-1" });
    mockTrainerProfessionAssignment.mockResolvedValue({ id: "assignment-1" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 200 for assigned training_officer", async () => {
    mockAuth.mockResolvedValue(officerSession);
    mockFindUnique.mockResolvedValue(baseReport);
    mockOfficerAssignment.mockResolvedValue({ id: "assignment-1" });
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 200 for admin without assignment check", async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockFindUnique.mockResolvedValue(baseReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("handles report with null submittedAt and reviewedAt", async () => {
    mockAuth.mockResolvedValue(adminSession);
    const draftReport = {
      ...baseReport,
      status: "draft",
      submittedAt: null,
      reviewedAt: null,
      reviewedBy: null,
    };
    mockFindUnique.mockResolvedValue(draftReport);
    const res = await GET(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });
});
