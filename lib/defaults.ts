import type { CompanyProfile, Preset, Quotation, Settings } from "./types";
import { todayISO } from "./thai";

export const DEFAULT_COMPANY: CompanyProfile = {
  nameTh: "บริษัท แฟร์ พลัส จำกัด  889/86   ถนนเสรีไทย 43 แขวงคลองกุ่ม เขตบึงกุ่ม กรุงเทพฯ 10240",
  nameEn: "FAIR PLUS  CO.,LTD.  889/86   serithai 43 Rd.Khongkum ,Buengkum,Bangkok 10240",
  addressTh: "",
  addressEn: "",
  phone: "โทร. 081-916-3129,089-279-3877 (อุทัย) โทร. 098-258-9610 (ไวทยะ)",
  email: "Email : fairplus63@hotmail.com",
  taxId: "0105563001201",
  logoFile: "/brand/logo.png",
  signatureFile: "/brand/signature.png",
};

export const DEFAULT_PRESETS: Preset[] = [
  { id: "p1", description: "งานซ่อมผนังร้าวขนาดทั่วไป __ จุด", unit: "ม.", unitPrice: 200 },
  { id: "p2", description: "งานซ่อมผนังร้าวขนาดใหญ่ __ จุด", unit: "ม.", unitPrice: 300 },
  { id: "p3", description: "งานซ่อมฝ้าเพดานริมผนังทั่วบริเวณ", unit: "ม.", unitPrice: 100 },
  { id: "p4", description: "งานทาสีผนังภายใน", unit: "ตร.ม.", unitPrice: 150 },
  { id: "p5", description: "งานทาสีเพดาน", unit: "ตร.ม.", unitPrice: 150 },
  { id: "p6", description: "เก็บขยะขนทิ้งพร้อมความสะอาด", unit: "งาน", unitPrice: 500 },
];

export const DEFAULT_SETTINGS: Settings = {
  company: DEFAULT_COMPANY,
  defaultQuoterName: "อุทัย  ศรีบุญ",
  defaultCustomerName: "นิติบุคคลอาคารชุดลุมพินี วิลล์ จรัญฯ - ไฟฉาย",
  defaultProjectName: "จรัญ22",
  defaultConditions: ["1. ราคานี้รวมค่าวัสดุและค่าแรงแล้ว", "2.รวมภาษีมูลค่าเพิ่ม 7 %"],
  /** ค่าดำเนินการคิด 10% ของยอดรวมรายการ (ตรงกับใบเก่าทั้ง 120 ใบ) */
  defaultOperationFee: 10,
  vatRate: 7,
  presets: DEFAULT_PRESETS,
};

export const UNITS = ["ม.", "ตร.ม.", "งาน", "จุด", "ชุด", "ตัว", "แผ่น", "เมตร", "ลบ.ม."];

export function newQuotation(settings: Settings): Quotation {
  const now = new Date().toISOString();
  return {
    date: todayISO(),
    projectName: settings.defaultProjectName,
    projectSlug: settings.defaultProjectName,
    unit: "",

    docNo: "FP/Q. -/2563",
    customerName: settings.defaultCustomerName,
    addressLine: "",
    poRef: "",
    quoterName: settings.defaultQuoterName,

    detailLabel: "รายละเอียด",
    detailValue: "เสนอราคางานซ่อมแซมปรับปรุง",
    workTypeLabel: "งานทาสี",
    workTypeValue: "งานซ่อมปรับปรุงซ่อมแซม เนื่องจากภัยภิบัติ แผ่นดินไหว",
    incidentDate: "ณ.วันที่ 28 มีนาคม 2568",
    attachmentLabel: "สิ่งที่ส่งมาด้วย",
    attachmentValue: "เอกสารภาพความเสียหาย แนบประกอบจำนวน 0 แผ่น",
    conditions: [...settings.defaultConditions],

    items: [],
    minRows: 11,
    operationFeeMode: "auto",
    operationFeeRate: settings.defaultOperationFee,
    operationFee: 0,
    vatRate: settings.vatRate,
    includeVat: true,

    photos: [],
    photosPerPage: 6,

    company: { ...settings.company },

    createdAt: now,
    updatedAt: now,
  };
}
