"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { expandRulesToViews, type RecurrenceRuleExpandInput } from "@/components/schedule/expand-rules";
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

export default function TraineeSchedulePage() {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [rules, setRules] = useState<RecurrenceRuleExpandInput[]>([]);
  const [loading, setLoading] = useState(true);
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

  const traineeId = assignments.length > 0 ? assignments[0].traineeId : "self";

  useEffect(() => {
    Promise.all([
      fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`).then((r) => r.json()),
      fetch("/api/recurrence-rules").then((r) => r.json()),
    ]).then(([data, ruleData]) => {
      const arr = Array.isArray(data) ? data : [];
      setAssignments(arr);
      setRules(Array.isArray(ruleData) ? ruleData : []);
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

  const allViews = useMemo<ScheduleAssignmentView[]>(
    () => [...assignments, ...expandRulesToViews(rules, viewStart, viewEnd)],
    [assignments, rules, viewStart, viewEnd],
  );

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
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-content-base">
          Meine Einsatzplanung
        </h1>
      </div>

      <GanttTimeline
        rows={[{ traineeId, label: "" }]}
        assignments={allViews}
        viewStart={viewStart}
        viewEnd={viewEnd}
        mode="readonly"
        singleRow
        onScrollNearEdge={handleScrollNearEdge}
      />

      <ScheduleLegend />

      {allViews.length === 0 && (
        <p className="mt-6 text-sm text-content-subtle">
          Noch keine Einsatzplanung vorhanden.
        </p>
      )}
    </div>
  );
}
