"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { computeDataBounds } from "@/lib/schedule-bounds";

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function toMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

function toSunday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function OfficerSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const boundsRef = useRef<{ minBound: Date; maxBound: Date } | null>(null);
  const initialSnapRef = useRef(false);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return toMonday(d);
  });
  const [viewEnd, setViewEnd] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return toSunday(d);
  });

  useEffect(() => {
    fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setAssignments(arr);
        setLoading(false);

        if (!initialSnapRef.current && arr.length > 0) {
          const bounds = computeDataBounds(arr);
          if (bounds) {
            boundsRef.current = { minBound: bounds.minBound, maxBound: bounds.maxBound };
            setViewStart(bounds.start);
            setViewEnd(bounds.end);
          }
          initialSnapRef.current = true;
        }
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
      const bounds = boundsRef.current;
      if (direction === "end") {
        setViewEnd((prev) => {
          const next = addMonths(prev, 1);
          const limit = bounds ? bounds.maxBound : addMonths(new Date(), 24);
          return next > limit ? limit : next;
        });
      } else {
        setViewStart((prev) => {
          const next = addMonths(prev, -1);
          const limit = bounds ? bounds.minBound : addMonths(new Date(), -24);
          return next < limit ? limit : next;
        });
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
