"use client";

import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleView } from "@/components/schedule/use-schedule-view";

export default function TraineeSchedulePage() {
  const { viewStart, viewEnd, allViews, loading, scrollNearEdge } = useScheduleView();

  if (loading) return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );

  const traineeId = allViews.length > 0 ? allViews[0].traineeId : "self";

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
        onScrollNearEdge={scrollNearEdge}
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
