"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";

export default function TraineeSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
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

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Meine Einsatzplanung
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

      <GanttTimeline
        rows={[{ traineeId: "self", label: "" }]}
        assignments={assignments}
        viewStart={viewStart}
        daysVisible={daysVisible}
        mode="readonly"
        singleRow
      />

      <ScheduleLegend />

      {assignments.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">
          Noch keine Einsatzplanung vorhanden.
        </p>
      )}
    </div>
  );
}
