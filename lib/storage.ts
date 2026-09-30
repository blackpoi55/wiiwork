import fs from "node:fs/promises";
import path from "node:path";
import type {
  Quotation,
  QuotationRef,
  QuotationSummary,
  Settings,
} from "./types";
import { DEFAULT_SETTINGS } from "./defaults";
import { migrateQuotation, migrateSettings } from "./migrate";
import { computeTotals } from "./totals";

export const DATA_ROOT =
  process.env.QUOTE_DATA_DIR ?? path.join(process.cwd(), "data");
export const QUOTES_ROOT = path.join(DATA_ROOT, "quotations");
const SETTINGS_FILE = path.join(DATA_ROOT, "settings.json");

/** ตัดอักขระที่ใช้เป็นชื่อไฟล์บน Windows ไม่ได้ออก แต่คงตัวอักษรไทยไว้ */
export function safeName(input: string, fallback = "ไม่ระบุ"): string {
  const cleaned = input
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .trim();
  return cleaned.length ? cleaned : fallback;
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function refToString(r: QuotationRef): string {
  return [r.projectSlug, r.month, r.date, r.unitSlug].join("/");
}

export function parseRef(ref: string): QuotationRef {
  const parts = ref.split("/").filter(Boolean);
  if (parts.length !== 4) throw new Error(`ref ไม่ถูกต้อง: ${ref}`);
  const [projectSlug, month, date, unitSlug] = parts;
  for (const p of parts) {
    if (p === "." || p === ".." || p.includes("\\")) {
      throw new Error(`ref ไม่ปลอดภัย: ${ref}`);
    }
  }
  if (!/^\d{4}-\d{2}$/.test(month) || !isISODate(date)) {
    throw new Error(`ref ไม่ถูกต้อง: ${ref}`);
  }
  return { projectSlug, month, date, unitSlug };
}

export function refFromQuotation(q: Quotation): QuotationRef {
  return {
    projectSlug: safeName(q.projectSlug || q.projectName, "โครงการ"),
    month: q.date.slice(0, 7),
    date: q.date,
    unitSlug: safeName(q.unit, "ไม่ระบุห้อง"),
  };
}

/**
 * โฟลเดอร์งานหนึ่งใบ:
 *   data/quotations/<โครงการ>/<ปี-เดือน>/<ปี-เดือน-วัน>_<ห้อง>/
 * ชื่อโฟลเดอร์ใบงานมีทั้งวันที่และห้อง จึงพิมพ์กรองใน File Explorer ได้ทันที
 * (พิมพ์ "A-203" เจอทุกครั้งที่เคยทำห้องนั้น, พิมพ์ "2026-05-20" เจอทุกห้องของวันนั้น)
 */
export function leafName(ref: QuotationRef): string {
  return `${ref.date}_${ref.unitSlug}`;
}

export function quotationDir(ref: QuotationRef): string {
  return path.join(QUOTES_ROOT, ref.projectSlug, ref.month, leafName(ref));
}

export function photosDir(ref: QuotationRef): string {
  return path.join(quotationDir(ref), "photos");
}

export function exportDir(ref: QuotationRef): string {
  return path.join(quotationDir(ref), "export");
}

export function monthlyDir(ref: QuotationRef): string {
  return path.join(QUOTES_ROOT, ref.projectSlug, ref.month, "_รวมทั้งเดือน");
}

export function quotationFile(ref: QuotationRef): string {
  return path.join(quotationDir(ref), "quotation.json");
}

/** กันไม่ให้ชื่อไฟล์หลุดออกนอกโฟลเดอร์ที่กำหนด */
export function safeChild(dir: string, name: string): string {
  const base = path.basename(name);
  if (!base || base === "." || base === "..") throw new Error("ชื่อไฟล์ไม่ถูกต้อง");
  const full = path.join(dir, base);
  if (!full.startsWith(dir + path.sep)) throw new Error("เส้นทางไฟล์ไม่ปลอดภัย");
  return full;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/* ---------------------------------- settings --------------------------------- */

export async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    return migrateSettings(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(settings: Settings): Promise<void> {
  await ensureDir(DATA_ROOT);
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
}

/* -------------------------------- quotations -------------------------------- */

export async function readQuotation(ref: QuotationRef): Promise<Quotation> {
  const raw = await fs.readFile(quotationFile(ref), "utf8");
  return migrateQuotation(JSON.parse(raw) as Quotation, await readSettings());
}

export async function quotationExists(ref: QuotationRef): Promise<boolean> {
  return exists(quotationFile(ref));
}

export async function writeQuotation(
  ref: QuotationRef,
  q: Quotation,
): Promise<void> {
  const dir = quotationDir(ref);
  await ensureDir(dir);
  await ensureDir(photosDir(ref));
  await ensureDir(exportDir(ref));
  await fs.writeFile(quotationFile(ref), JSON.stringify(q, null, 2), "utf8");
}

/** ย้ายโฟลเดอร์เมื่อ วันที่ / โครงการ / ห้อง ถูกแก้ */
export async function moveQuotation(
  from: QuotationRef,
  to: QuotationRef,
): Promise<void> {
  const src = quotationDir(from);
  const dst = quotationDir(to);
  if (src === dst) return;
  if (await exists(dst)) throw new Error("ปลายทางมีใบเสนอราคาอยู่แล้ว");
  await ensureDir(path.dirname(dst));
  await fs.rename(src, dst);
  await pruneEmpty(path.dirname(src));
}

export async function deleteQuotation(ref: QuotationRef): Promise<void> {
  const dir = quotationDir(ref);
  await fs.rm(dir, { recursive: true, force: true });
  await pruneEmpty(path.dirname(dir));
}

async function pruneEmpty(dir: string): Promise<void> {
  let cur = dir;
  while (cur.startsWith(QUOTES_ROOT) && cur !== QUOTES_ROOT) {
    try {
      const entries = await fs.readdir(cur);
      if (entries.length > 0) return;
      await fs.rmdir(cur);
      cur = path.dirname(cur);
    } catch {
      return;
    }
  }
}

export async function listPhotos(ref: QuotationRef): Promise<string[]> {
  try {
    const entries = await fs.readdir(photosDir(ref), { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export async function listExports(ref: QuotationRef): Promise<string[]> {
  try {
    const entries = await fs.readdir(exportDir(ref), { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function summarize(
  ref: QuotationRef,
): Promise<QuotationSummary | null> {
  try {
    const q = await readQuotation(ref);
    const totals = computeTotals(q);
    return {
      ...ref,
      ref: refToString(ref),
      projectName: q.projectName,
      unit: q.unit,
      customerName: q.customerName,
      docNo: q.docNo,
      grandTotal: totals.grandTotal,
      photoCount: q.photos.length,
      itemCount: q.items.filter((i) => i.description.trim()).length,
      updatedAt: q.updatedAt,
      exports: await listExports(ref),
    };
  } catch {
    return null;
  }
}

/** แยกชื่อโฟลเดอร์ "2026-05-20_A-203" กลับเป็นวันที่กับห้อง */
function parseLeaf(name: string): { date: string; unitSlug: string } | null {
  const idx = name.indexOf("_");
  if (idx !== 10) return null;
  const date = name.slice(0, 10);
  const unitSlug = name.slice(11);
  if (!isISODate(date) || !unitSlug) return null;
  return { date, unitSlug };
}

/** เดินทั้งคลังไฟล์ตามโครงสร้าง โครงการ/เดือน/(วันที่_ห้อง) */
export async function listAllQuotations(): Promise<QuotationSummary[]> {
  const out: QuotationSummary[] = [];
  for (const projectSlug of await listDirs(QUOTES_ROOT)) {
    for (const month of await listDirs(path.join(QUOTES_ROOT, projectSlug))) {
      if (!/^\d{4}-\d{2}$/.test(month)) continue;
      for (const leaf of await listDirs(path.join(QUOTES_ROOT, projectSlug, month))) {
        const parsed = parseLeaf(leaf);
        if (!parsed) continue;
        const s = await summarize({ projectSlug, month, ...parsed });
        if (s) out.push(s);
      }
    }
  }
  out.sort((a, b) =>
    a.date === b.date
      ? a.unitSlug.localeCompare(b.unitSlug, "th")
      : b.date.localeCompare(a.date),
  );
  return out;
}

export async function listMonthQuotations(
  projectSlug: string,
  month: string,
): Promise<QuotationSummary[]> {
  const all: QuotationSummary[] = [];
  const base = path.join(QUOTES_ROOT, projectSlug, month);
  for (const leaf of await listDirs(base)) {
    const parsed = parseLeaf(leaf);
    if (!parsed) continue;
    const s = await summarize({ projectSlug, month, ...parsed });
    if (s) all.push(s);
  }
  all.sort((a, b) =>
    a.date === b.date
      ? a.unitSlug.localeCompare(b.unitSlug, "th")
      : a.date.localeCompare(b.date),
  );
  return all;
}

export async function ensureDataRoot(): Promise<void> {
  await ensureDir(QUOTES_ROOT);
}
