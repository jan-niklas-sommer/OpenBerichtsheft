"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Download, FileText } from "lucide-react";

type DateRange = { from: string; to: string };

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

const QUICK_RANGES: { label: string; getRange: () => DateRange }[] = [
  {
    label: "Letzter Monat",
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toDateStr(from), to: toDateStr(to) };
    },
  },
  {
    label: "Letzte 3 Monate",
    getRange: () => {
      const now = new Date();
      const from = addMonths(now, -3);
      return { from: toDateStr(from), to: toDateStr(now) };
    },
  },
  {
    label: "Letztes Jahr",
    getRange: () => {
      const now = new Date();
      return {
        from: toDateStr(new Date(now.getFullYear() - 1, 0, 1)),
        to: toDateStr(new Date(now.getFullYear() - 1, 11, 31)),
      };
    },
  },
  {
    label: "Gesamte Historie",
    getRange: () => ({
      from: "2020-01-01",
      to: toDateStr(new Date()),
    }),
  },
];

export default function ExportPage() {
  const [from, setFrom] = useState(() => QUICK_RANGES[1].getRange().from);
  const [to, setTo] = useState(() => QUICK_RANGES[1].getRange().to);
  const [selectedRange, setSelectedRange] = useState(1);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!from || !to) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError("");
      }
    });
    const params = new URLSearchParams({ from, to });
    fetch(`/api/reports/count?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCount(data.count ?? 0);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCount(0);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [from, to]);

  const displayCount = from && to ? count : null;

  const handleDownload = async () => {
    if (!from || !to) return;
    setDownloading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`/api/reports/export?${params}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Export");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `berichtsheft_${from}_${to}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Netzwerkfehler beim Download");
    } finally {
      setDownloading(false);
    }
  };

  const applyQuickRange = (getRange: () => DateRange, index: number) => {
    const range = getRange();
    setFrom(range.from);
    setTo(range.to);
    setSelectedRange(index);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">PDF-Export</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Berichte exportieren
          </CardTitle>
        </CardHeader>
        <div className="space-y-6 p-6 pt-0">
          <div>
            <p className="mb-3 text-sm text-content-muted">Zeitraum wählen</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Zeitraum">
              {QUICK_RANGES.map((r, i) => (
                <Button
                  key={r.label}
                  variant={selectedRange === i ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => applyQuickRange(r.getRange, i)}
                  role="radio"
                  aria-checked={selectedRange === i}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="from" className="mb-1.5 block text-sm font-medium text-content-base">
                Von
              </label>
              <input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-md border border-stroke-base bg-surface-base px-3 py-2 text-sm text-content-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="to" className="mb-1.5 block text-sm font-medium text-content-base">
                Bis
              </label>
              <input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border border-stroke-base bg-surface-base px-3 py-2 text-sm text-content-base focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {from && to && (
            <div className="rounded-md border border-stroke-subtle bg-surface-elevated p-4">
              <div className="flex items-center gap-2 text-sm text-content-muted">
                <CalendarDays className="h-4 w-4" />
                {loading ? (
                  "Lade..."
                ) : displayCount !== null ? (
                  <span>
                    <strong className="text-content-base">{displayCount}</strong>{" "}
                    {displayCount === 1 ? "Bericht" : "Berichte"} im gewählten Zeitraum
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={handleDownload}
            disabled={!from || !to || displayCount === 0 || downloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Exportiere..." : "Als PDF herunterladen"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
