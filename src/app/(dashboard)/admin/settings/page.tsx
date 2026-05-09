"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default function AdminSettingsPage() {
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.workingDays) setWorkingDays(data.workingDays);
        setLoading(false);
      });
  }, []);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workingDays }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) return <div className="text-content-muted">Laden...</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">
        Einstellungen
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Arbeitstage</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-content-muted">
          Wählen Sie die Standard-Arbeitstage. Nicht-Arbeitstage werden beim Anlegen eines
          Wochenberichts automatisch mit 0 Stunden und als freier Tag (&bdquo;&ndash;&ldquo;) vorbelegt.
        </p>

        <div className="flex flex-wrap gap-3">
          {DAY_NAMES.map((name, index) => (
            <button
              key={index}
              onClick={() => toggleDay(index)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                workingDays.includes(index)
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-stroke-subtle bg-surface-base text-content-muted hover:border-stroke-base"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            Speichern
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="h-3 w-3" /> Gespeichert
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
