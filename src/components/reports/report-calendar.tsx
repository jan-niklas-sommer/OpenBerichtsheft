"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getWeeksInMonth, getIsoWeek, statusColor, STATUS_LABELS } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReportStatus } from "@/types";

interface ReportSummary {
  calendarYear: number;
  calendarWeek: number;
  status: ReportStatus;
}

interface ReportCalendarProps {
  year: number;
  month: number;
  reports: ReportSummary[];
  trainingStartDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export function ReportCalendar({
  year,
  month,
  reports,
  trainingStartDate,
  onPrevMonth,
  onNextMonth,
}: ReportCalendarProps) {
  const weeks = useMemo(() => getWeeksInMonth(year, month), [year, month]);

  const reportMap = useMemo(() => {
    const map = new Map<string, ReportStatus>();
    for (const r of reports) {
      map.set(`${r.calendarYear}-${r.calendarWeek}`, r.status);
    }
    return map;
  }, [reports]);

  const trainingStart = useMemo(() => {
    if (!trainingStartDate) return null;
    return getIsoWeek(new Date(trainingStartDate));
  }, [trainingStartDate]);

  const currentWeek = useMemo(() => getIsoWeek(new Date()), []);

  const isBeforeTrainingStart = (y: number, w: number) => {
    if (!trainingStart) return false;
    return y < trainingStart.year || (y === trainingStart.year && w < trainingStart.week);
  };

  const isCurrentWeek = (y: number, w: number) => {
    return y === currentWeek.year && w === currentWeek.week;
  };

  return (
    <div>
      <div className="mb-4 mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onPrevMonth} aria-label="Vorheriger Monat">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-content-base">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNextMonth} aria-label="Nächster Monat">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {weeks.map((weekInfo) => {
          const key = `${weekInfo.year}-${weekInfo.week}`;
          const status = reportMap.get(key);
          const beforeStart = isBeforeTrainingStart(weekInfo.year, weekInfo.week);
          const current = isCurrentWeek(weekInfo.year, weekInfo.week);
          const missing = !status && !beforeStart && (
            weekInfo.year < currentWeek.year ||
            (weekInfo.year === currentWeek.year && weekInfo.week <= currentWeek.week)
          );

          return (
            <Link
              key={key}
              href={beforeStart ? "#" : `/trainee/reports/${weekInfo.year}-${weekInfo.week}`}
              className={`flex items-center gap-3 rounded-lg border transition-colors ${
                current
                  ? "border-content-base"
                  : "border-stroke-subtle"
              } ${
                beforeStart
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-surface-overlay"
              }`}
              style={{ minHeight: 44 }}
            >
              <div className="flex items-center justify-center w-8 h-8 ml-3 shrink-0 rounded-full bg-surface-overlay text-xs font-semibold text-content-muted">
                {weekInfo.week}
              </div>
              <div className="flex-1 flex items-center justify-between pr-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-content-muted">KW {weekInfo.week}</span>
                  <span className="text-xs text-content-subtle">{weekInfo.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-accent-fg ${statusColor(status)}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  )}
                  {missing && (
                    <span className="inline-flex items-center rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                      Fehlt
                    </span>
                  )}
                  {beforeStart && (
                    <span className="text-xs text-content-subtle">Vor Eintritt</span>
                  )}
                  {current && !beforeStart && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                      Aktuell
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
