"use client";

import { useState } from "react";
import { Bold, ChevronDown, ChevronUp, Plus, RotateCcw, Trash2, Variable } from "lucide-react";
import { defaultInfoRows, makeInfoRow } from "@/lib/defaults";
import { PLACEHOLDERS } from "@/lib/placeholders";
import type { InfoRow } from "@/lib/types";

type Props = {
  rows: InfoRow[];
  onChange: (rows: InfoRow[]) => void;
  /** แสดงปุ่มคืนค่าเป็นบล็อกมาตรฐาน */
  allowReset?: boolean;
};

export default function InfoRowsEditor({ rows, onChange, allowReset = true }: Props) {
  const [showTokens, setShowTokens] = useState(false);

  const update = (id: string, patch: Partial<InfoRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const move = (index: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    const [row] = next.splice(index, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  const insertAfter = (index: number) => {
    const next = [...rows];
    next.splice(index + 1, 0, makeInfoRow());
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onChange([...rows, makeInfoRow()])}
        >
          <Plus size={14} />
          เพิ่มบรรทัด
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-sm"
          onClick={() => setShowTokens((v) => !v)}
        >
          <Variable size={14} />
          ตัวแปรที่ใช้ได้
        </button>
        {allowReset ? (
          <button
            type="button"
            className="btn btn-quiet btn-sm ml-auto"
            onClick={() => onChange(defaultInfoRows())}
          >
            <RotateCcw size={14} />
            คืนค่าแบบมาตรฐาน
          </button>
        ) : null}
      </div>

      {showTokens ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="mb-2 text-xs text-slate-500">
            พิมพ์ตัวแปรพวกนี้ลงในช่องข้อความได้ ระบบจะแทนค่าจริงให้ตอนออกเอกสาร
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.token}
                type="button"
                title={p.describe}
                onClick={() => navigator.clipboard?.writeText(p.token)}
                className="rounded-md border border-[var(--border-strong)] bg-white px-2 py-1 font-mono text-[11px] text-slate-600 hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                {p.token}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">คลิกเพื่อคัดลอก</p>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.6fr)_96px] gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span />
          <span>หัวข้อซ้าย</span>
          <span>ข้อความซ้าย</span>
          <span>หัวข้อขวา</span>
          <span>ข้อความขวา</span>
          <span />
        </div>

        {rows.map((row, index) => (
          <div
            key={row.id}
            className="group grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.6fr)_96px] items-center gap-2 border-b border-[var(--border)] px-3 py-1.5 last:border-0 hover:bg-[var(--surface-2)]"
          >
            <span className="text-center text-[11px] font-semibold text-slate-300">
              {index + 1}
            </span>
            <input
              className="field-inline text-right"
              placeholder="—"
              value={row.leftLabel}
              onChange={(e) => update(row.id, { leftLabel: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <input
                className={`field-inline ${row.leftBold ? "font-bold" : ""}`}
                placeholder="—"
                value={row.leftValue}
                onChange={(e) => update(row.id, { leftValue: e.target.value })}
              />
              <button
                type="button"
                title={row.leftBold ? "ยกเลิกตัวหนา" : "ทำเป็นตัวหนา"}
                onClick={() => update(row.id, { leftBold: !row.leftBold })}
                className={`shrink-0 rounded-md p-1 ${
                  row.leftBold
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                }`}
              >
                <Bold size={13} />
              </button>
            </div>
            <input
              className="field-inline"
              placeholder="—"
              value={row.rightLabel}
              onChange={(e) => update(row.id, { rightLabel: e.target.value })}
            />
            <input
              className="field-inline"
              placeholder="—"
              value={row.rightValue}
              onChange={(e) => update(row.id, { rightValue: e.target.value })}
            />
            <div className="flex justify-end gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                className="btn btn-quiet btn-icon"
                title="เลื่อนขึ้น"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-icon"
                title="เลื่อนลง"
                onClick={() => move(index, index + 1)}
                disabled={index === rows.length - 1}
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-icon"
                title="แทรกบรรทัดใต้แถวนี้"
                onClick={() => insertAfter(index)}
              >
                <Plus size={14} />
              </button>
              <button
                type="button"
                className="btn btn-danger btn-icon"
                title="ลบบรรทัด"
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            ไม่มีบรรทัดเลย — กด “เพิ่มบรรทัด” เพื่อเริ่ม
          </p>
        ) : null}
      </div>
    </div>
  );
}
