import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekNavigator } from "./week-navigator";

describe("WeekNavigator", () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders current week and year", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByText("KW 10/2026")).toBeInTheDocument();
  });

  it("renders profession name", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
        professionName="FiAE"
      />
    );
    expect(screen.getByText("FiAE")).toBeInTheDocument();
  });

  it("renders current status badge", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus="approved"
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByText("Genehmigt")).toBeInTheDocument();
  });

  it("renders adjacent prev status", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: "draft" as const, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
  });

  it("renders adjacent next status", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: "submitted" as const }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByText("Eingereicht")).toBeInTheDocument();
  });

  it("calls onNavigate(-1) on prev click", async () => {
    const user = userEvent.setup();
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByLabelText("Vorherige Woche"));
    expect(onNavigate).toHaveBeenCalledWith(-1);
  });

  it("calls onNavigate(1) on next click", async () => {
    const user = userEvent.setup();
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    await user.click(screen.getByLabelText("Nächste Woche"));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("disables prev button when prevDisabled is true", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={1}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={true}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByLabelText("Vorherige Woche")).toBeDisabled();
  });

  it("does not render status badges when null", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    expect(screen.queryByText("Genehmigt")).not.toBeInTheDocument();
    expect(screen.queryByText("Entwurf")).not.toBeInTheDocument();
    expect(screen.queryByText("Eingereicht")).not.toBeInTheDocument();
  });

  it("navigates on ArrowLeft key press", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onNavigate).toHaveBeenCalledWith(-1);
  });

  it("navigates on ArrowRight key press", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={10}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={false}
        onNavigate={onNavigate}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("does not navigate on ArrowLeft when prevDisabled", () => {
    render(
      <WeekNavigator
        currentYear={2026}
        currentWeek={1}
        currentStatus={null}
        adjacentStatuses={{ prev: null, next: null }}
        prevDisabled={true}
        onNavigate={onNavigate}
      />
    );
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("ignores arrow keys when focus is on input element", () => {
    render(
      <>
        <input data-testid="test-input" />
        <WeekNavigator
          currentYear={2026}
          currentWeek={10}
          currentStatus={null}
          adjacentStatuses={{ prev: null, next: null }}
          prevDisabled={false}
          onNavigate={onNavigate}
        />
      </>
    );
    const input = screen.getByTestId("test-input");
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
