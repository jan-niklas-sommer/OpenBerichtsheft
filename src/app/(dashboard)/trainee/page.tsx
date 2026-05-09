"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportCalendar } from "@/components/reports/report-calendar";
import { YearCalendar } from "@/components/reports/year-calendar";
import { Plus } from "lucide-react";
import type { WeeklyReportData, ReportStatus } from "@/types";

export default function TraineeDashboard() {
  const [reports, setReports] = useState<WeeklyReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainingStartDate, setTrainingStartDate] = useState<string | null>(null);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      });
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.trainingStartDate) {
          setTrainingStartDate(session.user.trainingStartDate);
        }
      });
  }, []);

  const reportSummaries = useMemo(
    () =>
      reports.map((r) => ({
        calendarYear: r.calendarYear,
        calendarWeek: r.calendarWeek,
        status: r.status as ReportStatus,
      })),
    [reports]
  );

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  if (loading) {
    return <div className="text-neutral-500">Laden...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Meine Berichte
        </h1>
        <Link href="/trainee/reports/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Aktueller Bericht
          </Button>
        </Link>
      </div>

      <YearCalendar
        year={viewYear}
        reports={reportSummaries}
        trainingStartDate={trainingStartDate}
        onPrevYear={() => setViewYear((y) => y - 1)}
        onNextYear={() => setViewYear((y) => y + 1)}
      />

      <ReportCalendar
        year={viewYear}
        month={viewMonth}
        reports={reportSummaries}
        trainingStartDate={trainingStartDate}
        onPrevMonth={handlePrev}
        onNextMonth={handleNext}
      />
    </div>
  );
}
