import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  DATA_ROOT,
  QUOTES_ROOT,
  exportDir,
  monthlyDir,
  parseRef,
  quotationDir,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

type Body = { scope: "data" | "quotations" | "quotation" | "export" | "month"; ref?: string };

/** เปิดโฟลเดอร์ใน File Explorer / Finder ของเครื่อง */
function openFolder(target: string) {
  const platform = os.platform();
  if (platform === "win32") {
    spawn("explorer.exe", [target], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    spawn("open", [target], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [target], { detached: true, stdio: "ignore" }).unref();
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    let target: string;
    switch (body.scope) {
      case "data":
        target = DATA_ROOT;
        break;
      case "quotations":
        target = QUOTES_ROOT;
        break;
      case "quotation":
        target = quotationDir(parseRef(body.ref ?? ""));
        break;
      case "export":
        target = exportDir(parseRef(body.ref ?? ""));
        break;
      case "month":
        target = monthlyDir(parseRef(body.ref ?? ""));
        break;
      default:
        throw new Error("scope ไม่ถูกต้อง");
    }
    await fs.mkdir(target, { recursive: true });
    openFolder(path.resolve(target));
    return NextResponse.json({ ok: true, path: path.resolve(target) });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    dataRoot: path.resolve(DATA_ROOT),
    quotationsRoot: path.resolve(QUOTES_ROOT),
  });
}
