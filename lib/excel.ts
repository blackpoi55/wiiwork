import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import type { Quotation } from "./types";
import { computeTotals, itemLabel, lineAmount } from "./totals";
import { bahtText } from "./thai";
import { resolveText } from "./placeholders";
import { LEADING_BLANK_ROWS, printedItemRows } from "./layout";

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

/** ตำแหน่งแถวทั้งหมดของฟอร์ม คำนวณจากจำนวนบรรทัดหัวเอกสารและจำนวนแถวรายการ */
export function sheetRows(q: Quotation) {
  const filled = q.items.filter((i) => i.description.trim() || i.qty || i.unitPrice);
  const itemRows = printedItemRows(q.infoRows.length, filled.length, q.minRows);

  const infoStart = 7;
  const infoEnd = infoStart + q.infoRows.length - 1;
  const head1 = infoEnd + 1;
  const head2 = head1 + 1;
  const itemStart = head2 + 1;
  const itemEnd = itemStart + itemRows - 1;
  const fee = itemEnd + 1;
  const sub = fee + 1;
  const vat = sub + 1;
  const grand = vat + 1;

  return {
    filled,
    itemRows,
    infoStart,
    infoEnd,
    head1,
    head2,
    itemStart,
    itemEnd,
    fee,
    sub,
    vat,
    grand,
    note: grand + 2,
    approver: grand + 4,
    approverDate: grand + 5,
    signer: grand + 6,
  };
}

