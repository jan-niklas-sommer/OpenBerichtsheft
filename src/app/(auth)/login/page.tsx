"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Ungültige Anmeldedaten");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Shield className="mx-auto mb-4 h-10 w-10 text-neutral-900 dark:text-neutral-100" />
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          OpenBerichtsheft
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Melden Sie sich an, um fortzufahren
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
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Anmelden
        </Button>
      </form>
    </div>
  );
}
