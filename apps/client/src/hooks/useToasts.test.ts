import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToasts } from "./useToasts";

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
    let toastId: string;

    act(() => {
      result.current.addToast("error", "Error message");
      toastId = result.current.toasts[0].id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("should dismiss toast manually", () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast("info", "Test");
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("should generate unique IDs for toasts", () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.addToast("info", "Message 1");
      result.current.addToast("info", "Message 2");
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });
});

