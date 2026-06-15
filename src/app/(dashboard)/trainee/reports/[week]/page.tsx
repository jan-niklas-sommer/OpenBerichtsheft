"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  getIsoWeeksInYear,
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
    if (!isEditable || !dataFetched) return null;
    return { reportText, reportType, dailyEntries };
  }, [isEditable, dataFetched, reportText, reportType, dailyEntries]);

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
        } else {
          fetch(`/api/reports/prefill?year=${currentYear}&week=${currentWeek}`)
            .then((r) => r.json())
            .then((prefill) => {
              if (Array.isArray(prefill) && prefill.length === 7) {
                setDailyEntries(prefill.map((e: { date: string; dayType: string; hours: number; minutes: number; reportText: string }) => ({
                  date: e.date,
                  dayType: e.dayType as DayType,
                  hours: e.hours,
                  minutes: e.minutes,
                  reportText: e.reportText,
                })));
              }
            })
            .catch(() => {});
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
      if (w < 1) { w = getIsoWeeksInYear(y - 1); y--; }
      else if (w > getIsoWeeksInYear(y)) { w = 1; y++; }
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

  const { saveStatus, save, reset } = useAutosave(
    autosaveData,
    handleSave,
    20000
  );

  // Beim Laden eines (anderen) Reports vom Server die geladenen Daten als
  // Baseline markieren, damit kein Phantom-Save der unveränderten Server-Daten
  // getriggert wird (initial + bei Wochenwechsel).
  const loadedReportIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (report && report.id !== loadedReportIdRef.current) {
      loadedReportIdRef.current = report.id;
      reset();
    }
  }, [report, reset]);

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
      newWeek = getIsoWeeksInYear(newYear - 1);
      newYear--;
    } else if (newWeek > getIsoWeeksInYear(newYear)) {
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

    fetch(`/api/reports/prefill?year=${newYear}&week=${newWeek}`)
      .then((r) => r.json())
      .then((prefill) => {
        if (Array.isArray(prefill) && prefill.length === 7) {
          setDailyEntries(prefill.map((e: { date: string; dayType: string; hours: number; minutes: number; reportText: string }) => ({
            date: e.date,
            dayType: e.dayType as DayType,
            hours: e.hours,
            minutes: e.minutes,
            reportText: e.reportText,
          })));
        }
      })
      .catch(() => {});
  };

  const prevDisabled = (() => {
    let pw = currentWeek - 1, py = currentYear;
    if (pw < 1) { pw = getIsoWeeksInYear(py - 1); py--; }
    return isBeforeTrainingStart(py, pw);
  })();

  const isNonWorkingDay = (date: Date) => {
    return !workingDays.includes(date.getDay());
  };

  if (loading) {
    return <div className="text-content-muted">Laden...</div>;
  }

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/trainee"
          className="inline-flex items-center gap-1 text-sm text-content-muted hover:text-content-base"
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
          <div className="text-sm text-content-muted">
            {saveStatus === "saving" && "Speichert…"}
            {saveStatus === "saved" && savedAt && (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-3 w-3" /> Zuletzt gespeichert {relativeSaveText}
              </span>
            )}
            {saveStatus === "saved" && !savedAt && (
              <span className="flex items-center gap-1 text-success">
                <Check className="h-3 w-3" /> Gespeichert
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-danger">Fehler beim Speichern</span>
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
        <Card className="mb-6 border-warning">
          <CardHeader>
            <CardTitle>Kommentar des Prüfers</CardTitle>
          </CardHeader>
          <p className="text-sm text-content-muted">
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
                ? "border-accent bg-accent text-accent-fg"
                : "border-stroke-subtle bg-surface-base text-content-muted hover:border-stroke-base"
            }`}
          >
            <FileText className="h-4 w-4" />
            Wochenbericht
          </button>
          <button
            onClick={() => setReportType("daily")}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              reportType === "daily"
                ? "border-accent bg-accent text-accent-fg"
                : "border-stroke-subtle bg-surface-base text-content-muted hover:border-stroke-base"
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
              ? "border-stroke-base bg-surface-overlay text-content-muted"
              : "border-stroke-subtle bg-surface-base text-content-subtle"
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
            <span className="flex items-center gap-1.5 text-sm text-content-muted">
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
                className={`rounded-lg border p-4 ${
                  nonWorking
                    ? "border-stroke-subtle bg-surface-overlay"
                    : "border-stroke-subtle"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-[140px]">
                    <p className={`font-medium ${nonWorking ? "text-content-subtle" : "text-content-base"}`}>
                      {formatDayName(weekDates[index])}
                    </p>
                    <p className="text-sm text-content-muted">
                      {formatDate(weekDates[index])}
                    </p>
                  </div>

                  {nonWorking ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-content-subtle">&ndash;</span>
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
                          className="h-10 w-20 rounded-lg border border-stroke-base bg-surface-base px-2 text-center text-sm text-content-base focus:border-stroke-strong focus:outline-none disabled:opacity-50"
                        />
                        <span className="text-sm text-content-muted">h</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={entry.minutes}
                          onChange={(e) =>
                            updateEntry(index, "minutes", Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                          }
                          disabled={!isEditable}
                          className="h-10 w-20 rounded-lg border border-stroke-base bg-surface-base px-2 text-center text-sm text-content-base focus:border-stroke-strong focus:outline-none disabled:opacity-50"
                        />
                        <span className="text-sm text-content-muted">min</span>
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
