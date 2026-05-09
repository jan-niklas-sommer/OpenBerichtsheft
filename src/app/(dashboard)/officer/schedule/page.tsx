"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";

export default function OfficerSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const daysVisible = Math.min(
    365,
    Math.max(60, typeof window !== "undefined" ? Math.floor(window.innerWidth / 4) : 120),
  );

  useEffect(() => {
    const viewEnd = new Date(viewStart.getTime() + daysVisible * 86400000);
    fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAssignments(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [viewStart, daysVisible]);

  const filtered = useMemo(() => {
    if (!search) return assignments;
    const s = search.toLowerCase();
    return assignments.filter((a) =>
      a.trainee.name.toLowerCase().includes(s),
    );
  }, [assignments, search]);

  const traineeRows = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of filtered) {
      if (!seen.has(a.traineeId)) seen.set(a.traineeId, a.trainee.name);
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1].localeCompare(b[1]));
  }, [filtered]);

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Einsatzplanung
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const d = new Date(viewStart);
              d.setMonth(d.getMonth() - 1);
              setViewStart(d);
            }}
          >
            ←
          </Button>
          <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            {viewStart.toLocaleDateString("de-DE", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const d = new Date(viewStart);
              d.setMonth(d.getMonth() + 1);
              setViewStart(d);
            }}
          >
            →
          </Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Azubi suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <GanttTimeline
        rows={traineeRows.map(([id, name]) => ({
          traineeId: id,
          label: name,
        }))}
        assignments={filtered}
        viewStart={viewStart}
        daysVisible={daysVisible}
        mode="readonly"
      />

      <ScheduleLegend />
    </div>
  );
}
