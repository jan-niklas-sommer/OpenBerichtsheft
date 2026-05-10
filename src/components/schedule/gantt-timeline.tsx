"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
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

const DRAG_THRESHOLD = 5;
const DECELERATION = 0.85;
const MIN_VELOCITY = 0.3;
const MAX_VELOCITY = 20;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const lastPosRef = useRef({ x: 0, time: 0 });
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const dragConsumedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const momentumLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    momentumLoopRef.current = () => {
      const el = containerRef.current;
      if (!el || Math.abs(velocityRef.current) < MIN_VELOCITY) {
        velocityRef.current = 0;
        return;
      }
      el.scrollLeft -= velocityRef.current;
      velocityRef.current *= DECELERATION;

      if (onScrollNearEdge && el.scrollLeft < el.clientWidth * 0.3) {
        onScrollNearEdge("start");
      }
      if (
        onScrollNearEdge &&
        el.scrollLeft + el.clientWidth > el.scrollWidth - el.clientWidth * 0.3
      ) {
        onScrollNearEdge("end");
      }

      animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
    };
  }, [onScrollNearEdge]);

  const touchMoveHandlerRef = useRef<(e: TouchEvent) => void>(() => {});
  const touchEndHandlerRef = useRef<(e: Event) => void>(() => {});

  useEffect(() => {
    touchMoveHandlerRef.current = (e: TouchEvent) => {
      const clientX = e.touches[0].clientX;
      const el = containerRef.current;
      if (!el) return;

      const dx = clientX - dragStartRef.current.x;
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        dragMovedRef.current = true;
        e.preventDefault();
      }

      if (isDraggingRef.current) {
        el.scrollLeft = dragStartRef.current.scrollLeft - dx;
      }

      const now = Date.now();
      const dt = now - lastPosRef.current.time;
      if (dt > 0) {
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (clientX - lastPosRef.current.x) / dt * 8));
      }
      lastPosRef.current = { x: clientX, time: now };
    };

    touchEndHandlerRef.current = (e: Event) => {
      const target = e.target as HTMLElement;
      target.removeEventListener("touchmove", touchMoveHandlerRef.current);
      target.removeEventListener("touchend", touchEndHandlerRef.current);
      target.removeEventListener("touchcancel", touchEndHandlerRef.current);

      if (isDraggingRef.current && Math.abs(velocityRef.current) > MIN_VELOCITY) {
        animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
      }
      setTimeout(() => {
        dragConsumedRef.current = isDraggingRef.current;
        isDraggingRef.current = false;
      }, 0);
    };
  }, [onScrollNearEdge]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      velocityRef.current = 0;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const el = containerRef.current;
      if (!el) return;

      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      dragMovedRef.current = false;
      dragConsumedRef.current = false;
      dragStartRef.current = { x: clientX, scrollLeft: el.scrollLeft };
      lastPosRef.current = { x: clientX, time: Date.now() };

      if ("touches" in e) {
        e.currentTarget.addEventListener("touchmove", touchMoveHandlerRef.current as EventListener, {
          passive: false,
        });
        e.currentTarget.addEventListener("touchend", touchEndHandlerRef.current as EventListener);
        e.currentTarget.addEventListener("touchcancel", touchEndHandlerRef.current as EventListener);
      }
    },
    [],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPointerDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - dragStartRef.current.x;

    if (!isDraggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      dragMovedRef.current = true;
    }

    if (isDraggingRef.current) {
      el.scrollLeft = dragStartRef.current.scrollLeft - dx;
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setTooltip(null);

      const now = Date.now();
      const dt = now - lastPosRef.current.time;
      if (dt > 0) {
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (e.clientX - lastPosRef.current.x) / dt * 8));
      }
      lastPosRef.current = { x: e.clientX, time: now };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isPointerDownRef.current = false;
    if (isDraggingRef.current && Math.abs(velocityRef.current) > MIN_VELOCITY) {
      animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
    }
    setTimeout(() => {
      dragConsumedRef.current = isDraggingRef.current;
      isDraggingRef.current = false;
    }, 0);
  }, []);

  const wasDragged = useCallback(() => {
    return dragConsumedRef.current;
  }, []);

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
        onClick={(e) => {
          if (wasDragged()) {
            e.stopPropagation();
            return;
          }
          if (mode === "edit") onCellClick?.(a);
        }}
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
        {tooltipPortal}
      </>
    );
  }

  return (
    <>
      <div className="flex">
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
