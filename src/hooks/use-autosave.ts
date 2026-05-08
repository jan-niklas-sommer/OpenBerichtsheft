"use client";

import { useEffect, useState, useRef } from "react";

export function useAutosave<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const pendingDataRef = useRef<T | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    dataRef.current = data;
    onSaveRef.current = onSave;
  });

  const executeSave = async (dataToSave: T) => {
    if (inFlightRef.current) {
      pendingDataRef.current = dataToSave;
      return;
    }
    inFlightRef.current = true;
    setSaveStatus("saving");
    try {
      await onSaveRef.current(dataToSave);
      setSaveStatus("saved");
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      inFlightRef.current = false;
      if (pendingDataRef.current !== null) {
        const pending = pendingDataRef.current;
        pendingDataRef.current = null;
        executeSave(pending);
      }
    }
  };

  const save = (dataToSave?: T) => {
    executeSave(dataToSave ?? dataRef.current);
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => executeSave(data), delay);
    return () => {
      clearTimeout(timeoutRef.current!);
    };
  }, [data, delay]);

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  return { saveStatus, save };
}
