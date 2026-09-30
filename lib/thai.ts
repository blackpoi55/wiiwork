const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** "2026-05-20" -> "20 พฤษภาคม 2569" */
export function thaiDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** "2026-05-20" -> "20 พ.ค. 69" */
export function thaiDateShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${String((y + 543) % 100).padStart(2, "0")}`;
}

/** "2026-05" -> "พฤษภาคม 2569" */
export function thaiMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function readInteger(nStr: string): string {
  if (nStr === "0") return "ศูนย์";
  // จัดการหลักล้านแบบซ้อนชั้น
  if (nStr.length > 7) {
    const head = nStr.slice(0, nStr.length - 6);
    const tail = nStr.slice(nStr.length - 6);
    return readInteger(head) + "ล้าน" + (Number(tail) === 0 ? "" : readInteger(tail));
  }
  let out = "";
  const len = nStr.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(nStr[i]);
    const place = len - i - 1;
    if (digit === 0) continue;
    if (place === 0 && digit === 1 && len > 1) out += "เอ็ด";
    else if (place === 1 && digit === 1) out += "สิบ";
    else if (place === 1 && digit === 2) out += "ยี่สิบ";
    else out += DIGITS[digit] + PLACES[place];
  }
  return out;
}

/** 3295.6 -> "สามพันสองร้อยเก้าสิบห้าบาทหกสิบสตางค์" */
export function bahtText(amount: number): string {
  if (!isFinite(amount)) return "";
  const negative = amount < 0;
  const value = Math.abs(Math.round(amount * 100) / 100);
  const baht = Math.floor(value);
  const satang = Math.round((value - baht) * 100);

  let text = "";
  if (baht === 0 && satang === 0) return "ศูนย์บาทถ้วน";
  if (baht > 0) text += readInteger(String(baht)) + "บาท";
  if (satang > 0) {
    if (baht === 0) text += readInteger(String(satang)) + "สตางค์";
    else text += readInteger(String(satang)) + "สตางค์";
  } else {
    text += "ถ้วน";
  }
  return (negative ? "ลบ" : "") + text;
}

export function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function qtyText(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}
