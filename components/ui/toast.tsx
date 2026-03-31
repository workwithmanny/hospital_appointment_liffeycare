"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
export type ToastKind = "success" | "error" | "info";
export type ToastAction = {
  label: string;
  onClick: () => void;
};
export type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  createdAt: number;
  ttlMs: number;
  action?: ToastAction;
};
type ToastContextValue = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};
const ToastContext = createContext<ToastContextValue | null>(null);
function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const clear = useCallback(() => setToasts([]), []);
  const push = useCallback(
    (t: Omit<Toast, "id" | "createdAt">) => {
      const id = randomId();
      const toast: Toast = {
        id,
        createdAt: Date.now(),
        ttlMs: t.ttlMs,
        kind: t.kind,
        title: t.title,
        message: t.message,
        action: t.action,
      };
      setToasts((prev) => [toast, ...prev].slice(0, 5));
      window.setTimeout(() => dismiss(id), toast.ttlMs);
    },
    [dismiss],
  );
  const value = useMemo(
    () => ({ toasts, push, dismiss, clear }),
    [toasts, push, dismiss, clear],
  );
  return (
    <ToastContext.Provider value={value}>
      {" "}
      {children} <ToastViewport />{" "}
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;
  return (
    <div className="fixed top-4 right-4 z-[1000] w-[360px] max-w-[calc(100vw-32px)] space-y-3">
      {" "}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-xl border px-4 py-3 bg-white ${t.kind === "success" ? "border-emerald-200" : t.kind === "error" ? "border-red-200" : "border-gray-200"}`}
          role="status"
          aria-live="polite"
        >
          {" "}
          <div className="flex items-start justify-between gap-3">
            {" "}
            <div className="min-w-0 flex-1">
              {" "}
              {t.title ? (
                <div className="text-sm font-semibold text-gray-900">
                  {t.title}
                </div>
              ) : null}{" "}
              <div
                className={`text-sm ${t.kind === "success" ? "text-emerald-800" : t.kind === "error" ? "text-red-800" : "text-gray-700"}`}
              >
                {" "}
                {t.message}{" "}
              </div>{" "}
              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {t.action.label} →
                </button>
              ) : null}
            </div>{" "}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              {" "}
              Close{" "}
            </button>{" "}
          </div>{" "}
        </div>
      ))}{" "}
    </div>
  );
}
