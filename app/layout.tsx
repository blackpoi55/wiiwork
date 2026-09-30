import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import ToastProvider from "@/components/ui/Toast";
import ConfirmProvider from "@/components/ui/Confirm";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "ระบบใบเสนอราคา",
  description: "ทำใบเสนอราคา แนบรูป และออกไฟล์ PDF/Excel เก็บลงเครื่อง",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body style={{ fontFamily: "var(--font-sarabun), 'Leelawadee UI', 'Segoe UI', sans-serif" }}>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
