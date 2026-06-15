"use client";

import {
  TYPE_COLORS,
  TYPE_FG_COLORS,
  TYPE_LABELS,
  type ScheduleAssignmentView,
  type AssignmentBlock,
} from "./types";
import { getConflictsForDay } from "./types";
import { getIsoWeek as getIsoWeekFull } from "@/lib/utils";
import { Repeat } from "lucide-react";

function getWeekNumber(date: Date): number {
  return getIsoWeekFull(date).week;
}

interface TimelineBlockProps {
  block: AssignmentBlock;
  rowHeight: number;
  barHeight: number;
  workDays: Date[];
  assignments: ScheduleAssignmentView[];
  showConflicts: boolean;
  mode: "edit" | "readonly";
  wasDragged: () => boolean;
  onCellClick?: (assignment: ScheduleAssignmentView) => void;
  onMouseEnter: (assignment: ScheduleAssignmentView, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export function TimelineBlock({
  block,
  rowHeight,
  barHeight,
  workDays,
  assignments,
  showConflicts,
  mode,
  wasDragged,
  onCellClick,
  onMouseEnter,
  onMouseLeave,
}: TimelineBlockProps) {
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
  const startKW = getWeekNumber(workDays[block.startIndex]);
  const endKW = block.endIndex < workDays.length ? getWeekNumber(workDays[block.endIndex]) : startKW;
  const label = startKW === endKW ? `KW ${startKW}` : `KW ${startKW}–${endKW}`;

  const barTop = (rowHeight - barHeight) / 2;

  const interactive = mode === "edit" && !!onCellClick;

  return (
    <div
      className={`absolute rounded-full transition-shadow ${
        interactive ? "cursor-pointer" : ""
      } ${hasConflict ? "ring-1 ring-danger ring-inset" : ""}`}
      style={{
        left: block.offset,
        top: barTop,
        width: block.width,
        height: barHeight,
        backgroundColor: TYPE_COLORS[a.scheduleType],
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive ? `${label} – ${TYPE_LABELS[a.scheduleType]}` : undefined
      }
      onClick={(e) => {
        if (wasDragged()) {
          e.stopPropagation();
          return;
        }
        if (interactive) onCellClick?.(a);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCellClick?.(a);
        }
      }}
      onMouseEnter={(e) => onMouseEnter(a, e)}
      onMouseLeave={onMouseLeave}
    >
      {showLabel && (
        <span
          className="flex h-full items-center justify-center gap-1 truncate px-2 text-[10px] font-medium"
          style={{ color: TYPE_FG_COLORS[a.scheduleType] }}
        >
          {a.recurring && (
            <Repeat className="h-2.5 w-2.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          )}
          <span className="truncate">{label}</span>
        </span>
      )}
    </div>
  );
}
