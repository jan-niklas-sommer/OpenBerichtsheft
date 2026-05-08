import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "./navbar";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/trainee",
  useRouter: () => ({ push: vi.fn() }),
}));

global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
});

describe("Navbar", () => {
  it("renders user name", () => {
    render(<Navbar role="trainee" userName="Anna Azubi" />);
    expect(screen.getByText("Anna Azubi")).toBeInTheDocument();
  });

  it("renders trainee navigation items", () => {
    render(<Navbar role="trainee" userName="Test" />);
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Berichte")).toBeInTheDocument();
  });

  it("renders admin navigation items", () => {
    render(<Navbar role="admin" userName="Admin" />);
    expect(screen.getByText("Benutzer")).toBeInTheDocument();
    expect(screen.getByText("Zuordnungen")).toBeInTheDocument();
    expect(screen.getByText("Berufe")).toBeInTheDocument();
    expect(screen.getByText("Fortschritt")).toBeInTheDocument();
  });

  it("renders trainer navigation", () => {
    render(<Navbar role="trainer" userName="Trainer" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders officer navigation", () => {
    render(<Navbar role="training_officer" userName="Officer" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders app name", () => {
    render(<Navbar role="trainee" userName="Test" />);
    expect(screen.getByText("OpenBerichtsheft")).toBeInTheDocument();
  });

  it("renders notification bell button", () => {
    render(<Navbar role="trainee" userName="Test" />);
    const bellSvg = document.querySelector(".lucide-bell");
    expect(bellSvg).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Navbar role="trainee" userName="Test" />);
    const logoutSvg = document.querySelector(".lucide-log-out");
    expect(logoutSvg).toBeInTheDocument();
  });
});
