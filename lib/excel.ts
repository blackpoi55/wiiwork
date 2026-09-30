import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import type { Quotation } from "./types";
import { computeTotals, itemLabel, lineAmount } from "./totals";
import { bahtText, thaiDate } from "./thai";

/** แถวรายการในฟอร์ม Excel เดิม = แถว 17 ถึง 27 */
const FIRST_ITEM_ROW = 17;
const LAST_ITEM_ROW = 27;

const NAVY = "FF002060";
const BLACK = "FF000000";
const ACCOUNTING = '_-* #,##0.00_-;\\-* #,##0.00_-;_-* "-"??_-;_-@';

type BorderStyle = Partial<ExcelJS.Borders>;

function thin(color = NAVY): ExcelJS.Border {
  return { style: "thin", color: { argb: color } };
}

function hair(color = NAVY): ExcelJS.Border {
  return { style: "hair", color: { argb: color } };
}

function ang(size = 16, bold = false): Partial<ExcelJS.Font> {
  return { name: "Angsana New", size, bold };
}

function sheetSafeName(name: string, fallback: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, "-").trim().slice(0, 31);
  return cleaned || fallback;
}

/** วางฟอร์มใบเสนอราคาหนึ่งใบลงใน worksheet ที่ให้มา */
export function writeQuotationSheet(
  ws: ExcelJS.Worksheet,
  q: Quotation,
  images: { logo?: number; signature?: number },
): void {
  const totals = computeTotals(q);

  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    margins: { left: 0.71, right: 0.71, top: 0.71, bottom: 0.71, header: 0.3, footer: 0.3 },
  };
  ws.views = [{ showGridLines: false }];

  ws.getColumn(1).width = 11.0;
  ws.getColumn(2).width = 44.43;
  ws.getColumn(3).width = 11.43;
  ws.getColumn(4).width = 9.57;
  ws.getColumn(5).width = 8.43;
  ws.getColumn(6).width = 8.43;
  ws.getColumn(7).width = 8.71;

  for (let r = 1; r <= 39; r++) ws.getRow(r).height = 21;
  ws.getRow(6).height = 27.75;

  const set = (
    addr: string,
    value: ExcelJS.CellValue,
    font?: Partial<ExcelJS.Font>,
    alignment?: Partial<ExcelJS.Alignment>,
    border?: BorderStyle,
    numFmt?: string,
  ) => {
    const cell = ws.getCell(addr);
    if (value !== undefined) cell.value = value;
    if (font) cell.font = font;
    if (alignment) cell.alignment = alignment;
    if (border) cell.border = border;
    if (numFmt) cell.numFmt = numFmt;
    return cell;
  };

  const c = q.company;

  /* ------------------------------- หัวกระดาษ ------------------------------- */
  set("B2", c.nameTh, { name: "Tahoma", size: 9, bold: true }, undefined, {
    bottom: thin(BLACK),
  });
  for (const a of ["C2", "D2", "E2"]) set(a, undefined, undefined, undefined, { bottom: thin(BLACK) });
  set("B3", c.nameEn, { name: "Tahoma", size: 9, bold: true });
  set("B4", c.phone, { name: "Tahoma", size: 8 });
  set("D4", `หมายเลขประจำตัวผู้เสียภาษี ${c.taxId}`, { name: "Tahoma", size: 8, bold: true });
  set("B5", c.email);
  set("D5", "เอกสารเลขที่", ang(10));
  set("E5", q.docNo, ang(10, true), undefined, { bottom: thin(BLACK) });
  set("F5", undefined, ang(10, true), undefined, { bottom: thin(BLACK) });

  ws.mergeCells("A6:F6");
  set("A6", "ใบขอเสนอราคา", ang(16, true), { horizontal: "center" }, { bottom: thin() });

  /* ----------------------------- บล็อกข้อมูลหัวเรื่อง ---------------------------- */
  const leftLabel: Partial<ExcelJS.Alignment> = { horizontal: "right" };
  const box = (top?: boolean, bottom?: boolean): BorderStyle => ({
    left: thin(),
    right: thin(),
    ...(top ? { top: thin() } : {}),
    ...(bottom ? { bottom: thin() } : {}),
  });
  const rightValueBox = (top?: boolean, bottom?: boolean): BorderStyle => ({
    left: thin(),
    ...(top ? { top: thin() } : {}),
    ...(bottom ? { bottom: thin() } : {}),
  });

  set("A7", "เสนอต่อ", ang(16, true), leftLabel, box(true));
  set("B7", q.customerName, ang(16), undefined, box(true));
  set("C7", "อ้างถึง P/O No.", ang(16, true), undefined, box(true, true));
  set("D7", q.poRef, ang(16), { horizontal: "left" }, rightValueBox(true, true));
  set("E7", undefined, ang(16), undefined, { top: thin(), bottom: thin() });
  set("F7", undefined, ang(16), undefined, { right: thin(), top: thin(), bottom: thin() });

  set("A8", undefined, ang(16), leftLabel, box());
  set("B8", q.addressLine, ang(16, true), undefined, box());
  set("C8", "วันที่", ang(16, true), undefined, box(true, true));
  set("D8", thaiDate(q.date), ang(16), { horizontal: "left" }, rightValueBox(true, true), "@");
  set("E8", undefined, ang(16), undefined, { top: thin(), bottom: thin() });
  set("F8", undefined, ang(16), undefined, { right: thin(), top: thin(), bottom: thin() });

  set("A9", undefined, ang(16), leftLabel, box());
  set("B9", undefined, ang(16), undefined, box());
  set("C9", "ผู้ขอเสนอราคา", ang(16, true), undefined, box(true, true));
  set("D9", q.quoterName, ang(16), { horizontal: "left" }, rightValueBox(true, true), "@");
  set("E9", undefined, ang(16), undefined, { top: thin(), bottom: thin() });
  set("F9", undefined, ang(16), undefined, { right: thin(), top: thin(), bottom: thin() });

  set("A10", undefined, ang(16), leftLabel, box());
  set("B10", undefined, ang(16), undefined, box());
  set("C10", undefined, ang(16, true), undefined, box(true));
  set("D10", undefined, ang(16), undefined, rightValueBox(true, true));
  set("E10", undefined, ang(16), undefined, { top: thin(), bottom: thin() });
  set("F10", undefined, ang(16), undefined, { right: thin(), top: thin(), bottom: thin() });

  const rows: Array<[string, string, string, string]> = [
    [q.detailLabel, q.detailValue, "เงื่อนไข", q.conditions[0] ?? ""],
    [q.workTypeLabel, q.workTypeValue, "", q.conditions[1] ?? ""],
    ["", q.incidentDate, "", q.conditions[2] ?? ""],
    [q.attachmentLabel, q.attachmentValue, "", q.conditions[3] ?? ""],
  ];
  rows.forEach(([a, b, cc, d], i) => {
    const r = 11 + i;
    const boldValue = i >= 1;
    set(`A${r}`, a, ang(16, true), leftLabel, { left: thin(BLACK), right: thin(BLACK) });
    set(`B${r}`, b, ang(16, boldValue), undefined, { left: thin(BLACK), right: thin(BLACK) });
    set(`C${r}`, cc, ang(16, true), undefined, { left: thin(BLACK), right: thin(BLACK) });
    set(`D${r}`, d, ang(16), undefined, {
      left: thin(BLACK),
      top: thin(BLACK),
      bottom: thin(BLACK),
    });
    set(`E${r}`, undefined, ang(16), undefined, { top: thin(BLACK), bottom: thin(BLACK) });
    set(`F${r}`, undefined, ang(16), undefined, {
      right: thin(BLACK),
      top: thin(BLACK),
      bottom: thin(BLACK),
    });
  });
  ws.getCell("A14").border = { left: thin(BLACK), right: thin(BLACK), bottom: thin(BLACK) };
  ws.getCell("B14").border = { left: thin(BLACK), right: thin(BLACK), bottom: thin(BLACK) };
  ws.getCell("C14").border = { left: thin(BLACK), right: thin(BLACK), bottom: thin(BLACK) };

  /* ------------------------------ หัวตารางรายการ ------------------------------ */
  const heads = ["ลำดับ", "รายการ", "หน่วย", "จำนวน ", "ราคา/หน่วย", "จำนวนเงิน"];
  heads.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    set(`${col}15`, h, ang(16, true), { horizontal: "center" }, { left: thin(), right: thin() });
    set(`${col}16`, i >= 4 ? "(บาท)" : undefined, ang(16, true), { horizontal: "center" }, {
      left: thin(),
      right: thin(),
      bottom: thin(),
    });
  });

  /* -------------------------------- แถวรายการ ------------------------------- */
  const filled = q.items.filter((i) => i.description.trim() || i.qty || i.unitPrice);
  for (let r = FIRST_ITEM_ROW; r <= LAST_ITEM_ROW; r++) {
    // แถว 17 เว้นว่างเสมอ รายการเริ่มที่แถว 18 (ตามฟอร์มเดิม)
    const index = r - FIRST_ITEM_ROW - 1;
    const item = index >= 0 ? filled[index] : undefined;
    const top = r === FIRST_ITEM_ROW ? thin() : hair();
    const bottom = r === LAST_ITEM_ROW ? undefined : hair();
    const cellBorder: BorderStyle = {
      left: thin(BLACK),
      right: thin(BLACK),
      top,
      ...(bottom ? { bottom } : {}),
    };

    set(`A${r}`, item ? index + 1 : undefined, ang(16), undefined, cellBorder);
    set(
      `B${r}`,
      item ? itemLabel(index + 1, item.description) : undefined,
      ang(16),
      undefined,
      cellBorder,
    );
    set(`C${r}`, item?.unit, ang(16), { horizontal: "center" }, cellBorder);
    set(`D${r}`, item?.qty, ang(16), undefined, cellBorder);
    set(`E${r}`, item?.unitPrice, ang(16), undefined, cellBorder, ACCOUNTING);
    const f = ws.getCell(`F${r}`);
    f.value = {
      formula: `SUM(D${r}*E${r})`,
      result: item ? lineAmount(item) : 0,
    } as ExcelJS.CellFormulaValue;
    f.font = ang(16);
    f.numFmt = ACCOUNTING;
    f.border = cellBorder;
  }

  /* --------------------------------- สรุปยอด -------------------------------- */
  ws.mergeCells("D28:E28");
  ws.mergeCells("D29:E29");
  ws.mergeCells("D30:E30");
  ws.mergeCells("D31:E31");
  ws.mergeCells("A31:C31");

  const totalLeft = (r: number, border: BorderStyle) => {
    set(`A${r}`, undefined, ang(16, true), { horizontal: "right" }, {
      left: border.left,
      top: border.top,
      bottom: border.bottom,
    });
    set(`B${r}`, undefined, ang(16, true), { horizontal: "right" }, {
      top: border.top,
      bottom: border.bottom,
    });
    set(`C${r}`, undefined, ang(16, true), { horizontal: "right" }, {
      right: border.right,
      top: border.top,
      bottom: border.bottom,
    });
  };

  totalLeft(28, { left: thin(BLACK), right: thin(BLACK), top: thin(BLACK), bottom: hair() });
  set("D28", "ค่าดำเนินการ", ang(16), { horizontal: "center", vertical: "middle" }, {
    left: thin(BLACK),
    right: thin(BLACK),
    top: thin(BLACK),
    bottom: thin(BLACK),
  });
  const f28 = ws.getCell("F28");
  f28.value =
    q.operationFeeMode === "manual"
      ? totals.operationFee
      : ({
          formula: `SUM(F${FIRST_ITEM_ROW}:F${LAST_ITEM_ROW})*${(q.operationFeeRate ?? 10) / 100}`,
          result: totals.operationFee,
        } as ExcelJS.CellFormulaValue);
  f28.font = ang(16);
  f28.numFmt = ACCOUNTING;
  f28.border = { left: thin(BLACK), right: thin(BLACK), top: thin(BLACK), bottom: thin(BLACK) };

  totalLeft(29, { left: thin(BLACK), right: thin(BLACK), top: hair(), bottom: hair(BLACK) });
  set("D29", " รวมเป็นจำนวนเงิน", ang(16, true), { horizontal: "center" }, {
    left: thin(BLACK),
    right: thin(BLACK),
    top: thin(BLACK),
    bottom: thin(BLACK),
  });
  const f29 = ws.getCell("F29");
  f29.value = {
    formula: `SUM(F${FIRST_ITEM_ROW}:F28)`,
    result: totals.subTotal,
  } as ExcelJS.CellFormulaValue;
  f29.font = ang(16, true);
  f29.numFmt = ACCOUNTING;
  f29.border = { left: thin(BLACK), right: thin(BLACK), bottom: thin(BLACK) };

  totalLeft(30, { left: thin(), right: thin(), bottom: thin() });
  set("D30", `ภาษีมูลค่าเพิ่ม ${q.vatRate}%`, ang(16, true), { horizontal: "center" }, {
    left: thin(),
    right: thin(),
    top: thin(BLACK),
    bottom: thin(),
  });
  const f30 = ws.getCell("F30");
  f30.value = {
    formula: q.includeVat ? `SUM(F29*${q.vatRate}/100)` : "0",
    result: totals.vat,
  } as ExcelJS.CellFormulaValue;
  f30.font = ang(16, true);
  f30.numFmt = ACCOUNTING;
  f30.alignment = { horizontal: "right" };
  f30.border = { left: thin(), right: thin(), bottom: thin() };

  const dbl: ExcelJS.Border = { style: "double", color: { argb: NAVY } };
  const a31 = ws.getCell("A31");
  a31.value = {
    formula: "BAHTTEXT(F31)",
    result: bahtText(totals.grandTotal),
  } as ExcelJS.CellFormulaValue;
  a31.font = ang(16, true);
  a31.alignment = { horizontal: "center" };
  a31.border = { left: thin(), right: thin(), top: thin(), bottom: dbl };
  ws.getCell("C31").border = { right: thin(), top: thin(), bottom: dbl };
  set("D31", "รวมเป็นจำนวนเงินทั้งสิ้น", ang(16, true), { horizontal: "center" }, {
    left: thin(),
    right: thin(),
    top: thin(),
    bottom: dbl,
  });
  const f31 = ws.getCell("F31");
  f31.value = {
    formula: "SUM(F29:F30)",
    result: totals.grandTotal,
  } as ExcelJS.CellFormulaValue;
  f31.font = ang(16, true);
  f31.numFmt = ACCOUNTING;
  f31.alignment = { horizontal: "right" };
  f31.border = { left: thin(), right: thin(), top: thin(), bottom: dbl };

  /* -------------------------------- ท้ายเอกสาร ------------------------------- */
  set("B33", "จึงเรียนมาเพื่อทราบและโปรดพิจารณาอนุมัติ", ang(16, true));
  set("A35", "ผู้อนุมัติ", ang(16, true), { horizontal: "right" });
  set("B35", undefined, ang(16, true), undefined, { bottom: hair(BLACK) });
  set("E35", "ขอแสดงความนับถือ", ang(16));
  set("A36", "             วันที่", ang(16, true));
  set("B36", undefined, ang(16, true), undefined, { bottom: hair(BLACK) });
  set("E37", `       (${q.quoterName} )`, ang(16));

  /* ---------------------------------- รูปภาพ --------------------------------- */
  if (images.logo !== undefined) {
    ws.addImage(images.logo, {
      tl: { col: 0.06, row: 0.07 } as ExcelJS.Anchor,
      ext: { width: 64, height: 100 },
      editAs: "oneCell",
    });
  }
  if (images.signature !== undefined) {
    ws.addImage(images.signature, {
      tl: { col: 4.25, row: 35.35 } as ExcelJS.Anchor,
      ext: { width: 64, height: 29 },
      editAs: "oneCell",
    });
  }
}

