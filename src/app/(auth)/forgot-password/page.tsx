"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { AlertCircle, MailCheck, type LucideIcon } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (res.status === 429) {
      setError("Zu viele Anfragen. Bitte später erneut versuchen.");
      return;
    }
    if (!res.ok) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    setDone(true);
  };

  return (
    <div className="w-full max-w-sm">
      <Card className="space-y-6 p-8 shadow-md hover:border-stroke-subtle">
        <BrandLockup showClaim={false} />

        {done ? (
          <ResultState
            icon={MailCheck}
            title="Anfrage gesendet"
            text="Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen Ihres Passworts gesendet. Prüfen Sie Ihren Posteingang."
          />
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-content-base">
                Passwort vergessen?
              </h2>
              <p className="mt-1 text-sm text-content-muted">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link,
                um ein neues Passwort zu vergeben.
              </p>
            </div>

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
                Link anfordern
              </Button>
            </form>
          </>
        )}
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

function ResultState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Icon className="h-8 w-8 text-success" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold text-content-base">{title}</h2>
      <p className="text-sm text-content-muted">{text}</p>
    </div>
  );
}
