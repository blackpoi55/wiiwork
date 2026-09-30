import { NextResponse } from "next/server";
import {
  deleteQuotation,
  listExports,
  listPhotos,
  moveQuotation,
  parseRef,
  quotationExists,
  readQuotation,
  refFromQuotation,
  refToString,
  writeQuotation,
} from "@/lib/storage";
import type { Quotation } from "@/lib/types";

export const dynamic = "force-dynamic";

function refParam(req: Request): string {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) throw new Error("ต้องระบุ ref");
  return ref;
}

export async function GET(req: Request) {
  try {
    const ref = parseRef(refParam(req));
    const quotation = await readQuotation(ref);
    return NextResponse.json({
      ref: refToString(ref),
      quotation,
      photoFiles: await listPhotos(ref),
      exports: await listExports(ref),
    });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 404 });
  }
}

export async function PUT(req: Request) {
  try {
    const current = parseRef(refParam(req));
    const q = (await req.json()) as Quotation;
    if (!q.unit?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุห้อง/ยูนิต" }, { status: 400 });
    }
    const next = refFromQuotation(q);
    if (refToString(next) !== refToString(current)) {
      if (await quotationExists(next)) {
        return NextResponse.json(
          { error: "ปลายทาง (โครงการ/วันที่/ห้อง) มีใบเสนอราคาอยู่แล้ว" },
          { status: 409 },
        );
      }
      await moveQuotation(current, next);
    }
    await writeQuotation(next, { ...q, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ref: refToString(next) });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await deleteQuotation(parseRef(refParam(req)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}
