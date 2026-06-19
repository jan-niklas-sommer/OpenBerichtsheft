"use client";

import { useState } from "react";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useScheduleView } from "@/components/schedule/use-schedule-view";
import { useToast } from "@/components/ui/toaster";
import { CalendarPlus } from "lucide-react";

export default function TraineeSchedulePage() {
  const { viewStart, viewEnd, allViews, loading, scrollNearEdge, refresh } = useScheduleView();
  const { toast } = useToast();
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacFrom, setVacFrom] = useState("");
  const [vacTo, setVacTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );

  const traineeId = allViews.length > 0 ? allViews[0].traineeId : "self";

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacFrom || !vacTo) return;
    setSubmitting(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traineeId: "self",
        scheduleType: "vacation",
        startDate: vacFrom,
        endDate: vacTo,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast("Urlaub eingetragen");
      setShowVacationForm(false);
      setVacFrom("");
      setVacTo("");
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Fehler beim Eintragen", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-content-base">
          Meine Einsatzplanung
        </h1>
        <Button size="sm" onClick={() => setShowVacationForm(!showVacationForm)}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Urlaub eintragen
        </Button>
      </div>

      {showVacationForm && (
        <form onSubmit={handleVacationSubmit} className="mb-4 flex flex-col gap-3 rounded-lg border border-stroke-subtle bg-surface-elevated p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-content-muted">Von</label>
            <DatePicker value={vacFrom} onChange={setVacFrom} placeholder="Startdatum" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-content-muted">Bis</label>
            <DatePicker value={vacTo} onChange={setVacTo} placeholder="Enddatum" />
          </div>
          <Button type="submit" size="sm" loading={submitting}>Eintragen</Button>
        </form>
      )}

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
