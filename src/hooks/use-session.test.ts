import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSession } from "./use-session";

describe("useSession", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with loading status", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
  });

  it("returns session data when authenticated", async () => {
    const session = {
      user: { id: "1", email: "test@test.de", name: "Test", role: "trainee" },
      expires: "2099-01-01",
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(session),
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });
    expect(result.current.data).toEqual(session);
  });

  it("returns unauthenticated when session fetch returns null", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });
    expect(result.current.data).toBeNull();
  });

  it("returns unauthenticated when fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.status).toBe("unauthenticated");
    });
    expect(result.current.data).toBeNull();
  });

  it("returns user role correctly from session", async () => {
    const session = {
      user: { id: "2", email: "admin@test.de", name: "Admin", role: "admin" },
      expires: "2099-01-01",
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(session),
    } as Response);

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.status).toBe("authenticated");
    });
    expect((result.current.data as { user: { role: string } }).user.role).toBe("admin");
  });
});
