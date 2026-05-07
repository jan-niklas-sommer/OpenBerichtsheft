"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        setSession(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { data: session, status: loading ? "loading" : session ? "authenticated" : "unauthenticated" };
}
