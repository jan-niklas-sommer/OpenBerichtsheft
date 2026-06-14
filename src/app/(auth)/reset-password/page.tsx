"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <Card className="space-y-6 p-8 text-center shadow-md hover:border-stroke-subtle">
          <BrandLockup showClaim={false} />
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-left text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>
              Dieser Link ist ungültig. Bitte fordern Sie einen neuen Link zur
              Passwort-Wiederherstellung an.
            </span>
          </div>
          <a
            href="/forgot-password"
            className="inline-block text-sm font-medium text-accent underline underline-offset-2 hover:opacity-80"
          >
            Neuen Link anfordern
          </a>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (res.status === 429) {
      setError("Zu viele Anfragen. Bitte später erneut versuchen.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error ||
          "Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.",
      );
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="w-full max-w-sm">
        <Card className="space-y-6 p-8 shadow-md hover:border-stroke-subtle">
          <BrandLockup showClaim={false} />
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-content-base">
              Passwort geändert
            </h2>
            <p className="text-sm text-content-muted">
              Ihr Passwort wurde erfolgreich aktualisiert. Sie können sich jetzt
              mit dem neuen Passwort anmelden.
            </p>
          </div>
          <a
            href="/login"
            className="block text-center text-sm font-medium text-accent underline underline-offset-2 hover:opacity-80"
          >
            Zur Anmeldung
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Card className="space-y-6 p-8 shadow-md hover:border-stroke-subtle">
        <BrandLockup showClaim={false} />

        <div className="text-center">
          <h2 className="text-lg font-semibold text-content-base">
            Neues Passwort vergeben
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            Wählen Sie ein neues Passwort für Ihr Konto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="neues-passwort"
              className="mb-1.5 block text-sm font-medium text-content-muted"
            >
              Neues Passwort
            </label>
            <div className="relative">
              <input
                id="neues-passwort"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-10 w-full rounded-lg border border-stroke-base bg-surface-base px-3 pr-10 text-sm text-content-base placeholder:text-content-subtle focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-content-subtle transition-colors hover:text-content-muted"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Input
            label="Passwort bestätigen"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Passwort wiederholen"
            required
            minLength={8}
            autoComplete="new-password"
          />

          {error && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Passwort speichern
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-content-muted">
        <a
          href="/login"
          className="font-medium text-accent underline underline-offset-2 hover:opacity-80"
        >
          Zurück zur Anmeldung
        </a>
      </p>
    </div>
  );
}
