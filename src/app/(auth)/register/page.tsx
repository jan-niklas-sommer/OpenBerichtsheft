"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

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
      <div className="w-full max-w-sm text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-content-base" />
        <h1 className="text-2xl font-semibold text-content-base">
          Registrierung erfolgreich
        </h1>
        <p className="mt-4 text-sm text-content-muted">
          Wir haben eine E-Mail an <strong className="text-content-base">{email}</strong> gesendet.
          Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
        </p>
        <p className="mt-2 text-xs text-content-subtle">
          Der Link ist 24 Stunden gültig.
        </p>
        <a href="/login" className="mt-6 inline-block text-sm text-accent underline">
          Zur Anmeldung
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-content-base" />
        <h1 className="text-2xl font-semibold text-content-base">
          Konto erstellen
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Registrieren Sie sich als Auszubildende(r)
        </p>
      </div>

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

      <div className="mt-6 text-center">
        <a href="/login" className="text-sm text-accent underline">
          Bereits ein Konto? Anmelden
        </a>
      </div>
    </div>
  );
}
