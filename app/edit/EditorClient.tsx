"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleAlert,
  FileDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Images,
  ListChecks,
  Loader2,
  Percent,
  Save,
  ScrollText,
  Trash2,
  ZoomIn,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import InfoRowsEditor from "@/components/InfoRowsEditor";
import ItemsEditor from "@/components/ItemsEditor";
import PhotoManager from "@/components/PhotoManager";
import QuotationDocument from "@/components/QuotationDocument";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { api, exportUrl, photoUrl } from "@/lib/client";
import { DEFAULT_SETTINGS, newQuotation } from "@/lib/defaults";
import { migrateQuotation } from "@/lib/migrate";
import {
  PHOTO_LAYOUTS,
  itemRowCapacity,
  maxItems,
  printedItemRows,
  type PhotosPerPage,
} from "@/lib/layout";
import { bahtText, money, thaiDate } from "@/lib/thai";
import { computeTotals } from "@/lib/totals";
import type { Quotation, Settings } from "@/lib/types";

type Tab = "form" | "items" | "photos";

const PT_TO_PX = 4 / 3;
const PAGE_W = 595.2 * PT_TO_PX;
const PAGE_H = 841.8 * PT_TO_PX;

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof FileText;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-tight text-slate-800">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function EditorClient() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const initialRef = params.get("ref");

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [refKey, setRefKey] = useState<string | null>(initialRef);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [exports, setExports] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("form");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.52);
  const loadedRef = useRef(false);
  const latest = useRef<Quotation | null>(null);
  const [photoTick, setPhotoTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await api.getSettings().catch(() => DEFAULT_SETTINGS);
      if (cancelled) return;
      setSettings(s);
      if (initialRef) {
        try {
          const data = await api.getQuotation(initialRef);
          if (cancelled) return;
          setQuotation(migrateQuotation(data.quotation, s));
          setExports(data.exports);
          setRefKey(data.ref);
        } catch (e) {
          if (!cancelled) setLoadError((e as Error).message);
        }
      } else {
        setQuotation(newQuotation(s));
      }
      loadedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [initialRef]);

  useEffect(() => {
    latest.current = quotation;
  }, [quotation]);

  const patch = useCallback((changes: Partial<Quotation>) => {
    setQuotation((prev) => (prev ? { ...prev, ...changes } : prev));
    setDirty(true);
  }, []);

  const totals = useMemo(() => (quotation ? computeTotals(quotation) : null), [quotation]);

  const save = async (silent = false): Promise<string | null> => {
    const q = latest.current;
    if (!q) return null;
    if (!q.unit.trim()) {
      toast.error("ยังกรอกไม่ครบ", "ต้องระบุห้อง/ยูนิต ก่อนบันทึก เพราะใช้ตั้งชื่อโฟลเดอร์");
      setTab("form");
      return null;
    }
    setSaving(true);
    try {
      const payload: Quotation = { ...q, projectSlug: q.projectSlug || q.projectName };
      const res = refKey
        ? await api.saveQuotation(refKey, payload)
        : await api.createQuotation(payload);
      setRefKey(res.ref);
      setDirty(false);
      if (res.ref !== initialRef) router.replace(`/edit?ref=${encodeURIComponent(res.ref)}`);
      const fresh = await api.getQuotation(res.ref);
      setExports(fresh.exports);
      if (!silent) toast.success("บันทึกแล้ว", res.ref);
      return res.ref;
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", (e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // เพิ่ม/ลบ/สลับรูป แล้วบันทึกทันที กันไฟล์รูปค้างโดยไม่มีข้อมูลอ้างอิง
  useEffect(() => {
    if (photoTick === 0) return;
    void save(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoTick]);

  const exportFiles = async () => {
    const ref = await save(true);
    if (!ref) return;
    setExporting(true);
    try {
      const res = await api.exportQuotation(ref);
      const fresh = await api.getQuotation(ref);
      setExports(fresh.exports);
      toast.success("ออกไฟล์เรียบร้อย", `${res.pdf}\n${res.xlsx}`, {
        label: "เปิด PDF",
        href: exportUrl(ref, res.pdf),
      });
    } catch (e) {
      toast.error("ออกไฟล์ไม่สำเร็จ", (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    if (!refKey || !quotation) return;
    const ok = await confirm({
      title: `ลบใบเสนอราคา ${quotation.unit}?`,
      detail: "ไฟล์ทั้งโฟลเดอร์ (รูป + PDF + Excel) จะถูกลบไปด้วย และกู้คืนไม่ได้",
      confirmLabel: "ลบทิ้ง",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteQuotation(refKey);
      toast.success("ลบแล้ว");
      router.push("/");
    } catch (e) {
      toast.error("ลบไม่สำเร็จ", (e as Error).message);
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <div className="card mx-auto max-w-md p-6 text-center">
          <CircleAlert size={28} className="mx-auto mb-2 text-rose-500" />
          <p className="font-semibold text-slate-800">เปิดใบเสนอราคาไม่ได้</p>
          <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          <Link href="/" className="btn btn-ghost mt-4">
            <ArrowLeft size={15} />
            กลับไปรายการ
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!quotation || !totals) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="skeleton h-9 w-72" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_540px]">
            <div className="space-y-3">
              <div className="skeleton h-10 w-80" />
              <div className="skeleton h-56 w-full" />
              <div className="skeleton h-64 w-full" />
            </div>
            <div className="skeleton h-[560px] w-full" />
          </div>
        </div>
      </AppShell>
    );
  }

  const q = quotation;
  const pdfFile = exports.find((f) => f.endsWith(".pdf"));
  const xlsxFile = exports.find((f) => f.endsWith(".xlsx"));
  const photoPages = Math.ceil(q.photos.length / q.photosPerPage);
  const totalPages = 1 + photoPages;

  const TABS: [Tab, string, typeof FileText, number | null][] = [
    ["form", "ข้อมูลเอกสาร", ScrollText, null],
    ["items", "รายการงาน", ListChecks, q.items.length],
    ["photos", "รูปภาพ", Images, q.photos.length],
  ];

  return (
    <AppShell>
      {/* ------------------------------ แถบหัวเรื่อง ------------------------------ */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/" className="btn btn-quiet btn-icon" title="กลับไปรายการ">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[1.3rem] font-bold leading-tight tracking-tight text-slate-900">
            <span className="truncate">{q.unit || "ใบเสนอราคาใหม่"}</span>
            {refKey ? (
              dirty ? (
                <span className="badge badge-wait">มีการแก้ไข</span>
              ) : (
                <span className="badge badge-ok">
                  <Check size={11} />
                  บันทึกแล้ว
                </span>
              )
            ) : (
              <span className="badge badge-neutral">ยังไม่บันทึก</span>
            )}
          </h1>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {q.projectName || "ยังไม่ระบุโครงการ"} · {thaiDate(q.date)} · {totalPages} หน้า
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {pdfFile ? (
            <a
              className="btn btn-ghost"
              href={exportUrl(refKey!, pdfFile)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">PDF</span>
            </a>
          ) : null}
          {xlsxFile ? (
            <a className="btn btn-ghost" href={exportUrl(refKey!, xlsxFile, true)}>
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Excel</span>
            </a>
          ) : null}
          {refKey ? (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                title="เปิดโฟลเดอร์ที่เก็บไฟล์"
                onClick={() =>
                  api
                    .reveal("quotation", refKey)
                    .catch((e) => toast.error("เปิดโฟลเดอร์ไม่สำเร็จ", e.message))
                }
              >
                <FolderOpen size={16} />
              </button>
              <button
                type="button"
                className="btn btn-danger btn-icon"
                title="ลบใบเสนอราคานี้"
                onClick={remove}
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => save()}
            disabled={saving || exporting}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            บันทึก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportFiles}
            disabled={exporting || saving}
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileDown size={16} />
            )}
            {exporting ? "กำลังออกไฟล์…" : "ออก PDF + Excel"}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          {/* ------------------------------- แท็บ ------------------------------- */}
          <div className="mb-4 inline-flex gap-1 rounded-xl border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-sm)]">
            {TABS.map(([key, label, Icon, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "bg-[var(--brand)] text-white shadow-[var(--shadow-sm)]"
                    : "text-slate-500 hover:bg-[var(--surface-2)] hover:text-slate-800"
                }`}
              >
                <Icon size={15} />
                {label}
                {count !== null ? (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold ${
                      tab === key ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {tab === "form" ? (
            <div className="space-y-4 animate-in">
              <Section
                icon={FolderOpen}
                title="ที่จัดเก็บ"
                description="สามช่องนี้ใช้ตั้งชื่อโฟลเดอร์ ถ้าแก้แล้วบันทึก ระบบจะย้ายไฟล์ให้เอง"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="วันที่" hint={thaiDate(q.date)}>
                    <input
                      type="date"
                      className="field"
                      value={q.date}
                      onChange={(e) => patch({ date: e.target.value })}
                    />
                  </Field>
                  <Field label="โครงการ">
                    <input
                      className="field"
                      placeholder="เช่น จรัญ22"
                      value={q.projectName}
                      onChange={(e) =>
                        patch({ projectName: e.target.value, projectSlug: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="ห้อง / ยูนิต *">
                    <input
                      className="field"
                      placeholder="เช่น A-203"
                      value={q.unit}
                      onChange={(e) => patch({ unit: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2">
                  <FolderOpen size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <code className="break-all text-[11px] leading-relaxed text-slate-500">
                    data/quotations/{q.projectName || "โครงการ"}/{q.date.slice(0, 7)}/{q.date}_
                    {q.unit || "ห้อง"}/
                  </code>
                </div>
              </Section>

              <Section icon={Building2} title="หัวเอกสาร" description="ข้อมูลลูกค้าและเลขที่เอกสาร">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="เอกสารเลขที่">
                    <input
                      className="field"
                      value={q.docNo}
                      onChange={(e) => patch({ docNo: e.target.value })}
                    />
                  </Field>
                  <Field label="อ้างถึง P/O No.">
                    <input
                      className="field"
                      value={q.poRef}
                      onChange={(e) => patch({ poRef: e.target.value })}
                    />
                  </Field>
                  <Field label="เสนอต่อ" className="sm:col-span-2">
                    <input
                      className="field"
                      value={q.customerName}
                      onChange={(e) => patch({ customerName: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="บรรทัดใต้ชื่อลูกค้า"
                    hint="ปกติใส่เลขที่ห้อง เช่น 282/5 (A 203)"
                    className="sm:col-span-2"
                  >
                    <input
                      className="field"
                      placeholder="282/5 (A 203)"
                      value={q.addressLine}
                      onChange={(e) => patch({ addressLine: e.target.value })}
                    />
                  </Field>
                  <Field label="ผู้ขอเสนอราคา">
                    <input
                      className="field"
                      value={q.quoterName}
                      onChange={(e) => patch({ quoterName: e.target.value })}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                icon={ScrollText}
                title="บล็อกข้อมูลกลางฟอร์ม"
                description={`เพิ่ม ลบ สลับบรรทัดได้อิสระ · ตอนนี้ ${q.infoRows.length} บรรทัด เหลือที่ใส่รายการงานได้ ${maxItems(q.infoRows.length)} รายการ`}
              >
                <InfoRowsEditor rows={q.infoRows} onChange={(infoRows) => patch({ infoRows })} />
              </Section>

              <Section
                icon={Percent}
                title="ค่าดำเนินการ · ภาษี · รูปแบบหน้ารูป"
                description="ค่าตั้งต้นคิดค่าดำเนินการ 10% ของยอดรายการ ตรงกับใบเสนอราคาเดิมทุกใบ"
              >
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="วิธีคิดค่าดำเนินการ">
                    <select
                      className="field"
                      value={q.operationFeeMode}
                      onChange={(e) =>
                        patch({ operationFeeMode: e.target.value as "auto" | "manual" })
                      }
                    >
                      <option value="auto">% ของยอดรายการ</option>
                      <option value="manual">กรอกเอง</option>
                    </select>
                  </Field>
                  {q.operationFeeMode === "auto" ? (
                    <Field label="อัตรา (%)">
                      <input
                        type="number"
                        step="any"
                        className="field text-right"
                        value={q.operationFeeRate}
                        onChange={(e) => patch({ operationFeeRate: Number(e.target.value) })}
                      />
                    </Field>
                  ) : (
                    <Field label="จำนวนเงิน (บาท)">
                      <input
                        type="number"
                        step="any"
                        className="field text-right"
                        value={q.operationFee}
                        onChange={(e) => patch({ operationFee: Number(e.target.value) })}
                      />
                    </Field>
                  )}
                  <Field label="ภาษีมูลค่าเพิ่ม (%)">
                    <input
                      type="number"
                      step="any"
                      className="field text-right"
                      value={q.vatRate}
                      disabled={!q.includeVat}
                      onChange={(e) => patch({ vatRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="รูปต่อหน้า">
                    <select
                      className="field"
                      value={q.photosPerPage}
                      onChange={(e) =>
                        patch({ photosPerPage: Number(e.target.value) as PhotosPerPage })
                      }
                    >
                      {Object.entries(PHOTO_LAYOUTS).map(([value, cfg]) => (
                        <option key={value} value={value}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="แถวรายการขั้นต่ำที่พิมพ์"
                    hint={`เว้นบรรทัดว่างไว้ให้เขียนเพิ่มด้วยมือ · ใส่ได้สูงสุด ${itemRowCapacity(q.infoRows.length)} แถว`}
                  >
                    <input
                      type="number"
                      min={1}
                      max={itemRowCapacity(q.infoRows.length)}
                      className="field text-right"
                      value={q.minRows}
                      onChange={(e) => patch({ minRows: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand)]"
                    checked={q.includeVat}
                    onChange={(e) => patch({ includeVat: e.target.checked })}
                  />
                  คิดภาษีมูลค่าเพิ่มในใบนี้
                </label>
              </Section>
            </div>
          ) : null}

          {tab === "items" ? (
            <div className="animate-in">
              <ItemsEditor
                items={q.items}
                presets={settings.presets}
                maxRows={maxItems(q.infoRows.length)}
                onChange={(items) => patch({ items })}
              />
            </div>
          ) : null}

          {tab === "photos" ? (
            <div className="animate-in">
              <PhotoManager
                refKey={refKey}
                photos={q.photos}
                photosPerPage={q.photosPerPage}
                onChange={(photos, autoSave) => {
                  patch({ photos });
                  if (autoSave) setPhotoTick((t) => t + 1);
                }}
                onNeedSave={() => save()}
              />
            </div>
          ) : null}

          {/* --------------------------------- สรุปยอด -------------------------------- */}
          <div className="card mt-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
              {[
                ["รวมรายการ", money(totals.itemsTotal)],
                [
                  q.operationFeeMode === "auto"
                    ? `ค่าดำเนินการ ${q.operationFeeRate}%`
                    : "ค่าดำเนินการ",
                  money(totals.operationFee),
                ],
                ["รวมเป็นจำนวนเงิน", money(totals.subTotal)],
                [`ภาษีมูลค่าเพิ่ม ${q.vatRate}%`, money(totals.vat)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-medium text-slate-400">{label}</p>
                  <p className="text-sm font-semibold tabular-nums text-slate-700">{value}</p>
                </div>
              ))}
              <div className="ml-auto text-right">
                <p className="text-[11px] font-medium text-slate-400">รวมทั้งสิ้น</p>
                <p className="text-xl font-bold tabular-nums text-[var(--brand)]">
                  {money(totals.grandTotal)} ฿
                </p>
              </div>
            </div>
            <p className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs text-slate-500">
              ({bahtText(totals.grandTotal)})
            </p>
          </div>
        </div>

        {/* ------------------------------- พรีวิวเอกสาร ------------------------------ */}
        <aside className="min-w-0 xl:w-[540px]">
          <div className="sticky top-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="section-title">
                <FileText size={14} className="text-slate-400" />
                ตัวอย่างเอกสาร
              </h2>
              <span className="hint">{totalPages} หน้า</span>
              <div className="ml-auto flex items-center gap-1.5">
                <ZoomIn size={14} className="text-slate-400" />
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.02}
                  value={previewScale}
                  onChange={(e) => setPreviewScale(Number(e.target.value))}
                  className="w-24 accent-[var(--brand)]"
                />
                <span className="w-9 text-right text-xs tabular-nums text-slate-400">
                  {Math.round(previewScale * 100)}%
                </span>
              </div>
            </div>
            <div className="card-flat max-h-[calc(100vh-7rem)] overflow-auto bg-[#e9edf4] p-4">
              <div
                style={{
                  width: PAGE_W * previewScale,
                  height: (PAGE_H * totalPages + 16 * (totalPages - 1)) * previewScale,
                }}
              >
                <div
                  className="preview-scaler [&>div>div]:mb-4 [&>div>div]:bg-white [&>div>div]:shadow-[0_2px_6px_rgba(15,29,53,0.14),0_12px_32px_-12px_rgba(15,29,53,0.3)]"
                  style={{ transform: `scale(${previewScale})`, width: PAGE_W }}
                >
                  <QuotationDocument
                    quotation={q}
                    photoSrc={(p) => (refKey ? photoUrl(refKey, p.file) : "")}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              หน้าตาตรงกับไฟล์ PDF ที่จะออกทุกจุด
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
