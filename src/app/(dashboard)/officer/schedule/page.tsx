"use client";

import { useMemo, useState } from "react";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { useScheduleView } from "@/components/schedule/use-schedule-view";

export default function OfficerSchedulePage() {
  const { viewStart, viewEnd, allViews, loading, scrollNearEdge } = useScheduleView();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return allViews;
    const s = search.toLowerCase();
    return allViews.filter((a) => a.trainee.name.toLowerCase().includes(s));
  }, [allViews, search]);

  const traineeRows = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of filtered) {
      if (!seen.has(a.traineeId)) seen.set(a.traineeId, a.trainee.name);
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [filtered]);

  if (loading) return <div className="flex min-h-[200px] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-stroke-base border-t-accent" /></div>;

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
        rows={traineeRows.map(([id, name]) => ({ traineeId: id, label: name }))}
        assignments={filtered}
        viewStart={viewStart}
        viewEnd={viewEnd}
        mode="readonly"
        onScrollNearEdge={scrollNearEdge}
      />

      <ScheduleLegend />
    </div>
  );
}
