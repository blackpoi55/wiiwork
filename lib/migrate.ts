import type { InfoRow, Quotation, Settings } from "./types";
import {
  DEFAULT_SETTINGS,
  defaultInfoRows,
  makeInfoRow,
  newQuotation,
} from "./defaults";
import { PHOTO_LAYOUTS, type PhotosPerPage } from "./layout";

/** แปลงใบเสนอราคาที่บันทึกด้วยโครงสร้างเดิม (4 บรรทัดตายตัว + conditions) มาเป็น infoRows */
function infoRowsFromLegacy(q: Quotation): InfoRow[] {
  const conditions = q.conditions ?? [];
  const attachment = (q.attachmentValue ?? "").replace(
    /(จำนวน\s*)\d*(\s*แผ่น)/,
    "$1{{จำนวนแผ่นรูป}}$2",
  );
  return [
    makeInfoRow({
      leftLabel: "เสนอต่อ",
      leftValue: "{{ลูกค้า}}",
      rightLabel: "อ้างถึง P/O No.",
      rightValue: "{{PO}}",
    }),
    makeInfoRow({
      leftValue: "{{ที่อยู่}}",
      leftBold: true,
      rightLabel: "วันที่",
      rightValue: "{{วันที่}}",
    }),
    makeInfoRow({ rightLabel: "ผู้ขอเสนอราคา", rightValue: "{{ผู้ขอเสนอราคา}}" }),
    makeInfoRow(),
    makeInfoRow({
      leftLabel: q.detailLabel ?? "รายละเอียด",
      leftValue: q.detailValue ?? "",
      rightLabel: "เงื่อนไข",
      rightValue: conditions[0] ?? "",
    }),
    makeInfoRow({
      leftLabel: q.workTypeLabel ?? "",
      leftValue: q.workTypeValue ?? "",
      leftBold: true,
      rightValue: conditions[1] ?? "",
    }),
    makeInfoRow({
      leftValue: q.incidentDate ?? "",
      leftBold: true,
      rightValue: conditions[2] ?? "",
    }),
    makeInfoRow({
      leftLabel: q.attachmentLabel ?? "สิ่งที่ส่งมาด้วย",
      leftValue: attachment,
      leftBold: true,
      rightValue: conditions[3] ?? "",
    }),
  ];
}

function validPhotosPerPage(value: unknown): PhotosPerPage {
  const n = Number(value);
  return (n in PHOTO_LAYOUTS ? n : 6) as PhotosPerPage;
}

/** เติมค่าที่ขาดและแปลงโครงสร้างเก่าให้ใช้กับระบบปัจจุบันได้ */
export function migrateQuotation(raw: Quotation, settings: Settings): Quotation {
  const base = newQuotation(settings);
  const merged: Quotation = {
    ...base,
    ...raw,
    company: { ...base.company, ...(raw.company ?? {}) },
    items: raw.items ?? [],
    photos: raw.photos ?? [],
    operationFeeMode: raw.operationFeeMode ?? "auto",
    operationFeeRate: raw.operationFeeRate ?? settings.defaultOperationFee,
    minRows: raw.minRows ?? base.minRows,
    photosPerPage: validPhotosPerPage(raw.photosPerPage),
    infoRows: raw.infoRows?.length ? raw.infoRows : infoRowsFromLegacy(raw),
  };
  merged.infoRows = merged.infoRows.map((r) => makeInfoRow(r));

  // ฟิลด์รุ่นเก่าไม่ต้องเก็บต่อแล้ว
  delete merged.detailLabel;
  delete merged.detailValue;
  delete merged.workTypeLabel;
  delete merged.workTypeValue;
  delete merged.incidentDate;
  delete merged.attachmentLabel;
  delete merged.attachmentValue;
  delete merged.conditions;

  return merged;
}

export function migrateSettings(raw: Partial<Settings>): Settings {
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...raw,
    company: { ...DEFAULT_SETTINGS.company, ...(raw.company ?? {}) },
    presets: raw.presets ?? DEFAULT_SETTINGS.presets,
    defaultInfoRows: raw.defaultInfoRows?.length ? raw.defaultInfoRows : defaultInfoRows(),
  };
  if (!raw.defaultInfoRows?.length && raw.defaultConditions?.length) {
    // ย้ายเงื่อนไขเดิมเข้าไปในบล็อกหัวเอกสารแบบใหม่
    const rows = defaultInfoRows();
    raw.defaultConditions.slice(0, 4).forEach((text, i) => {
      if (rows[4 + i]) rows[4 + i].rightValue = text;
    });
    merged.defaultInfoRows = rows;
  }
  delete merged.defaultConditions;
  return merged;
}
