import { NextResponse } from "next/server";
import {
  ensureDataRoot,
  listAllQuotations,
  quotationExists,
  refFromQuotation,
  refToString,
  writeQuotation,
} from "@/lib/storage";
import type { Quotation } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDataRoot();
  return NextResponse.json(await listAllQuotations());
}

export async function POST(req: Request) {
  const q = (await req.json()) as Quotation;
  if (!q.unit?.trim()) {
    return NextResponse.json({ error: "กรุณาระบุห้อง/ยูนิต" }, { status: 400 });
  }
  const ref = refFromQuotation(q);
  if (await quotationExists(ref)) {
    return NextResponse.json(
      { error: "มีใบเสนอราคาของห้องนี้ในวันที่นี้อยู่แล้ว", ref: refToString(ref) },
      { status: 409 },
    );
  }
  const now = new Date().toISOString();
  await writeQuotation(ref, { ...q, createdAt: now, updatedAt: now });
  return NextResponse.json({ ref: refToString(ref) });
}
