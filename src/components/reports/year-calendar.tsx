"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getIsoWeek, statusColor, STATUS_LABELS, getWeekDates, formatDate, getWeeksInMonth } from "@/lib/utils";
import type { ReportStatus } from "@/types";

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
  const [legendPos, setLegendPos] = useState<{ x: number; y: number; containerWidth: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const beforeStart = isBeforeTrainingStart(year, w);
    const isPast = year < currentWeek.year || (year === currentWeek.year && w <= currentWeek.week);

    if (beforeStart) return "bg-surface-sunken/40";
    if (status) return statusColor(status);
    if (isPast) return statusColor("missing");
    return "bg-surface-overlay";
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLegendPos({ x, y, containerWidth: rect.width });
  }, []);

  const LEGEND_ITEMS = [
    { status: "draft", label: "Entwurf" },
    { status: "submitted", label: "Eingereicht" },
    { status: "approved", label: "Genehmigt" },
    { status: "rejected", label: "Abgelehnt" },
    { status: "needs_revision", label: "Überarbeitung" },
    { status: "missing", label: "Fehlt" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLegendPos(null)}
    >
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
          const beforeStart = isBeforeTrainingStart(year, w.week);
          const href = getWeekHref(w.week);

          return (
            <Link
              key={`${w.year}-${w.week}`}
              href={href}
              title={getTooltip(w.week)}
              className={`h-7 min-w-[3px] flex-1 rounded-sm transition-transform hover:scale-y-150 hover:z-10 ${colorClass} ${
                isSelectedMonth && !beforeStart
                  ? "ring-1 ring-content-base"
                  : ""
              } ${beforeStart ? "pointer-events-none" : ""}`}
            />
          );
        })}
      </div>

      {legendPos && (
        <div
          className="absolute pointer-events-none rounded-lg border border-stroke-subtle bg-surface-base/95 backdrop-blur-sm p-2.5 shadow-lg z-20 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-content-muted"
          style={{
            left: Math.min(legendPos.x + 12, legendPos.containerWidth - 220),
            top: legendPos.y + 12,
          }}
        >
          {LEGEND_ITEMS.map((item) => (
            <span key={item.status} className="flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${statusColor(item.status)}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
