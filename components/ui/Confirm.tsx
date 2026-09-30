"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

type ConfirmOptions = {
  title: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm ต้องอยู่ภายใน ConfirmProvider");
  return ctx;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOptions(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => close(false)}
        >
          <div
            className="card w-full max-w-md animate-in p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  options.danger ? "bg-rose-50 text-rose-600" : "bg-[var(--brand-soft)] text-[var(--brand)]"
                }`}
              >
                <TriangleAlert size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">{options.title}</h2>
                {options.detail ? (
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{options.detail}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
                {options.cancelLabel ?? "ยกเลิก"}
              </button>
              <button
                type="button"
                autoFocus
                className={`btn ${options.danger ? "btn-primary !bg-rose-600 hover:!bg-rose-700" : "btn-primary"}`}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
