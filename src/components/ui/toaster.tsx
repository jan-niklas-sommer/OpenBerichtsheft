"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TONE_STYLES: Record<ToastTone, { box: string; icon: typeof CheckCircle2 }> = {
  success: { box: "border-success/25 bg-success-soft text-success", icon: CheckCircle2 },
  error: { box: "border-danger/25 bg-danger-soft text-danger", icon: AlertCircle },
  info: { box: "border-info/25 bg-info-soft text-info", icon: Info },
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((t) => {
              const { box, icon: Icon } = TONE_STYLES[t.tone];
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${box}`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-content-base">{t.message}</span>
                  <button
                    onClick={() => remove(t.id)}
                    className="shrink-0 rounded p-0.5 text-content-muted hover:text-content-base"
                    aria-label="Schließen"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
