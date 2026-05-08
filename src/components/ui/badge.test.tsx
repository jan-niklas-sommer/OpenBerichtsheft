import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("applies default variant", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-neutral-100");
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Approved</Badge>);
    expect(screen.getByText("Approved").className).toContain("bg-green-100");
  });

  it("applies warning variant", () => {
    render(<Badge variant="warning">Pending</Badge>);
    expect(screen.getByText("Pending").className).toContain("bg-yellow-100");
  });

  it("applies danger variant", () => {
    render(<Badge variant="danger">Rejected</Badge>);
    expect(screen.getByText("Rejected").className).toContain("bg-red-100");
  });

  it("applies info variant", () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText("Info").className).toContain("bg-blue-100");
  });

  it("applies custom className", () => {
    render(<Badge className="extra">Test</Badge>);
    expect(screen.getByText("Test").className).toContain("extra");
  });

  it("renders as inline-flex span", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("inline-flex");
  });
});
