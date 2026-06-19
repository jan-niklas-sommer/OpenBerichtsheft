"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Trash2, UserCheck } from "lucide-react";
import type { UserData, AssignmentData, ProfessionData } from "@/types";

export default function AssignmentsPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [professions, setProfessions] = useState<ProfessionData[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<AssignmentData | null>(null);
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
      toast("Zuordnung erstellt");
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast("Zuordnung gelöscht");
    }
  };

  if (loading) {
    return <SkeletonList count={4} />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">
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
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <Button type="submit">Zuordnung erstellen</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {assignments.length === 0 && (
          <Card>
            <EmptyState
              icon={UserCheck}
              title="Noch keine Zuordnungen"
              description="Ordne Ausbilder zu Ausbildungsberufen zu, damit sie Berichte prüfen können."
            />
          </Card>
        )}
        {Object.entries(
          assignments.reduce<Record<string, typeof assignments>>((acc, a) => {
            const key = a.trainer?.id || "unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(a);
            return acc;
          }, {}),
        ).map(([trainerId, trainerAssignments]) => (
          <div key={trainerId}>
            <h3 className="mb-2 text-sm font-semibold text-content-base">
              {trainerAssignments[0].trainer?.name}
            </h3>
            <div className="space-y-2">
              {trainerAssignments.map((a) => (
                <Card key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{a.profession?.name}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(a)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Zuordnung löschen"
        description={`${confirmDelete?.trainer?.name} → ${confirmDelete?.profession?.name} wird entfernt.`}
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
