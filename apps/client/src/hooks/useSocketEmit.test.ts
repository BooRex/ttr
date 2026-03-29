import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSocketEmit } from "./useSocketEmit";
import { socket } from "../socket";

vi.mock("../socket", () => ({
  socket: {
    emit: vi.fn(),
  },
}));

describe("useSocketEmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with roomId and sessionToken", () => {
    const { result } = renderHook(() => useSocketEmit("room-1", "session-1"));

    expect(result.current.emit).toBeDefined();
  });

  it("should emit event with roomId and sessionToken", () => {
    const { result } = renderHook(() => useSocketEmit("room-123", "token-456"));

    act(() => {
      result.current.emit("room:start");
    });

    expect(socket.emit).toHaveBeenCalledWith("room:start", {
      roomId: "room-123",
      sessionToken: "token-456",
    });
  });

  it("should merge provided data with roomId and sessionToken", () => {
    const { result } = renderHook(() => useSocketEmit("room-1", "token-1"));

    act(() => {
      result.current.emit("game:draw-card", { fromOpenIndex: 2 });
    });

    expect(socket.emit).toHaveBeenCalledWith("game:draw-card", {
      roomId: "room-1",
      sessionToken: "token-1",
      fromOpenIndex: 2,
    });
  });

  it("should handle multiple emissions", () => {
    const { result } = renderHook(() => useSocketEmit("room-1", "token-1"));

    act(() => {
      result.current.emit("room:start");
      result.current.emit("game:draw-card");
    });

    expect(socket.emit).toHaveBeenCalledTimes(2);
  });

  it("should use same emit function on rerenders", () => {
    const { result, rerender } = renderHook(() => useSocketEmit("room-1", "token-1"));
    const firstEmit = result.current.emit;

    rerender();

    expect(result.current.emit).toBe(firstEmit);
  });

  it("should update when roomId changes", () => {
    let roomId = "room-1";
    const { result, rerender } = renderHook(() => useSocketEmit(roomId, "token-1"));

    act(() => {
      result.current.emit("room:start");
    });

    expect(socket.emit).toHaveBeenCalledWith("room:start", {
      roomId: "room-1",
      sessionToken: "token-1",
    });

    roomId = "room-2";
    rerender();

    act(() => {
      result.current.emit("room:start");
    });

    expect(socket.emit).toHaveBeenLastCalledWith("room:start", {
      roomId: "room-2",
      sessionToken: "token-1",
    });
  });
});

