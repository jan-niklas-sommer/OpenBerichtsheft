import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited, recordFailedAttempt, clearAttempts, _reset } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    _reset();
  });

  it("is not rate limited initially", () => {
    expect(isRateLimited("test@example.com")).toBe(false);
  });

  it("is not rate limited after 4 failed attempts", () => {
    for (let i = 0; i < 4; i++) recordFailedAttempt("test@example.com");
    expect(isRateLimited("test@example.com")).toBe(false);
  });

  it("is rate limited after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt("test@example.com");
    expect(isRateLimited("test@example.com")).toBe(true);
  });

  it("clears attempts on clearAttempts", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt("test@example.com");
    expect(isRateLimited("test@example.com")).toBe(true);
    clearAttempts("test@example.com");
    expect(isRateLimited("test@example.com")).toBe(false);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt("user1@test.de");
    expect(isRateLimited("user1@test.de")).toBe(true);
    expect(isRateLimited("user2@test.de")).toBe(false);
  });

  it("unlocks after lockout period expires", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) recordFailedAttempt("test@example.com");
    expect(isRateLimited("test@example.com")).toBe(true);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);
    expect(isRateLimited("test@example.com")).toBe(false);
    vi.useRealTimers();
  });

  it("stays locked before lockout period expires", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) recordFailedAttempt("test@example.com");
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(isRateLimited("test@example.com")).toBe(true);
    vi.useRealTimers();
  });
});
