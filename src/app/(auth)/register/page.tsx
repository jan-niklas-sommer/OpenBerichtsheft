"use client";

import Link from "next/link";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BrandLockup } from "@/components/layout/brand-lockup";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registrierung fehlgeschlagen");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <Card className="space-y-4 p-8 text-center shadow-md hover:border-stroke-subtle">
          <BrandLockup showClaim={false} />
          <p className="text-sm text-content-muted">
            Wir haben eine E-Mail an{" "}
            <strong className="text-content-base">{email}</strong> gesendet.
            Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu
            aktivieren.
          </p>
          <p className="text-xs text-content-subtle">
            Der Link ist 24 Stunden gültig.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-accent underline underline-offset-2 hover:opacity-80"
          >
            Zur Anmeldung
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Card className="space-y-6 p-8 shadow-md hover:border-stroke-subtle">
        <BrandLockup showClaim={false} />

        <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Max Mustermann"
          required
        />
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
          placeholder="Mindestens 8 Zeichen"
          required
          minLength={8}
          autoComplete="new-password"
        />

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Registrieren
        </Button>
      </form>
      </Card>

      <p className="mt-6 text-center text-sm text-content-muted">
        Bereits ein Konto?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline underline-offset-2 hover:opacity-80"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
