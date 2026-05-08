import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies card styles", () => {
    render(<Card>Test</Card>);
    expect(screen.getByText("Test").className).toContain("rounded-xl");
  });

  it("applies custom className", () => {
    render(<Card className="my-card">Test</Card>);
    expect(screen.getByText("Test").className).toContain("my-card");
  });

  it("forwards HTML attributes", () => {
    render(<Card data-testid="card">Test</Card>);
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("applies margin-bottom", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header").className).toContain("mb-4");
  });
});

describe("CardTitle", () => {
  it("renders children", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title").tagName).toBe("H3");
  });

  it("applies title styles", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title").className).toContain("font-semibold");
  });
});
