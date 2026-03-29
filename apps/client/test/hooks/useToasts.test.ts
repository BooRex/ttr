import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToasts } from "../../src/hooks/useToasts";

vi.useFakeTimers();

describe("useToasts", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it("should initialize with empty toasts", () => {
    const { result } = renderHook(() => useToasts());

    expect(result.current.toasts).toEqual([]);
  });

  it("should add toast", () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast("info", "Test message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      kind: "info",
      message: "Test message",
    });
  });

  it("should remove toast after 4500ms", () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast("error", "Error message");
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});

