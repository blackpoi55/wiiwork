import { NextResponse } from "next/server";
import { parseRef } from "@/lib/storage";
import { exportQuotation } from "@/lib/exporter";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = parseRef(url.searchParams.get("ref") ?? "");
    const host = req.headers.get("host") ?? url.host;
    const origin = `http://${host}`;
    const result = await exportQuotation(ref, origin);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
