"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { UserData, AssignmentData, ProfessionData } from "@/types";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [professions, setProfessions] = useState<ProfessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ trainerId: "", professionId: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/assignments").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/professions").then((r) => r.json()),
    ]).then(([assignData, userData, profData]) => {
      setAssignments(assignData);
      setUsers(userData);
      setProfessions(profData);
      setLoading(false);
    });
  }, []);

  const trainers = users.filter((u) => u.role === "trainer" && !u.deactivatedAt);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const assignment = await res.json();
      setAssignments((prev) => [assignment, ...prev]);
      setForm({ trainerId: "", professionId: "" });
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return <div className="text-neutral-500">Laden...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Zuordnungen
      </h1>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Ausbilder"
              value={form.trainerId}
              onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
              options={[
                { value: "", label: "Bitte wählen..." },
                ...trainers.map((t) => ({ value: t.id, label: `${t.name} (${t.email})` })),
              ]}
            />
            <Select
              label="Ausbildungsberuf"
              value={form.professionId}
              onChange={(e) => setForm({ ...form, professionId: e.target.value })}
              options={[
                { value: "", label: "Bitte wählen..." },
                ...professions.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button type="submit">Zuordnung erstellen</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {assignments.map((a) => (
          <Card key={a.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {a.trainer?.name} → {a.profession?.name}
              </p>
              <p className="text-sm text-neutral-500">
                Ausbilder: {a.trainer?.email}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
              Entfernen
            </Button>
          </Card>
        ))}
        {assignments.length === 0 && (
          <p className="text-neutral-500">Keine Zuordnungen vorhanden.</p>
        )}
      </div>
    </div>
  );
}
