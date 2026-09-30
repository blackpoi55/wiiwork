"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FilePlus2, FileText, FolderOpen, PanelLeftClose, PanelLeft, Settings } from "lucide-react";
import { api } from "@/lib/client";

const NAV = [
  { href: "/", label: "ใบเสนอราคา", hint: "รายการทั้งหมด", icon: FileText, exact: true },
  { href: "/edit", label: "สร้างใบใหม่", hint: "เริ่มใบเสนอราคา", icon: FilePlus2 },
  { href: "/settings", label: "ตั้งค่า", hint: "บริษัท / ค่าตั้งต้น", icon: Settings },
];

function Sidebar({
  collapsed,
  onToggle,
  dataRoot,
}: {
  collapsed: boolean;
  onToggle: () => void;
  dataRoot: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col text-white transition-[width] duration-200 lg:flex"
      style={{
        width: collapsed ? 76 : 248,
        background: "linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 100%)",
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95">
          <Image src="/brand/logo.png" alt="" width={22} height={32} className="object-contain" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">ระบบใบเสนอราคา</p>
            <p className="truncate text-[11px] text-white/55">แฟร์ พลัส</p>
          </div>
        ) : null}
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-white/12 font-semibold" : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[var(--accent)]" />
              ) : null}
              <Icon size={18} className="shrink-0" />
              {!collapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate leading-tight">{item.label}</span>
                  <span className="block truncate text-[11px] font-normal text-white/45">
                    {item.hint}
                  </span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        <button
          type="button"
          onClick={() => api.reveal("data").catch(() => {})}
          title="เปิดโฟลเดอร์ข้อมูล"
          className="flex w-full items-center gap-3 rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/14"
        >
          <FolderOpen size={18} className="shrink-0" />
          {!collapsed ? <span className="truncate">เปิดโฟลเดอร์ข้อมูล</span> : null}
        </button>
        {!collapsed && dataRoot ? (
          <p className="break-all px-1 text-[10px] leading-relaxed text-white/35" title={dataRoot}>
            {dataRoot}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/8 hover:text-white"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed ? <span>ย่อเมนู</span> : null}
        </button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-40 flex items-center gap-1 border-b border-[var(--border)] bg-white/90 px-3 py-2 backdrop-blur lg:hidden">
      <Image src="/brand/logo.png" alt="" width={18} height={26} className="mr-1 object-contain" />
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
              active ? "bg-[var(--brand)] text-white" : "text-slate-600"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="btn btn-ghost btn-sm ml-auto"
        onClick={() => api.reveal("data").catch(() => {})}
      >
        <FolderOpen size={15} />
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dataRoot, setDataRoot] = useState("");

  useEffect(() => {
    api
      .paths()
      .then((p) => setDataRoot(p.dataRoot))
      .catch(() => {});
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    } catch {
      /* ไม่มี localStorage ก็ไม่เป็นไร */
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sidebar-collapsed", c ? "0" : "1");
      } catch {
        /* ข้าม */
      }
      return !c;
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={toggle} dataRoot={dataRoot} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <main className="min-w-0 flex-1 px-4 py-5 lg:px-7 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
