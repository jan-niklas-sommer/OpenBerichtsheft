"use client";

import { useMemo } from "react";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  getTopAssignmentForDay,
  getConflictsForDay,
  generateDays,
  type ScheduleAssignmentView,
} from "./types";

interface GanttRow {
  traineeId: string;
  label: string;
}

interface GanttTimelineProps {
  rows: GanttRow[];
  assignments: ScheduleAssignmentView[];
  viewStart: Date;
  daysVisible: number;
  cellWidth?: number;
  rowHeight?: number;
  mode: "edit" | "readonly";
  singleRow?: boolean;
  showConflicts?: boolean;
  onCellClick?: (assignment: ScheduleAssignmentView) => void;
}

export function GanttTimeline({
  rows,
  assignments,
  viewStart,
  daysVisible,
  cellWidth = 3,
  rowHeight = 32,
  mode,
  singleRow = false,
  showConflicts = false,
  onCellClick,
}: GanttTimelineProps) {
  const viewEnd = useMemo(() => {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + daysVisible);
    return d;
  }, [viewStart, daysVisible]);

  const days = useMemo(() => generateDays(viewStart, viewEnd), [viewStart, viewEnd]);

  const renderCell = (
    traineeId: string,
    date: Date,
    index: number,
    height: number,
  ) => {
    const top = getTopAssignmentForDay(traineeId, date, assignments);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    if (!top) {
      return (
        <div
          key={index}
          className="absolute top-0"
          style={{ left: index * cellWidth, width: cellWidth, height }}
        />
      );
    }

    const conflicts = showConflicts
      ? getConflictsForDay(traineeId, date, assignments)
      : [];
    const hasConflict = conflicts.length > 1;

    return (
      <div
        key={index}
        className="absolute top-0"
        style={{ left: index * cellWidth, width: cellWidth, height }}
      >
        <div
          className={`h-full rounded-[1px] ${hasConflict ? "ring-1 ring-red-400 ring-inset" : ""} ${
            mode === "edit" && onCellClick ? "cursor-pointer" : ""
          }`}
          style={{
            backgroundColor: top.color || TYPE_COLORS[top.scheduleType],
            opacity: isWeekend ? 0.5 : 1,
          }}
          title={
            hasConflict
              ? `KONFLIKT: ${conflicts.map((c) => `${TYPE_LABELS[c.scheduleType]}${c.department ? ` — ${c.department}` : ""}`).join(" | ")}`
              : `${TYPE_LABELS[top.scheduleType]}${top.department ? ` — ${top.department}` : ""}${top.supervisor ? ` — ${top.supervisor.name}` : ""}`
          }
          onClick={() => mode === "edit" && onCellClick?.(top)}
        />
      </div>
    );
  };

  const weekHeaders = (
    <div className="flex h-8 border-b border-neutral-200 dark:border-neutral-800">
      {days
        .filter((_, i) => i % 7 === 0)
        .map((d, i) => (
          <div
            key={i}
            className="flex-shrink-0 text-[9px] text-neutral-400 leading-8"
            style={{ width: 7 * cellWidth }}
          >
            {d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
          </div>
        ))}
    </div>
  );

  if (singleRow && rows.length === 1) {
    const row = rows[0];
    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div style={{ width: days.length * cellWidth }}>
          {weekHeaders}
          <div className="relative" style={{ height: 40 }}>
            {days.map((date, i) => renderCell(row.traineeId, date, i, 40))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex">
        <div className="sticky left-0 z-10 min-w-[160px] border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex h-8 items-center border-b border-neutral-200 px-3 text-xs font-medium text-neutral-500 dark:border-neutral-800">
            Azubi
          </div>
          {rows.map((row) => (
            <div
              key={row.traineeId}
              className="flex items-center border-b border-neutral-100 px-3 dark:border-neutral-800/50"
              style={{ height: rowHeight }}
            >
              <span className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {row.label}
              </span>
            </div>
          ))}
        </div>

        <div className="relative" style={{ width: days.length * cellWidth }}>
          {weekHeaders}
          {rows.map((row) => (
            <div
              key={row.traineeId}
              className="relative border-b border-neutral-100 dark:border-neutral-800/50"
              style={{ height: rowHeight }}
            >
              {days.map((date, i) => renderCell(row.traineeId, date, i, rowHeight))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScheduleLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {Object.entries(TYPE_LABELS).map(([type, label]) => (
        <div key={type} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: TYPE_COLORS[type] }}
          />
          <span className="text-xs text-neutral-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
