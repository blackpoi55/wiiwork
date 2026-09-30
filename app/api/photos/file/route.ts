import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { parseRef, photosDir, safeChild } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = parseRef(url.searchParams.get("ref") ?? "");
    const file = url.searchParams.get("file");
    if (!file) throw new Error("ต้องระบุ file");
    const buf = await fs.readFile(safeChild(photosDir(ref), file));
    const ext = file.toLowerCase().split(".").pop();
    const type =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": type, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });
  }
}
