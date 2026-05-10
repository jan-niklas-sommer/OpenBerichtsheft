"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <div className="mb-8 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-content-base" />
        <h1 className="text-2xl font-semibold text-content-base">
          OpenBerichtsheft
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Melden Sie sich an, um fortzufahren
        </p>
      </div>

      {verified === "success" && (
        <div className="mb-4 rounded-lg border border-success-soft bg-success-soft px-4 py-3 text-sm text-success">
          E-Mail erfolgreich verifiziert! Sie können sich jetzt anmelden.
        </div>
      )}

      {verified === "already" && (
        <div className="mb-4 rounded-lg border border-info-soft bg-info-soft px-4 py-3 text-sm text-info">
          E-Mail bereits verifiziert. Melden Sie sich an.
        </div>
      )}

      {urlError === "token_expired" && (
        <div className="mb-4 rounded-lg border border-warning-soft bg-warning-soft px-4 py-3 text-sm text-warning">
          Der Verifizierungslink ist abgelaufen. Bitte fordern Sie einen neuen an.
        </div>
      )}

      {urlError === "invalid_token" && (
        <div className="mb-4 rounded-lg border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger">
          Ungültiger Verifizierungslink.
        </div>
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
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        {error && (
          <div>
            <p className="text-sm text-danger">{error}</p>
            {unverifiedEmail && (
              <button
                type="button"
                onClick={handleResend}
                className="mt-1 text-sm text-accent underline"
              >
                Verifizierung erneut senden
              </button>
            )}
            {resendSuccess && (
              <p className="mt-1 text-sm text-success">
                E-Mail gesendet! Prüfen Sie Ihren Posteingang.
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Anmelden
        </Button>
      </form>

      <div className="mt-6 text-center">
        <a href="/register" className="text-sm text-accent underline">
          Neues Konto erstellen
        </a>
      </div>
    </div>
  );
}
