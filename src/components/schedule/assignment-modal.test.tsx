import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AssignmentModal } from "./assignment-modal";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const trainees = [
  { id: "t1", name: "Anna Schmidt" },
  { id: "t2", name: "Ben Müller" },
];

const officers = [
  { id: "o1", name: "Max Officer" },
];

describe("AssignmentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <AssignmentModal open={false} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal when open", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByText("Einsatz planen")).toBeInTheDocument();
  });

  it("renders trainee options", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByText("Anna Schmidt")).toBeInTheDocument();
    expect(screen.getByText("Ben Müller")).toBeInTheDocument();
  });

  it("renders officer options", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByText("Max Officer")).toBeInTheDocument();
  });

  it("shows mode tabs", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByText("Einzeleinsatz")).toBeInTheDocument();
    expect(screen.getByText("Wiederholung")).toBeInTheDocument();
  });

  it("shows weekday buttons in recurring mode", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Wiederholung"));
    expect(screen.getByText("Mo")).toBeInTheDocument();
    expect(screen.getByText("Di")).toBeInTheDocument();
    expect(screen.getByText("Mi")).toBeInTheDocument();
    expect(screen.getByText("Do")).toBeInTheDocument();
    expect(screen.getByText("Fr")).toBeInTheDocument();
    expect(screen.getByText("Sa")).toBeInTheDocument();
    expect(screen.getByText("So")).toBeInTheDocument();
  });

  it("shows description input in recurring mode", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Wiederholung"));
    expect(screen.getByPlaceholderText("Beschreibung dieser Regel (optional)")).toBeInTheDocument();
  });

  it("shows department input for department type", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByPlaceholderText("Welche Abteilung?")).toBeInTheDocument();
  });

  it("hides department input for school type", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    const selects = screen.getAllByRole("combobox");
    const typeSelect = selects[1];
    fireEvent.change(typeSelect, { target: { value: "school" } });
    expect(screen.queryByPlaceholderText("Welche Abteilung?")).not.toBeInTheDocument();
  });

  it("shows description placeholder for other type", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    const selects = screen.getAllByRole("combobox");
    const typeSelect = selects[1];
    fireEvent.change(typeSelect, { target: { value: "other" } });
    expect(screen.getByPlaceholderText("Beschreibung")).toBeInTheDocument();
  });

  it("shows Abbrechen and Erstellen buttons", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    expect(screen.getByText("Abbrechen")).toBeInTheDocument();
    expect(screen.getByText("Erstellen")).toBeInTheDocument();
  });

  it("shows Regel erstellen button in recurring mode", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Wiederholung"));
    expect(screen.getByText("Regel erstellen")).toBeInTheDocument();
  });

  it("calls onClose when clicking Abbrechen", () => {
    const onClose = vi.fn();
    render(
      <AssignmentModal open={true} onClose={onClose} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Abbrechen"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(
      <AssignmentModal open={true} onClose={onClose} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    const backdrop = container.firstElementChild!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking modal content", () => {
    const onClose = vi.fn();
    render(
      <AssignmentModal open={true} onClose={onClose} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    const heading = screen.getByText("Einsatz planen");
    const modalContent = heading.closest("div")!;
    fireEvent.mouseDown(modalContent);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("submits single assignment via POST /api/schedule", async () => {
    const onCreated = vi.fn();
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={onCreated} trainees={trainees} officers={officers} />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "t1" } });

    const startBtn = screen.getByRole("button", { name: "Startdatum" });
    const endBtn = screen.getByRole("button", { name: "Enddatum" });
    fireEvent.click(startBtn);
    fireEvent.click(endBtn);

    fireEvent.click(screen.getByText("Erstellen"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/schedule",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it("shows error when submission fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Validation failed" }) });

    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "t1" } });
    const startBtn = screen.getByRole("button", { name: "Startdatum" });
    const endBtn = screen.getByRole("button", { name: "Enddatum" });
    fireEvent.click(startBtn);
    fireEvent.click(endBtn);

    fireEvent.click(screen.getByText("Erstellen"));

    await waitFor(() => {
      expect(screen.getByText("Validation failed")).toBeInTheDocument();
    });
  });

  it("toggles weekday selection in recurring mode", () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Wiederholung"));

    const moButton = screen.getByText("Mo");
    fireEvent.click(moButton);
    fireEvent.click(moButton);
  });

  it("shows error when recurring submission has no days selected", async () => {
    render(
      <AssignmentModal open={true} onClose={vi.fn()} onCreated={vi.fn()} trainees={trainees} officers={officers} />,
    );
    fireEvent.click(screen.getByText("Wiederholung"));

    const moButton = screen.getByText("Mo");
    const tuButton = screen.getByText("Di");
    const weButton = screen.getByText("Mi");
    const thButton = screen.getByText("Do");
    const frButton = screen.getByText("Fr");
    fireEvent.click(moButton);
    fireEvent.click(tuButton);
    fireEvent.click(weButton);
    fireEvent.click(thButton);
    fireEvent.click(frButton);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "t1" } });
    const startBtn = screen.getByRole("button", { name: "Startdatum" });
    const endBtn = screen.getByRole("button", { name: "Enddatum" });
    fireEvent.click(startBtn);
    fireEvent.click(endBtn);

    fireEvent.click(screen.getByText("Regel erstellen"));

    await waitFor(() => {
      expect(screen.getByText("Mindestens ein Wochentag erforderlich")).toBeInTheDocument();
    });
  });
});
