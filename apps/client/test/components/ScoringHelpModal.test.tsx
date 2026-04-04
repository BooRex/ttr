import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScoringHelpModal } from "../../src/components/ScoringHelpModal";

describe("ScoringHelpModal", () => {
  it("renders scoring details when open", () => {
    render(<ScoringHelpModal open lang="ru" onClose={vi.fn()} />);

    expect(screen.getByText("Как считаются очки")).toBeTruthy();
    expect(screen.getByText(/Маршрут длиной 6/)).toBeTruthy();
    expect(screen.getByText("Карты маршрутов")).toBeTruthy();
  });

  it("does not render when closed", () => {
    cleanup();
    render(<ScoringHelpModal open={false} lang="ru" onClose={vi.fn()} />);
    expect(screen.queryByText("Как считаются очки")).toBeNull();
  });
});

