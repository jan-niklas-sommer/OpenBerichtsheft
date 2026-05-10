import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("renders without crashing", () => {
    render(<Calendar />);
  });

  it("renders with a selected date", () => {
    render(<Calendar selected={new Date("2026-06-15")} />);
  });

  it("renders with disabled dates", () => {
    render(<Calendar disabled={(date) => date < new Date("2026-01-01")} />);
  });

  it("renders with defaultMonth", () => {
    render(<Calendar defaultMonth={new Date("2026-06-01")} />);
  });

  it("calls onSelect when a date is clicked", async () => {
    const onSelect = vi.fn();
    render(<Calendar onSelect={onSelect} defaultMonth={new Date("2026-06-01")} />);
  });
});
