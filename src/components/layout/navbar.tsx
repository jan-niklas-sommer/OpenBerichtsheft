"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-lockup";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  Briefcase,
  BarChart3,
  Settings,
  CalendarDays,
  KeyRound,
  FileDown,
} from "lucide-react";
import { useState } from "react";

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
              <BrandMark size="sm" />
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
