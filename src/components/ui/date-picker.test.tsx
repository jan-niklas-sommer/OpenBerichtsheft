import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatePicker } from "./date-picker";

describe("DatePicker", () => {
  it("renders with placeholder", () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Datum wählen" />);
    expect(screen.getByRole("button", { name: "Datum wählen" })).toBeInTheDocument();
  });

  it("renders with selected date", () => {
    render(<DatePicker value="2026-06-15" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Gewähltes Datum/ })).toBeInTheDocument();
    expect(screen.getByText("15.06.2026")).toBeInTheDocument();
  });

  it("renders as disabled", () => {
    render(<DatePicker value="" onChange={vi.fn()} disabled />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });

  it("shows default placeholder when none provided", () => {
    render(<DatePicker value="" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Datum wählen" })).toBeInTheDocument();
  });
});
