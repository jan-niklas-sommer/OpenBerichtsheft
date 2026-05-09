"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusDotColor, STATUS_LABELS, statusVariant } from "@/lib/utils";
import { FileText, ChevronDown, ChevronUp, Filter } from "lucide-react";

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
    for (let i = 0; i < 8; i++) {
      let w = currentWeek - i;
      let y = currentYear;
      while (w < 1) { w += 52; y--; }
      weeks.push({ year: y, week: w });
    }
    return weeks;
  }, [currentYear, currentWeek]);

  const [dotTooltip, setDotTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const dotContainerRef = useRef<HTMLDivElement>(null);

  const handleDotEnter = useCallback((text: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = dotContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setDotTooltip({
      text,
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top - 4,
    });
  }, []);

  const handleDotLeave = useCallback(() => {
    setDotTooltip(null);
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-content-base">
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
            <FileText className="mb-3 h-10 w-10 text-content-subtle" />
            <p className="text-content-muted">Keine offenen Berichte.</p>
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
                    <p className="font-medium text-content-base">
                      {trainee.name}
                    </p>
                    <p className="text-sm text-content-muted">
                      {trainee.profession || "Kein Beruf"}
                      {" · "}{trainee.reports.length} Berichte
                      {submittedReports.length > 0 && (
                        <span className="text-warning">
                          {" · "}{submittedReports.length} offen
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Mini week overview */}
                    <div ref={dotContainerRef} className="relative hidden sm:flex items-center gap-1">
                      {recentWeeks.map((w) => {
                        const report = trainee.reports.find(
                          (r) => r.calendarYear === w.year && r.calendarWeek === w.week
                        );
                        const tooltipText = report
                          ? `KW ${w.week}: ${STATUS_LABELS[report.status]}`
                          : `KW ${w.week}: Kein Bericht`;
                        const href = report
                          ? `${basePath}/report/${report.id}`
                          : "#";
                        return (
                          <Link
                            key={`${w.year}-${w.week}`}
                            href={href}
                            className={`h-4 w-4 rounded-sm ${report ? statusDotColor(report.status) : "bg-surface-overlay border border-stroke-subtle"}`}
                            onMouseEnter={(e) => handleDotEnter(tooltipText, e)}
                            onMouseLeave={handleDotLeave}
                          />
                        );
                      })}
                      {dotTooltip && (
                        <div
                          className="pointer-events-none absolute z-30 whitespace-nowrap rounded-md border border-stroke-subtle bg-surface-elevated px-2 py-1 text-[10px] shadow-md text-content-base"
                          style={{
                            left: dotTooltip.x,
                            top: dotTooltip.y,
                            transform: "translate(-50%, -100%)",
                          }}
                        >
                          {dotTooltip.text}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-content-subtle" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-content-subtle" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stroke-subtle px-4 py-3 space-y-2">
                    {/* Submitted reports first */}
                    {submittedReports.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
                          Zu prüfen
                        </p>
                        {submittedReports.map((report) => (
                          <Link key={report.id} href={`${basePath}/report/${report.id}`}>
                            <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-surface-overlay">
                              <div>
                                <p className="text-sm font-medium text-content-base">
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
                          <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-surface-overlay">
                            <div>
                              <p className="text-sm font-medium text-content-base">
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
                      <p className="text-sm text-content-muted py-2">Keine Berichte vorhanden.</p>
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
