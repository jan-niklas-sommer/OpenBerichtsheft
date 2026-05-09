"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TYPE_LABELS,
  type ScheduleType,
} from "@/components/schedule/types";
import { weekdayToBit } from "@/lib/schedule-resolver";

const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

interface TraineeOption {
  id: string;
  name: string;
}

interface OfficerOption {
  id: string;
  name: string;
}

type ModalMode = "single" | "recurring";

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  trainees: TraineeOption[];
  officers: OfficerOption[];
}

export function AssignmentModal({
  open,
  onClose,
  onCreated,
  trainees,
  officers,
}: AssignmentModalProps) {
  const [mode, setMode] = useState<ModalMode>("single");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [traineeId, setTraineeId] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("department");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [displayLabel, setDisplayLabel] = useState("");

  const previewDates = useMemo(() => {
    if (mode !== "recurring" || !startDate || !endDate || selectedDays.length === 0) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const bitfield = selectedDays.reduce((acc, d) => acc | weekdayToBit(d), 0);
    const dates: Date[] = [];
    const d = new Date(start);
    while (d <= end) {
      const isoDay = d.getDay() === 0 ? 7 : d.getDay();
      if ((bitfield & (1 << (isoDay - 1))) !== 0) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates.slice(0, 12);
  }, [mode, startDate, endDate, selectedDays]);

  if (!open) return null;

  const resetForm = () => {
    setTraineeId("");
    setScheduleType("department");
    setStartDate("");
    setEndDate("");
    setDepartment("");
    setSupervisorId("");
    setSelectedDays([1, 2, 3, 4, 5]);
    setDisplayLabel("");
    setError("");
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "single") {
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            traineeId,
            scheduleType,
            startDate,
            endDate,
            department: department || undefined,
            supervisorId: supervisorId || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Fehler");
          return;
        }
      }

      if (mode === "recurring") {
        if (selectedDays.length === 0) {
          setError("Mindestens ein Wochentag erforderlich");
          return;
        }
        const res = await fetch("/api/recurrence-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            traineeId,
            scheduleType,
            startDate,
            endDate,
            weekDays: selectedDays,
            displayLabel: displayLabel || undefined,
            department: department || undefined,
            supervisorId: supervisorId || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Fehler");
          return;
        }
      }

      resetForm();
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  const modeTabs: { key: ModalMode; label: string }[] = [
    { key: "single", label: "Einzeleinsatz" },
    { key: "recurring", label: "Wiederholung" },
  ];

  const inputClass =
    "h-9 w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base";
  const selectClass = inputClass;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-stroke-subtle bg-surface-elevated p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-content-base">
          Einsatz planen
        </h3>

        <div className="mb-4 flex gap-1 rounded-lg border border-stroke-subtle p-1">
          {modeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(""); }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === tab.key
                  ? "bg-accent text-accent-fg"
                  : "text-content-muted hover:bg-surface-overlay"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <select
              value={traineeId}
              onChange={(e) => setTraineeId(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Azubi auswählen...</option>
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className={selectClass}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {mode === "recurring" && (
            <div>
              <label className="mb-1 block text-xs text-content-muted">
                Wochentage
              </label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((name, i) => {
                  const day = i + 1;
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
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
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-content-muted">Von</label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Startdatum"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-content-muted">Bis</label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Enddatum"
              />
            </div>
          </div>

          {mode === "recurring" && (
            <input
              type="text"
              placeholder="Beschreibung dieser Regel (optional)"
              value={displayLabel}
              onChange={(e) => setDisplayLabel(e.target.value)}
              className={inputClass}
            />
          )}

          {(scheduleType === "department" || scheduleType === "other") && (
            <input
              type="text"
              placeholder={
                scheduleType === "department"
                  ? "Welche Abteilung?"
                  : "Beschreibung"
              }
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={inputClass}
            />
          )}

          <select
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            className={selectClass}
          >
            <option value="">Betreuer (optional)...</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {mode === "recurring" && previewDates.length > 0 && (
            <div className="rounded-lg border border-stroke-subtle bg-surface-overlay p-3">
              <p className="mb-1.5 text-xs font-medium text-content-muted">
                Nächste {previewDates.length} Termine
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-content-muted">
                {previewDates.map((d) => (
                  <span key={d.toISOString()}>
                    {d.toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mode === "recurring" && startDate && endDate && selectedDays.length > 0 && previewDates.length === 0 && (
            <p className="text-sm text-danger">
              Diese Regel erzeugt keine Termine im Geltungszeitraum.
            </p>
          )}

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-stroke-subtle pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Abbrechen
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {mode === "recurring" ? "Regel erstellen" : "Erstellen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
