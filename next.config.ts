import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ระบุ root ให้ชัด กัน Turbopack ไปหยิบ package-lock.json นอกโปรเจกต์
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // exceljs / sharp / puppeteer ต้องรันฝั่ง Node เท่านั้น
  serverExternalPackages: ["exceljs", "sharp", "puppeteer"],
};

export default nextConfig;
