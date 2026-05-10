"use client";

import { useEffect, useState } from "react";
import { Session } from "next-auth";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        setSession(s);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { data: session, status: loading ? "loading" : session ? "authenticated" : "unauthenticated" };
}
