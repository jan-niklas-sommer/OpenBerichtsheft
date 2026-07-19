import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "./notification-bell";

const notifications = [
  {
    id: "n-1",
    userId: "user-1",
    type: "report_submitted",
    message: "Bericht wurde eingereicht",
    read: false,
    createdAt: "2026-07-19T10:00:00.000Z",
  },
  {
    id: "n-2",
    userId: "user-1",
    type: "report_reviewed",
    message: "Bericht wurde geprüft",
    read: false,
    createdAt: "2026-07-19T11:00:00.000Z",
  },
];

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks all unread notifications as read after a successful request", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications, unreadCount: 2 }),
      })
      .mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();

    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Benachrichtigungen" }));
    await user.click(
      screen.getByRole("button", { name: "Alle Benachrichtigungen als gelesen markieren" }),
    );

    expect(global.fetch).toHaveBeenLastCalledWith("/api/notifications", { method: "PUT" });
    await waitFor(() => {
      expect(screen.queryByText("2")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Als gelesen markieren" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Alle Benachrichtigungen als gelesen markieren" }),
      ).not.toBeInTheDocument();
    });
  });

  it("keeps unread notifications unchanged when the request fails", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notifications, unreadCount: 2 }),
      })
      .mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();

    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Benachrichtigungen" }));
    await user.click(
      screen.getByRole("button", { name: "Alle Benachrichtigungen als gelesen markieren" }),
    );

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Als gelesen markieren" })).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Alle Benachrichtigungen als gelesen markieren" }),
      ).toBeEnabled();
    });
  });
});
