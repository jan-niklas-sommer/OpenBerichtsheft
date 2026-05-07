import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function authorize(credentials?: Record<string, string> | null) {
  if (!credentials?.email || !credentials?.password) return null;

  const user = await prisma.user.findUnique({
    where: { email: credentials.email as string },
  });

  if (!user || user.deactivatedAt || user.anonymizedAt) return null;

  const valid = await bcrypt.compare(
    credentials.password as string,
    user.passwordHash
  );
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

describe("authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null without credentials", async () => {
    const result = await authorize(null);
    expect(result).toBeNull();
  });

  it("returns null without email", async () => {
    const result = await authorize({ password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null without password", async () => {
    const result = await authorize({ email: "test@test.de" });
    expect(result).toBeNull();
  });

  it("returns null when user not found", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await authorize({ email: "unknown@test.de", password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null for deactivated user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      email: "test@test.de",
      name: "Test",
      role: "trainee",
      passwordHash: "hash",
      deactivatedAt: new Date(),
      anonymizedAt: null,
    });
    const result = await authorize({ email: "test@test.de", password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null for anonymized user", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      email: "test@test.de",
      name: "Test",
      role: "trainee",
      passwordHash: "hash",
      deactivatedAt: null,
      anonymizedAt: new Date(),
    });
    const result = await authorize({ email: "test@test.de", password: "secret" });
    expect(result).toBeNull();
  });

  it("returns null for wrong password", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      email: "test@test.de",
      name: "Test",
      role: "trainee",
      passwordHash: "hash",
      deactivatedAt: null,
      anonymizedAt: null,
    });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await authorize({ email: "test@test.de", password: "wrong" });
    expect(result).toBeNull();
  });

  it("returns user object for correct credentials", async () => {
    const dbUser = {
      id: "1",
      email: "test@test.de",
      name: "Test User",
      role: "trainee",
      passwordHash: "hash",
      deactivatedAt: null,
      anonymizedAt: null,
    };
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(dbUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const result = await authorize({ email: "test@test.de", password: "secret" });

    expect(result).toEqual({
      id: "1",
      email: "test@test.de",
      name: "Test User",
      role: "trainee",
    });
  });

  it("calls bcrypt.compare with password and hash", async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      email: "test@test.de",
      name: "Test",
      role: "trainee",
      passwordHash: "storedhash",
      deactivatedAt: null,
      anonymizedAt: null,
    });
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await authorize({ email: "test@test.de", password: "mypass" });

    expect(bcrypt.compare).toHaveBeenCalledWith("mypass", "storedhash");
  });
});
