"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import {
  TYPE_COLORS,
  TYPE_FG_COLORS,
  TYPE_LABELS,
  generateWorkDays,
  computeBlocks,
  type ScheduleAssignmentView,
  type AssignmentBlock,
} from "./types";
import { useDragScroll } from "./use-drag-scroll";
import { TimelineTooltip, type TooltipState } from "./timeline-tooltip";
import { TimelineBlock } from "./timeline-block";
import { getIsoWeek as getIsoWeekFull } from "@/lib/utils";

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 120;
const TOOLTIP_DELAY_MS = 200;

function getWeekNumber(date: Date): number {
  return getIsoWeekFull(date).week;
}

interface GanttRow {
  traineeId: string;
  label: string;
  sublabel?: string | null;
}

interface GanttTimelineProps {
  rows: GanttRow[];
  assignments: ScheduleAssignmentView[];
  viewStart: Date;
  viewEnd: Date;
  cellWidth?: number;
  rowHeight?: number;
  mode: "edit" | "readonly";
  singleRow?: boolean;
  showConflicts?: boolean;
  onCellClick?: (assignment: ScheduleAssignmentView) => void;
  onScrollNearEdge?: (direction: "start" | "end") => void;
}

export function GanttTimeline({
  rows,
  assignments,
  viewStart,
  viewEnd,
  cellWidth = 6,
  rowHeight = 48,
  mode,
  singleRow = false,
  showConflicts = false,
  onCellClick,
  onScrollNearEdge,
}: GanttTimelineProps) {
  const headerHeight = 48;
  const monthRowHeight = 22;
  const weekRowHeight = 26;
  const barHeight = 24;

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    containerRef,
    handlePointerDown,
    handleMouseMove,
    handleMouseUp,
    wasDragged,
    isDragging: isDraggingRef,
  } = useDragScroll({ onScrollNearEdge });

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
      const kw = getWeekNumber(workDays[i]);
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
        const tooltipWidth = TOOLTIP_WIDTH;
        const tooltipHeight = TOOLTIP_HEIGHT;
        const x = Math.min(
          Math.max(clientX + 12, 8),
          vw - tooltipWidth - 8,
        );
        const fitsAbove = clientY - tooltipHeight - 12 > 0;
        const y = fitsAbove
          ? clientY - 12
          : clientY + 20;
        setTooltip({ assignment, x, y, flip: !fitsAbove });
      }, TOOLTIP_DELAY_MS);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setTooltip(null);
  }, []);

  const renderTimelineContent = () => {
    const totalWidth = workDays.length * cellWidth;

    return (
      <div className="relative" style={{ width: totalWidth }}>
        <div style={{ height: monthRowHeight }}>
          {monthHeaders.map((m, i) => (
            <div
              key={i}
              className="absolute flex items-center px-1 text-[11px] font-medium text-content-muted"
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
              className={`absolute flex items-center text-[10px] px-1 ${
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
                {blocks.map((block) => (
                  <TimelineBlock
                    key={`block-${block.assignment.id}-${block.startIndex}`}
                    block={block}
                    rowHeight={effectiveRowHeight}
                    barHeight={barHeight}
                    workDays={workDays}
                    assignments={assignments}
                    showConflicts={showConflicts}
                    mode={mode}
                    wasDragged={wasDragged}
                    onCellClick={onCellClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (singleRow && rows.length === 1) {
    return (
      <>
        <div
          ref={containerRef}
          className="timeline-scroll cursor-grab overflow-x-auto active:cursor-grabbing select-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDraggingRef.current) handleMouseUp();
          }}
          onTouchStart={handlePointerDown}
        >
          {renderTimelineContent()}
        </div>
        <TimelineTooltip tooltip={tooltip} />
      </>
    );
  }

  return (
    <>
      <div className="flex select-none">
        <div className="flex-shrink-0 w-[160px] border-r border-stroke-subtle bg-surface-base">
          <div
            style={{ height: headerHeight }}
            className="flex items-end px-3 pb-1 text-xs font-medium text-content-muted"
          >
            Azubi
          </div>
          {rows.map((row) => (
            <div
              key={row.traineeId}
              className="flex flex-col justify-center px-3"
              style={{ height: rowHeight }}
            >
              <span className="truncate text-xs font-medium text-content-base">
                {row.label}
              </span>
              {row.sublabel && (
                <span className="truncate text-[10px] text-content-subtle">
                  {row.sublabel}
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          ref={containerRef}
          className="timeline-scroll min-w-0 cursor-grab overflow-x-auto active:cursor-grabbing select-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDraggingRef.current) handleMouseUp();
          }}
          onTouchStart={handlePointerDown}
        >
          {renderTimelineContent()}
        </div>
      </div>
      <TimelineTooltip tooltip={tooltip} />
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

export type { GanttRow, GanttTimelineProps };
