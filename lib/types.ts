export type LineItem = {
  id: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: number;
};

export type Photo = {
  id: string;
  /** ชื่อไฟล์ภายในโฟลเดอร์ photos/ */
  file: string;
  caption: string;
  /** ลำดับการเรียงในรายงาน */
  order: number;
};

export type CompanyProfile = {
  nameTh: string;
  nameEn: string;
  addressTh: string;
  addressEn: string;
  phone: string;
  email: string;
  taxId: string;
  logoFile: string;
  signatureFile: string;
};

export type Quotation = {
  /** yyyy-MM-dd (ค.ศ.) */
  date: string;
  projectName: string;
  projectSlug: string;
  unit: string;

  docNo: string;
  customerName: string;
  addressLine: string;
  poRef: string;
  quoterName: string;

  detailLabel: string;
  detailValue: string;
  workTypeLabel: string;
  workTypeValue: string;
  incidentDate: string;
  attachmentLabel: string;
  attachmentValue: string;
  conditions: string[];

  items: LineItem[];
  /** จำนวนแถวรายการขั้นต่ำที่พิมพ์ (เว้นบรรทัดว่างเหมือนฟอร์มเดิม) */
  minRows: number;
  /** auto = คิดเป็น % ของยอดรวมรายการ (ฟอร์มเดิมใช้ 10%), manual = พิมพ์เอง */
  operationFeeMode: "auto" | "manual";
  operationFeeRate: number;
  operationFee: number;
  vatRate: number;
  includeVat: boolean;

  photos: Photo[];
  photosPerPage: 4 | 6;

  company: CompanyProfile;

  createdAt: string;
  updatedAt: string;
};

export type QuotationRef = {
  projectSlug: string;
  month: string; // yyyy-MM
  date: string; // yyyy-MM-dd
  unitSlug: string;
};

export type QuotationSummary = QuotationRef & {
  ref: string;
  projectName: string;
  unit: string;
  customerName: string;
  docNo: string;
  grandTotal: number;
  photoCount: number;
  itemCount: number;
  updatedAt: string;
  exports: string[];
};

export type Preset = {
  id: string;
  description: string;
  unit: string;
  unitPrice: number;
};

export type Settings = {
  company: CompanyProfile;
  defaultQuoterName: string;
  defaultCustomerName: string;
  defaultProjectName: string;
  defaultConditions: string[];
  defaultOperationFee: number;
  vatRate: number;
  presets: Preset[];
};
