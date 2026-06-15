import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useScheduleView } from "./use-schedule-view";

function mockFetch(schedule: unknown[] = [], rules: unknown[] = []) {
  const calls: string[] = [];
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const u = typeof url === "string" ? url : url.toString();
    calls.push(u);
    if (u.includes("/api/recurrence-rules")) {
      return { json: async () => rules } as Response;
    }
    return { json: async () => schedule } as Response;
  }) as unknown as typeof fetch;
  return calls;
}

describe("useScheduleView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches schedule + rules on mount and stops loading", async () => {
    mockFetch([{ id: "a1", traineeId: "t1", scheduleType: "department", startDate: "2026-01-01", endDate: "2026-12-31", department: null, color: null, trainee: { id: "t1", name: "A" }, supervisor: null }], []);
    const { result } = renderHook(() => useScheduleView());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allViews.length).toBeGreaterThan(0);
  });

  it("sets loading false even when fetch rejects (no infinite spinner)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useScheduleView());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("handles empty data without snapping", async () => {
    mockFetch([], []);
    const { result } = renderHook(() => useScheduleView());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allViews).toEqual([]);
  });

  it("refresh re-fetches", async () => {
    const calls = mockFetch([], []);
    const { result } = renderHook(() => useScheduleView());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = calls.length;
    act(() => result.current.refresh());
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it("scrollNearEdge extends viewEnd (no-bounds fallback)", async () => {
    // Leere Daten -> kein Snap, keine Bounds -> scrollNearEdge nutzt den
    // +24-Monate-Fallback und erweitert viewEnd deterministisch um 1 Monat.
    mockFetch([], []);
    const { result } = renderHook(() => useScheduleView());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.viewEnd.getTime();
    act(() => result.current.scrollNearEdge("end"));
    expect(result.current.viewEnd.getTime()).toBeGreaterThan(before);
  });
});
