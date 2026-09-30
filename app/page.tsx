"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Images,
  ListChecks,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { api, exportUrl } from "@/lib/client";
import { money, thaiDate, thaiDateShort, thaiMonth } from "@/lib/thai";
import type { QuotationSummary } from "@/lib/types";

type Filters = { q: string; project: string; month: string; from: string; to: string };
const EMPTY: Filters = { q: "", project: "", month: "", from: "", to: "" };

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "accent" | "warn";
}) {
  const tones = {
    brand: "bg-[var(--brand-soft)] text-[var(--brand)]",
    accent: "bg-[var(--accent-soft)] text-[#1c7a3c]",
    warn: "bg-[var(--warn-soft)] text-[var(--warn)]",
  };
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold leading-tight text-slate-900">{value}</p>
        {sub ? <p className="truncate text-[11px] text-slate-400">{sub}</p> : null}
      </div>
    </div>
  );
}

export default function HomePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<QuotationSummary[] | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setRows(await api.listQuotations());
    } catch (e) {
      toast.error("โหลดรายการไม่สำเร็จ", (e as Error).message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projects = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.projectName || r.projectSlug))).sort(),
    [rows],
  );
  const months = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.month))).sort().reverse(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (filters.project && (r.projectName || r.projectSlug) !== filters.project) return false;
      if (filters.month && r.month !== filters.month) return false;
      if (filters.from && r.date < filters.from) return false;
      if (filters.to && r.date > filters.to) return false;
      if (!needle) return true;
      return [r.unit, r.customerName, r.docNo, r.projectName, r.date]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, filters]);

  const activeFilters = Object.entries(filters).filter(([, v]) => v).length;
  const totalSum = filtered.reduce((s, r) => s + r.grandTotal, 0);
  const notExported = filtered.filter((r) => r.exports.length === 0).length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = (rows ?? []).filter((r) => r.month === thisMonth).length;

  const remove = async (row: QuotationSummary) => {
    const ok = await confirm({
      title: `ลบใบเสนอราคา ${row.unit}?`,
      detail: `วันที่ ${thaiDate(row.date)} · ${row.projectName}\nไฟล์ทั้งโฟลเดอร์ (รูป + PDF + Excel) จะถูกลบไปด้วย และกู้คืนไม่ได้`,
      confirmLabel: "ลบทิ้ง",
      danger: true,
    });
    if (!ok) return;
    setBusy(row.ref);
    try {
      await api.deleteQuotation(row.ref);
      toast.success("ลบแล้ว", `${row.unit} · ${thaiDate(row.date)}`);
      await load();
    } catch (e) {
      toast.error("ลบไม่สำเร็จ", (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doExport = async (row: QuotationSummary) => {
    setBusy(row.ref);
    try {
      const res = await api.exportQuotation(row.ref);
      toast.success("ออกไฟล์เรียบร้อย", `${res.pdf}`, {
        label: "เปิด PDF",
        href: exportUrl(row.ref, res.pdf),
      });
      await load();
    } catch (e) {
      toast.error("ออกไฟล์ไม่สำเร็จ", (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="ใบเสนอราคา"
        subtitle={
          rows
            ? `แสดง ${filtered.length} จาก ${rows.length} ใบ${activeFilters ? " (กรองอยู่)" : ""}`
            : "กำลังโหลด…"
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={refresh}
              disabled={refreshing}
              title="โหลดใหม่"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <Link href="/edit" className="btn btn-primary">
              <FilePlus2 size={16} />
              สร้างใบเสนอราคา
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="ใบเสนอราคาทั้งหมด" value={`${rows?.length ?? 0} ใบ`} />
        <StatCard
          icon={CalendarDays}
          label="เดือนนี้"
          value={`${thisMonthCount} ใบ`}
          sub={thaiMonth(thisMonth)}
          tone="accent"
        />
        <StatCard
          icon={Wallet}
          label="ยอดรวมที่แสดงอยู่"
          value={`${money(totalSum)} ฿`}
          sub={`${filtered.length} ใบ`}
        />
        <StatCard
          icon={FileDown}
          label="ยังไม่ได้ออกไฟล์"
          value={`${notExported} ใบ`}
          tone={notExported ? "warn" : "accent"}
        />
      </div>

      {/* ---------------------------------- ตัวกรอง --------------------------------- */}
      <div className="card mb-4 p-3">
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="field !pl-9"
              placeholder="ค้นหา ห้อง / ลูกค้า / เลขที่เอกสาร"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <select
            className="field"
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          >
            <option value="">ทุกโครงการ</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="">ทุกเดือน</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {thaiMonth(m)}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="field"
            title="ตั้งแต่วันที่"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <input
            type="date"
            className="field"
            title="ถึงวันที่"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setFilters(EMPTY)}
            disabled={!activeFilters}
          >
            <X size={15} />
            ล้าง
          </button>
        </div>
      </div>

      {/* ---------------------------------- ตาราง ---------------------------------- */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">วันที่</th>
                <th className="px-4 py-2.5">ห้อง / โครงการ</th>
                <th className="px-4 py-2.5">ลูกค้า</th>
                <th className="px-4 py-2.5 text-center">รายการ</th>
                <th className="px-4 py-2.5 text-center">รูป</th>
                <th className="px-4 py-2.5 text-right">ยอดรวม</th>
                <th className="px-4 py-2.5">ไฟล์</th>
                <th className="px-4 py-2.5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14">
                    <div className="mx-auto max-w-sm text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-slate-300">
                        <FileText size={26} />
                      </div>
                      <p className="font-semibold text-slate-700">
                        {rows.length === 0 ? "ยังไม่มีใบเสนอราคา" : "ไม่พบรายการตามตัวกรอง"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {rows.length === 0
                          ? "เริ่มจากสร้างใบแรก ระบบจะเก็บไฟล์ให้อัตโนมัติตามวันที่และห้อง"
                          : "ลองล้างตัวกรองหรือเปลี่ยนคำค้น"}
                      </p>
                      <div className="mt-4">
                        {rows.length === 0 ? (
                          <Link href="/edit" className="btn btn-primary">
                            <FilePlus2 size={16} />
                            สร้างใบเสนอราคา
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setFilters(EMPTY)}
                          >
                            <X size={15} />
                            ล้างตัวกรอง
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const pdf = r.exports.find((f) => f.endsWith(".pdf"));
                  const xlsx = r.exports.find((f) => f.endsWith(".xlsx"));
                  const working = busy === r.ref;
                  return (
                    <tr
                      key={r.ref}
                      className={`border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--surface-2)] ${
                        working ? "opacity-60" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-medium text-slate-800">{thaiDateShort(r.date)}</div>
                        <div className="text-[11px] text-slate-400">{r.date}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/edit?ref=${encodeURIComponent(r.ref)}`}
                          className="font-semibold text-slate-900 hover:text-[var(--brand)] hover:underline"
                        >
                          {r.unit}
                        </Link>
                        <div className="text-[11px] text-slate-400">
                          {r.projectName || r.projectSlug}
                        </div>
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="truncate text-slate-600" title={r.customerName}>
                          {r.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">{r.docNo}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <ListChecks size={14} className="text-slate-400" />
                          {r.itemCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Images size={14} className="text-slate-400" />
                          {r.photoCount}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                        {money(r.grandTotal)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {pdf || xlsx ? (
                          <div className="flex items-center gap-1.5">
                            {pdf ? (
                              <a
                                className="badge badge-ok hover:brightness-95"
                                href={exportUrl(r.ref, pdf)}
                                target="_blank"
                                rel="noreferrer"
                                title={pdf}
                              >
                                <FileText size={12} />
                                PDF
                              </a>
                            ) : null}
                            {xlsx ? (
                              <a
                                className="badge badge-ok hover:brightness-95"
                                href={exportUrl(r.ref, xlsx, true)}
                                title={xlsx}
                              >
                                <FileSpreadsheet size={12} />
                                Excel
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <span className="badge badge-wait">ยังไม่ออกไฟล์</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            className="btn btn-quiet btn-icon"
                            href={`/edit?ref=${encodeURIComponent(r.ref)}`}
                            title="เปิด / แก้ไข"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-quiet btn-icon"
                            disabled={working}
                            onClick={() => doExport(r)}
                            title="ออกไฟล์ PDF + Excel ใหม่"
                          >
                            <FileDown size={16} className={working ? "animate-pulse" : ""} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-quiet btn-icon"
                            onClick={() =>
                              api
                                .reveal("quotation", r.ref)
                                .catch((e) => toast.error("เปิดโฟลเดอร์ไม่สำเร็จ", e.message))
                            }
                            title="เปิดโฟลเดอร์ที่เก็บไฟล์"
                          >
                            <FolderOpen size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            disabled={working}
                            onClick={() => remove(r)}
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Camera size={13} />
          เคล็ดลับ: ไฟล์ทะเบียนรวม <code className="text-slate-500">ทะเบียนใบเสนอราคา.xlsx</code>{" "}
          ในโฟลเดอร์ข้อมูล เปิดใน Excel แล้วกรองได้ทุกใบ
        </p>
      ) : null}
    </AppShell>
  );
}
