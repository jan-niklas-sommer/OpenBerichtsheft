"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export default function OfficerSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [viewEnd, setViewEnd] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    d.setHours(0, 0, 0, 0);
    return d;
  });

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

  const handleScrollNearEdge = useCallback(
    (direction: "start" | "end") => {
      if (direction === "end") {
        setViewEnd((prev) => addMonths(prev, 3));
      } else {
        setViewStart((prev) => addMonths(prev, -3));
      }
    },
    [],
  );

  if (loading) return <div className="text-content-muted">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-content-base">
          Einsatzplanung
        </h1>
      </div>

      <input
        type="text"
        placeholder="Azubi suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 h-9 rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base"
      />

      <GanttTimeline
        rows={traineeRows.map(([id, name]) => ({
          traineeId: id,
          label: name,
        }))}
        assignments={filtered}
        viewStart={viewStart}
        viewEnd={viewEnd}
        mode="readonly"
        onScrollNearEdge={handleScrollNearEdge}
      />

      <ScheduleLegend />
    </div>
  );
}
