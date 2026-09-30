/**
 * ตัวเปิดโปรแกรม — เรียกจาก "เปิดโปรแกรม.bat"
 *
 * เขียนเป็น Node แทนการใส่ข้อความไทยลง .bat โดยตรง เพราะ cmd.exe อ่านไฟล์ .bat
 * ตามโค้ดเพจของระบบ (ไทย = CP874) ถ้าไฟล์เป็น UTF-8 หรือมีคำสั่ง chcp คั่นกลาง
 * cmd จะอ่านไฟล์ผิดตำแหน่งแล้วจบการทำงานกลางคัน (หน้าต่างปิดเองทันที)
 * ส่วน Node บน Windows พิมพ์ยูนิโคดออกคอนโซลได้ตรงๆ ไม่ต้องยุ่งกับโค้ดเพจ
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const OPEN_BROWSER = process.env.QUOTE_NO_OPEN !== "1";

const line = (s = "") => process.stdout.write(s + "\n");

function banner() {
  line();
  line("  ╔════════════════════════════════════════╗");
  line("  ║           ระบบใบเสนอราคา                ║");
  line("  ╚════════════════════════════════════════╝");
  line();
}

/** รันคำสั่งแล้วรอจนจบ คืน exit code */
function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

function portBusy(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "0.0.0.0");
  });
}

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

async function waitForServer(port, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${port}/`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

function openBrowser(url) {
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
}

async function main() {
  banner();

  if (await portBusy(PORT)) {
    line(`  [!] พอร์ต ${PORT} ถูกใช้งานอยู่แล้ว`);
    line("      อาจเปิดโปรแกรมค้างไว้อยู่ — ลองเปิด http://localhost:" + PORT + " ดูก่อน");
    line("      ถ้าไม่ใช่ ให้ปิดหน้าต่างโปรแกรมเดิมแล้วเปิดใหม่");
    line();
    return 1;
  }

  if (!existsSync(path.join(ROOT, "node_modules"))) {
    line("  กำลังติดตั้งส่วนประกอบครั้งแรก ใช้เวลาสักครู่ (ดาวน์โหลดหลายร้อย MB)...");
    line();
    if ((await run("npm", ["install"])) !== 0) {
      line();
      line("  [!] ติดตั้งไม่สำเร็จ ดูข้อความด้านบน");
      return 1;
    }
    line();
  }

  if (!existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    line("  กำลังเตรียมโปรแกรม ใช้เวลาสักครู่...");
    line();
    if ((await run("npm", ["run", "build"])) !== 0) {
      line();
      line("  [!] เตรียมโปรแกรมไม่สำเร็จ ดูข้อความด้านบน");
      return 1;
    }
    line();
  }

  line("  กำลังเปิดโปรแกรม...");
  line();

  const server = spawn("npm", ["run", "start"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });

  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.kill();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("exit", stop);

  if (await waitForServer(PORT)) {
    line();
    line("  ────────────────────────────────────────");
    line(`  เปิดใช้งานได้ที่   http://localhost:${PORT}`);
    for (const ip of lanAddresses()) {
      line(`  เครื่องอื่นในออฟฟิศ  http://${ip}:${PORT}`);
    }
    line("  ────────────────────────────────────────");
    line("  ปิดโปรแกรม = ปิดหน้าต่างนี้");
    line();
    if (OPEN_BROWSER) openBrowser(`http://localhost:${PORT}`);
  } else {
    line();
    line("  [!] เปิดเซิร์ฟเวอร์ไม่สำเร็จ ดูข้อความด้านบน");
    stop();
    return 1;
  }

  return await new Promise((resolve) => server.on("close", (code) => resolve(code ?? 0)));
}

const code = await main();
if (code !== 0) {
  line("  กด Enter เพื่อปิดหน้าต่าง");
  process.stdin.resume();
  process.stdin.once("data", () => process.exit(code));
} else {
  process.exit(code);
}
