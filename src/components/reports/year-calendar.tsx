"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getIsoWeek, statusColor, STATUS_LABELS, getWeekDates, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
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

const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function YearCalendar({
  year,
  reports,
  trainingStartDate,
  onPrevYear,
  onNextYear,
}: YearCalendarProps) {
  const [showLegend, setShowLegend] = useState(false);

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
    const result: { week: number; year: number; month: number }[] = [];
    const d = new Date(year, 0, 4);
    d.setHours(12, 0, 0, 0);
    for (let w = 1; w <= 53; w++) {
      const dates = getWeekDates(year, w);
      const firstDay = dates[0];
      if (firstDay.getFullYear() === year || dates[6].getFullYear() === year) {
        result.push({ week: w, year, month: firstDay.getMonth() });
      }
    }
    return result;
  }, [year]);

  const monthPositions = useMemo(() => {
    const positions: { label: string; index: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      if (w.month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[w.month], index: i });
        lastMonth = w.month;
      }
    });
    return positions;
  }, [weeks]);

  const getStatusColor = (w: number) => {
    const status = reportMap.get(`${year}-${w}`);
    const beforeStart = isBeforeTrainingStart(year, w);
    const isPast = year < currentWeek.year || (year === currentWeek.year && w <= currentWeek.week);

    if (beforeStart) return "bg-neutral-200/40 dark:bg-neutral-700/40";
    if (status) return statusColor(status);
    if (isPast) return statusColor("missing");
    return "bg-neutral-100 dark:bg-neutral-800/50";
  };

  const getTooltip = (w: number) => {
    const status = reportMap.get(`${year}-${w}`);
    const beforeStart = isBeforeTrainingStart(year, w);
    const dates = getWeekDates(year, w);
    const range = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;

    if (beforeStart) return `KW ${w}: Vor Eintritt (${range})`;
    if (status) return `KW ${w}: ${STATUS_LABELS[status] || status} (${range})`;
    return `KW ${w}: Kein Bericht (${range})`;
  };

  const getWeekHref = (w: number) => {
    const beforeStart = isBeforeTrainingStart(year, w);
    return beforeStart ? "#" : `/trainee/reports/${year}-${w}`;
  };

  const LEGEND_ITEMS = [
    { status: "draft", label: "Entwurf" },
    { status: "submitted", label: "Eingereicht" },
    { status: "approved", label: "Genehmigt" },
    { status: "rejected", label: "Abgelehnt" },
    { status: "needs_revision", label: "Überarbeitung" },
    { status: "missing", label: "Fehlt" },
  ];

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
        <div className="flex gap-0.5 mb-1" style={{ paddingLeft: 0 }}>
          {monthPositions.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              className="text-[10px] text-neutral-400 leading-none"
              style={{
                position: "relative",
                left: m.index * 18,
                width: 0,
                overflow: "visible",
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-0.5" style={{ minWidth: weeks.length * 18 }}>
          {weeks.map((w) => {
            const colorClass = getStatusColor(w.week);
            const isCurrentWeek = year === currentWeek.year && w.week === currentWeek.week;
            const beforeStart = isBeforeTrainingStart(year, w.week);
            const href = getWeekHref(w.week);

            return (
              <Link
                key={`${w.year}-${w.week}`}
                href={href}
                title={getTooltip(w.week)}
                className={`h-7 w-4 shrink-0 rounded-sm transition-transform hover:scale-y-150 hover:z-10 ${colorClass} ${
                  isCurrentWeek && !beforeStart
                    ? "ring-1 ring-neutral-900 dark:ring-neutral-100"
                    : ""
                } ${beforeStart ? "pointer-events-none" : ""}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2 relative">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label="Legende anzeigen"
        >
          <Info className="h-3 w-3" />
          Legende
        </button>
        {showLegend && (
          <div className="absolute bottom-full mb-2 left-0 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 z-20 flex flex-wrap gap-3 text-xs text-neutral-500">
            {LEGEND_ITEMS.map((item) => (
              <span key={item.status} className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded-sm ${statusColor(item.status)}`} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
