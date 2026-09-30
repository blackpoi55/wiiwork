import type { LineItem, Quotation } from "./types";

export function lineAmount(item: LineItem): number {
  return round2((item.qty || 0) * (item.unitPrice || 0));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * ข้อความในคอลัมน์ "รายการ" — เติมคำนำหน้า "งานที่ N." ให้อัตโนมัติ
 * ถ้าผู้ใช้พิมพ์คำนำหน้ามาเองแล้ว จะตัดของเดิมออกก่อน กันเลขซ้ำ
 */
export function itemLabel(index: number, description: string): string {
  const clean = description.replace(/^\s*งานที่\s*\d+\s*\.?\s*/, "").trim();
  return `งานที่ ${index}. ${clean}`;
}

export type Totals = {
  itemsTotal: number;
  operationFee: number;
  subTotal: number;
  vat: number;
  grandTotal: number;
};

export function computeTotals(q: Quotation): Totals {
  const itemsTotal = round2(
    q.items.reduce((sum, item) => sum + lineAmount(item), 0),
  );
  const operationFee =
    q.operationFeeMode === "manual"
      ? round2(q.operationFee || 0)
      : round2((itemsTotal * (q.operationFeeRate ?? 10)) / 100);
  const subTotal = round2(itemsTotal + operationFee);
  const vat = q.includeVat ? round2((subTotal * (q.vatRate || 0)) / 100) : 0;
  const grandTotal = round2(subTotal + vat);
  return { itemsTotal, operationFee, subTotal, vat, grandTotal };
}
