import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHoverState } from "../../src/hooks/useHoverState";

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

  it("should reset all hovers", () => {
    const { result } = renderHook(() => useHoverState());

    act(() => {
      result.current.setHoveredDestination({ id: "1" } as any);
      result.current.setHoveredConnection({ from: "A", to: "B" });
      result.current.setHighlightOwnerSessionToken("token");
    });

    act(() => {
      result.current.resetHovers();
    });

    expect(result.current.hoveredDestination).toBeNull();
    expect(result.current.hoveredConnection).toBeNull();
    expect(result.current.highlightOwnerSessionToken).toBeNull();
  });
});

