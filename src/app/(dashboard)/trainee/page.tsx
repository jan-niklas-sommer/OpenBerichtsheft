"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, statusVariant } from "@/lib/utils";
import { FileText, Plus } from "lucide-react";
import type { WeeklyReportData } from "@/types";

export default function TraineeDashboard() {
  const [reports, setReports] = useState<WeeklyReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      });
  }, []);

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
            Neuer Bericht
          </Button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-neutral-400" />
            <p className="mb-4 text-neutral-500">
              Noch keine Berichte erstellt.
            </p>
            <Link href="/trainee/reports/new">
              <Button>Ersten Bericht erstellen</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/trainee/reports/${report.calendarYear}-${report.calendarWeek}`}>
              <Card className="mb-3 cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      KW {report.calendarWeek}/{report.calendarYear}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatDate(new Date(report.weekStartDate))} – {formatDate(new Date(report.weekEndDate))}
                    </p>
                    {report.reviewComment && (
                      <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                        Kommentar: {report.reviewComment.substring(0, 60)}
                        {report.reviewComment.length > 60 ? "..." : ""}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariant(report.status)}>
                    {STATUS_LABELS[report.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
