"use client";

import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STATUS_LABELS, statusVariant } from "@/lib/utils";
import type { ReportStatus } from "@/types";

interface WeekNavigatorProps {
  currentYear: number;
  currentWeek: number;
  currentStatus: ReportStatus | null;
  adjacentStatuses: { prev: ReportStatus | null; next: ReportStatus | null };
  prevDisabled: boolean;
  onNavigate: (direction: -1 | 1) => void;
  professionName?: string | null;
}

export function WeekNavigator({
  currentYear,
  currentWeek,
  currentStatus,
  adjacentStatuses,
  prevDisabled,
  onNavigate,
  professionName,
}: WeekNavigatorProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && !prevDisabled) {
        e.preventDefault();
        onNavigate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate(1);
      }
    },
    [onNavigate, prevDisabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(-1)}
          disabled={prevDisabled}
          aria-label="Vorherige Woche"
        >
          <ArrowLeft className="h-4 w-4" />
          {adjacentStatuses.prev && (
            <Badge variant={statusVariant(adjacentStatuses.prev)} className="ml-1 text-[10px] px-1">
              {STATUS_LABELS[adjacentStatuses.prev]}
            </Badge>
          )}
        </Button>
      </div>

      <div className="text-center min-w-[120px]">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          KW {currentWeek}/{currentYear}
        </h1>
        {professionName && (
          <p className="text-sm text-neutral-500">{professionName}</p>
        )}
        {currentStatus && (
          <Badge
            variant={statusVariant(currentStatus)}
            className="mt-1"
          >
            {STATUS_LABELS[currentStatus]}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(1)}
          aria-label="Nächste Woche"
        >
          {adjacentStatuses.next && (
            <Badge variant={statusVariant(adjacentStatuses.next)} className="mr-1 text-[10px] px-1">
              {STATUS_LABELS[adjacentStatuses.next]}
            </Badge>
          )}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
