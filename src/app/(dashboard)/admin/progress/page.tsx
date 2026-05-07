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

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  if (data.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Ausbildungsfortschritt
        </h1>
        <p className="text-neutral-500">Keine Auszubildenden zugeordnet.</p>
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
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Ausbildungsfortschritt
      </h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Auszubildende</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{data.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Berichte gesamt</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{totals.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Genehmigt</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{totals.approved}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-neutral-500">Fehlende Wochen</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{totals.missing}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {data.map((trainee) => (
          <Card key={trainee.traineeId}>
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {trainee.traineeName}
                  </p>
                  {trainee.profession && (
                    <p className="text-sm text-neutral-500">{trainee.profession}</p>
                  )}
                </div>
                <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {trainee.completionPercent}%
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
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
                  <p className="mb-1 text-sm font-medium text-red-600 dark:text-red-400">
                    Fehlende Wochen (letzte 12):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trainee.missingWeeks.map((w) => (
                      <span
                        key={`${w.year}-${w.week}`}
                        className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-400"
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
