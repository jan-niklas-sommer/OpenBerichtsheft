"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getIsoWeek, statusDotColor, STATUS_LABELS, getWeekDates, formatDate, getWeeksInMonth, isBeforeTrainingStart } from "@/lib/utils";
import type { ReportStatus } from "@/types";

const LEGEND_ITEMS = [
  { status: "draft", label: "Entwurf" },
  { status: "submitted", label: "Eingereicht" },
  { status: "approved", label: "Genehmigt" },
  { status: "rejected", label: "Abgelehnt" },
  { status: "needs_revision", label: "Überarbeitung" },
  { status: "missing", label: "Fehlt" },
];

interface ReportSummary {
  calendarYear: number;
  calendarWeek: number;
  status: ReportStatus;
}

interface YearCalendarProps {
  year: number;
  month: number;
  reports: ReportSummary[];
  trainingStartDate: string | null;
}

const MONTH_LABELS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function YearCalendar({
  year,
  month,
  reports,
  trainingStartDate,
}: YearCalendarProps) {
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

  const weeks = useMemo(() => {
    const result: { week: number; year: number; month: number }[] = [];
    for (let w = 1; w <= 53; w++) {
      const dates = getWeekDates(year, w);
      const firstDay = dates[0];
      if (firstDay.getFullYear() === year || dates[6].getFullYear() === year) {
        result.push({ week: w, year, month: firstDay.getMonth() });
      }
    }
    return result;
  }, [year]);

  const monthWeeks = useMemo(() => {
    const mw = new Set<number>();
    const monthWeekInfos = getWeeksInMonth(year, month);
    for (const wi of monthWeekInfos) {
      mw.add(wi.week);
    }
    return mw;
  }, [year, month]);

  const monthRanges = useMemo(() => {
    const ranges: { label: string; startIdx: number; span: number }[] = [];
    let lastMonth = -1;
    let startIdx = 0;
    weeks.forEach((w, i) => {
      if (w.month !== lastMonth && lastMonth !== -1) {
        ranges.push({ label: MONTH_LABELS[lastMonth], startIdx, span: i - startIdx });
        startIdx = i;
      }
      lastMonth = w.month;
    });
    if (lastMonth !== -1) {
      ranges.push({ label: MONTH_LABELS[lastMonth], startIdx, span: weeks.length - startIdx });
    }
    return ranges;
  }, [weeks]);

  const getStatusColor = (w: number) => {
    const status = reportMap.get(`${year}-${w}`);
    const beforeStart = isBeforeTrainingStart(year, w, trainingStart);
    const isPast = year < currentWeek.year || (year === currentWeek.year && w <= currentWeek.week);

    if (beforeStart) return "bg-surface-sunken/40";
    if (status) return statusDotColor(status);
    if (isPast) return statusDotColor("missing");
    return "bg-surface-overlay border border-stroke-subtle";
  };

  const getTooltip = (w: number) => {
    const status = reportMap.get(`${year}-${w}`);
    const beforeStart = isBeforeTrainingStart(year, w, trainingStart);
    const dates = getWeekDates(year, w);
    const range = `${formatDate(dates[0])} – ${formatDate(dates[6])}`;

    if (beforeStart) return `KW ${w}: Vor Eintritt (${range})`;
    if (status) return `KW ${w}: ${STATUS_LABELS[status] || status} (${range})`;
    return `KW ${w}: Kein Bericht (${range})`;
  };

  const getWeekHref = (w: number) => {
    const beforeStart = isBeforeTrainingStart(year, w, trainingStart);
    return beforeStart ? "#" : `/trainee/reports/${year}-${w}`;
  };

  return (
    <div>
      <div className="overflow-x-auto timeline-scroll">
        <div className="min-w-[480px]">
          <div className="mb-0.5 relative h-4">
            {monthRanges.map((m) => (
              <span
                key={`${m.label}-${m.startIdx}`}
                className="absolute text-[10px] text-content-subtle leading-none"
                style={{
                  left: `${(m.startIdx / weeks.length) * 100}%`,
                  width: `${(m.span / weeks.length) * 100}%`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[2px] w-full">
            {weeks.map((w) => {
              const colorClass = getStatusColor(w.week);
              const isSelectedMonth = monthWeeks.has(w.week) && w.month === month;
              const beforeStart = isBeforeTrainingStart(year, w.week, trainingStart);
              const href = getWeekHref(w.week);

              return (
                <Link
                  key={`${w.year}-${w.week}`}
                  href={href}
                  title={getTooltip(w.week)}
                  className={`h-7 min-w-[3px] flex-1 rounded-sm transition-all hover:ring-1 hover:ring-content-base/50 hover:z-10 ${colorClass} ${
                    isSelectedMonth && !beforeStart
                      ? "ring-1 ring-content-base"
                      : ""
                  } ${beforeStart ? "pointer-events-none" : ""}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-content-muted">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.status} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded-sm ${statusDotColor(item.status)}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
