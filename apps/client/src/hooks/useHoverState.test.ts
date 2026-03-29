import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHoverState } from "./useHoverState";

describe("useHoverState", () => {
  it("should initialize with null values", () => {
    const { result } = renderHook(() => useHoverState());

    expect(result.current.hoveredDestination).toBeNull();
    expect(result.current.hoveredConnection).toBeNull();
    expect(result.current.highlightOwnerSessionToken).toBeNull();
  });

  it("should set hovered destination", () => {
    const { result } = renderHook(() => useHoverState());
    const mockDestination = { id: "dest-1", from: "A", to: "B" } as any;

    act(() => {
      result.current.setHoveredDestination(mockDestination);
    });

    expect(result.current.hoveredDestination).toBe(mockDestination);
  });

  it("should set hovered connection", () => {
    const { result } = renderHook(() => useHoverState());
    const mockConnection = { from: "CityA", to: "CityB" };

    act(() => {
      result.current.setHoveredConnection(mockConnection);
    });

    expect(result.current.hoveredConnection).toEqual(mockConnection);
  });

  it("should set highlight owner session token", () => {
    const { result } = renderHook(() => useHoverState());
    const token = "player-token-123";

    act(() => {
      result.current.setHighlightOwnerSessionToken(token);
    });

    expect(result.current.highlightOwnerSessionToken).toBe(token);
  });

  it("should reset all hovers", () => {
    const { result } = renderHook(() => useHoverState());

    // Set some values
    act(() => {
      result.current.setHoveredDestination({ id: "1" } as any);
      result.current.setHoveredConnection({ from: "A", to: "B" });
      result.current.setHighlightOwnerSessionToken("token");
    });

    expect(result.current.hoveredDestination).not.toBeNull();
    expect(result.current.hoveredConnection).not.toBeNull();
    expect(result.current.highlightOwnerSessionToken).not.toBeNull();

    // Reset
    act(() => {
      result.current.resetHovers();
    });

    expect(result.current.hoveredDestination).toBeNull();
    expect(result.current.hoveredConnection).toBeNull();
    expect(result.current.highlightOwnerSessionToken).toBeNull();
  });
});

