"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScheduleAssignmentView } from "./types";
import { expandRulesToViews, type RecurrenceRuleExpandInput } from "./expand-rules";
import { computeDataBounds } from "@/lib/schedule-bounds";
import { addMonths, toMonday, toSunday } from "@/lib/date-utils";

const INITIAL_VIEW_MONTHS_BACK = 6;
const INITIAL_VIEW_MONTHS_FORWARD = 6;
const MAX_SCROLL_MONTHS = 24;

export interface ScheduleView {
  viewStart: Date;
  viewEnd: Date;
  allViews: ScheduleAssignmentView[];
  rules: RecurrenceRuleExpandInput[];
  loading: boolean;
  refresh: () => void;
  scrollNearEdge: (direction: "start" | "end") => void;
}

function initialStart(): Date {
  return toMonday(addMonths(new Date(), -INITIAL_VIEW_MONTHS_BACK));
}
function initialEnd(): Date {
  return toSunday(addMonths(new Date(), INITIAL_VIEW_MONTHS_FORWARD));
}

export function useScheduleView(): ScheduleView {
  const [assignments, setAssignments] = useState<ScheduleAssignmentView[]>([]);
  const [rules, setRules] = useState<RecurrenceRuleExpandInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStart, setViewStart] = useState<Date>(initialStart);
  const [viewEnd, setViewEnd] = useState<Date>(initialEnd);
  const boundsRef = useRef<{ minBound: Date; maxBound: Date } | null>(null);
  const initialSnapRef = useRef(false);
  // Verhindert den Doppel-Fetch beim initialen Snap: der Snap ändert viewStart/
  // viewEnd und triggert damit den Fetch-Effekt erneut — diese zweite Ausführung
  // ist redundant (die Daten des ersten Fetch decken das gesnappte Fenster ab).
  const skipNextFetchRef = useRef(false);

  const doFetch = useCallback(
    (snap: boolean) => {
      Promise.all([
        fetch(`/api/schedule?start=${viewStart.toISOString()}&end=${viewEnd.toISOString()}`).then((r) => r.json()),
        fetch("/api/recurrence-rules").then((r) => r.json()),
      ])
        .then(([sched, ruleData]) => {
          const data = Array.isArray(sched) ? sched : [];
          setAssignments(data);
          setRules(Array.isArray(ruleData) ? ruleData : []);
          setLoading(false);

          const bounds = data.length > 0 ? computeDataBounds(data) : null;
          if (bounds) boundsRef.current = { minBound: bounds.minBound, maxBound: bounds.maxBound };

          if (snap && !initialSnapRef.current && data.length > 0 && bounds) {
            initialSnapRef.current = true;
            skipNextFetchRef.current = true;
            setViewStart(bounds.start);
            setViewEnd(bounds.end);
          }
        })
        .catch(() => {
          // Fetch-Fehler dürfen die UI nicht in "Laden…" blockieren.
          setLoading(false);
        });
    },
    [viewStart, viewEnd],
  );

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    doFetch(true);
  }, [doFetch]);

  const refresh = useCallback(() => {
    doFetch(false);
  }, [doFetch]);

  const allViews = useMemo<ScheduleAssignmentView[]>(
    () => [...assignments, ...expandRulesToViews(rules, viewStart, viewEnd)],
    [assignments, rules, viewStart, viewEnd],
  );

  const scrollNearEdge = useCallback((direction: "start" | "end") => {
    const bounds = boundsRef.current;
    if (direction === "end") {
      setViewEnd((prev) => {
        const next = addMonths(prev, 1);
        const limit = bounds ? bounds.maxBound : addMonths(new Date(), MAX_SCROLL_MONTHS);
        return next > limit ? limit : next;
      });
    } else {
      setViewStart((prev) => {
        const next = addMonths(prev, -1);
        const limit = bounds ? bounds.minBound : addMonths(new Date(), -MAX_SCROLL_MONTHS);
        return next < limit ? limit : next;
      });
    }
  }, []);

  return { viewStart, viewEnd, allViews, rules, loading, refresh, scrollNearEdge };
}
