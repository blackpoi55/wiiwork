/** อัปเดตโปรแกรม — เรียกจาก "อัปเดตโปรแกรม.bat" (ดูคำอธิบายเหตุผลใน launch.mjs) */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const line = (s = "") => process.stdout.write(s + "\n");

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", shell: true });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

line();
line("  ╔════════════════════════════════════════╗");
line("  ║        อัปเดตระบบใบเสนอราคา              ║");
line("  ╚════════════════════════════════════════╝");
line();
line("  ข้อมูลใบเสนอราคาในโฟลเดอร์ data\\ จะไม่ถูกแตะต้อง");
line();

if (existsSync(path.join(ROOT, ".git"))) {
  line("  [1/3] ดึงโค้ดล่าสุดจาก GitHub");
  await run("git", ["pull"]);
  line();
}

line("  [2/3] ติดตั้งส่วนประกอบ");
if ((await run("npm", ["install"])) !== 0) {
  line();
  line("  [!] ติดตั้งไม่สำเร็จ ดูข้อความด้านบน");
  process.exit(1);
}
line();

line("  [3/3] สร้างโปรแกรมใหม่");
if ((await run("npm", ["run", "build"])) !== 0) {
  line();
  line("  [!] สร้างโปรแกรมไม่สำเร็จ ดูข้อความด้านบน");
  process.exit(1);
}

line();
line("  เรียบร้อย — เปิดใช้งานได้จากไฟล์ \"เปิดโปรแกรม.bat\"");
line();
