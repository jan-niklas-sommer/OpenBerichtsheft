"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Check } from "lucide-react";

export default function EinstellungenPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (newPassword !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    if (newPassword.length < 8) {
      setError("Neues Passwort muss mindestens 8 Zeichen haben");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Neues Passwort muss sich vom aktuellen unterscheiden");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler beim Ändern des Passworts");
        return;
      }
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-content-base">Einstellungen</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
          <div>
            <label htmlFor="current" className="mb-1.5 block text-sm font-medium text-content-base">
              Aktuelles Passwort
            </label>
            <div className="relative">
              <input
                id="current"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-md border border-stroke-base bg-surface-base px-3 py-2 pr-10 text-sm text-content-base placeholder:text-content-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-base"
                aria-label={showCurrent ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new" className="mb-1.5 block text-sm font-medium text-content-base">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                id="new"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-md border border-stroke-base bg-surface-base px-3 py-2 pr-10 text-sm text-content-base placeholder:text-content-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-base"
                aria-label={showNew ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-content-muted">Mindestens 8 Zeichen</p>
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-content-base">
              Neues Passwort bestätigen
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-stroke-base bg-surface-base px-3 py-2 text-sm text-content-base placeholder:text-content-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {saved && (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" />
              Passwort erfolgreich geändert
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Speichern..." : "Passwort ändern"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
