"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyRound, Eye, EyeOff, Users, Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/utils";
import type { UserData, ProfessionData } from "@/types";

interface UserWithProfession extends UserData {
  profession?: { id: string; name: string } | null;
  anonymizedAt?: string | null;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithProfession[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmAnonymize, setConfirmAnonymize] = useState<UserWithProfession | null>(null);
  const [professions, setProfessions] = useState<ProfessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "trainee" as string, password: "", professionId: "", trainingStartDate: "" });
  const [formError, setFormError] = useState("");

  const [resetTarget, setResetTarget] = useState<UserWithProfession | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const closeReset = () => {
    setResetTarget(null);
    setResetPassword("");
    setResetMsg("");
    setResetErr("");
    setShowResetPw(false);
  };

  const handleSetPassword = async () => {
    if (!resetTarget) return;
    setResetErr("");
    setResetMsg("");
    setResetLoading(true);
    const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    setResetLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResetMsg(data.message || "Passwort geändert.");
      setResetPassword("");
    } else {
      setResetErr(data.error || "Fehler beim Ändern des Passworts.");
    }
  };

  const handleSendResetEmail = async () => {
    if (!resetTarget) return;
    setResetErr("");
    setResetMsg("");
    setResetLoading(true);
    const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendEmail: true }),
    });
    setResetLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResetMsg(data.message || "Reset-Mail versendet.");
    } else {
      setResetErr(data.error || "Fehler beim Versenden der Reset-Mail.");
    }
  };

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
      toast("Benutzer erstellt");
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
    const res = await fetch(`/api/users/${user.id}/anonymize`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
      toast("Benutzer anonymisiert");
    } else {
      const data = await res.json();
      toast(data.error || "Fehler beim Anonymisieren", "error");
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    const matchesSearch = !search || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <SkeletonList />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-content-base">
          Benutzerverwaltung
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Abbrechen" : "Benutzer erstellen"}
        </Button>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Benutzer suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base"
        >
          <option value="">Alle Rollen</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
                  <div className="w-full">
                    <label className="mb-1.5 block text-sm font-medium text-content-muted">
                      Eintrittsdatum
                    </label>
                    <DatePicker
                      value={form.trainingStartDate}
                      onChange={(v) => setForm({ ...form, trainingStartDate: v })}
                      placeholder="Datum wählen"
                    />
                  </div>
                </>
              )}
            </div>
            {formError && <p className="text-sm text-danger">{formError}</p>}
            <Button type="submit">Erstellen</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {filteredUsers.length === 0 && (
          <EmptyState
            icon={Users}
            title="Keine Benutzer gefunden"
            description={search ? "Keine Treffer für deine Suche." : "Erstelle den ersten Benutzer."}
          />
        )}
        {filteredUsers.map((user) => (
          <Card key={user.id} className="flex items-center justify-between">
            <div>
               <p className="font-medium text-content-base">
                  {user.name}
                </p>
               <p className="text-sm text-content-muted">
                 {user.email}
                 {user.profession?.name && (
                   <> &middot; {user.profession.name}</>
                 )}
               </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default">
                {ROLE_LABELS[user.role]}
              </Badge>
              {user.anonymizedAt ? (
                <Badge variant="danger">Anonymisiert — unwiderruflich</Badge>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResetTarget(user);
                      setResetMsg("");
                      setResetErr("");
                      setResetPassword("");
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                    Passwort
                  </Button>
                  {user.deactivatedAt && user.role === "trainee" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAnonymize(user)}
                      className="text-danger"
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

      {resetTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeReset(); }}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-stroke-subtle bg-surface-elevated p-6 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-semibold text-content-base">
              Passwort zurücksetzen
            </h3>
            <p className="mb-4 text-sm text-content-muted">
              Für <strong className="text-content-base">{resetTarget.name}</strong> ({resetTarget.email})
            </p>

            {resetMsg ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
                  {resetMsg}
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={closeReset}>
                    Schließen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="admin-new-password" className="mb-1.5 block text-sm font-medium text-content-muted">
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <input
                      id="admin-new-password"
                      type={showResetPw ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Mindestens 8 Zeichen"
                      minLength={8}
                      autoComplete="new-password"
                      className="h-10 w-full rounded-lg border border-stroke-base bg-surface-base px-3 pr-10 text-sm text-content-base placeholder:text-content-subtle focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPw(!showResetPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-content-subtle transition-colors hover:text-content-muted"
                      aria-label={showResetPw ? "Passwort verbergen" : "Passwort anzeigen"}
                    >
                      {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {resetErr && (
                  <div className="rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
                    {resetErr}
                  </div>
                )}

                <Button
                  className="w-full"
                  loading={resetLoading}
                  disabled={resetPassword.length < 8}
                  onClick={handleSetPassword}
                >
                  Neues Passwort setzen
                </Button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-stroke-subtle" />
                  <span className="text-xs text-content-subtle">oder</span>
                  <div className="h-px flex-1 bg-stroke-subtle" />
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  loading={resetLoading}
                  onClick={handleSendResetEmail}
                >
                  Reset-Link per E-Mail senden
                </Button>

                <div className="flex justify-end border-t border-stroke-subtle pt-3">
                  <Button variant="ghost" size="sm" onClick={closeReset}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAnonymize}
        title="Benutzer anonymisieren"
        description={`"${confirmAnonymize?.name}" wird dauerhaft anonymisiert. Name und E-Mail werden durch Platzhalter ersetzt. Berichte bleiben erhalten. Dies ist unwiderruflich — der Benutzer kann nicht wiederhergestellt werden.`}
        confirmLabel="Anonymisieren"
        onConfirm={() => {
          if (confirmAnonymize) handleAnonymize(confirmAnonymize);
          setConfirmAnonymize(null);
        }}
        onCancel={() => setConfirmAnonymize(null)}
      />
    </div>
  );
}
