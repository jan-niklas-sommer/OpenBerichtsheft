import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed"),
  compare: vi.fn().mockResolvedValue(true),
}));

import { hashPassword, verifyPassword, BCRYPT_ROUNDS } from "./password";
import { hash, compare } from "bcryptjs";

describe("password helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports BCRYPT_ROUNDS = 12", () => {
    expect(BCRYPT_ROUNDS).toBe(12);
  });

  it("hashPassword delegates to bcrypt.hash with BCRYPT_ROUNDS", async () => {
    const result = await hashPassword("geheim");
    expect(result).toBe("hashed");
    expect(hash).toHaveBeenCalledWith("geheim", BCRYPT_ROUNDS);
  });

  it("verifyPassword delegates to bcrypt.compare", async () => {
    const result = await verifyPassword("geheim", "hashed");
    expect(result).toBe(true);
    expect(compare).toHaveBeenCalledWith("geheim", "hashed");
  });
});
