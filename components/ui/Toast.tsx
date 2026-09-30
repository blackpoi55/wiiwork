"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<{
  push: (t: ToastInput) => void;
  success: (title: string, detail?: string, action?: Toast["action"]) => void;
  error: (title: string, detail?: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ต้องอยู่ภายใน ToastProvider");
  return ctx;
}

const STYLES: Record<ToastKind, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-200", iconColor: "text-emerald-600" },
  error: { icon: TriangleAlert, ring: "border-rose-200", iconColor: "text-rose-600" },
  info: { icon: Info, ring: "border-slate-200", iconColor: "text-slate-500" },
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-3), { ...input, id }]);
      window.setTimeout(() => remove(id), input.kind === "error" ? 8000 : 5000);
    },
    [remove],
  );

  const value = useMemo(
    () => ({
      push,
      success: (title: string, detail?: string, action?: Toast["action"]) =>
        push({ kind: "success", title, detail, action }),
      error: (title: string, detail?: string) => push({ kind: "error", title, detail }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => {
          const style = STYLES[t.kind];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              style={{ animation: "toast-in 0.2s ease-out both" }}
              className={`card pointer-events-auto flex items-start gap-3 border ${style.ring} p-3 pr-2`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                {t.detail ? (
                  <p className="mt-0.5 break-words text-xs text-slate-500">{t.detail}</p>
                ) : null}
                {t.action ? (
                  t.action.href ? (
                    <a
                      href={t.action.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block text-xs font-semibold text-[var(--brand)] hover:underline"
                    >
                      {t.action.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={t.action.onClick}
                      className="mt-1.5 text-xs font-semibold text-[var(--brand)] hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="btn btn-quiet btn-icon shrink-0"
                aria-label="ปิด"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
