"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TraineeProgress {
  traineeId: string;
  traineeName: string;
  profession: string | null;
  totalReports: number;
  approved: number;
  submitted: number;
  draft: number;
  rejected: number;
  needsRevision: number;
  completionPercent: number;
  missingWeeks: { year: number; week: number }[];
}

export default function ProgressPage() {
  const [data, setData] = useState<TraineeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex min-h-[200px] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-stroke-base border-t-accent" /></div>;

  if (data.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-content-base">
          Ausbildungsfortschritt
        </h1>
        <p className="text-content-muted">Keine Auszubildenden zugeordnet.</p>
      </div>
    );
  }

  const totals = data.reduce(
    (acc, t) => ({
      approved: acc.approved + t.approved,
      submitted: acc.submitted + t.submitted,
      total: acc.total + t.totalReports,
      missing: acc.missing + t.missingWeeks.length,
    }),
    { approved: 0, submitted: 0, total: 0, missing: 0 }
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">
        Ausbildungsfortschritt
      </h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-content-muted">Auszubildende</p>
            <p className="text-2xl font-semibold text-content-base">{data.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-content-muted">Berichte gesamt</p>
            <p className="text-2xl font-semibold text-content-base">{totals.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-content-muted">Genehmigt</p>
            <p className="text-2xl font-semibold text-success">{totals.approved}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-content-muted">Fehlende Wochen</p>
            <p className="text-2xl font-semibold text-danger">{totals.missing}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {data.map((trainee) => (
          <Card key={trainee.traineeId}>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-content-base">
                    {trainee.traineeName}
                  </p>
                  {trainee.profession && (
                    <p className="text-sm text-content-muted">{trainee.profession}</p>
                  )}
                </div>
                <span className="text-lg font-semibold text-content-base">
                  {trainee.completionPercent}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-overlay">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${trainee.completionPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{trainee.approved} genehmigt</Badge>
                <Badge variant="warning">{trainee.submitted} eingereicht</Badge>
                <Badge variant="default">{trainee.draft} Entwürfe</Badge>
                {trainee.needsRevision > 0 && (
                  <Badge variant="info">{trainee.needsRevision} in Überarbeitung</Badge>
                )}
                {trainee.rejected > 0 && (
                  <Badge variant="danger">{trainee.rejected} abgelehnt</Badge>
                )}
              </div>

              {trainee.missingWeeks.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-danger">
                    Fehlende Wochen (letzte 12):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trainee.missingWeeks.map((w) => (
                      <span
                        key={`${w.year}-${w.week}`}
                        className="rounded bg-danger-soft px-2 py-0.5 text-xs text-danger"
                      >
                        KW {w.week}/{w.year}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
