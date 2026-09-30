/**
 * พิกัดและการคำนวณพื้นที่ของฟอร์มใบเสนอราคา (หน่วย pt ตามไฟล์ต้นฉบับ)
 * ใช้ร่วมกันทั้งตอนเรนเดอร์เอกสาร ตอนสร้าง Excel และตอนบอกผู้ใช้ว่าใส่ได้อีกกี่แถว
 */

export const PAGE_W = 595.2;
export const PAGE_H = 841.8;

/** ขอบบนของตารางหลัก */
export const TABLE_TOP = 164.5;
export const TABLE_LEFT = 51.6;
export const TABLE_W = 488.5;

/** ความสูงหนึ่งแถว */
export const ROW_H = 17.9;
/** หัวตารางรายการสูงสองแถว */
export const HEAD_H = ROW_H * 2;
/** แถวสรุปยอด: ค่าดำเนินการ / รวม / VAT / รวมทั้งสิ้น */
export const TOTAL_ROWS = 4;
/** แถวว่างก่อนรายการแรก (ตามฟอร์มเดิม) */
export const LEADING_BLANK_ROWS = 1;

/** ความสูงบล็อกลายเซ็นท้ายเอกสาร วัดจากขอบล่างของตาราง */
export const FOOTER_H = 104.5;
/** เผื่อขอบล่างกระดาษ */
export const BOTTOM_MARGIN = 24;

export const COL_W = [56.1, 227.0, 57.6, 49.6, 49.1, 49.1];

/** จำนวนแถวรายการมากที่สุดที่ยังพิมพ์ลงกระดาษ A4 หนึ่งแผ่นได้ */
export function itemRowCapacity(infoRowCount: number): number {
  const available = PAGE_H - TABLE_TOP - BOTTOM_MARGIN - FOOTER_H;
  const used = infoRowCount * ROW_H + HEAD_H + TOTAL_ROWS * ROW_H;
  return Math.max(1, Math.floor((available - used) / ROW_H));
}

/** จำนวนรายการงานที่ใส่ได้ (หักแถวว่างหัวตารางออกแล้ว) */
export function maxItems(infoRowCount: number): number {
  return Math.max(1, itemRowCapacity(infoRowCount) - LEADING_BLANK_ROWS);
}

/** จำนวนแถวรายการที่จะพิมพ์จริง — ขยายตามจำนวนรายการ แต่ไม่ต่ำกว่าค่าขั้นต่ำ */
export function printedItemRows(
  infoRowCount: number,
  filledItems: number,
  minRows: number,
): number {
  const wanted = Math.max(minRows, filledItems + LEADING_BLANK_ROWS);
  return Math.min(wanted, itemRowCapacity(infoRowCount));
}

/** ตัวเลือกรูปแบบหน้ารูปภาพ */
export const PHOTO_LAYOUTS = {
  2: { cols: 1, rows: 2, label: "2 รูป (1×2) — รูปใหญ่สุด" },
  4: { cols: 2, rows: 2, label: "4 รูป (2×2) — รูปใหญ่" },
  6: { cols: 2, rows: 3, label: "6 รูป (2×3) — แบบเดิม" },
  9: { cols: 3, rows: 3, label: "9 รูป (3×3) — รูปเล็ก" },
} as const;

export type PhotosPerPage = keyof typeof PHOTO_LAYOUTS;

/** กรอบรูปทั้งหมดกินพื้นที่เท่าเดิมเสมอ (ตามไฟล์ต้นฉบับ) แล้วหารตามจำนวนช่อง */
export const PHOTO_GRID = { left: 72, top: 72.25, width: 451.15, height: 679.05 };

export function photoCellSize(perPage: PhotosPerPage) {
  const { cols, rows } = PHOTO_LAYOUTS[perPage];
  return {
    cols,
    rows,
    cellW: PHOTO_GRID.width / cols,
    cellH: PHOTO_GRID.height / rows,
  };
}
