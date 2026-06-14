"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  type ScheduleAssignmentView,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { AssignmentModal } from "@/components/schedule/assignment-modal";
import { EditAssignmentPopover } from "@/components/schedule/edit-popover";
import { useScheduleView } from "@/components/schedule/use-schedule-view";

interface Trainee {
  id: string;
  name: string;
  email: string;
  trainingStartDate?: string | null;
}

interface Officer {
  id: string;
  name: string;
  email: string;
}

export default function SchedulePage() {
  const { viewStart, viewEnd, allViews, rules, loading, refresh, scrollNearEdge } = useScheduleView();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [search, setSearch] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleAssignmentView | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users?role=trainee").then((r) => r.json()),
      fetch("/api/users?role=training_officer").then((r) => r.json()),
    ]).then(([tr, off]) => {
      setTrainees(Array.isArray(tr) ? tr : []);
      setOfficers(Array.isArray(off) ? off : []);
    });
  }, []);

  const filteredAssignments = useMemo(() => {
    let filtered = allViews;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((a) => a.trainee.name.toLowerCase().includes(s));
    }
    if (professionFilter) {
      filtered = filtered.filter((a) => a.trainee.profession?.name === professionFilter);
    }
    return filtered;
  }, [allViews, search, professionFilter]);

  const traineeRows = useMemo(() => {
    const assignmentTraineeIds = new Set(filteredAssignments.map((a) => a.traineeId));
    return trainees
      .filter((t) => {
        if (!search && !professionFilter) return true;
        const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
        const matchesProfession =
          !professionFilter ||
          filteredAssignments.some(
            (a) => a.traineeId === t.id && a.trainee.profession?.name === professionFilter,
          );
        return matchesSearch && matchesProfession;
      })
      .filter((t) => assignmentTraineeIds.has(t.id))
      .map((t) => {
        const jg = t.trainingStartDate ? new Date(t.trainingStartDate).getFullYear() : null;
        return [t.id, { name: t.name, sublabel: jg ? `JG ${jg}` : null }] as [
          string,
          { name: string; sublabel: string | null },
        ];
      })
      .sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [trainees, filteredAssignments, search, professionFilter]);

  const professions = useMemo(() => {
    const set = new Set<string>();
    for (const a of allViews) {
      if (a.trainee.profession?.name) set.add(a.trainee.profession.name);
    }
    return Array.from(set).sort();
  }, [allViews]);

  const hasConflicts = useMemo(() => {
    for (const [traineeId] of traineeRows) {
      const traineeAssignments = filteredAssignments.filter((a) => a.traineeId === traineeId);
      for (let i = 0; i < traineeAssignments.length; i++) {
        for (let j = i + 1; j < traineeAssignments.length; j++) {
          const a = traineeAssignments[i];
          const b = traineeAssignments[j];
          if (
            new Date(a.startDate) <= new Date(b.endDate) &&
            new Date(b.startDate) <= new Date(a.endDate)
          )
            return true;
        }
      }
    }
    return false;
  }, [traineeRows, filteredAssignments]);

  if (loading) return <div className="text-content-muted">Laden...</div>;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-content-base">Einsatzplanung</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowModal(true)}>
            Eintrag hinzufügen
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Azubi suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base"
        />
        {professions.length > 1 && (
          <select
            value={professionFilter}
            onChange={(e) => setProfessionFilter(e.target.value)}
            className="h-9 rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base"
          >
            <option value="">Alle Berufe</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <AssignmentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => {
          setShowModal(false);
          refresh();
        }}
        trainees={trainees.map((t) => ({ id: t.id, name: t.name }))}
        officers={officers.map((o) => ({ id: o.id, name: o.name }))}
      />

      {editItem && (
        <EditAssignmentPopover
          item={editItem}
          rules={rules}
          officers={officers.map((o) => ({ id: o.id, name: o.name }))}
          onClose={() => setEditItem(null)}
          onSaved={refresh}
        />
      )}

      <GanttTimeline
        rows={traineeRows.map(([id, info]) => ({
          traineeId: id,
          label: info.name,
          sublabel: info.sublabel,
        }))}
        assignments={filteredAssignments}
        viewStart={viewStart}
        viewEnd={viewEnd}
        mode="edit"
        showConflicts={hasConflicts}
        onCellClick={setEditItem}
        onScrollNearEdge={scrollNearEdge}
      />

      <ScheduleLegend />
    </div>
  );
}
