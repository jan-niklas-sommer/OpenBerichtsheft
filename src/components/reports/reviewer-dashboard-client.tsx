"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusColor, STATUS_LABELS, statusVariant } from "@/lib/utils";
import { FileText, ChevronDown, ChevronUp, Filter } from "lucide-react";
import type { ReportStatus } from "@/types";

interface TraineeWithReports {
  id: string;
  name: string;
  profession: string | null;
  trainingStartDate: string | null;
  reports: {
    id: string;
    calendarYear: number;
    calendarWeek: number;
    status: string;
    submittedAt: string | null;
  }[];
}

interface ReviewerDashboardClientProps {
  title: string;
  basePath: string;
  trainees: TraineeWithReports[];
  currentYear: number;
  currentWeek: number;
}

type StatusFilter = "all" | "submitted" | "needs_revision" | "approved" | "rejected" | "draft";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "submitted", label: "Eingereicht" },
  { value: "needs_revision", label: "Überarbeitung" },
  { value: "approved", label: "Genehmigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "draft", label: "Entwurf" },
];

export function ReviewerDashboardClient({
  title,
  basePath,
  trainees,
  currentYear,
  currentWeek,
}: ReviewerDashboardClientProps) {
  const [expandedTrainee, setExpandedTrainee] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrainees = useMemo(() => {
    return trainees.map((t) => ({
      ...t,
      reports: t.reports.filter(
        (r) => statusFilter === "all" || r.status === statusFilter
      ),
    })).filter((t) => statusFilter === "all" || t.reports.length > 0);
  }, [trainees, statusFilter]);

  const submittedCount = useMemo(
    () => trainees.reduce((sum, t) => sum + t.reports.filter((r) => r.status === "submitted").length, 0),
    [trainees]
  );

  const recentWeeks = useMemo(() => {
    const weeks: { year: number; week: number }[] = [];
    for (let i = 0; i < 12; i++) {
      let w = currentWeek - i;
      let y = currentYear;
      while (w < 1) { w += 52; y--; }
      weeks.push({ year: y, week: w });
    }
    return weeks;
  }, [currentYear, currentWeek]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {submittedCount > 0 && (
            <Badge variant="warning">
              {submittedCount} offen
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}

      {filteredTrainees.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="text-neutral-500">Keine offenen Berichte.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrainees.map((trainee) => {
            const isExpanded = expandedTrainee === trainee.id;
            const submittedReports = trainee.reports.filter((r) => r.status === "submitted");

            return (
              <Card key={trainee.id}>
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedTrainee(isExpanded ? null : trainee.id)}
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {trainee.name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {trainee.profession || "Kein Beruf"}
                      {" · "}{trainee.reports.length} Berichte
                      {submittedReports.length > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {" · "}{submittedReports.length} offen
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mini week overview */}
                    <div className="hidden sm:flex items-center gap-0.5">
                      {recentWeeks.map((w) => {
                        const report = trainee.reports.find(
                          (r) => r.calendarYear === w.year && r.calendarWeek === w.week
                        );
                        return (
                          <div
                            key={`${w.year}-${w.week}`}
                            className={`h-3 w-3 rounded-sm ${report ? statusColor(report.status) : "bg-neutral-100 dark:bg-neutral-800"}`}
                            title={report ? `KW ${w.week}: ${STATUS_LABELS[report.status]}` : `KW ${w.week}: Kein Bericht`}
                          />
                        );
                      })}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-2">
                    {/* Submitted reports first */}
                    {submittedReports.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Zu prüfen
                        </p>
                        {submittedReports.map((report) => (
                          <Link key={report.id} href={`${basePath}/report/${report.id}`}>
                            <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  KW {report.calendarWeek}/{report.calendarYear}
                                </p>
                              </div>
                              <Badge variant={statusVariant(report.status)}>
                                {STATUS_LABELS[report.status]}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* All other reports */}
                    {trainee.reports
                      .filter((r) => r.status !== "submitted")
                      .map((report) => (
                        <Link key={report.id} href={`${basePath}/report/${report.id}`}>
                          <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                KW {report.calendarWeek}/{report.calendarYear}
                              </p>
                            </div>
                            <Badge variant={statusVariant(report.status)}>
                              {STATUS_LABELS[report.status]}
                            </Badge>
                          </div>
                        </Link>
                      ))}

                    {trainee.reports.length === 0 && (
                      <p className="text-sm text-neutral-500 py-2">Keine Berichte vorhanden.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
