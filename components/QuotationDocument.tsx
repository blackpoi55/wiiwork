import type { Photo, Quotation } from "@/lib/types";
import { computeTotals, itemLabel, lineAmount } from "@/lib/totals";
import { bahtText, money, thaiDate } from "@/lib/thai";
import s from "./QuotationDocument.module.css";

/** จำนวนแถวว่างก่อนรายการแรก (ตรงกับฟอร์ม Excel เดิมที่เว้นแถว 17 ไว้) */
const LEADING_BLANK_ROWS = 1;

const COLS = [56.1, 227.0, 57.6, 49.6, 49.1, 49.1];

export type PhotoSrc = (photo: Photo) => string;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function Cell({
  className,
  children,
  colSpan,
  rowSpan,
  style,
}: {
  className?: string;
  children?: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td className={className} colSpan={colSpan} rowSpan={rowSpan} style={style}>
      <span>{children ?? " "}</span>
    </td>
  );
}

export default function QuotationDocument({
  quotation,
  photoSrc,
}: {
  quotation: Quotation;
  photoSrc: PhotoSrc;
}) {
  const q = quotation;
  const totals = computeTotals(q);
  const company = q.company;

  const filled = q.items.filter((i) => i.description.trim() || i.qty || i.unitPrice);
  const blanksAfter = Math.max(0, q.minRows - LEADING_BLANK_ROWS - filled.length);

  const photos = [...q.photos].sort((a, b) => a.order - b.order);
  const photoPages = chunk(photos, q.photosPerPage);
  const cols = q.photosPerPage === 4 ? 2 : 2;
  const rows = q.photosPerPage === 4 ? 2 : 3;
  const cellW = q.photosPerPage === 4 ? 225.4 : 225.4;
  const cellH = q.photosPerPage === 4 ? 339.5 : 226.5;

  return (
    <div className={`${s.doc} ${s.ang}`}>
      {/* ------------------------------ หน้า 1: ฟอร์ม ----------------------------- */}
      <div className={s.page}>
        {company.logoFile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.logo} src={company.logoFile} alt="" />
        ) : null}

        <div
          className={`${s.abs} ${s.tahoma}`}
          style={{ left: "109.5pt", top: "74.9pt", fontSize: "7.7pt" }}
        >
          <b>{company.nameTh}</b>
        </div>
        <div
          className={`${s.abs} ${s.tahoma}`}
          style={{ left: "109.5pt", top: "92.8pt", fontSize: "7.7pt" }}
        >
          <b>{company.nameEn}</b>
        </div>
        <div
          className={`${s.abs} ${s.tahoma}`}
          style={{ left: "109.1pt", top: "112.6pt", fontSize: "6.8pt" }}
        >
          {company.phone}
        </div>
        <div
          className={`${s.abs} ${s.tahoma}`}
          style={{ left: "394.3pt", top: "112.6pt", fontSize: "6.8pt", fontWeight: 700 }}
        >
          หมายเลขประจำตัวผู้เสียภาษี {company.taxId}
        </div>
        <div
          className={`${s.abs} ${s.tahoma}`}
          style={{ left: "109.5pt", top: "126.4pt", fontSize: "9.4pt" }}
        >
          {company.email}
        </div>
        <div className={s.abs} style={{ left: "393.9pt", top: "128pt", fontSize: "8.5pt" }}>
          เอกสารเลขที่
        </div>
        <div
          className={s.abs}
          style={{ left: "443pt", top: "128pt", fontSize: "8.5pt", fontWeight: 700 }}
        >
          {q.docNo}
        </div>
        <div className={s.docNoRule} />

        <div className={s.title}>ใบขอเสนอราคา</div>

        <table className={s.table}>
          <colgroup>
            {COLS.map((w, i) => (
              <col key={i} style={{ width: `${w}pt` }} />
            ))}
          </colgroup>
          <tbody>
            {/* ---------------------------- บล็อกข้อมูลหัวเรื่อง --------------------------- */}
            <tr>
              <Cell className={s.labelL}>เสนอต่อ</Cell>
              <Cell className={s.valueL}>{q.customerName}</Cell>
              <Cell className={s.labelR}>อ้างถึง P/O No.</Cell>
              <Cell className={s.valueR} colSpan={3}>
                {q.poRef}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL} />
              <Cell className={`${s.valueL} ${s.bold}`}>{q.addressLine}</Cell>
              <Cell className={s.labelR}>วันที่</Cell>
              <Cell className={s.valueR} colSpan={3}>
                {thaiDate(q.date)}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL} />
              <Cell className={s.valueL} />
              <Cell className={s.labelR}>ผู้ขอเสนอราคา</Cell>
              <Cell className={s.valueR} colSpan={3}>
                {q.quoterName}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL} />
              <Cell className={s.valueL} />
              <Cell className={s.labelR} />
              <Cell className={s.valueR} colSpan={3} />
            </tr>
            <tr>
              <Cell className={s.labelL}>{q.detailLabel}</Cell>
              <Cell className={s.valueL}>{q.detailValue}</Cell>
              <Cell className={s.labelR}>เงื่อนไข</Cell>
              <Cell className={s.valueR} colSpan={3}>
                {q.conditions[0]}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL}>{q.workTypeLabel}</Cell>
              <Cell className={`${s.valueL} ${s.bold}`}>{q.workTypeValue}</Cell>
              <Cell className={s.labelR} />
              <Cell className={s.valueR} colSpan={3}>
                {q.conditions[1]}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL} />
              <Cell className={`${s.valueL} ${s.bold}`}>{q.incidentDate}</Cell>
              <Cell className={s.labelR} />
              <Cell className={s.valueR} colSpan={3}>
                {q.conditions[2]}
              </Cell>
            </tr>
            <tr>
              <Cell className={s.labelL}>{q.attachmentLabel}</Cell>
              <Cell className={`${s.valueL} ${s.bold}`}>{q.attachmentValue}</Cell>
              <Cell className={s.labelR} />
              <Cell className={s.valueR} colSpan={3}>
                {q.conditions[3]}
              </Cell>
            </tr>

            {/* ------------------------------- หัวตารางรายการ ------------------------------ */}
            <tr style={{ height: "35.8pt" }}>
              <td className={s.headCell} style={{ height: "35.8pt" }}>
                <span>ลำดับ</span>
              </td>
              <td className={s.headCell}>
                <span>รายการ</span>
              </td>
              <td className={s.headCell}>
                <span>หน่วย</span>
              </td>
              <td className={s.headCell}>
                <span>จำนวน </span>
              </td>
              <td className={`${s.headCell} ${s.headTwoLine}`}>
                <span>
                  ราคา/หน่วย
                  <br />
                  (บาท)
                </span>
              </td>
              <td className={`${s.headCell} ${s.headTwoLine}`}>
                <span>
                  จำนวนเงิน
                  <br />
                  (บาท)
                </span>
              </td>
            </tr>

            {/* -------------------------------- แถวรายการ -------------------------------- */}
            {Array.from({ length: LEADING_BLANK_ROWS }).map((_, i) => (
              <tr key={`lead-${i}`}>
                <Cell className={s.rightTight} />
                <Cell className={s.desc} />
                <Cell className={s.center} />
                <Cell className={s.rightTight} />
                <Cell className={s.right} />
                <Cell className={s.dash}>-</Cell>
              </tr>
            ))}
            {filled.map((item, i) => (
              <tr key={item.id}>
                <Cell className={s.rightTight}>{i + 1}</Cell>
                <Cell className={s.desc}>{itemLabel(i + 1, item.description)}</Cell>
                <Cell className={s.center}>{item.unit}</Cell>
                <Cell className={s.rightTight}>{item.qty || ""}</Cell>
                <Cell className={s.right}>{item.unitPrice ? money(item.unitPrice) : ""}</Cell>
                <Cell className={s.right}>{money(lineAmount(item))}</Cell>
              </tr>
            ))}
            {Array.from({ length: blanksAfter }).map((_, i) => (
              <tr key={`tail-${i}`}>
                <Cell className={s.rightTight} />
                <Cell className={s.desc} />
                <Cell className={s.center} />
                <Cell className={s.rightTight} />
                <Cell className={s.right} />
                <Cell className={s.dash}>-</Cell>
              </tr>
            ))}

            {/* ---------------------------------- สรุปยอด --------------------------------- */}
            <tr>
              <Cell colSpan={3} />
              <Cell className={s.center} colSpan={2}>
                ค่าดำเนินการ
              </Cell>
              <Cell className={s.right}>{money(totals.operationFee)}</Cell>
            </tr>
            <tr>
              <Cell colSpan={3} />
              <Cell className={`${s.center} ${s.bold}`} colSpan={2}>
                {" "}
                รวมเป็นจำนวนเงิน
              </Cell>
              <Cell className={`${s.right} ${s.bold}`}>{money(totals.subTotal)}</Cell>
            </tr>
            <tr>
              <Cell colSpan={3} />
              <Cell className={`${s.center} ${s.bold}`} colSpan={2}>
                ภาษีมูลค่าเพิ่ม {q.vatRate}%
              </Cell>
              <Cell className={`${s.right} ${s.bold}`}>{money(totals.vat)}</Cell>
            </tr>
            <tr>
              <Cell className={`${s.center} ${s.bold}`} colSpan={3}>
                {bahtText(totals.grandTotal)}
              </Cell>
              <Cell className={`${s.center} ${s.bold}`} colSpan={2}>
                รวมเป็นจำนวนเงินทั้งสิ้น
              </Cell>
              <Cell className={`${s.right} ${s.bold}`}>{money(totals.grandTotal)}</Cell>
            </tr>
          </tbody>
        </table>

        <div className={`${s.abs} ${s.note}`}>จึงเรียนมาเพื่อทราบและโปรดพิจารณาอนุมัติ</div>
        <div className={`${s.abs} ${s.approver}`}>ผู้อนุมัติ</div>
        <div className={`${s.abs} ${s.approverDate}`}>วันที่</div>
        <div className={s.ruleA} />
        <div className={s.ruleB} />
        <div className={`${s.abs} ${s.regards}`}>ขอแสดงความนับถือ</div>
        {company.signatureFile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={s.signature} src={company.signatureFile} alt="" />
        ) : null}
        <div className={`${s.abs} ${s.signerName}`}>{`       (${q.quoterName} )`}</div>
      </div>

      {/* ----------------------------- หน้ารูปความเสียหาย ---------------------------- */}
      {photoPages.map((pagePhotos, pageIndex) => (
        <div className={s.page} key={`photo-page-${pageIndex}`}>
          <table className={s.photoTable}>
            <tbody>
              {Array.from({ length: rows }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: cols }).map((__, c) => {
                    const photo = pagePhotos[r * cols + c];
                    return (
                      <td
                        key={c}
                        className={s.photoCell}
                        style={{
                          width: `${cellW}pt`,
                          height: `${cellH}pt`,
                          boxSizing: "border-box",
                        }}
                      >
                        {photo ? (
                          <div className={s.photoBox}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className={s.photoImg} src={photoSrc(photo)} alt="" />
                            {photo.caption?.trim() ? (
                              <div className={s.photoCaption}>{photo.caption}</div>
                            ) : null}
                          </div>
                        ) : (
                          <div className={s.photoBox} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
