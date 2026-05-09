import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, TextArea } from "./input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="E-Mail" />);
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
  });

  it("renders without label", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    expect(screen.queryByRole("label")).not.toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("generates id from label", () => {
    render(<Input label="First Name" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "first-name");
  });

  it("uses provided id over generated id", () => {
    render(<Input label="Name" id="custom-id" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "custom-id");
  });

  it("applies error styles when error is present", () => {
    render(<Input error="Error" />);
    expect(screen.getByRole("textbox").className).toContain("border-danger");
  });

  it("forwards ref", () => {
    let ref: HTMLInputElement | null = null;
    render(<Input ref={(el) => { ref = el; }} />);
    expect(ref).toBeInstanceOf(HTMLInputElement);
  });

  it("handles user input", async () => {
    const user = userEvent.setup();
    render(<Input label="Test" />);
    const input = screen.getByLabelText("Test");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });
});

describe("TextArea", () => {
  it("renders textarea element", () => {
    render(<TextArea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<TextArea label="Description" />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<TextArea error="Too short" />);
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    let ref: HTMLTextAreaElement | null = null;
    render(<TextArea ref={(el) => { ref = el; }} />);
    expect(ref).toBeInstanceOf(HTMLTextAreaElement);
  });
});
