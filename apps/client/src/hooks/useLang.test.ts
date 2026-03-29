import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLang } from "./useLang";

// Mock i18n
vi.mock("../lib/i18n", () => ({
  getInitialLang: vi.fn(() => "en"),
  setLangStorage: vi.fn(),
  defaultLang: "en",
}));

describe("useLang", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default language", () => {
    const { result } = renderHook(() => useLang());

    expect(result.current[0]).toBe("en");
  });

  it("should set language", () => {
    const { result } = renderHook(() => useLang());

    act(() => {
      result.current[1]("ru");
    });

    expect(result.current[0]).toBe("ru");
  });

  it("should save to localStorage on change", () => {
    const { setLangStorage } = require("../lib/i18n");
    const { result } = renderHook(() => useLang());

    act(() => {
      result.current[1]("de");
    });

    expect(setLangStorage).toHaveBeenCalledWith("de");
  });

  it("should handle language initialization error", () => {
    const { getInitialLang } = require("../lib/i18n");
    getInitialLang.mockImplementationOnce(() => {
      throw new Error("Failed to get lang");
    });

    const { result } = renderHook(() => useLang());

    // Should fall back to defaultLang
    expect(result.current[0]).toBe("en");
  });

  it("should return array with lang and setter", () => {
    const { result } = renderHook(() => useLang());

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
    expect(typeof result.current[0]).toBe("string");
    expect(typeof result.current[1]).toBe("function");
  });
});

