import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

describe("Popover", () => {
  it("renders trigger and content", () => {
    render(
      <Popover>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("applies custom className to content", () => {
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent className="custom-class">Content</PopoverContent>
      </Popover>,
    );
  });

  it("renders with custom align and sideOffset", () => {
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent align="start" sideOffset={8}>
          Content
        </PopoverContent>
      </Popover>,
    );
  });
});