/** วางฟอร์มใบเสนอราคาหนึ่งใบลงใน worksheet ที่ให้มา */
export function writeQuotationSheet(
  ws: ExcelJS.Worksheet,
  q: Quotation,
  images: { logo?: number; signature?: number },
): void {
  const totals = computeTotals(q);
  const R = sheetRows(q);
  const text = (value: string) => resolveText(q, value);

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

  for (let r = 1; r <= R.signer + 2; r++) ws.getRow(r).height = 21;
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
  for (const a of ["C2", "D2", "E2"]) {
    set(a, undefined, undefined, undefined, { bottom: thin(BLACK) });
  }
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
  q.infoRows.forEach((row, i) => {
    const r = R.infoStart + i;
    const top = i === 0 ? thin() : undefined;
    const bottom = i === q.infoRows.length - 1 ? thin() : undefined;
    const cellBorder = (extra: BorderStyle = {}): BorderStyle => ({
      ...(top ? { top } : {}),
      ...(bottom ? { bottom } : {}),
      ...extra,
    });

    set(
      `A${r}`,
      text(row.leftLabel),
      ang(16, true),
      { horizontal: "right" },
      cellBorder({ left: thin(), right: thin() }),
    );
    set(
      `B${r}`,
      text(row.leftValue),
      ang(16, row.leftBold),
      undefined,
      cellBorder({ left: thin(), right: thin() }),
    );
    set(
      `C${r}`,
      text(row.rightLabel),
      ang(16, true),
      undefined,
      cellBorder({ left: thin(), right: thin() }),
    );
    set(
      `D${r}`,
      text(row.rightValue),
      ang(16),
      { horizontal: "left" },
      cellBorder({ left: thin() }),
      "@",
    );
    set(`E${r}`, undefined, ang(16), undefined, cellBorder());
    set(`F${r}`, undefined, ang(16), undefined, cellBorder({ right: thin() }));
  });

  /* ------------------------------ หัวตารางรายการ ------------------------------ */
  const heads = ["ลำดับ", "รายการ", "หน่วย", "จำนวน ", "ราคา/หน่วย", "จำนวนเงิน"];
  heads.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    set(`${col}${R.head1}`, h, ang(16, true), { horizontal: "center" }, {
      left: thin(),
      right: thin(),
    });
    set(`${col}${R.head2}`, i >= 4 ? "(บาท)" : undefined, ang(16, true), { horizontal: "center" }, {
      left: thin(),
      right: thin(),
      bottom: thin(),
    });
  });

  /* -------------------------------- แถวรายการ ------------------------------- */
  const visible = R.filled.slice(0, Math.max(0, R.itemRows - LEADING_BLANK_ROWS));
  for (let r = R.itemStart; r <= R.itemEnd; r++) {
    const index = r - R.itemStart - LEADING_BLANK_ROWS;
    const item = index >= 0 ? visible[index] : undefined;
    const cellBorder: BorderStyle = {
      left: thin(BLACK),
      right: thin(BLACK),
      top: r === R.itemStart ? thin() : hair(),
      ...(r === R.itemEnd ? {} : { bottom: hair() }),
    };

    set(`A${r}`, item ? index + 1 : undefined, ang(16), undefined, cellBorder);
    set(
      `B${r}`,
      item ? itemLabel(index + 1, text(item.description)) : undefined,
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
  ws.mergeCells(`D${R.fee}:E${R.fee}`);
  ws.mergeCells(`D${R.sub}:E${R.sub}`);
  ws.mergeCells(`D${R.vat}:E${R.vat}`);
  ws.mergeCells(`D${R.grand}:E${R.grand}`);
  ws.mergeCells(`A${R.grand}:C${R.grand}`);

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

  const totalCell = (
    row: number,
    label: string,
    value: ExcelJS.CellValue,
    bold: boolean,
    border: BorderStyle,
  ) => {
    set(`D${row}`, label, ang(16, bold), { horizontal: "center", vertical: "middle" }, border);
    const f = ws.getCell(`F${row}`);
    f.value = value;
    f.font = ang(16, bold);
    f.numFmt = ACCOUNTING;
    f.alignment = { horizontal: "right" };
    f.border = border;
  };

  const boxAll: BorderStyle = {
    left: thin(BLACK),
    right: thin(BLACK),
    top: thin(BLACK),
    bottom: thin(BLACK),
  };

  totalLeft(R.fee, { left: thin(BLACK), right: thin(BLACK), top: thin(BLACK), bottom: hair() });
  totalCell(
    R.fee,
    "ค่าดำเนินการ",
    q.operationFeeMode === "manual"
      ? totals.operationFee
      : ({
          formula: `SUM(F${R.itemStart}:F${R.itemEnd})*${(q.operationFeeRate ?? 10) / 100}`,
          result: totals.operationFee,
        } as ExcelJS.CellFormulaValue),
    false,
    boxAll,
  );

  totalLeft(R.sub, { left: thin(BLACK), right: thin(BLACK), top: hair(), bottom: hair(BLACK) });
  totalCell(
    R.sub,
    " รวมเป็นจำนวนเงิน",
    { formula: `SUM(F${R.itemStart}:F${R.fee})`, result: totals.subTotal } as ExcelJS.CellFormulaValue,
    true,
    boxAll,
  );

  totalLeft(R.vat, { left: thin(), right: thin(), bottom: thin() });
  totalCell(
    R.vat,
    `ภาษีมูลค่าเพิ่ม ${q.vatRate}%`,
    {
      formula: q.includeVat ? `SUM(F${R.sub}*${q.vatRate}/100)` : "0",
      result: totals.vat,
    } as ExcelJS.CellFormulaValue,
    true,
    { left: thin(), right: thin(), top: thin(BLACK), bottom: thin() },
  );

  const dbl: ExcelJS.Border = { style: "double", color: { argb: NAVY } };
  const grandBorder: BorderStyle = { left: thin(), right: thin(), top: thin(), bottom: dbl };
  const a = ws.getCell(`A${R.grand}`);
  a.value = {
    formula: `BAHTTEXT(F${R.grand})`,
    result: bahtText(totals.grandTotal),
  } as ExcelJS.CellFormulaValue;
  a.font = ang(16, true);
  a.alignment = { horizontal: "center" };
  a.border = grandBorder;
  ws.getCell(`C${R.grand}`).border = { right: thin(), top: thin(), bottom: dbl };
  totalCell(
    R.grand,
    "รวมเป็นจำนวนเงินทั้งสิ้น",
    { formula: `SUM(F${R.sub}:F${R.vat})`, result: totals.grandTotal } as ExcelJS.CellFormulaValue,
    true,
    grandBorder,
  );

  /* -------------------------------- ท้ายเอกสาร ------------------------------- */
  set(`B${R.note}`, "จึงเรียนมาเพื่อทราบและโปรดพิจารณาอนุมัติ", ang(16, true));
  set(`A${R.approver}`, "ผู้อนุมัติ", ang(16, true), { horizontal: "right" });
  set(`B${R.approver}`, undefined, ang(16, true), undefined, { bottom: hair(BLACK) });
  set(`E${R.approver}`, "ขอแสดงความนับถือ", ang(16));
  set(`A${R.approverDate}`, "             วันที่", ang(16, true));
  set(`B${R.approverDate}`, undefined, ang(16, true), undefined, { bottom: hair(BLACK) });
  set(`E${R.signer}`, `       (${q.quoterName} )`, ang(16));

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
      tl: { col: 4.25, row: R.grand + 4.35 } as ExcelJS.Anchor,
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
    try {
      const buf = await fs.readFile(path.join(publicDir, file.replace(/^\//, "")));
      return wb.addImage({
        buffer: new Uint8Array(buf) as unknown as ExcelJS.Buffer,
        extension: "png",
      });
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
  writeQuotationSheet(ws, q, await loadBrandImages(wb, q));
  return Buffer.from(await wb.xlsx.writeBuffer());
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
    writeQuotationSheet(ws, q, await loadBrandImages(wb, q));
  }
  if (!quotations.length) wb.addWorksheet("ว่าง");
  return Buffer.from(await wb.xlsx.writeBuffer());
}
