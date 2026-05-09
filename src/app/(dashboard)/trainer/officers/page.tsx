"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfficerAssignment {
  id: string;
  traineeId: string;
  trainingOfficerId: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  trainee: { id: string; name: string; email: string };
  trainingOfficer: { id: string; name: string; email: string };
}

interface Trainee {
  id: string;
  name: string;
  email: string;
}

interface Officer {
  id: string;
  name: string;
  email: string;
}

export default function TrainerOfficersPage() {
  const [assignments, setAssignments] = useState<OfficerAssignment[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    traineeId: "",
    trainingOfficerId: "",
    validFrom: "",
    validUntil: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/officer-assignments").then((r) => r.json()),
      fetch("/api/users?role=trainee").then((r) => r.json()),
      fetch("/api/users?role=training_officer").then((r) => r.json()),
    ]).then(([assignData, traineeData, officerData]) => {
      setAssignments(assignData);
      setTrainees(traineeData);
      setOfficers(officerData);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/officer-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newAssignment = await res.json();
      setAssignments((prev) => [newAssignment, ...prev]);
      setShowForm(false);
      setForm({ traineeId: "", trainingOfficerId: "", validFrom: "", validUntil: "" });
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler beim Erstellen");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/officer-assignments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE");

  const isActive = (a: OfficerAssignment) => {
    const now = new Date();
    return new Date(a.validFrom) <= now && new Date(a.validUntil) >= now;
  };

  if (loading) return <div className="text-neutral-500">Laden...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Ausbildungsbeauftragte
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "Zuordnung erstellen"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Neue Zuordnung</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Auszubildende(r)
              </label>
              <select
                value={form.traineeId}
                onChange={(e) => setForm({ ...form, traineeId: e.target.value })}
                required
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">Auswählen...</option>
                {trainees.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ausbildungsbeauftragte(r)
              </label>
              <select
                value={form.trainingOfficerId}
                onChange={(e) => setForm({ ...form, trainingOfficerId: e.target.value })}
                required
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">Auswählen...</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Gültig von
                </label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  required
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Gültig bis
                </label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  required
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <Button type="submit">Zuordnung erstellen</Button>
          </form>
        </Card>
      )}

      {assignments.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-neutral-500">
            Keine Zuordnungen vorhanden. Erstellen Sie eine neue Zuordnung.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {a.trainee.name}
                </p>
                <p className="text-sm text-neutral-500">
                  Beauftragte(r): {a.trainingOfficer.name}
                </p>
                <p className="text-sm text-neutral-500">
                  {formatDate(a.validFrom)} – {formatDate(a.validUntil)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isActive(a) ? "success" : "default"}>
                  {isActive(a) ? "Aktiv" : "Abgelaufen"}
                </Badge>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(a.id)}
                >
                  Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
