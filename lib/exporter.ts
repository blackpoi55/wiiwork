import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import type { Quotation, QuotationRef } from "./types";
import {
  DATA_ROOT,
  exportDir,
  listMonthQuotations,
  monthlyDir,
  parseRef,
  quotationDir,
  readQuotation,
  refToString,
  safeName,
} from "./storage";
import { buildMonthlyWorkbook, buildSingleWorkbook } from "./excel";
import { renderPdf } from "./pdf";
import { computeTotals } from "./totals";
import { thaiDate, thaiMonth } from "./thai";

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function exportBaseName(q: Quotation): string {
  return safeName(
    `ใบเสนอราคา_${q.projectName || q.projectSlug}_${q.unit}_${q.date}`,
    "ใบเสนอราคา",
  );
}

/** ถ้ามีไฟล์เดิมอยู่ ย้ายไปเก็บในโฟลเดอร์ประวัติก่อนเขียนทับ */
async function archiveIfExists(file: string): Promise<void> {
  try {
    await fs.access(file);
  } catch {
    return;
  }
  const dir = path.join(path.dirname(file), "เวอร์ชันก่อนหน้า");
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  await fs.rename(file, path.join(dir, `${base}_${stamp()}${ext}`));
}

export type ExportResult = {
  ref: string;
  pdf: string;
  xlsx: string;
  monthlyXlsx: string;
  folder: string;
};

export async function exportQuotation(
  ref: QuotationRef,
  origin: string,
): Promise<ExportResult> {
  const q = await readQuotation(ref);
  const dir = exportDir(ref);
  await fs.mkdir(dir, { recursive: true });

  const base = exportBaseName(q);
  const pdfPath = path.join(dir, `${base}.pdf`);
  const xlsxPath = path.join(dir, `${base}.xlsx`);

  const printUrl = `${origin}/print?ref=${encodeURIComponent(refToString(ref))}`;
  const [pdfBuf, xlsxBuf] = await Promise.all([
    renderPdf(printUrl),
    buildSingleWorkbook(q),
  ]);

  await archiveIfExists(pdfPath);
  await archiveIfExists(xlsxPath);
  await fs.writeFile(pdfPath, new Uint8Array(pdfBuf));
  await fs.writeFile(xlsxPath, new Uint8Array(xlsxBuf));

  const monthlyXlsx = await rebuildMonthlyWorkbook(ref);
  await rebuildIndexFiles();

  return {
    ref: refToString(ref),
    pdf: path.basename(pdfPath),
    xlsx: path.basename(xlsxPath),
    monthlyXlsx,
    folder: quotationDir(ref),
  };
}

/** สร้างไฟล์รวมทั้งเดือนใหม่ (หนึ่งชีตต่อหนึ่งห้อง เรียงตามวันที่) */
export async function rebuildMonthlyWorkbook(ref: QuotationRef): Promise<string> {
  const summaries = await listMonthQuotations(ref.projectSlug, ref.month);
  const quotations: Quotation[] = [];
  for (const s of summaries) {
    try {
      quotations.push(await readQuotation(parseRef(s.ref)));
    } catch {
      /* ข้ามใบที่อ่านไม่ได้ */
    }
  }
  const dir = monthlyDir(ref);
  await fs.mkdir(dir, { recursive: true });
  const name = safeName(`ใบเสนอราคา_${ref.projectSlug}_${ref.month}_รวมทั้งเดือน.xlsx`);
  const buf = await buildMonthlyWorkbook(quotations);
  await fs.writeFile(path.join(dir, name), new Uint8Array(buf));
  return name;
}

/* ------------------------- ทะเบียนรวมไว้ filter ใน Excel ------------------------ */

const INDEX_HEADERS = [
  "โครงการ",
  "เดือน",
  "วันที่",
  "วันที่ (ไทย)",
  "ห้อง/ยูนิต",
  "ลูกค้า",
  "เลขที่เอกสาร",
  "จำนวนรายการ",
  "จำนวนรูป",
  "ยอดก่อนภาษี",
  "ภาษี",
  "ยอดรวมทั้งสิ้น",
  "แก้ไขล่าสุด",
  "โฟลเดอร์",
];

export async function rebuildIndexFiles(): Promise<void> {
  const { listAllQuotations } = await import("./storage");
  const summaries = await listAllQuotations();

  const rows: (string | number)[][] = [];
  for (const s of summaries) {
    try {
      const q = await readQuotation(parseRef(s.ref));
      const t = computeTotals(q);
      rows.push([
        q.projectName || s.projectSlug,
        thaiMonth(s.month),
        s.date,
        thaiDate(s.date),
        q.unit,
        q.customerName,
        q.docNo,
        s.itemCount,
        s.photoCount,
        t.subTotal,
        t.vat,
        t.grandTotal,
        s.updatedAt.slice(0, 19).replace("T", " "),
        quotationDir(parseRef(s.ref)),
      ]);
    } catch {
      /* ข้าม */
    }
  }

  await fs.mkdir(DATA_ROOT, { recursive: true });

  // CSV (BOM เพื่อให้ Excel อ่านภาษาไทยถูก)
  const csv = [INDEX_HEADERS, ...rows]
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
  await fs.writeFile(path.join(DATA_ROOT, "ทะเบียนใบเสนอราคา.csv"), "﻿" + csv, "utf8");

  // XLSX พร้อม AutoFilter + freeze header
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ทะเบียน");
  ws.addRow(INDEX_HEADERS);
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: INDEX_HEADERS.length } };
  [18, 16, 12, 18, 14, 34, 16, 12, 10, 14, 12, 16, 20, 60].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  for (const col of [10, 11, 12]) ws.getColumn(col).numFmt = "#,##0.00";
  const buf = await wb.xlsx.writeBuffer();
  await fs.writeFile(
    path.join(DATA_ROOT, "ทะเบียนใบเสนอราคา.xlsx"),
    new Uint8Array(Buffer.from(buf)),
  );
}
