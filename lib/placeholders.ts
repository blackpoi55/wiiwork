import type { Quotation } from "./types";
import { thaiDate } from "./thai";

/**
 * ตัวแปรที่พิมพ์แทรกในช่องข้อความของบล็อกหัวเอกสารได้
 * ระบบจะแทนค่าให้ตอนพิมพ์เอกสาร ทำให้ข้อความอัปเดตตามข้อมูลจริงเสมอ
 */
export const PLACEHOLDERS: { token: string; label: string; describe: string }[] = [
  { token: "{{ลูกค้า}}", label: "ลูกค้า", describe: "ชื่อผู้ที่เสนอต่อ" },
  { token: "{{ที่อยู่}}", label: "ที่อยู่", describe: "บรรทัดใต้ชื่อลูกค้า" },
  { token: "{{วันที่}}", label: "วันที่", describe: "วันที่ของใบเสนอราคา แบบไทย" },
  { token: "{{ผู้ขอเสนอราคา}}", label: "ผู้ขอเสนอราคา", describe: "ชื่อผู้เสนอราคา" },
  { token: "{{PO}}", label: "P/O No.", describe: "เลขที่ใบสั่งซื้อที่อ้างถึง" },
  { token: "{{ห้อง}}", label: "ห้อง", describe: "ห้อง/ยูนิต" },
  { token: "{{โครงการ}}", label: "โครงการ", describe: "ชื่อโครงการ" },
  { token: "{{เลขที่เอกสาร}}", label: "เลขที่เอกสาร", describe: "เลขที่เอกสาร" },
  {
    token: "{{จำนวนแผ่นรูป}}",
    label: "จำนวนแผ่นรูป",
    describe: "จำนวนหน้ารูปที่แนบ นับให้อัตโนมัติ",
  },
];

export function resolveText(q: Quotation, text: string): string {
  if (!text || !text.includes("{{")) return text ?? "";
  const photoPages = Math.ceil(q.photos.length / q.photosPerPage);
  const map: Record<string, string> = {
    "{{ลูกค้า}}": q.customerName,
    "{{ที่อยู่}}": q.addressLine,
    "{{PO}}": q.poRef,
    "{{วันที่}}": thaiDate(q.date),
    "{{ผู้ขอเสนอราคา}}": q.quoterName,
    "{{ห้อง}}": q.unit,
    "{{โครงการ}}": q.projectName,
    "{{เลขที่เอกสาร}}": q.docNo,
    "{{จำนวนแผ่นรูป}}": String(photoPages),
  };
  return text.replace(/\{\{[^}]*\}\}/g, (m) => map[m] ?? m);
}
