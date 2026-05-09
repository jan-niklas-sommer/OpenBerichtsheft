"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ScheduleAssignment {
  id: string;
  traineeId: string;
  scheduleType: "department" | "school" | "vacation" | "other";
  startDate: string;
  endDate: string;
  department: string | null;
  color: string | null;
  trainee: { id: string; name: string; profession?: { name: string } | null };
  supervisor: { id: string; name: string; email: string } | null;
}

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

const TYPE_COLORS: Record<string, string> = {
  school: "#3b82f6",
  vacation: "#f59e0b",
  department: "#10b981",
  other: "#8b5cf6",
};

const TYPE_LABELS: Record<string, string> = {
  department: "Abteilung",
  school: "Berufsschule",
  vacation: "Urlaub",
  other: "Sonstiges",
};

const LAYER_ORDER = ["school", "vacation", "other", "department"];

export default function SchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
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
  const [editItem, setEditItem] = useState<ScheduleAssignment | null>(null);
  const [form, setForm] = useState({
    traineeId: "",
    scheduleType: "department" as string,
    startDate: "",
    endDate: "",
    department: "",
    supervisorId: "",
    color: "",
  });
  const [formError, setFormError] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const daysVisible = Math.min(365, Math.max(60, typeof window !== "undefined" ? Math.floor(window.innerWidth / 4) : 120));
  const viewEnd = useMemo(() => {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + daysVisible);
    return d;
  }, [viewStart, daysVisible]);

  const days = useMemo(() => {
    const result: Date[] = [];
    const d = new Date(viewStart);
    while (d < viewEnd) {
      result.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [viewStart, viewEnd]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`).then((r) => r.json()),
      fetch("/api/users?role=trainee").then((r) => r.json()),
      fetch("/api/users?role=training_officer").then((r) => r.json()),
    ]).then(([sched, tr, off]) => {
      setAssignments(Array.isArray(sched) ? sched : []);
      setTrainees(Array.isArray(tr) ? tr : []);
      setOfficers(Array.isArray(off) ? off : []);
      setLoading(false);
    });
  }, [viewStart, viewEnd]);

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
      filtered = filtered.filter(
        (a) => a.trainee.name.toLowerCase().includes(s)
      );
    }
    if (professionFilter) {
      filtered = filtered.filter(
        (a) => a.trainee.profession?.name === professionFilter
      );
    }
    return filtered;
  }, [assignments, search, professionFilter]);

  const traineeRows = useMemo(() => {
    const seen = new Map<string, { name: string; profession?: string | null }>();
    for (const a of filteredAssignments) {
      if (!seen.has(a.traineeId)) {
        seen.set(a.traineeId, { name: a.trainee.name, profession: a.trainee.profession?.name });
      }
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filteredAssignments]);

  const professions = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments) {
      if (a.trainee.profession?.name) set.add(a.trainee.profession.name);
    }
    return Array.from(set).sort();
  }, [assignments]);

  const getAssignmentsForDay = (traineeId: string, date: Date) => {
    return filteredAssignments
      .filter(
        (a) =>
          a.traineeId === traineeId &&
          new Date(a.startDate) <= date &&
          new Date(a.endDate) >= date
      )
      .sort((a, b) => LAYER_ORDER.indexOf(a.scheduleType) - LAYER_ORDER.indexOf(b.scheduleType));
  };

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
      setForm({ traineeId: "", scheduleType: "department", startDate: "", endDate: "", department: "", supervisorId: "", color: "" });
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
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
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

  const openEdit = (a: ScheduleAssignment) => {
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

  const cellWidth = 3;
  const rowHeight = 32;

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Einsatzplanung</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigateMonths(-1)}>←</Button>
          <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            {viewStart.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigateMonths(1)}>→</Button>
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
              <option key={p} value={p}>{p}</option>
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
              {trainees.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              value={form.scheduleType}
              onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
            {form.scheduleType === "department" && (
              <input type="text" placeholder="Abteilung" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
            )}
            <select value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
              className="h-9 rounded-lg border border-neutral-300 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Betreuer...</option>
              {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            {(form.scheduleType === "department" || form.scheduleType === "other") && (
              <input type="color" value={form.color || TYPE_COLORS[form.scheduleType]} onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700" />
            )}
            {formError && <span className="text-sm text-red-500">{formError}</span>}
            <Button type="submit" size="sm">Erstellen</Button>
          </form>
        </Card>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditItem(null)}>
          <div ref={popoverRef} className="w-80 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Bearbeiten</h3>
            <div className="space-y-3">
              <select value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
              {(form.scheduleType === "department" || form.scheduleType === "other") && (
                <input type="text" placeholder="Abteilung" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
              )}
              <select value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                <option value="">Betreuer...</option>
                {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {(form.scheduleType === "department" || form.scheduleType === "other") && (
                <input type="color" value={form.color || TYPE_COLORS[form.scheduleType]} onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700" />
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpdate}>Speichern</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(editItem.id)}>Löschen</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditItem(null)}>Abbrechen</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex">
          <div className="sticky left-0 z-10 min-w-[160px] border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex h-8 items-center border-b border-neutral-200 px-3 text-xs font-medium text-neutral-500 dark:border-neutral-800">Azubi</div>
            {traineeRows.map(([id, info]) => (
              <div key={id} className="flex items-center border-b border-neutral-100 px-3 dark:border-neutral-800/50" style={{ height: rowHeight }}>
                <span className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">{info.name}</span>
              </div>
            ))}
          </div>

          <div className="relative" style={{ width: days.length * cellWidth }}>
            <div className="flex h-8 border-b border-neutral-200 dark:border-neutral-800">
              {days.filter((_, i) => i % 7 === 0).map((d, i) => (
                <div key={i} className="flex-shrink-0 text-[9px] text-neutral-400" style={{ width: 7 * cellWidth }}>
                  {d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                </div>
              ))}
            </div>

            {traineeRows.map(([traineeId]) => (
              <div key={traineeId} className="relative border-b border-neutral-100 dark:border-neutral-800/50" style={{ height: rowHeight }}>
                {days.map((date, i) => {
                  const dayAssignments = getAssignmentsForDay(traineeId, date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className="absolute top-0"
                      style={{ left: i * cellWidth, width: cellWidth, height: rowHeight }}
                    >
                      {dayAssignments.length > 0 && (
                        <div
                          className="h-full cursor-pointer rounded-[1px]"
                          style={{ backgroundColor: dayAssignments[0].color || TYPE_COLORS[dayAssignments[0].scheduleType], opacity: isWeekend ? 0.5 : 1 }}
                          title={`${TYPE_LABELS[dayAssignments[0].scheduleType]}${dayAssignments[0].department ? ` — ${dayAssignments[0].department}` : ""}${dayAssignments[0].supervisor ? ` — ${dayAssignments[0].supervisor.name}` : ""}`}
                          onClick={() => openEdit(dayAssignments[0])}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type] }} />
            <span className="text-xs text-neutral-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
