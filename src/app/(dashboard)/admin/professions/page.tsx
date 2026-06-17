"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Trash2, Pencil, Briefcase } from "lucide-react";

interface ProfessionWithCount {
  id: string;
  name: string;
  createdAt: string;
  _count?: { users: number };
}

export default function ProfessionsPage() {
  const [professions, setProfessions] = useState<ProfessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ProfessionWithCount | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/professions")
      .then((r) => r.json())
      .then((data) => {
        setProfessions(data);
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/professions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const profession = await res.json();
      setProfessions((prev) => [...prev, profession]);
      setName("");
      setShowForm(false);
      toast("Beruf angelegt");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler");
    }
  };

  const handleUpdate = async (id: string) => {
    const res = await fetch(`/api/professions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProfessions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: updated.name } : p))
      );
      setEditingId(null);
      setEditingName("");
      toast("Beruf aktualisiert");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/professions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProfessions((prev) => prev.filter((p) => p.id !== id));
      toast("Beruf gelöscht");
    }
  };

  if (loading) {
    return <SkeletonList count={3} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-content-base">
          Ausbildungsberufe
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "Beruf anlegen"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Berufsbezeichnung"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Fachinformatiker für Anwendungsentwicklung"
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit">Anlegen</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {professions.length === 0 && !showForm && (
          <Card>
            <EmptyState
              icon={Briefcase}
              title="Noch keine Ausbildungsberufe"
              description="Lege Berufe an, um Auszubildende und Ausbilder zuzuordnen."
              action={<Button size="sm" onClick={() => setShowForm(true)}>Beruf anlegen</Button>}
            />
          </Card>
        )}
        {professions.map((p) => (
          <Card key={p.id} className="flex items-center justify-between">
            {editingId === p.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={() => handleUpdate(p.id)}>Speichern</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Abbrechen</Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="font-medium text-content-base">{p.name}</p>
                  <p className="text-sm text-content-muted">
                    {p._count?.users || 0} zugeordnet
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setEditingName(p.name); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(p)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Beruf löschen"
        description={`"${confirmDelete?.name}" wird entfernt. Bestehende Zuordnungen bleiben unbeeinflusst.`}
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
