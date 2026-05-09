"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";

interface ProfessionWithCount {
  id: string;
  name: string;
  createdAt: string;
  _count: { users: number };
}

export default function ProfessionsPage() {
  const [professions, setProfessions] = useState<ProfessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [formError, setFormError] = useState("");

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
    setFormError("");
    const res = await fetch("/api/professions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName }),
    });
    if (res.ok) {
      const profession = await res.json();
      setProfessions((prev) => [...prev, { ...profession, _count: { users: 0 } }]);
      setShowForm(false);
      setFormName("");
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler beim Erstellen");
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
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/professions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProfessions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return <div className="text-content-muted">Laden...</div>;
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
              label="Bezeichnung"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="z.B. Fachinformatiker für Anwendungsentwicklung"
              required
            />
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit">Anlegen</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {professions.length === 0 && (
          <p className="text-content-muted">Noch keine Ausbildungsberufe angelegt.</p>
        )}
        {professions.map((profession) => (
          <Card key={profession.id} className="flex items-center justify-between">
            {editingId === profession.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(profession.id);
                }}
                className="flex flex-1 items-center gap-3"
              >
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  required
                />
                <Button type="submit" size="sm">
                  Speichern
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingId(null)}
                >
                  Abbrechen
                </Button>
              </form>
            ) : (
              <>
                <div>
                  <p className="font-medium text-content-base">
                    {profession.name}
                  </p>
                  <p className="text-sm text-content-muted">
                    {profession._count.users}{" "}
                    {profession._count.users === 1 ? "Auszubildende(r)" : "Auszubildende"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{profession._count.users} zugeordnet</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(profession.id);
                      setEditingName(profession.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(profession.id)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
