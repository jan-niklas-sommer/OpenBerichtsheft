"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  type ScheduleType,
} from "@/components/schedule/types";

const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

interface TraineeOption {
  id: string;
  name: string;
}

interface OfficerOption {
  id: string;
  name: string;
}

type ModalMode = "single" | "recurring" | "composition";

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
  const [color, setColor] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [displayLabel, setDisplayLabel] = useState("");
  const [priority, setPriority] = useState(0);

  if (!open) return null;

  const resetForm = () => {
    setTraineeId("");
    setScheduleType("department");
    setStartDate("");
    setEndDate("");
    setDepartment("");
    setSupervisorId("");
    setColor("");
    setSelectedDays([1, 2, 3, 4, 5]);
    setDisplayLabel("");
    setPriority(0);
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
      if (mode === "single" || mode === "composition") {
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
            color: color || undefined,
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
            color: color || undefined,
            priority,
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
    { key: "composition", label: "Tagesplan" },
  ];

  const inputClass =
    "h-9 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
  const selectClass = inputClass;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-5 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Einsatz planen
        </h3>

        <div className="mb-4 flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
          {modeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(""); }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                mode === tab.key
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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

          {mode === "recurring" && (
            <div>
              <label className="mb-1 block text-xs text-neutral-500">
                Wochentage
              </label>
              <div className="flex gap-1">
                {DAY_NAMES.map((name, i) => {
                  const day = i + 1;
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={inputClass}
              placeholder="Von"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className={inputClass}
              placeholder="Bis"
            />
          </div>

          {mode === "recurring" && (
            <input
              type="text"
              placeholder="Bezeichnung (optional)"
              value={displayLabel}
              onChange={(e) => setDisplayLabel(e.target.value)}
              className={inputClass}
            />
          )}

          {(scheduleType === "department" || scheduleType === "other") && (
            <input
              type="text"
              placeholder="Abteilung / Beschreibung"
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

          {(scheduleType === "department" || scheduleType === "other") && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Farbe</label>
              <input
                type="color"
                value={color || TYPE_COLORS[scheduleType]}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
              />
            </div>
          )}

          {mode === "recurring" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-500">Priorität</label>
              <input
                type="number"
                min={0}
                max={100}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="h-8 w-16 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" loading={submitting}>
              {mode === "recurring" ? "Regel erstellen" : "Erstellen"}
            </Button>
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
          </div>
        </form>
      </div>
    </div>
  );
}
