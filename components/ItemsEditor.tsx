"use client";

import { ChevronDown, ChevronUp, ListChecks, Plus, Trash2, Zap } from "lucide-react";
import { UNITS } from "@/lib/defaults";
import { lineAmount } from "@/lib/totals";
import { money } from "@/lib/thai";
import type { LineItem, Preset } from "@/lib/types";

type Props = {
  items: LineItem[];
  presets: Preset[];
  maxRows: number;
  onChange: (items: LineItem[]) => void;
};

function newId() {
  return `it-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ItemsEditor({ items, presets, maxRows, onChange }: Props) {
  const full = items.length >= maxRows;
  const total = items.reduce((s, it) => s + lineAmount(it), 0);

  const update = (id: string, patch: Partial<LineItem>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const add = (preset?: Preset) => {
    if (full) return;
    onChange([
      ...items,
      {
        id: newId(),
        description: preset?.description ?? "",
        unit: preset?.unit ?? "ม.",
        qty: 1,
        unitPrice: preset?.unitPrice ?? 0,
      },
    ]);
  };

  const move = (index: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* ------------------------- ปุ่มลัดรายการที่ใช้บ่อย ------------------------ */}
      {presets.length ? (
        <div className="card p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Zap size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-bold text-slate-700">รายการที่ใช้บ่อย</span>
            <span className="hint">— คลิกเพื่อเพิ่มเข้าใบ</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={full}
                onClick={() => add(p)}
                className="group flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-white px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Plus size={13} className="text-slate-400 group-hover:text-[var(--brand)]" />
                <span className="font-medium">{p.description}</span>
                <span className="text-slate-400">
                  {p.unit} · {money(p.unitPrice)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* --------------------------------- ตาราง --------------------------------- */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <ListChecks size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800">รายการงาน</h2>
          <span
            className={`badge ${full ? "badge-wait" : "badge-neutral"}`}
            title={`ฟอร์มพิมพ์ได้สูงสุด ${maxRows} แถว`}
          >
            {items.length}/{maxRows} แถว{full ? " · เต็มแล้ว" : ""}
          </span>
          <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={() => add()} disabled={full}>
            <Plus size={14} />
            เพิ่มแถวว่าง
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-slate-300">
              <ListChecks size={26} />
            </div>
            <p className="font-semibold text-slate-700">ยังไม่มีรายการงาน</p>
            <p className="mt-1 text-sm text-slate-500">
              คลิกปุ่มรายการที่ใช้บ่อยด้านบน หรือกด “เพิ่มแถวว่าง” เพื่อพิมพ์เอง
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-3 py-2.5 text-center">ลำดับ</th>
                  <th className="px-3 py-2.5">รายการ</th>
                  <th className="w-28 px-3 py-2.5">หน่วย</th>
                  <th className="w-24 px-3 py-2.5 text-right">จำนวน</th>
                  <th className="w-32 px-3 py-2.5 text-right">ราคา/หน่วย</th>
                  <th className="w-32 px-3 py-2.5 text-right">จำนวนเงิน</th>
                  <th className="w-24 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="group border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-3 py-1.5 text-center text-xs font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        className="field-inline font-medium"
                        placeholder="เช่น งานซ่อมผนังร้าวขนาดทั่วไป 10 จุด"
                        value={item.description}
                        onChange={(e) => update(item.id, { description: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        className="field-inline"
                        list="unit-options"
                        value={item.unit}
                        onChange={(e) => update(item.id, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        step="any"
                        className="field-inline text-right tabular-nums"
                        value={item.qty}
                        onChange={(e) => update(item.id, { qty: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number"
                        step="any"
                        className="field-inline text-right tabular-nums"
                        value={item.unitPrice}
                        onChange={(e) => update(item.id, { unitPrice: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-800">
                      {money(lineAmount(item))}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          className="btn btn-quiet btn-icon"
                          onClick={() => move(index, index - 1)}
                          disabled={index === 0}
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-quiet btn-icon"
                          onClick={() => move(index, index + 1)}
                          disabled={index === items.length - 1}
                          title="เลื่อนลง"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon"
                          onClick={() => onChange(items.filter((i) => i.id !== item.id))}
                          title="ลบรายการ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--surface-2)]">
                  <td colSpan={5} className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">
                    รวมรายการ
                  </td>
                  <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums text-slate-900">
                    {money(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <datalist id="unit-options">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </div>
  );
}
