"use client";

import Link from "next/link";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLockup } from "@/components/layout/brand-lockup";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

type AlertTone = "success" | "info" | "warning" | "danger";

const ALERT_STYLES: Record<AlertTone, string> = {
  success: "border-success/25 bg-success-soft text-success",
  info: "border-info/25 bg-info-soft text-info",
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
};

const ALERT_ICONS: Record<AlertTone, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
};

function Alert({
  tone,
  children,
}: {
  tone: AlertTone;
  children: React.ReactNode;
}) {
  const Icon = ALERT_ICONS[tone];
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${ALERT_STYLES[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const searchParams = useSearchParams();

  const verified = searchParams.get("verified");
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setResendSuccess(false);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "EmailNotVerified") {
        setError("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");
        setUnverifiedEmail(email);
      } else {
        setError("Ungültige Anmeldedaten");
      }
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendSuccess(false);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResendSuccess(true);
  };

  return (
    <div className="w-full max-w-sm">
      <Card className="space-y-6 p-8 shadow-md hover:border-stroke-subtle">
        <BrandLockup />

        {verified === "success" && (
          <Alert tone="success">
            E-Mail erfolgreich verifiziert! Sie können sich jetzt anmelden.
          </Alert>
        )}

        {verified === "already" && (
          <Alert tone="info">E-Mail bereits verifiziert. Melden Sie sich an.</Alert>
        )}

        {urlError === "token_expired" && (
          <Alert tone="warning">
            Der Verifizierungslink ist abgelaufen. Bitte fordern Sie einen neuen an.
          </Alert>
        )}

        {urlError === "invalid_token" && (
          <Alert tone="danger">Ungültiger Verifizierungslink.</Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@firma.de"
            required
            autoComplete="email"
          />
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="passwort"
                className="block text-sm font-medium text-content-muted"
              >
                Passwort
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent underline underline-offset-2 hover:opacity-80"
              >
                Passwort vergessen?
              </Link>
            </div>
            <div className="relative">
              <input
                id="passwort"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          {error && (
            <Alert tone="danger">
              <p>{error}</p>
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="mt-1.5 inline-flex items-center gap-1 rounded text-sm font-medium underline underline-offset-2 hover:opacity-80"
                >
                  Verifizierung erneut senden
                </button>
              )}
              {resendSuccess && (
                <p className="mt-1.5 text-success">
                  E-Mail gesendet! Prüfen Sie Ihren Posteingang.
                </p>
              )}
            </Alert>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Anmelden
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-content-muted">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-medium text-accent underline underline-offset-2 hover:opacity-80"
        >
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
