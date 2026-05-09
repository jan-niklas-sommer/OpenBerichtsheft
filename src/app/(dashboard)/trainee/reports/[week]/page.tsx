"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TextArea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAutosave } from "@/hooks/use-autosave";
import { WeekNavigator } from "@/components/reports/week-navigator";
import {
  getWeekDates,
  formatDayName,
  formatDate,
  getCurrentWeek,
  getIsoWeek,
  DAY_TYPE_LABELS,
  DAY_TYPES,
} from "@/lib/utils";
import type { DailyEntryData, DayType, WeeklyReportData, ReportStatus, ReportType } from "@/types";
import { Save, Send, Check, Download, CalendarDays, Undo2, FileText, FileSpreadsheet, Clock } from "lucide-react";

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trainingStartWeek, setTrainingStartWeek] = useState<{ year: number; week: number } | null>(null);
  const [allReports, setAllReports] = useState<WeeklyReportData[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reportType, setReportType] = useState<ReportType>("weekly");

  const slug = params.week as string;
  const isNewFromSlug = slug === "new";

  const { year, week } = useMemo(() => {
    if (slug === "new") {
      const cw = getCurrentWeek();
      return cw;
    }
    const parts = slug.split("-");
    return { year: parseInt(parts[0]), week: parseInt(parts[1]) };
  }, [slug]);

  const [currentYear, setCurrentYear] = useState(year);
  const [currentWeek, setCurrentWeek] = useState(week);

  const weekDates = useMemo(() => getWeekDates(currentYear, currentWeek), [currentYear, currentWeek]);

  const [reportText, setReportText] = useState("");
  const [dailyEntries, setDailyEntries] = useState<DailyEntryData[]>(() =>
    buildDefaultEntries(weekDates, [1, 2, 3, 4, 5])
  );

  const isEditable = report?.status === "draft" || report?.status === "needs_revision" || !report || isNewFromSlug;

  const totalMinutes = useMemo(() => {
    return dailyEntries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0);
  }, [dailyEntries]);

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [relativeSaveText, setRelativeSaveText] = useState<string>("");

  useEffect(() => {
    if (!savedAt) return;
    const update = () => {
      const diff = Math.floor((Date.now() - savedAt.getTime()) / 1000);
      if (diff < 5) setRelativeSaveText("Gerade eben");
      else if (diff < 60) setRelativeSaveText(`vor ${diff} Sekunden`);
      else if (diff < 3600) setRelativeSaveText(`vor ${Math.floor(diff / 60)} Minuten`);
      else setRelativeSaveText(`vor ${Math.floor(diff / 3600)} Stunden`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [savedAt]);

  const autosaveData = useMemo(() => {
    if (!isEditable) return null;
    return { reportText, reportType, dailyEntries };
  }, [isEditable, reportText, reportType, dailyEntries]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.trainingStartDate) {
          setTrainingStartWeek(getIsoWeek(new Date(session.user.trainingStartDate)));
        }
      });
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.workingDays) setWorkingDays(data.workingDays);
      });
  }, []);

  const loading = !isNewFromSlug && !dataFetched;

  useEffect(() => {
    if (isNewFromSlug) return;

    fetch(`/api/reports`)
      .then((r) => r.json())
      .then((reports: WeeklyReportData[]) => {
        setAllReports(reports);
        const found = reports.find(
          (r: WeeklyReportData) => r.calendarWeek === currentWeek && r.calendarYear === currentYear
        );
        if (found) {
          setReport(found);
          setReportText(found.reportText || "");
          setReportType(found.reportType || "weekly");
          if (found.dailyEntries.length > 0) {
            setDailyEntries(found.dailyEntries);
          }
        }
        setDataFetched(true);
      });
  }, [currentYear, currentWeek, isNewFromSlug]);

  const reportStatusMap = useMemo(() => {
    const map = new Map<string, ReportStatus>();
    for (const r of allReports) {
      map.set(`${r.calendarYear}-${r.calendarWeek}`, r.status);
    }
    return map;
  }, [allReports]);

  const adjacentStatuses = useMemo(() => {
    const calcWeek = (direction: -1 | 1) => {
      let w = currentWeek + direction;
      let y = currentYear;
      if (w < 1) { w = 52; y--; }
      else if (w > 52) { w = 1; y++; }
      return { year: y, week: w };
    };
    const prev = calcWeek(-1);
    const next = calcWeek(1);
    return {
      prev: reportStatusMap.get(`${prev.year}-${prev.week}`) ?? null,
      next: reportStatusMap.get(`${next.year}-${next.week}`) ?? null,
    };
  }, [currentYear, currentWeek, reportStatusMap]);

  const handleSave = async () => {
    const body = {
      calendarYear: currentYear,
      calendarWeek: currentWeek,
      reportText,
      reportType,
      dailyEntries: dailyEntries.map((e) => ({
        date: e.date,
        dayType: e.dayType,
        hours: e.hours,
        minutes: e.minutes,
        reportText: e.reportText || undefined,
      })),
    };

    if (report?.id) {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) setSavedAt(new Date());
      return data;
    } else {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id) {
        setReport(data);
        setSavedAt(new Date());
      }
      return data;
    }
  };

  const { saveStatus, save } = useAutosave(
    autosaveData,
    handleSave,
    20000
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    const savedReport = await handleSave();
    const reportId = savedReport?.id || report?.id;
    if (!reportId) {
      setSubmitting(false);
      return;
    }

    const res = await fetch(`/api/reports/${reportId}/submit`, {
      method: "POST",
    });

    if (res.ok) {
      router.push("/trainee");
    }
    setSubmitting(false);
  };

  const handleWithdraw = async () => {
    if (!report?.id) return;
    setSubmitting(true);
    const res = await fetch(`/api/reports/${report.id}/submit`, {
      method: "PUT",
    });
    if (res.ok) {
      const updated = await res.json();
      setReport(updated);
    }
    setSubmitting(false);
  };

  const updateEntry = (index: number, field: keyof DailyEntryData, value: string | number) => {
    setDailyEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const isBeforeTrainingStart = (y: number, w: number) => {
    if (!trainingStartWeek) return false;
    return y < trainingStartWeek.year || (y === trainingStartWeek.year && w < trainingStartWeek.week);
  };

  const navigateWeek = (direction: -1 | 1) => {
    let newWeek = currentWeek + direction;
    let newYear = currentYear;
    if (newWeek < 1) {
      newWeek = 52;
      newYear--;
    } else if (newWeek > 52) {
      newWeek = 1;
      newYear++;
    }
    if (isBeforeTrainingStart(newYear, newWeek)) return;
    setCurrentWeek(newWeek);
    setCurrentYear(newYear);
    setReport(null);
    setDataFetched(false);
    const dates = getWeekDates(newYear, newWeek);
    setDailyEntries(buildDefaultEntries(dates, workingDays));
    setReportText("");
    router.push(`/trainee/reports/${newYear}-${newWeek}`);
  };

  const prevDisabled = (() => {
    let pw = currentWeek - 1, py = currentYear;
    if (pw < 1) { pw = 52; py--; }
    return isBeforeTrainingStart(py, pw);
  })();

  const isNonWorkingDay = (date: Date) => {
    return !workingDays.includes(date.getDay());
  };

  if (loading) {
    return <div className="text-neutral-500">Laden...</div>;
  }

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/trainee"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Zurück zur Übersicht
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <WeekNavigator
          currentYear={currentYear}
          currentWeek={currentWeek}
          currentStatus={report?.status ?? null}
          adjacentStatuses={adjacentStatuses}
          prevDisabled={prevDisabled}
          onNavigate={navigateWeek}
          professionName={report?.trainee?.profession?.name}
        />

        <div className="flex items-center gap-3">
          <div className="text-sm text-neutral-500">
            {saveStatus === "saving" && "Speichert…"}
            {saveStatus === "saved" && savedAt && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" /> Zuletzt gespeichert {relativeSaveText}
              </span>
            )}
            {saveStatus === "saved" && !savedAt && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" /> Gespeichert
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-red-500">Fehler beim Speichern</span>
            )}
          </div>

          {isEditable && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => save({ reportText, reportType, dailyEntries })}
              >
                <Save className="mr-1 h-4 w-4" />
                Speichern
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
              >
                <Send className="mr-1 h-4 w-4" />
                Einreichen
              </Button>
            </div>
          )}

          {report?.status === "submitted" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleWithdraw}
              loading={submitting}
            >
              <Undo2 className="mr-1 h-4 w-4" />
              Zurückziehen
            </Button>
          )}

          {report?.id && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/api/reports/${report.id}/pdf`, "_blank")}
            >
              <Download className="mr-1 h-4 w-4" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {report?.reviewComment && (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle>Kommentar des Prüfers</CardTitle>
          </CardHeader>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {report.reviewComment}
          </p>
        </Card>
      )}

      {isEditable && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setReportType("weekly")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              reportType === "weekly"
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            }`}
          >
            <FileText className="h-4 w-4" />
            Wochenbericht
          </button>
          <button
            onClick={() => setReportType("daily")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              reportType === "daily"
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Tagesbericht
          </button>
        </div>
      )}

      {!isEditable && (
        <div className="mb-6 flex gap-2">
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
            reportType === "weekly"
              ? "border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              : "border-neutral-200 bg-white text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500"
          }`}>
            {reportType === "weekly" ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            {reportType === "weekly" ? "Wochenbericht" : "Tagesbericht"}
          </div>
        </div>
      )}

      {reportType === "weekly" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wochenbericht</CardTitle>
          </CardHeader>
          <TextArea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            disabled={!isEditable}
            placeholder="Beschreiben Sie Ihre Tätigkeiten dieser Woche..."
            className="min-h-[250px]"
          />
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tageseinträge</CardTitle>
            <span className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Clock className="h-3.5 w-3.5" />
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min
            </span>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {dailyEntries.map((entry, index) => {
            const nonWorking = isNonWorkingDay(weekDates[index]);
            const showDayReport = reportType === "daily" && entry.dayType !== "vacation" && !nonWorking;

            return (
              <div
                key={entry.date}
                className={`rounded-lg border p-4 dark:border-neutral-800 ${
                  nonWorking
                    ? "border-neutral-100 bg-neutral-50/50 dark:border-neutral-800/50 dark:bg-neutral-900/30"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-[140px]">
                    <p className={`font-medium ${nonWorking ? "text-neutral-400 dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-100"}`}>
                      {formatDayName(weekDates[index])}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatDate(weekDates[index])}
                    </p>
                  </div>

                  {nonWorking ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400 dark:text-neutral-600">&ndash;</span>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <Select
                          value={entry.dayType}
                          onChange={(e) => updateEntry(index, "dayType", e.target.value)}
                          disabled={!isEditable}
                          options={DAY_TYPES.map((t) => ({
                            value: t,
                            label: DAY_TYPE_LABELS[t],
                          }))}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={24}
                          value={entry.hours}
                          onChange={(e) =>
                            updateEntry(index, "hours", Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))
                          }
                          disabled={!isEditable}
                          className="h-10 w-16 rounded-lg border border-neutral-300 bg-white px-2 text-center text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 disabled:opacity-50"
                        />
                        <span className="text-sm text-neutral-500">h</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={entry.minutes}
                          onChange={(e) =>
                            updateEntry(index, "minutes", Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                          }
                          disabled={!isEditable}
                          className="h-10 w-16 rounded-lg border border-neutral-300 bg-white px-2 text-center text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 disabled:opacity-50"
                        />
                        <span className="text-sm text-neutral-500">min</span>
                      </div>
                    </div>
                  )}
                </div>

                {showDayReport && (
                  <div className="mt-3">
                    <TextArea
                      value={entry.reportText || ""}
                      onChange={(e) => updateEntry(index, "reportText", e.target.value)}
                      disabled={!isEditable}
                      placeholder="Tagesbericht für diesen Tag..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function buildDefaultEntries(weekDates: Date[], workingDays: number[]): DailyEntryData[] {
  return weekDates.map((date) => {
    const dayOfWeek = date.getDay();
    const isWorking = workingDays.includes(dayOfWeek);
    return {
      date: date.toISOString().split("T")[0],
      dayType: "company" as DayType,
      hours: isWorking ? 8 : 0,
      minutes: 0,
    };
  });
}
