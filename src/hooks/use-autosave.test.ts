import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosave } from "./use-autosave";

vi.useFakeTimers();

describe("useAutosave", () => {
  let onSave: (data: unknown) => Promise<void>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined) as unknown as (data: unknown) => Promise<void>;
  });

  it("starts with idle status", () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 1000)
    );
    expect(result.current.saveStatus).toBe("idle");
  });

  it("transitions from saving to saved on successful save via debounce", async () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 500)
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("transitions back to idle after saved timeout", async () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 500)
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe("saved");

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.saveStatus).toBe("idle");
  });

  it("sets error status when save throws", async () => {
    onSave = vi.fn().mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 500)
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(result.current.saveStatus).toBe("error");
  });

  it("debounces rapid data changes", () => {
    const { rerender } = renderHook(
      ({ data }) => useAutosave(data, onSave, 500),
      { initialProps: { data: "a" } }
    );

    rerender({ data: "b" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ data: "c" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("c");
  });

  it("manual save triggers immediately", async () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 5000)
    );

    await act(async () => {
      await result.current.save();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("manual save uses provided data", async () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 5000)
    );

    await act(async () => {
      await result.current.save({ foo: "manual" });
    });

    expect(onSave).toHaveBeenCalledWith({ foo: "manual" });
  });

  it("prevents duplicate in-flight saves and queues pending data", async () => {
    let resolveFirst: () => void;
    const firstPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    let callCount = 0;
    onSave = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return firstPromise;
      return Promise.resolve();
    });

    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 5000)
    );

    act(() => {
      result.current.save({ foo: "first" });
    });

    expect(result.current.saveStatus).toBe("saving");
    expect(onSave).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.save({ foo: "second" });
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst!();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ foo: "second" });
    expect(result.current.saveStatus).toBe("saved");
  });

  it("clears debounce timeout on unmount", () => {
    const { unmount } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave, 500)
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("uses default delay when not provided", () => {
    const { result } = renderHook(() =>
      useAutosave({ foo: "bar" }, onSave as unknown as (data: { foo: string }) => Promise<void>)
    );
    expect(result.current.saveStatus).toBe("idle");
  });

  it("does not save when data is null", () => {
    const { result } = renderHook(() =>
      useAutosave<{ foo: string } | null>(null, onSave as unknown as (data: { foo: string } | null) => Promise<void>, 500)
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.saveStatus).toBe("idle");
  });

  it("does not re-save when only the reference changes (deep compare)", async () => {
    const { rerender } = renderHook(
      ({ data }) => useAutosave(data, onSave, 500),
      { initialProps: { data: { foo: "bar" } } }
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    // new object reference, identical content
    rerender({ data: { foo: "bar" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("reset() marks current data as baseline (no phantom save)", async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave(data, onSave, 500),
      { initialProps: { data: { foo: "bar" } } }
    );
    await act(async () => {
      result.current.reset();
    });
    // Gleicher Inhalt, neue Referenz -> kein Save (Baseline gesetzt)
    rerender({ data: { foo: "bar" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("retries on error and recovers when a later attempt succeeds", async () => {
    let calls = 0;
    onSave = vi.fn().mockImplementation(() => {
      calls++;
      return calls < 2 ? Promise.reject(new Error("fail")) : Promise.resolve();
    }) as unknown as (data: unknown) => Promise<void>;

    const { result } = renderHook(() => useAutosave({ foo: "bar" }, onSave, 500));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.saveStatus).toBe("error");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.saveStatus).toBe("saved");
  });
});
