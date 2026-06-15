"use client";

import { useEffect, useState, useRef } from "react";

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;
const SAVED_TO_IDLE_MS = 2000;

export function useAutosave<T>(
  data: T | null | undefined,
  onSave: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingDataRef = useRef<T | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T | null>(null);
  const onSaveRef = useRef(onSave);
  const lastSeenHashRef = useRef<string>("");
  const mountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dataRef.current = data ?? null;
    onSaveRef.current = onSave;
  });

  const markSaved = () => {
    if (!mountedRef.current) return;
    setSaveStatus("saved");
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setSaveStatus("idle");
    }, SAVED_TO_IDLE_MS);
  };

  const saveWithRetry = async (dataToSave: T, attempt: number): Promise<void> => {
    if (!mountedRef.current) return;
    setSaveStatus("saving");
    try {
      await onSaveRef.current(dataToSave);
      markSaved();
    } catch {
      if (!mountedRef.current) return;
      setSaveStatus("error");
      if (attempt < MAX_RETRIES) {
        await new Promise<void>((resolve) => {
          retryTimerRef.current = setTimeout(resolve, RETRY_BASE_MS * Math.pow(2, attempt));
        });
        if (!mountedRef.current) return;
        return saveWithRetry(dataToSave, attempt + 1);
      }
    }
  };

  const executeSave = async (dataToSave: T) => {
    if (inFlightRef.current) {
      pendingDataRef.current = dataToSave;
      return;
    }
    inFlightRef.current = true;
    try {
      await saveWithRetry(dataToSave, 0);
    } finally {
      inFlightRef.current = false;
      if (pendingDataRef.current !== null) {
        const pending = pendingDataRef.current;
        pendingDataRef.current = null;
        await executeSave(pending);
      }
    }
  };

  const save = (dataToSave?: T) => {
    if (dataToSave) {
      executeSave(dataToSave);
    } else if (dataRef.current) {
      executeSave(dataRef.current);
    }
  };

  useEffect(() => {
    if (data == null) return;
    // Deep-Compare: kein Save planen, wenn der Inhalt identisch zum letzten
    // eingereichten Stand ist (verhindert Saves bei reiner Referenz-Änderung).
    const hash = JSON.stringify(data);
    if (hash === lastSeenHashRef.current) return;
    lastSeenHashRef.current = hash;

    const d = data;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => executeSave(d), delay);
    return () => {
      clearTimeout(timeoutRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, delay]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  return { saveStatus, save };
}