async function loadBrandImages(
  wb: ExcelJS.Workbook,
  q: Quotation,
): Promise<{ logo?: number; signature?: number }> {
  const out: { logo?: number; signature?: number } = {};
  const publicDir = path.join(process.cwd(), "public");
  const tryAdd = async (file: string) => {
    if (!file) return undefined;
    const rel = file.replace(/^\//, "");
    try {
      const buf = await fs.readFile(path.join(publicDir, rel));
      return wb.addImage({ buffer: new Uint8Array(buf) as unknown as ExcelJS.Buffer, extension: "png" });
    } catch {
      return undefined;
    }
  };
  out.logo = await tryAdd(q.company.logoFile);
  out.signature = await tryAdd(q.company.signatureFile);
  return out;
}

/** ไฟล์ Excel ของใบเสนอราคาใบเดียว */
export async function buildSingleWorkbook(q: Quotation): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ระบบใบเสนอราคา";
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetSafeName(q.unit, "ใบเสนอราคา"));
  const images = await loadBrandImages(wb, q);
  writeQuotationSheet(ws, q, images);
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** ไฟล์รวมทั้งเดือน — หนึ่งชีตต่อหนึ่งห้อง */
export async function buildMonthlyWorkbook(quotations: Quotation[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ระบบใบเสนอราคา";
  wb.created = new Date();
  const used = new Set<string>();
  for (const q of quotations) {
    let name = sheetSafeName(q.unit, "ใบเสนอราคา");
    let n = 2;
    while (used.has(name)) name = sheetSafeName(`${q.unit} (${n++})`, `sheet${n}`);
    used.add(name);
    const ws = wb.addWorksheet(name);
    const images = await loadBrandImages(wb, q);
    writeQuotationSheet(ws, q, images);
  }
  if (!quotations.length) wb.addWorksheet("ว่าง");
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
