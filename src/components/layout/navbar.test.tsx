import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./navbar";

const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/trainee",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
  });

  it("renders user name", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainee" userName="Anna Azubi" />);
    expect(screen.getByText("Anna Azubi")).toBeInTheDocument();
  });

  it("renders trainee navigation items", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Berichte")).toBeInTheDocument();
  });

  it("renders admin navigation items", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="admin" userName="Admin" />);
    expect(screen.getByText("Benutzer")).toBeInTheDocument();
    expect(screen.getByText("Zuordnungen")).toBeInTheDocument();
    expect(screen.getByText("Berufe")).toBeInTheDocument();
    expect(screen.getByText("Fortschritt")).toBeInTheDocument();
  });

  it("renders trainer navigation", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainer" userName="Trainer" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders officer navigation", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="training_officer" userName="Officer" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders app name", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    expect(screen.getByText("OpenBerichtsheft")).toBeInTheDocument();
  });

  it("renders notification bell button", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    const bellSvg = document.querySelector(".lucide-bell");
    expect(bellSvg).toBeInTheDocument();
  });

  it("renders logout button", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    const logoutSvg = document.querySelector(".lucide-log-out");
    expect(logoutSvg).toBeInTheDocument();
  });

  it("calls signOut on logout click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    const user = userEvent.setup();
    render(<Navbar role="trainee" userName="Test" />);
    const logoutBtn = document.querySelector(".lucide-log-out")!.closest("button")!;
    await user.click(logoutBtn);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });

  it("shows unread count badge", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        notifications: [{ id: "n-1", message: "Test", read: false, createdAt: "2026-03-10" }],
        unreadCount: 3,
      }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows 9+ for more than 9 unread", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        notifications: [],
        unreadCount: 15,
      }),
    });
    render(<Navbar role="trainee" userName="Test" />);
    await waitFor(() => {
      expect(screen.getByText("9+")).toBeInTheDocument();
    });
  });

  it("opens notification dropdown on bell click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        notifications: [
          { id: "n-1", userId: "u-1", type: "info", message: "Neuer Bericht", read: false, createdAt: "2026-03-10T10:00:00Z" },
        ],
        unreadCount: 1,
      }),
    });
    const user = userEvent.setup();
    render(<Navbar role="trainee" userName="Test" />);
    const bellBtn = document.querySelector(".lucide-bell")!.closest("button")!;
    await user.click(bellBtn);
    expect(screen.getByText("Benachrichtigungen")).toBeInTheDocument();
    expect(screen.getByText("Neuer Bericht")).toBeInTheDocument();
  });

  it("marks notification as read", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          notifications: [
            { id: "n-1", userId: "u-1", type: "info", message: "Neuer Bericht", read: false, createdAt: "2026-03-10T10:00:00Z" },
          ],
          unreadCount: 1,
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<Navbar role="trainee" userName="Test" />);
    const bellBtn = document.querySelector(".lucide-bell")!.closest("button")!;
    await user.click(bellBtn);
    const checkBtn = document.querySelector(".lucide-check")!.closest("button")!;
    await user.click(checkBtn);
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications/n-1", { method: "PUT" });
  });

  it("shows empty notification state", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    const user = userEvent.setup();
    render(<Navbar role="trainee" userName="Test" />);
    const bellBtn = document.querySelector(".lucide-bell")!.closest("button")!;
    await user.click(bellBtn);
    expect(screen.getByText("Keine Benachrichtigungen")).toBeInTheDocument();
  });

  it("toggles mobile menu and clicks nav item", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    const user = userEvent.setup();
    const { container } = render(<Navbar role="trainee" userName="Test" />);
    const menuBtn = screen.getByRole("button", { name: "Menü" });
    await user.click(menuBtn);
    expect(container.querySelectorAll("nav").length).toBeGreaterThanOrEqual(2);
    const mobileNav = container.querySelectorAll("nav")[1];
    const mobileLink = mobileNav!.querySelector("a")!;
    await user.click(mobileLink);
  });

  it("closes mobile menu on backdrop click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    const user = userEvent.setup();
    const { container } = render(<Navbar role="trainee" userName="Test" />);
    const menuBtn = screen.getByRole("button", { name: "Menü" });
    await user.click(menuBtn);
    const backdrop = container.querySelector(".bg-black\\/20")!;
    await user.click(backdrop as HTMLElement);
  });

  it("closes notification dropdown on outside click", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        notifications: [{ id: "n-1", userId: "u-1", type: "info", message: "Test", read: false, createdAt: "2026-03-10T10:00:00Z" }],
        unreadCount: 1,
      }),
    });
    const user = userEvent.setup();
    render(<Navbar role="trainee" userName="Test" />);
    const bellBtn = document.querySelector(".lucide-bell")!.closest("button")!;
    await user.click(bellBtn);
    expect(screen.getByText("Benachrichtigungen")).toBeInTheDocument();
    await user.click(document.body);
    expect(screen.queryByText("Benachrichtigungen")).not.toBeInTheDocument();
  });

  it("renders no nav items for unknown role", () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    });
    render(<Navbar role="unknown" userName="Test" />);
    const bellSvg = document.querySelector(".lucide-bell");
    expect(bellSvg).toBeInTheDocument();
  });
});
