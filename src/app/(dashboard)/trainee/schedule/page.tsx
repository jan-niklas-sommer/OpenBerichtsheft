"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export default function TraineeSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-content-base">
          Meine Einsatzplanung
        </h1>
      </div>

      <GanttTimeline
        rows={[{ traineeId: "self", label: "" }]}
        assignments={assignments}
        viewStart={viewStart}
        viewEnd={viewEnd}
        mode="readonly"
        singleRow
        onScrollNearEdge={handleScrollNearEdge}
      />

      <ScheduleLegend />

      {assignments.length === 0 && (
        <p className="mt-6 text-sm text-content-subtle">
          Noch keine Einsatzplanung vorhanden.
        </p>
      )}
    </div>
  );
}
