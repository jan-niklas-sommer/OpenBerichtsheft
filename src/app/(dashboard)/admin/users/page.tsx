"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/utils";
import type { UserData, ProfessionData } from "@/types";

interface UserWithProfession extends UserData {
  profession?: { id: string; name: string } | null;
  anonymizedAt?: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithProfession[]>([]);
  const [professions, setProfessions] = useState<ProfessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "trainee" as string, password: "", professionId: "", trainingStartDate: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
    fetch("/api/professions")
      .then((r) => r.json())
      .then((data) => setProfessions(data));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [user, ...prev]);
      setShowForm(false);
      setForm({ email: "", name: "", role: "trainee", password: "", professionId: "", trainingStartDate: "" });
    } else {
      const data = await res.json();
      setFormError(data.error || "Fehler beim Erstellen");
    }
  };

  const handleToggleActive = async (user: UserWithProfession) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deactivatedAt: user.deactivatedAt ? null : new Date(),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    }
  };

  const handleAnonymize = async (user: UserWithProfession) => {
    if (!confirm(`"${user.name}" wirklich anonymisieren? Dies kann nicht rückgängig gemacht werden.`)) return;
    const res = await fetch(`/api/users/${user.id}/anonymize`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } else {
      const data = await res.json();
      alert(data.error || "Fehler beim Anonymisieren");
    }
  };

  if (loading) {
    return <div className="text-neutral-500">Laden...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Benutzerverwaltung
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "Benutzer erstellen"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="E-Mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Select
                label="Rolle"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={Object.entries(ROLE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Input
                label="Passwort"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
              {form.role === "trainee" && (
                <>
                  <Select
                    label="Ausbildungsberuf"
                    value={form.professionId}
                    onChange={(e) => setForm({ ...form, professionId: e.target.value })}
                    options={[
                      { value: "", label: "— Kein Beruf —" },
                      ...professions.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                  <Input
                    label="Eintrittsdatum"
                    type="date"
                    value={form.trainingStartDate}
                    onChange={(e) => setForm({ ...form, trainingStartDate: e.target.value })}
                  />
                </>
              )}
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <Button type="submit">Erstellen</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} className="flex items-center justify-between">
            <div>
               <p className="font-medium text-neutral-900 dark:text-neutral-100">
                 {user.name}
               </p>
               <p className="text-sm text-neutral-500">
                 {user.email}
                 {user.profession?.name && (
                   <> &middot; {user.profession.name}</>
                 )}
               </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.deactivatedAt ? "danger" : "success"}>
                {ROLE_LABELS[user.role]}
              </Badge>
              {user.anonymizedAt ? (
                <Badge variant="danger">Anonymisiert</Badge>
              ) : (
                <>
                  <Badge variant={user.deactivatedAt ? "danger" : "success"}>
                    {user.deactivatedAt ? "Inaktiv" : "Aktiv"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.deactivatedAt ? "Aktivieren" : "Deaktivieren"}
                  </Button>
                  {user.deactivatedAt && user.role === "trainee" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnonymize(user)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Anonymisieren
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
