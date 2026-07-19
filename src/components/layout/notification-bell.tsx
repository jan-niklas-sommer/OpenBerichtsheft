"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { Bell, Check, CheckCheck } from "lucide-react";
import type { NotificationData } from "@/types";

const MAX_BADGE_COUNT = 9;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", { method: "PUT" });
      if (!response.ok) throw new Error("Benachrichtigungen konnten nicht aktualisiert werden");

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch {
      toast("Benachrichtigungen konnten nicht als gelesen markiert werden", "error");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} className="relative" aria-label="Benachrichtigungen">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-fg">
            {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-stroke-subtle bg-surface-elevated shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-stroke-subtle p-3">
            <p className="text-sm font-medium text-content-base">Benachrichtigungen</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                loading={markingAll}
                onClick={markAllRead}
                aria-label="Alle Benachrichtigungen als gelesen markieren"
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Alle gelesen
              </Button>
            )}
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
