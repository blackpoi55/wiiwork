import QuotationDocument from "@/components/QuotationDocument";
import { parseRef, readQuotation } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) return <div>ต้องระบุ ref</div>;

  const parsed = parseRef(ref);
  const quotation = await readQuotation(parsed);
  const encoded = encodeURIComponent(ref);

  return (
    <QuotationDocument
      quotation={quotation}
      photoSrc={(p) => `/api/photos/file?ref=${encoded}&file=${encodeURIComponent(p.file)}`}
    />
  );
}
