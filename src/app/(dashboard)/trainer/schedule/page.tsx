"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  type ScheduleAssignmentView,
  type ScheduleType,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";

interface Trainee {
  id: string;
  name: string;
  email: string;
}

interface Officer {
  id: string;
  name: string;
  email: string;
}

export default function SchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleAssignmentView | null>(null);
  const [form, setForm] = useState({
    traineeId: "",
    scheduleType: "department" as ScheduleType,
    startDate: "",
    endDate: "",
    department: "",
    supervisorId: "",
    color: "",
  });
  const [formError, setFormError] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const daysVisible = Math.min(
    365,
    Math.max(60, typeof window !== "undefined" ? Math.floor(window.innerWidth / 4) : 120),
  );

  useEffect(() => {
    Promise.all([
      fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${new Date(viewStart.getTime() + daysVisible * 86400000).toISOString()}`).then((r) => r.json()),
      fetch("/api/users?role=trainee").then((r) => r.json()),
      fetch("/api/users?role=training_officer").then((r) => r.json()),
    ]).then(([sched, tr, off]) => {
      setAssignments(Array.isArray(sched) ? sched : []);
      setTrainees(Array.isArray(tr) ? tr : []);
      setOfficers(Array.isArray(off) ? off : []);
      setLoading(false);
    });
  }, [viewStart, daysVisible]);

  useEffect(() => {
    if (!editItem) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditItem(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editItem]);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((a) =>
        a.trainee.name.toLowerCase().includes(s),
      );
    }
    if (professionFilter) {
      filtered = filtered.filter(
        (a) => a.trainee.profession?.name === professionFilter,
      );
    }
    return filtered;
  }, [assignments, search, professionFilter]);

  const traineeRows = useMemo(() => {
    const seen = new Map<string, { name: string; profession?: string | null }>();
    for (const a of filteredAssignments) {
      if (!seen.has(a.traineeId)) {
        seen.set(a.traineeId, {
          name: a.trainee.name,
          profession: a.trainee.profession?.name,
        });
      }
    }
    return Array.from(seen.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name),
    );
  }, [filteredAssignments]);

  const professions = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments) {
      if (a.trainee.profession?.name) set.add(a.trainee.profession.name);
    }
    return Array.from(set).sort();
  }, [assignments]);

  const hasConflicts = useMemo(() => {
    for (const [traineeId] of traineeRows) {
      const traineeAssignments = filteredAssignments.filter(
        (a) => a.traineeId === traineeId,
      );
      for (let i = 0; i < traineeAssignments.length; i++) {
        for (let j = i + 1; j < traineeAssignments.length; j++) {
          const a = traineeAssignments[i];
          const b = traineeAssignments[j];
          const aStart = new Date(a.startDate);
          const aEnd = new Date(a.endDate);
          const bStart = new Date(b.startDate);
          const bEnd = new Date(b.endDate);
          if (aStart <= bEnd && bStart <= aEnd) return true;
        }
      }
    }
    return false;
  }, [traineeRows, filteredAssignments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newItem = await res.json();
      setAssignments((prev) => [...prev, newItem]);
      setShowAdd(false);
      setForm({
        traineeId: "",
        scheduleType: "department",
        startDate: "",
        endDate: "",
        department: "",
        supervisorId: "",
        color: "",
      });
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler");
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    const res = await fetch("/api/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editItem.id,
        scheduleType: form.scheduleType,
        startDate: form.startDate,
        endDate: form.endDate,
        department: form.department,
        supervisorId: form.supervisorId,
        color: form.color,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAssignments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setEditItem(null);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setEditItem(null);
    }
  };

  const openEdit = (a: ScheduleAssignmentView) => {
    setEditItem(a);
    setForm({
      traineeId: a.traineeId,
      scheduleType: a.scheduleType,
      startDate: a.startDate.split("T")[0],
      endDate: a.endDate.split("T")[0],
      department: a.department || "",
      supervisorId: a.supervisor?.id || "",
      color: a.color || "",
    });
  };

  const navigateMonths = (dir: number) => {
    const d = new Date(viewStart);
    d.setMonth(d.getMonth() + dir);
    setViewStart(d);
  };

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Einsatzplanung
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigateMonths(-1)}>
            ←
          </Button>
          <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            {viewStart.toLocaleDateString("de-DE", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigateMonths(1)}>
            →
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Abbrechen" : "Eintrag hinzufügen"}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Azubi suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {professions.length > 1 && (
          <select
            value={professionFilter}
            onChange={(e) => setProfessionFilter(e.target.value)}
            className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Alle Berufe</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {showAdd && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <select
              value={form.traineeId}
              onChange={(e) => setForm({ ...form, traineeId: e.target.value })}
              required
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Azubi...</option>
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              value={form.scheduleType}
              onChange={(e) =>
                setForm({ ...form, scheduleType: e.target.value as ScheduleType })
              }
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            {form.scheduleType === "department" && (
              <input
                type="text"
                placeholder="Abteilung"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            )}
            <select
              value={form.supervisorId}
              onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Betreuer...</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            {(form.scheduleType === "department" ||
              form.scheduleType === "other") && (
              <input
                type="color"
                value={form.color || TYPE_COLORS[form.scheduleType]}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
              />
            )}
            {formError && (
              <span className="text-sm text-red-500">{formError}</span>
            )}
            <Button type="submit" size="sm">
              Erstellen
            </Button>
          </form>
        </Card>
      )}

      {editItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setEditItem(null)}
        >
          <div
            ref={popoverRef}
            className="w-80 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">
              Bearbeiten
            </h3>
            <div className="space-y-3">
              <select
                value={form.scheduleType}
                onChange={(e) =>
                  setForm({ ...form, scheduleType: e.target.value as ScheduleType })
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              {(form.scheduleType === "department" ||
                form.scheduleType === "other") && (
                <input
                  type="text"
                  placeholder="Abteilung"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              )}
              <select
                value={form.supervisorId}
                onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">Betreuer...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {(form.scheduleType === "department" ||
                form.scheduleType === "other") && (
                <input
                  type="color"
                  value={form.color || TYPE_COLORS[form.scheduleType]}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
                />
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate}>
                  Speichern
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(editItem.id)}
                >
                  Löschen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditItem(null)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GanttTimeline
        rows={traineeRows.map(([id, info]) => ({
          traineeId: id,
          label: info.name,
        }))}
        assignments={filteredAssignments}
        viewStart={viewStart}
        daysVisible={daysVisible}
        mode="edit"
        showConflicts={hasConflicts}
        onCellClick={openEdit}
      />

      <ScheduleLegend />
    </div>
  );
}
