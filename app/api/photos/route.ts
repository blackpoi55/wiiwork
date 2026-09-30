import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import sharp from "sharp";
import { parseRef, photosDir, safeChild } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_EDGE = 1800;

function refParam(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) throw new Error("ต้องระบุ ref");
  return parseRef(ref);
}

/** อัปโหลดรูปใหม่ (หลายไฟล์พร้อมกันได้) */
export async function POST(req: Request) {
  try {
    const ref = refParam(req);
    const dir = photosDir(ref);
    await fs.mkdir(dir, { recursive: true });

    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
    }

    const created: string[] = [];
    const stamp = Date.now();
    for (let i = 0; i < files.length; i++) {
      const buf = Buffer.from(await files[i].arrayBuffer());
      const name = `p-${stamp}-${String(i).padStart(3, "0")}.jpg`;
      const out = await sharp(buf)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
      await fs.writeFile(safeChild(dir, name), out);
      created.push(name);
    }
    return NextResponse.json({ files: created });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}

/** บันทึกทับหลังจากครอป/หมุนรูป */
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = refParam(req);
    const file = url.searchParams.get("file");
    if (!file) throw new Error("ต้องระบุ file");
    const target = safeChild(photosDir(ref), file);
    await fs.access(target);
    const buf = Buffer.from(await req.arrayBuffer());
    const out = await sharp(buf).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    await fs.writeFile(target, out);
    return NextResponse.json({ ok: true, file, v: Date.now() });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const ref = refParam(req);
    const file = url.searchParams.get("file");
    if (!file) throw new Error("ต้องระบุ file");
    await fs.rm(safeChild(photosDir(ref), file), { force: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}
