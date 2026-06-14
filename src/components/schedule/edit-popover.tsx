"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TYPE_LABELS,
  type ScheduleAssignmentView,
  type ScheduleType,
} from "./types";
import type { RecurrenceRuleExpandInput } from "./expand-rules";
import { weekdayToBit, bitfieldContainsWeekday } from "@/lib/schedule-resolver";

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

interface EditAssignmentPopoverProps {
  item: ScheduleAssignmentView;
  rules: RecurrenceRuleExpandInput[];
  officers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}

interface EditForm {
  traineeId: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate: string;
  department: string;
  supervisorId: string;
  weekDays: number[];
  interval: number;
}

function buildForm(item: ScheduleAssignmentView, rules: RecurrenceRuleExpandInput[]): EditForm {
  if (item.ruleId) {
    const rule = rules.find((r) => r.id === item.ruleId);
    const days: number[] = [];
    for (let d = 1; d <= 7; d++) {
      if (rule && bitfieldContainsWeekday(rule.weekDays, d)) days.push(d);
    }
    return {
      traineeId: item.traineeId,
      scheduleType: item.scheduleType,
      startDate: (rule?.startDate ?? item.startDate).split("T")[0],
      endDate: (rule?.endDate ?? item.endDate).split("T")[0],
      department: item.department || "",
      supervisorId: item.supervisor?.id || "",
      weekDays: days.length > 0 ? days : [...DEFAULT_WEEKDAYS],
      interval: rule?.interval ?? 1,
    };
  }
  return {
    traineeId: item.traineeId,
    scheduleType: item.scheduleType,
    startDate: item.startDate.split("T")[0],
    endDate: item.endDate.split("T")[0],
    department: item.department || "",
    supervisorId: item.supervisor?.id || "",
    weekDays: [...DEFAULT_WEEKDAYS],
    interval: 1,
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function EditAssignmentPopover({
  item,
  rules,
  officers,
  onClose,
  onSaved,
}: EditAssignmentPopoverProps) {
  const [form, setForm] = useState<EditForm>(() => buildForm(item, rules));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(buildForm(item, rules));
  }, [item, rules]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleUpdate = async () => {
    if (item.ruleId) {
      const weekDaysBitfield = form.weekDays.reduce((acc, d) => acc | weekdayToBit(d), 0);
      const res = await fetch(`/api/recurrence-rules/${item.ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleType: form.scheduleType,
          startDate: form.startDate,
          endDate: form.endDate,
          weekDays: weekDaysBitfield,
          interval: form.interval,
          department: form.department || null,
          supervisorId: form.supervisorId || null,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
      return;
    }
    const res = await fetch(`/api/schedule/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleType: form.scheduleType,
        startDate: form.startDate,
        endDate: form.endDate,
        department: form.department,
        supervisorId: form.supervisorId,
      }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (item.ruleId) {
      const res = await fetch(`/api/recurrence-rules/${item.ruleId}`, { method: "DELETE" });
      if (res.ok) {
        onSaved();
        onClose();
      }
      return;
    }
    const res = await fetch(`/api/schedule/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      onSaved();
      onClose();
    }
  };

  const handleAddException = async (date: string) => {
    const res = await fetch(`/api/recurrence-rules/${item.ruleId}/exceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Ausnahme konnte nicht erstellt werden");
    }
  };

  const handleRemoveException = async (exceptionId: string) => {
    const res = await fetch(
      `/api/recurrence-rules/${item.ruleId}/exceptions?exceptionId=${exceptionId}`,
      { method: "DELETE" },
    );
    if (res.ok) onSaved();
  };

  if (typeof window === "undefined") return null;

  const rule = item.ruleId ? rules.find((r) => r.id === item.ruleId) : undefined;
  const exceptions = rule?.exceptions ?? [];
  const clickedDate = item.startDate;
  const alreadyExcepted = exceptions.some(
    (ex) => new Date(ex.date).toISOString().slice(0, 10) === clickedDate,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={popoverRef}
        className="w-80 rounded-lg border border-stroke-subtle bg-surface-elevated p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-semibold text-content-base">
          {item.recurring ? "Wiederholungsregel" : "Bearbeiten"}
        </h3>
        {item.recurring && (
          <p className="mb-2 rounded-md bg-surface-overlay px-2 py-1 text-xs text-content-muted">
            Wiederholt sich wöchentlich – Änderungen wirken auf alle Termine der Regel.
          </p>
        )}
        <div className="space-y-3">
          <select
            value={form.scheduleType}
            onChange={(e) => setForm({ ...form, scheduleType: e.target.value as ScheduleType })}
            className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {item.recurring && (
            <>
              <div>
                <label className="mb-1 block text-xs text-content-muted">Wochentage</label>
                <div className="flex gap-1">
                  {DAY_NAMES.map((name, i) => {
                    const day = i + 1;
                    const active = form.weekDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            weekDays: prev.weekDays.includes(day)
                              ? prev.weekDays.filter((d) => d !== day)
                              : [...prev.weekDays, day].sort(),
                          }))
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                          active
                            ? "bg-accent text-accent-fg"
                            : "border border-stroke-base text-content-muted hover:bg-surface-overlay"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-content-muted">Intervall</label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
                >
                  <option value={1}>Jede Woche</option>
                  <option value={2}>Alle 2 Wochen</option>
                  <option value={3}>Alle 3 Wochen</option>
                  <option value={4}>Alle 4 Wochen</option>
                </select>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-content-muted">Von</label>
              <DatePicker
                value={form.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })}
                placeholder="Startdatum"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-content-muted">Bis</label>
              <DatePicker
                value={form.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })}
                placeholder="Enddatum"
              />
            </div>
          </div>
          {(form.scheduleType === "department" || form.scheduleType === "other") && (
            <input
              type="text"
              placeholder={form.scheduleType === "department" ? "Welche Abteilung?" : "Beschreibung"}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
            />
          )}
          <select
            value={form.supervisorId}
            onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
            className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
          >
            <option value="">Betreuer (optional)...</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {item.recurring && item.ruleId && (
            <div className="rounded-lg border border-stroke-subtle bg-surface-overlay p-3">
              <p className="mb-1.5 text-xs font-medium text-content-muted">
                Ausnahme für diesen Termin
              </p>
              <p className="mb-2 text-xs text-content-subtle">
                Termine, die an einem bestimmten Tag nicht greifen sollen (z.B. Feiertag), lassen sich einzeln ausblenden.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={alreadyExcepted}
                onClick={() => handleAddException(clickedDate)}
              >
                {alreadyExcepted
                  ? "Termin bereits ausgeblendet"
                  : `Termin am ${fmtDate(clickedDate)} ausblenden`}
              </Button>
              {exceptions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-content-subtle">Ausgenommene Termine:</p>
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between gap-2 text-xs text-content-muted"
                    >
                      <span>{fmtDate(new Date(ex.date).toISOString().slice(0, 10))}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveException(ex.id)}
                        className="text-accent underline underline-offset-2 hover:opacity-80"
                      >
                        wiederherstellen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-stroke-subtle pt-3">
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Löschen
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Abbrechen
              </Button>
              <Button size="sm" onClick={handleUpdate}>
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
