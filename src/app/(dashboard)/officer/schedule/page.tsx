"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface ScheduleAssignment {
  id: string;
  traineeId: string;
  scheduleType: "department" | "school" | "vacation" | "other";
  startDate: string;
  endDate: string;
  department: string | null;
  color: string | null;
  trainee: { id: string; name: string; profession?: { name: string } | null };
  supervisor: { id: string; name: string } | null;
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

export default function OfficerSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

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
    fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [viewStart, viewEnd]);

  const filtered = useMemo(() => {
    if (!search) return assignments;
    const s = search.toLowerCase();
    return assignments.filter((a) => a.trainee.name.toLowerCase().includes(s));
  }, [assignments, search]);

  const traineeRows = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of filtered) {
      if (!seen.has(a.traineeId)) seen.set(a.traineeId, a.trainee.name);
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [filtered]);

  const getTopAssignment = (traineeId: string, date: Date) => {
    const items = filtered.filter(
      (a) => a.traineeId === traineeId && new Date(a.startDate) <= date && new Date(a.endDate) >= date
    );
    return items.sort((a, b) => {
      const order = ["school", "vacation", "other", "department"];
      return order.indexOf(a.scheduleType) - order.indexOf(b.scheduleType);
    })[0] || null;
  };

  const cellWidth = 3;
  const rowHeight = 32;

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Einsatzplanung</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { const d = new Date(viewStart); d.setMonth(d.getMonth() - 1); setViewStart(d); }}>←</Button>
          <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            {viewStart.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => { const d = new Date(viewStart); d.setMonth(d.getMonth() + 1); setViewStart(d); }}>→</Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Azubi suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex">
          <div className="sticky left-0 z-10 min-w-[160px] border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex h-8 items-center border-b border-neutral-200 px-3 text-xs font-medium text-neutral-500 dark:border-neutral-800">Azubi</div>
            {traineeRows.map(([id, name]) => (
              <div key={id} className="flex items-center border-b border-neutral-100 px-3 dark:border-neutral-800/50" style={{ height: rowHeight }}>
                <span className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">{name}</span>
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
                  const a = getTopAssignment(traineeId, date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <div key={i} className="absolute top-0" style={{ left: i * cellWidth, width: cellWidth, height: rowHeight }}>
                      {a && (
                        <div
                          className="h-full rounded-[1px]"
                          style={{ backgroundColor: a.color || TYPE_COLORS[a.scheduleType], opacity: isWeekend ? 0.5 : 1 }}
                          title={`${TYPE_LABELS[a.scheduleType]}${a.department ? ` — ${a.department}` : ""}${a.supervisor ? ` — ${a.supervisor.name}` : ""}`}
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
