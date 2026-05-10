"use client";

import { createPortal } from "react-dom";
import { TYPE_LABELS, type ScheduleAssignmentView } from "./types";

interface TooltipState {
  assignment: ScheduleAssignmentView;
  x: number;
  y: number;
  flip: boolean;
}

export type { TooltipState };

export function TimelineTooltip({ tooltip }: { tooltip: TooltipState | null }) {
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
}
