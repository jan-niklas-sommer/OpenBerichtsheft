import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./select";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("Select", () => {
  it("renders select with options", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByLabelText("Choose")).toBeInTheDocument();
  });

  it("renders without label", () => {
    render(<Select options={options} />);
    expect(screen.queryByRole("label")).not.toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Select options={options} error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("applies error styles when error is present", () => {
    render(<Select options={options} error="Error" />);
    expect(screen.getByRole("combobox").className).toContain("border-red-500");
  });

  it("generates id from label", () => {
    render(<Select label="Role" options={options} />);
    expect(screen.getByRole("combobox")).toHaveAttribute("id", "role");
  });

  it("uses provided id", () => {
    render(<Select label="Role" id="my-select" options={options} />);
    expect(screen.getByRole("combobox")).toHaveAttribute("id", "my-select");
  });

  it("handles selection change", async () => {
    const user = userEvent.setup();
    render(<Select label="Pick" options={options} />);
    await user.selectOptions(screen.getByLabelText("Pick"), "b");
    expect(screen.getByLabelText("Pick")).toHaveValue("b");
  });

  it("forwards ref", () => {
    let ref: HTMLSelectElement | null = null;
    render(<Select options={options} ref={(el) => { ref = el; }} />);
    expect(ref).toBeInstanceOf(HTMLSelectElement);
  });
});
