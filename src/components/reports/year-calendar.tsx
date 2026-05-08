"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getIsoWeek, statusColor } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReportStatus } from "@/types";

interface ReportSummary {
  calendarYear: number;
  calendarWeek: number;
  status: ReportStatus;
}

interface YearCalendarProps {
  year: number;
  reports: ReportSummary[];
  trainingStartDate: string | null;
  onPrevYear: () => void;
  onNextYear: () => void;
}

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function getYearGrid(year: number) {
  const grid: { date: Date; dayOfWeek: number; isoWeek: number; isoYear: number; month: number }[] = [];
  const start = new Date(year, 0, 1);
  start.setHours(12, 0, 0, 0);
  const end = new Date(year, 11, 31);
  end.setHours(12, 0, 0, 0);

  const d = new Date(start);
  while (d <= end) {
    const { year: isoYear, week: isoWeek } = getIsoWeek(d);
    const jsDay = d.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    grid.push({
      date: new Date(d),
      dayOfWeek,
      isoWeek,
      isoYear,
      month: d.getMonth(),
    });
    d.setDate(d.getDate() + 1);
  }
  return grid;
}

export function YearCalendar({
  year,
  reports,
  trainingStartDate,
  onPrevYear,
  onNextYear,
}: YearCalendarProps) {
  const grid = useMemo(() => getYearGrid(year), [year]);

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

  const weeks = useMemo(() => {
    const seen = new Set<string>();
    const result: { isoWeek: number; isoYear: number; month: number }[] = [];
    for (const cell of grid) {
      const key = `${cell.isoYear}-${cell.isoWeek}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ isoWeek: cell.isoWeek, isoYear: cell.isoYear, month: cell.month });
      }
    }
    return result;
  }, [grid]);

  const cellMap = useMemo(() => {
    const map = new Map<string, { date: Date; dayOfWeek: number; isoWeek: number; isoYear: number }>();
    for (const cell of grid) {
      const key = `${cell.dayOfWeek}-${cell.isoYear}-${cell.isoWeek}`;
      if (!map.has(key)) {
        map.set(key, cell);
      }
    }
    return map;
  }, [grid]);

  const monthPositions = useMemo(() => {
    const positions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      if (w.month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[w.month], col: i });
        lastMonth = w.month;
      }
    });
    return positions;
  }, [weeks]);

  const getStatusColor = (isoYear: number, isoWeek: number) => {
    const key = `${isoYear}-${isoWeek}`;
    const status = reportMap.get(key);
    const beforeStart = isBeforeTrainingStart(isoYear, isoWeek);
    const isPast = isoYear < currentWeek.year || (isoYear === currentWeek.year && isoWeek <= currentWeek.week);

    if (beforeStart) return "bg-neutral-100 dark:bg-neutral-800/30 opacity-30";
    if (status) return statusColor(status);
    if (isPast) return statusColor("missing");
    return "bg-neutral-50 dark:bg-neutral-800/30";
  };

  const getTooltip = (isoYear: number, isoWeek: number) => {
    const key = `${isoYear}-${isoWeek}`;
    const status = reportMap.get(key);
    const beforeStart = isBeforeTrainingStart(isoYear, isoWeek);

    if (beforeStart) return `KW ${isoWeek}/${isoYear}: Vor Eintritt`;
    if (status) return `KW ${isoWeek}/${isoYear}: ${status}`;
    return `KW ${isoWeek}/${isoYear}: Kein Bericht`;
  };

  const getWeekHref = (isoYear: number, isoWeek: number) => {
    const beforeStart = isBeforeTrainingStart(isoYear, isoWeek);
    return beforeStart ? "#" : `/trainee/reports/${isoYear}-${isoWeek}`;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onPrevYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {year}
        </h2>
        <Button variant="ghost" size="sm" onClick={onNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-0.5" style={{ minWidth: weeks.length * 14 }}>
          <div className="flex gap-0.5 mb-1" style={{ paddingLeft: 28 }}>
            {monthPositions.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                className="text-[10px] text-neutral-400 leading-none"
                style={{
                  position: "relative",
                  left: m.col * 14,
                  width: 0,
                  overflow: "visible",
                  whiteSpace: "nowrap",
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div key={dayLabel} className="flex items-center gap-0.5">
              <span className="w-6 text-[10px] text-neutral-400 text-right mr-0.5 shrink-0">
                {dayLabel}
              </span>
              {weeks.map((week) => {
                const cellKey = `${dayIndex}-${week.isoYear}-${week.isoWeek}`;
                const cell = cellMap.get(cellKey);
                if (!cell) {
                  return (
                    <div
                      key={`empty-${dayIndex}-${week.isoWeek}`}
                      className="h-3 w-3 shrink-0"
                    />
                  );
                }

                const colorClass = getStatusColor(week.isoYear, week.isoWeek);
                const isCurrentWeek = week.isoYear === currentWeek.year && week.isoWeek === currentWeek.week;
                const beforeStart = isBeforeTrainingStart(week.isoYear, week.isoWeek);
                const href = getWeekHref(week.isoYear, week.isoWeek);

                return (
                  <Link
                    key={cellKey}
                    href={href}
                    title={getTooltip(week.isoYear, week.isoWeek)}
                    className={`h-3 w-3 shrink-0 rounded-sm transition-transform hover:scale-150 hover:z-10 ${colorClass} ${
                      isCurrentWeek && !beforeStart
                        ? "ring-1 ring-neutral-900 dark:ring-neutral-100"
                        : ""
                    } ${beforeStart ? "pointer-events-none" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("draft")}`} />
            Entwurf
          </span>
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("submitted")}`} />
            Eingereicht
          </span>
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("approved")}`} />
            Genehmigt
          </span>
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("rejected")}`} />
            Abgelehnt
          </span>
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("needs_revision")}`} />
            Überarbeitung
          </span>
          <span className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusColor("missing")}`} />
            Fehlt
          </span>
        </div>
      </div>
    </div>
  );
}
