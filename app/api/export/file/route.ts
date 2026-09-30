import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { exportDir, parseRef, safeChild } from "@/lib/storage";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = parseRef(url.searchParams.get("ref") ?? "");
    const file = url.searchParams.get("file");
    if (!file) throw new Error("ต้องระบุ file");
    const full = safeChild(exportDir(ref), file);
    const buf = await fs.readFile(full);
    const ext = file.toLowerCase().split(".").pop() ?? "";
    const download = url.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }
}
