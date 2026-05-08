"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TextArea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAutosave } from "@/hooks/use-autosave";
import {
  getWeekDates,
  formatDayName,
  formatDate,
  getCurrentWeek,
  getIsoWeek,
  DAY_TYPE_LABELS,
  DAY_TYPES,
  STATUS_LABELS,
} from "@/lib/utils";
import type { DailyEntryData, DayType, WeeklyReportData } from "@/types";
import { Save, Send, ArrowLeft, ArrowRight, Check, Download } from "lucide-react";

export default function ReportEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trainingStartWeek, setTrainingStartWeek] = useState<{ year: number; week: number } | null>(null);

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
    weekDates.map((date) => ({
      date: date.toISOString().split("T")[0],
      dayType: "company" as DayType,
      hours: 8,
      minutes: 0,
    }))
  );

  const isEditable = report?.status === "draft" || report?.status === "needs_revision" || !report || isNewFromSlug;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.trainingStartDate) {
          setTrainingStartWeek(getIsoWeek(new Date(session.user.trainingStartDate)));
        }
      });
  }, []);

  const loading = !isNewFromSlug && !dataFetched;

  useEffect(() => {
    if (isNewFromSlug) return;

    fetch(`/api/reports?year=${currentYear}`)
      .then((r) => r.json())
      .then((reports: WeeklyReportData[]) => {
        const found = reports.find(
          (r: WeeklyReportData) => r.calendarWeek === currentWeek && r.calendarYear === currentYear
        );
        if (found) {
          setReport(found);
          setReportText(found.reportText || "");
          if (found.dailyEntries.length > 0) {
            setDailyEntries(found.dailyEntries);
          }
        }
        setDataFetched(true);
      });
  }, [currentYear, currentWeek, isNewFromSlug]);

  const handleSave = async () => {
    const body = {
      calendarYear: currentYear,
      calendarWeek: currentWeek,
      reportText,
      dailyEntries: dailyEntries.map((e) => ({
        date: e.date,
        dayType: e.dayType,
        hours: e.hours,
        minutes: e.minutes,
      })),
    };

    if (report?.id) {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    } else {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.id) {
        setReport(data);
      }
      return data;
    }
  };

  const { saveStatus, save } = useAutosave(
    { reportText, dailyEntries },
    handleSave,
    1500
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
    setDailyEntries(
      dates.map((date) => ({
        date: date.toISOString().split("T")[0],
        dayType: "company" as DayType,
        hours: 8,
        minutes: 0,
      }))
    );
    setReportText("");
    router.push(`/trainee/reports/${newYear}-${newWeek}`);
  };

  if (loading) {
    return <div className="text-neutral-500">Laden...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)} disabled={
            (() => {
              let pw = currentWeek - 1, py = currentYear;
              if (pw < 1) { pw = 52; py--; }
              return isBeforeTrainingStart(py, pw);
            })()
          }>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              KW {currentWeek}/{currentYear}
            </h1>
            {report?.trainee?.profession?.name && (
              <p className="text-sm text-neutral-500">{report.trainee.profession.name}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {report?.status && (
            <Badge
              variant={
                report.status === "approved"
                  ? "success"
                  : report.status === "submitted"
                  ? "warning"
                  : report.status === "needs_revision"
                  ? "info"
                  : "default"
              }
            >
              {STATUS_LABELS[report.status]}
            </Badge>
          )}

          <div className="text-sm text-neutral-500">
            {saveStatus === "saving" && "Speichert…"}
            {saveStatus === "saved" && (
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
                onClick={() => save({ reportText, dailyEntries })}
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

      <Card>
        <CardHeader>
          <CardTitle>Tageseinträge</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {dailyEntries.map((entry, index) => (
            <div
              key={entry.date}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-[140px]">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDayName(weekDates[index])}
                </p>
                <p className="text-sm text-neutral-500">
                  {formatDate(weekDates[index])}
                </p>
              </div>

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
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
