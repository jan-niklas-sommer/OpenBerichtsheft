"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  TYPE_LABELS,
  type ScheduleAssignmentView,
  type ScheduleType,
} from "@/components/schedule/types";
import { GanttTimeline, ScheduleLegend } from "@/components/schedule/gantt-timeline";
import { AssignmentModal } from "@/components/schedule/assignment-modal";
import { useScheduleView } from "@/components/schedule/use-schedule-view";
import { weekdayToBit, bitfieldContainsWeekday } from "@/lib/schedule-resolver";

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
  const [form, setForm] = useState({
    traineeId: "",
    scheduleType: "department" as ScheduleType,
    startDate: "",
    endDate: "",
    department: "",
    supervisorId: "",
    weekDays: [1, 2, 3, 4, 5] as number[],
    interval: 1,
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users?role=trainee").then((r) => r.json()),
      fetch("/api/users?role=training_officer").then((r) => r.json()),
    ]).then(([tr, off]) => {
      setTrainees(Array.isArray(tr) ? tr : []);
      setOfficers(Array.isArray(off) ? off : []);
    });
  }, []);

  useEffect(() => {
    if (!editItem) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditItem(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [editItem]);

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

  const handleUpdate = async () => {
    if (!editItem) return;
    if (editItem.ruleId) {
      const weekDaysBitfield = form.weekDays.reduce((acc, d) => acc | weekdayToBit(d), 0);
      const res = await fetch("/api/recurrence-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.ruleId,
          scheduleType: form.scheduleType,
          startDate: form.startDate,
          endDate: form.endDate,
          weekDays: weekDaysBitfield,
          interval: form.interval,
          department: form.department || null,
          supervisorId: form.supervisorId || null,
        }),
      });
      if (res.ok) {
        setEditItem(null);
        refresh();
      }
      return;
    }
    const res = await fetch("/api/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editItem.id,
        scheduleType: form.scheduleType,
        startDate: form.startDate,
        endDate: form.endDate,
        department: form.department,
        supervisorId: form.supervisorId,
      }),
    });
    if (res.ok) {
      setEditItem(null);
      refresh();
    }
  };

  const handleDelete = async (item: ScheduleAssignmentView) => {
    if (item.ruleId) {
      const res = await fetch(`/api/recurrence-rules?id=${item.ruleId}`, { method: "DELETE" });
      if (res.ok) {
        setEditItem(null);
        refresh();
      }
      return;
    }
    const res = await fetch(`/api/schedule?id=${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setEditItem(null);
      refresh();
    }
  };

  const openEdit = (a: ScheduleAssignmentView) => {
    setEditItem(a);
    if (a.ruleId) {
      const rule = rules.find((r) => r.id === a.ruleId);
      const days: number[] = [];
      for (let d = 1; d <= 7; d++) {
        if (rule && bitfieldContainsWeekday(rule.weekDays, d)) days.push(d);
      }
      setForm({
        traineeId: a.traineeId,
        scheduleType: a.scheduleType,
        startDate: (rule?.startDate ?? a.startDate).split("T")[0],
        endDate: (rule?.endDate ?? a.endDate).split("T")[0],
        department: a.department || "",
        supervisorId: a.supervisor?.id || "",
        weekDays: days.length > 0 ? days : [1, 2, 3, 4, 5],
        interval: rule?.interval ?? 1,
      });
      return;
    }
    setForm({
      traineeId: a.traineeId,
      scheduleType: a.scheduleType,
      startDate: a.startDate.split("T")[0],
      endDate: a.endDate.split("T")[0],
      department: a.department || "",
      supervisorId: a.supervisor?.id || "",
      weekDays: [1, 2, 3, 4, 5],
      interval: 1,
    });
  };

  const handleAddException = async (ruleId: string, date: string) => {
    const res = await fetch(`/api/recurrence-rules/${ruleId}/exceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (res.ok) {
      setEditItem(null);
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Ausnahme konnte nicht erstellt werden");
    }
  };

  const handleRemoveException = async (ruleId: string, exceptionId: string) => {
    const res = await fetch(
      `/api/recurrence-rules/${ruleId}/exceptions?exceptionId=${exceptionId}`,
      { method: "DELETE" },
    );
    if (res.ok) refresh();
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

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

      {editItem && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEditItem(null); }}
        >
          <div
            ref={popoverRef}
            className="w-80 rounded-lg border border-stroke-subtle bg-surface-elevated p-5 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 font-semibold text-content-base">
              {editItem.recurring ? "Wiederholungsregel" : "Bearbeiten"}
            </h3>
            {editItem.recurring && (
              <p className="mb-2 rounded-md bg-surface-overlay px-2 py-1 text-xs text-content-muted">
                Wiederholt sich wöchentlich – Änderungen wirken auf alle Termine der Regel.
              </p>
            )}
            <div className="space-y-3">
              <select
                value={form.scheduleType}
                onChange={(e) => setForm({ ...form, scheduleType: e.target.value as ScheduleType })}
                className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              {editItem.recurring && (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-content-muted">Wochentage</label>
                    <div className="flex gap-1">
                      {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((name, i) => {
                        const day = i + 1;
                        const active = form.weekDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                weekDays: prev.weekDays.includes(day)
                                  ? prev.weekDays.filter((d) => d !== day)
                                  : [...prev.weekDays, day].sort(),
                              }))
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                              active
                                ? "bg-accent text-accent-fg"
                                : "border border-stroke-base text-content-muted hover:bg-surface-overlay"
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-muted">Intervall</label>
                    <select
                      value={form.interval}
                      onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })}
                      className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
                    >
                      <option value={1}>Jede Woche</option>
                      <option value={2}>Alle 2 Wochen</option>
                      <option value={3}>Alle 3 Wochen</option>
                      <option value={4}>Alle 4 Wochen</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-content-muted">Von</label>
                  <DatePicker
                    value={form.startDate}
                    onChange={(v) => setForm({ ...form, startDate: v })}
                    placeholder="Startdatum"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-content-muted">Bis</label>
                  <DatePicker
                    value={form.endDate}
                    onChange={(v) => setForm({ ...form, endDate: v })}
                    placeholder="Enddatum"
                  />
                </div>
              </div>
              {(form.scheduleType === "department" || form.scheduleType === "other") && (
                <input
                  type="text"
                  placeholder={form.scheduleType === "department" ? "Welche Abteilung?" : "Beschreibung"}
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
                />
              )}
              <select
                value={form.supervisorId}
                onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
                className="w-full rounded-lg border border-stroke-base bg-surface-base px-2 py-1.5 text-sm text-content-base"
              >
                <option value="">Betreuer (optional)...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {editItem.recurring && editItem.ruleId && (() => {
                const editRule = rules.find((r) => r.id === editItem.ruleId);
                const exceptions = editRule?.exceptions ?? [];
                const clickedDate = editItem.startDate;
                const alreadyExcepted = exceptions.some(
                  (ex) => new Date(ex.date).toISOString().slice(0, 10) === clickedDate,
                );
                return (
                  <div className="rounded-lg border border-stroke-subtle bg-surface-overlay p-3">
                    <p className="mb-1.5 text-xs font-medium text-content-muted">
                      Ausnahme für diesen Termin
                    </p>
                    <p className="mb-2 text-xs text-content-subtle">
                      Termine, die an einem bestimmten Tag nicht greifen sollen (z.B. Feiertag), lassen sich einzeln ausblenden.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      disabled={alreadyExcepted}
                      onClick={() => handleAddException(editItem.ruleId!, clickedDate)}
                    >
                      {alreadyExcepted
                        ? "Termin bereits ausgeblendet"
                        : `Termin am ${fmtDate(clickedDate)} ausblenden`}
                    </Button>
                    {exceptions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-content-subtle">Ausgenommene Termine:</p>
                        {exceptions.map((ex) => (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between gap-2 text-xs text-content-muted"
                          >
                            <span>{fmtDate(new Date(ex.date).toISOString().slice(0, 10))}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveException(editItem.ruleId!, ex.id)}
                              className="text-accent underline underline-offset-2 hover:opacity-80"
                            >
                              wiederherstellen
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex items-center justify-between border-t border-stroke-subtle pt-3">
                <Button variant="danger" size="sm" onClick={() => handleDelete(editItem)}>
                  Löschen
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditItem(null)}>
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={handleUpdate}>
                    Speichern
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
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
        onCellClick={openEdit}
        onScrollNearEdge={scrollNearEdge}
      />

      <ScheduleLegend />
    </div>
  );
}
