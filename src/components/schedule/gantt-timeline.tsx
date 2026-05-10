"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  TYPE_COLORS,
  TYPE_FG_COLORS,
  TYPE_LABELS,
  generateWorkDays,
  computeBlocks,
  getConflictsForDay,
  type ScheduleAssignmentView,
  type AssignmentBlock,
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

interface TooltipState {
  assignment: ScheduleAssignmentView;
  x: number;
  y: number;
  flip: boolean;
}

export function GanttTimeline({
  rows,
  assignments,
  viewStart,
  daysVisible,
  cellWidth = 6,
  rowHeight = 48,
  mode,
  singleRow = false,
  showConflicts = false,
  onCellClick,
}: GanttTimelineProps) {
  const headerHeight = 48;
  const monthRowHeight = 22;
  const weekRowHeight = 26;
  const barHeight = 24;

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewEnd = useMemo(() => {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + daysVisible);
    return d;
  }, [viewStart, daysVisible]);

  const workDays = useMemo(() => generateWorkDays(viewStart, viewEnd), [viewStart, viewEnd]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const todayIndex = useMemo(
    () => workDays.findIndex((d) => {
      const dn = new Date(d);
      dn.setHours(0, 0, 0, 0);
      return dn.getTime() === today;
    }),
    [workDays, today],
  );

  const monthHeaders = useMemo(() => {
    const months: { label: string; width: number; offset: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let startIdx = 0;

    for (let i = 0; i <= workDays.length; i++) {
      const m = i < workDays.length ? workDays[i].getMonth() : -1;
      const y = i < workDays.length ? workDays[i].getFullYear() : -1;
      if (m !== currentMonth || y !== currentYear) {
        if (currentMonth >= 0) {
          const monthDate = new Date(workDays[startIdx]);
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
  }, [workDays, cellWidth]);

  const weekHeaders = useMemo(() => {
    const seen = new Map<string, { kw: number; startIdx: number; count: number }>();
    for (let i = 0; i < workDays.length; i++) {
      const kw = getIsoWeek(workDays[i]);
      const key = `${workDays[i].getFullYear()}-${kw}`;
      if (!seen.has(key)) {
        seen.set(key, { kw, startIdx: i, count: 0 });
      }
      seen.get(key)!.count++;
    }
    return Array.from(seen.values());
  }, [workDays]);

  const rowBlocks = useMemo(() => {
    const map = new Map<string, AssignmentBlock[]>();
    for (const row of rows) {
      map.set(row.traineeId, computeBlocks(row.traineeId, workDays, assignments, cellWidth));
    }
    return map;
  }, [rows, workDays, assignments, cellWidth]);

  const handleMouseEnter = useCallback(
    (assignment: ScheduleAssignmentView, e: React.MouseEvent) => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      const clientX = e.clientX;
      const clientY = e.clientY;
      hoverTimerRef.current = setTimeout(() => {
        const vw = window.innerWidth;
        const tooltipWidth = 320;
        const tooltipHeight = 120;
        const x = Math.min(
          Math.max(clientX + 12, 8),
          vw - tooltipWidth - 8,
        );
        const fitsAbove = clientY - tooltipHeight - 12 > 0;
        const y = fitsAbove
          ? clientY - 12
          : clientY + 20;
        setTooltip({ assignment, x, y, flip: !fitsAbove });
      }, 200);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setTooltip(null);
  }, []);

  const renderBlock = (
    block: AssignmentBlock,
    effectiveRowHeight: number,
  ) => {
    const a = block.assignment;
    const hasConflict = (() => {
      if (!showConflicts) return false;
      for (let i = block.startIndex; i <= block.endIndex; i++) {
        if (getConflictsForDay(a.traineeId, workDays[i], assignments).length > 1) {
          return true;
        }
      }
      return false;
    })();

    const showLabel = block.width > 80;
    const startKW = getIsoWeek(workDays[block.startIndex]);
    const endKW = block.endIndex < workDays.length ? getIsoWeek(workDays[block.endIndex]) : startKW;
    const label = startKW === endKW ? `KW ${startKW}` : `KW ${startKW}–${endKW}`;

    const barTop = (effectiveRowHeight - barHeight) / 2;

    return (
      <div
        key={`block-${a.id}-${block.startIndex}`}
        className={`absolute rounded-full transition-shadow ${
          mode === "edit" && onCellClick ? "cursor-pointer" : ""
        } ${hasConflict ? "ring-1 ring-danger ring-inset" : ""}`}
        style={{
          left: block.offset,
          top: barTop,
          width: block.width,
          height: barHeight,
          backgroundColor: TYPE_COLORS[a.scheduleType],
        }}
        onClick={() => mode === "edit" && onCellClick?.(a)}
        onMouseEnter={(e) => handleMouseEnter(a, e)}
        onMouseLeave={handleMouseLeave}
      >
        {showLabel && (
          <span
            className="flex h-full items-center justify-center truncate px-2 text-[10px] font-medium"
            style={{ color: TYPE_FG_COLORS[a.scheduleType] }}
          >
            {label}
          </span>
        )}
      </div>
    );
  };

  const renderTooltip = () => {
    if (!tooltip || typeof document === "undefined") return null;
    const a = tooltip.assignment;
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    const startStr = start.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const endStr = end.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / 86400000) + 1;
    const diffWeeks = Math.round(diffDays / 7 * 10) / 10;

    const duration = diffWeeks >= 1
      ? `${diffWeeks} Woche${diffWeeks !== 1 ? "n" : ""}, ${diffDays} Tage`
      : `${diffDays} Tag${diffDays !== 1 ? "e" : ""}`;

    return createPortal(
      <div
        className="pointer-events-none fixed z-[9999] max-w-xs rounded-md border border-stroke-subtle bg-surface-elevated px-3 py-2 shadow-md"
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: tooltip.flip ? "translate(0, 0)" : "translate(0, -100%)",
        }}
      >
        <div className="text-xs font-medium text-content-base">
          {TYPE_LABELS[a.scheduleType]}
          {a.department ? ` — ${a.department}` : ""}
        </div>
        <div className="mt-0.5 text-[10px] text-content-muted">
          {startStr} – {endStr}
        </div>
        <div className="text-[10px] text-content-muted">{duration}</div>
        {a.supervisor && (
          <div className="text-[10px] text-content-muted">
            Betreuer: {a.supervisor.name}
          </div>
        )}
      </div>,
      document.body,
    );
  };

  const renderTimelineContent = () => {
    const totalWidth = workDays.length * cellWidth;

    return (
      <div className="relative" style={{ width: totalWidth }}>
        <div style={{ height: monthRowHeight }}>
          {monthHeaders.map((m, i) => (
            <div
              key={i}
              className="absolute flex items-center px-1 text-[10px] font-medium text-content-muted"
              style={{ left: m.offset, width: m.width, height: monthRowHeight }}
            >
              <span className="truncate">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="relative" style={{ height: weekRowHeight }}>
          {weekHeaders.map((w, i) => (
            <div
              key={i}
              className={`absolute flex items-center text-[9px] px-1 ${
                i % 2 === 0 ? "text-content-subtle" : "text-content-subtle/0"
              }`}
              style={{
                left: w.startIdx * cellWidth,
                width: w.count * cellWidth,
                height: weekRowHeight,
              }}
            >
              KW {w.kw}
            </div>
          ))}
        </div>

        <div className="border-b border-stroke-subtle pb-3">
          {todayIndex >= 0 && (
            <div
              className="absolute z-10 w-0 opacity-20"
              style={{
                left: todayIndex * cellWidth + cellWidth / 2,
                top: 0,
                height: "100%",
                borderLeft: "1px solid var(--color-fg-base)",
              }}
            />
          )}

          {rows.map((row) => {
            const effectiveRowHeight = singleRow ? 40 : rowHeight;
            const blocks = rowBlocks.get(row.traineeId) || [];

            return (
              <div
                key={row.traineeId}
                className="relative"
                style={{ height: effectiveRowHeight }}
              >
                {blocks.map((block) =>
                  renderBlock(block, effectiveRowHeight),
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const tooltipPortal = renderTooltip();

  if (singleRow && rows.length === 1) {
    return (
      <>
        <div className="timeline-scroll overflow-x-auto">
          {renderTimelineContent()}
        </div>
        {tooltipPortal}
      </>
    );
  }

  return (
    <>
      <div className="timeline-scroll overflow-x-auto">
        <div className="flex">
          <div className="sticky left-0 z-10 min-w-[140px] pr-6 bg-surface-base">
          <div
            style={{ height: headerHeight }}
            className="flex items-end px-3 pb-1 text-xs font-medium text-content-muted"
          >
            Azubi
          </div>
          {rows.map((row) => (
            <div
              key={row.traineeId}
              className="flex items-center px-3"
              style={{ height: rowHeight }}
            >
              <span className="truncate text-xs font-medium text-content-base">
                {row.label}
              </span>
            </div>
          ))}
        </div>

        {renderTimelineContent()}
      </div>
    </div>
    {tooltipPortal}
  </>
  );
}

export function ScheduleLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {Object.entries(TYPE_LABELS).map(([type, label]) => (
        <div
          key={type}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: TYPE_COLORS[type],
            color: TYPE_FG_COLORS[type],
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
