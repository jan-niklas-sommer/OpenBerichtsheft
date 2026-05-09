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
        <Button variant="ghost" size="sm" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNextMonth}>
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
                  ? "border-neutral-900 dark:border-neutral-100"
                  : "border-neutral-200 dark:border-neutral-800"
              } ${
                beforeStart
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
              style={{ minHeight: 44 }}
            >
              <div className="flex items-center justify-center w-8 h-8 ml-3 shrink-0 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {weekInfo.week}
              </div>
              <div className="flex-1 flex items-center justify-between pr-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">KW {weekInfo.week}</span>
                  <span className="text-xs text-neutral-400">{weekInfo.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white dark:text-neutral-900 ${statusColor(status)}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  )}
                  {missing && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Fehlt
                    </span>
                  )}
                  {beforeStart && (
                    <span className="text-xs text-neutral-400">Vor Eintritt</span>
                  )}
                  {current && !beforeStart && (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900">
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
