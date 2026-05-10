"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Shield,
  LogOut,
  Menu,
  X,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  CalendarDays,
  Check,
  KeyRound,
  FileDown,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { NotificationData } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  trainee: [
    { href: "/trainee", label: "Übersicht", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/trainee/schedule", label: "Planung", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/trainee/export", label: "Export", icon: <FileDown className="h-4 w-4" /> },
  ],
  trainer: [
    { href: "/trainer", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/trainer/schedule", label: "Planung", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/trainer/officers", label: "Beauftragte", icon: <UserCheck className="h-4 w-4" /> },
  ],
  training_officer: [
    { href: "/officer", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/officer/schedule", label: "Planung", icon: <CalendarDays className="h-4 w-4" /> },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/admin/users", label: "Benutzer", icon: <Users className="h-4 w-4" /> },
    { href: "/admin/assignments", label: "Zuordnungen", icon: <UserCheck className="h-4 w-4" /> },
    { href: "/admin/professions", label: "Berufe", icon: <Briefcase className="h-4 w-4" /> },
    { href: "/admin/settings", label: "Einstellungen", icon: <Settings className="h-4 w-4" /> },
    { href: "/admin/progress", label: "Fortschritt", icon: <BarChart3 className="h-4 w-4" /> },
  ],
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PUT" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="relative" aria-label="Benachrichtigungen">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-content-on-accent">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-stroke-subtle bg-surface-elevated shadow-lg">
          <div className="border-b border-stroke-subtle p-3">
            <p className="text-sm font-medium text-content-base">
              Benachrichtigungen
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-3 text-sm text-content-muted">Keine Benachrichtigungen</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-2 border-b border-stroke-subtle p-3 last:border-0 ${
                  !n.read ? "bg-info-soft" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm text-content-base">{n.message}</p>
                  <p className="mt-1 text-xs text-content-muted">
                    {new Date(n.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded p-1 text-content-subtle hover:bg-surface-overlay hover:text-content-muted"
                    aria-label="Als gelesen markieren"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NavbarProps {
  role: string;
  userName: string;
}

export function Navbar({ role, userName }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS[role] || [];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stroke-subtle bg-surface-base backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden rounded-lg p-2 text-content-muted hover:bg-surface-overlay"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 font-semibold text-content-base">
              <Shield className="h-5 w-5" />
              <span className="hidden sm:inline">OpenBerichtsheft</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-surface-overlay text-content-base"
                    : "text-content-muted hover:bg-surface-overlay hover:text-content-base"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-surface-overlay text-xs font-semibold text-content-muted" aria-label={userName}>
              {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <ThemeToggle />
            <Link
              href="/einstellungen"
              className="inline-flex items-center justify-center rounded-md size-8 bg-transparent p-0 text-content-muted hover:bg-surface-overlay hover:text-content-base transition-colors"
              aria-label="Einstellungen"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
            <div className="mx-1 h-4 w-px bg-stroke-subtle" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-overlay-backdrop/40" onClick={() => setMobileOpen(false)} />
          <nav className="fixed left-0 top-14 bottom-0 w-64 bg-surface-elevated p-4 shadow-lg">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-surface-overlay text-content-base"
                    : "text-content-muted hover:bg-surface-overlay hover:text-content-base"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <Link
              href="/einstellungen"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                pathname === "/einstellungen"
                  ? "bg-surface-overlay text-content-base"
                  : "text-content-muted hover:bg-surface-overlay hover:text-content-base"
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Passwort ändern
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
