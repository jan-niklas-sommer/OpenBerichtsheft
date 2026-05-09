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

function getIsoWeek(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(12, 0, 0, 0);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const todayIndex = useMemo(
    () => days.findIndex((d) => {
      const dn = new Date(d);
      dn.setHours(0, 0, 0, 0);
      return dn.getTime() === today;
    }),
    [days, today],
  );

  const monthHeaders = useMemo(() => {
    const months: { label: string; width: number; offset: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let startIdx = 0;

    for (let i = 0; i <= days.length; i++) {
      const m = i < days.length ? days[i].getMonth() : -1;
      const y = i < days.length ? days[i].getFullYear() : -1;
      if (m !== currentMonth || y !== currentYear) {
        if (currentMonth >= 0) {
          const monthDate = new Date(days[startIdx]);
          months.push({
            label: monthDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
            width: (i - startIdx) * cellWidth,
            offset: startIdx * cellWidth,
          });
        }
        currentMonth = m;
        currentYear = y;
        startIdx = i;
      }
    }
    return months;
  }, [days, cellWidth]);

  const weekHeaders = useMemo(() => {
    const weeks: { label: string; width: number; offset: number }[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const monday = days[i];
      const kw = getIsoWeek(monday);
      weeks.push({
        label: `KW ${kw}`,
        width: 7 * cellWidth,
        offset: i * cellWidth,
      });
    }
    return weeks;
  }, [days, cellWidth]);

  const weekBoundaryIndices = useMemo(() => {
    const boundaries: number[] = [];
    for (let i = 7; i < days.length; i += 7) {
      boundaries.push(i);
    }
    return boundaries;
  }, [days.length]);

  const renderCell = (
    traineeId: string,
    date: Date,
    index: number,
    height: number,
  ) => {
    const top = getTopAssignmentForDay(traineeId, date, assignments);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dn = new Date(date);
    dn.setHours(0, 0, 0, 0);
    const isToday = dn.getTime() === today;

    return (
      <div
        key={index}
        className={`absolute top-0 ${isWeekend ? "bg-neutral-100 dark:bg-neutral-900/50" : ""}`}
        style={{ left: index * cellWidth, width: cellWidth, height }}
      >
        {top ? (
          <div
            className={`h-full rounded-[1px] ${
              showConflicts && getConflictsForDay(traineeId, date, assignments).length > 1
                ? "ring-1 ring-red-400 ring-inset"
                : ""
            } ${mode === "edit" && onCellClick ? "cursor-pointer" : ""}`}
            style={{
              backgroundColor: TYPE_COLORS[top.scheduleType],
              opacity: isWeekend ? 0.6 : 1,
            }}
            title={`${TYPE_LABELS[top.scheduleType]}${top.department ? ` — ${top.department}` : ""}${top.supervisor ? ` — ${top.supervisor.name}` : ""}`}
            onClick={() => mode === "edit" && onCellClick?.(top)}
          />
        ) : null}
      </div>
    );
  };

  const headerHeight = 52;
  const monthRowHeight = 24;
  const weekRowHeight = 28;

  const renderTimelineContent = () => (
    <div className="relative" style={{ width: days.length * cellWidth }}>
      <div
        className="flex border-b border-neutral-200 dark:border-neutral-800"
        style={{ height: monthRowHeight }}
      >
        {monthHeaders.map((m, i) => (
          <div
            key={i}
            className="absolute flex items-center px-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400"
            style={{ left: m.offset, width: m.width, height: monthRowHeight }}
          >
            <span className="truncate">{m.label}</span>
          </div>
        ))}
      </div>

      <div
        className="relative flex border-b border-neutral-200 dark:border-neutral-800"
        style={{ height: weekRowHeight }}
      >
        {weekHeaders.map((w, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center text-[9px] text-neutral-400 dark:text-neutral-500"
            style={{ left: w.offset, width: w.width, height: weekRowHeight }}
          >
            {w.label}
          </div>
        ))}
        {weekBoundaryIndices.map((idx) => (
          <div
            key={`wb-${idx}`}
            className="absolute top-0 h-full border-l border-neutral-200/60 dark:border-neutral-800/60"
            style={{ left: idx * cellWidth }}
          />
        ))}
      </div>

      <div className="relative">
        {todayIndex >= 0 && (
          <div
            className="absolute z-20 w-0 border-l-2 border-red-500 dark:border-red-400"
            style={{
              left: todayIndex * cellWidth + cellWidth / 2,
              top: 0,
              height: "100%",
            }}
          />
        )}

        {rows.map((row) => (
          <div
            key={row.traineeId}
            className="relative border-b border-neutral-100 dark:border-neutral-800/50"
            style={{ height: singleRow ? 40 : rowHeight }}
          >
            {days.map((date, i) =>
              renderCell(
                row.traineeId,
                date,
                i,
                singleRow ? 40 : rowHeight,
              ),
            )}
            {weekBoundaryIndices.map((idx) => (
              <div
                key={`wbr-${row.traineeId}-${idx}`}
                className="absolute top-0 h-full border-l border-dashed border-neutral-200/40 dark:border-neutral-800/40"
                style={{ left: idx * cellWidth }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (singleRow && rows.length === 1) {
    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        {renderTimelineContent()}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex">
        <div className="sticky left-0 z-10 min-w-[160px] border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div style={{ height: headerHeight }} className="flex items-end border-b border-neutral-200 px-3 pb-1 text-xs font-medium text-neutral-500 dark:border-neutral-800">
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

        {renderTimelineContent()}
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
