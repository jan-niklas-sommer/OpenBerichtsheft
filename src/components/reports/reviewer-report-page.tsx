"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextArea } from "@/components/ui/input";
import { STATUS_LABELS, DAY_TYPE_LABELS, formatDate } from "@/lib/utils";
import type { WeeklyReportData } from "@/types";
import { Download } from "lucide-react";

interface ReviewerReportPageProps {
  basePath: string;
}

export function ReviewerReportPage({ basePath }: ReviewerReportPageProps) {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      });
  }, [params.id]);

  const handleReview = async (action: string) => {
    setActionLoading(true);
    const res = await fetch(`/api/reports/${params.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment: comment || undefined }),
    });
    if (res.ok) {
      router.push(basePath);
    }
    setActionLoading(false);
  };

  if (loading) return <div className="text-neutral-500">Laden...</div>;
  if (!report) return <div className="text-red-500">Bericht nicht gefunden</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            KW {report.calendarWeek}/{report.calendarYear}
          </h1>
          <p className="text-sm text-neutral-500">
            von {report.trainee?.name}
            {report.trainee?.profession?.name && (
              <> &middot; {report.trainee.profession.name}</>
            )}
            {" "}&middot;{" "}
            <Badge
              variant={
                report.status === "submitted" ? "warning" : report.status === "approved" ? "success" : "default"
              }
            >
              {STATUS_LABELS[report.status]}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open(`/api/reports/${report.id}/pdf`, "_blank")}>
            <Download className="mr-1 h-4 w-4" />
            PDF
          </Button>
          <Button variant="ghost" onClick={() => router.push(basePath)}>
            Zurück
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{report.reportType === "daily" ? "Tagesbericht" : "Wochenbericht"}</CardTitle>
        </CardHeader>
        {report.reportType === "daily" ? (
          report.dailyEntries.some((e) => (e as { reportText?: string }).reportText) ? (
            <div className="space-y-4">
              {report.dailyEntries
                .filter((e) => (e as { reportText?: string }).reportText)
                .map((entry) => (
                  <div key={entry.id || entry.date}>
                    <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatDate(new Date(entry.date))} &middot; {DAY_TYPE_LABELS[entry.dayType]}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                      {(entry as { reportText?: string }).reportText}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Keine Tagesberichte vorhanden.</p>
          )
        ) : (
          <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {report.reportText || "Kein Berichtstext vorhanden."}
          </p>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tageseinträge</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {report.dailyEntries.map((entry) => (
            <div
              key={entry.id || entry.date}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatDate(new Date(entry.date))}
                </p>
                <p className="text-xs text-neutral-500">
                  {DAY_TYPE_LABELS[entry.dayType]}
                </p>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {entry.hours}h {entry.minutes}min
              </p>
            </div>
          ))}
        </div>
      </Card>

      {report.reviewComment && (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle>Letzter Prüfungskommentar</CardTitle>
          </CardHeader>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {report.reviewComment}
          </p>
        </Card>
      )}

      {report.status === "submitted" && (
        <Card>
          <CardHeader>
            <CardTitle>Prüfung</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <TextArea
              label="Kommentar (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Kommentar für den Azubi..."
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleReview("approved")}
                loading={actionLoading}
              >
                Genehmigen
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleReview("needs_revision")}
                loading={actionLoading}
              >
                Zurückgeben
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReview("rejected")}
                loading={actionLoading}
              >
                Ablehnen
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
