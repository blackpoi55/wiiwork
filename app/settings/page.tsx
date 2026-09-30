"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Building2,
  FolderOpen,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  Zap,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { api } from "@/lib/client";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import type { Preset, Settings } from "@/lib/types";

function Section({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = "",
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-tight text-slate-800">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-slate-400">{description}</p> : null}
        </div>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
  }, []);

  if (!settings) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="skeleton h-9 w-48" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="skeleton h-96" />
            <div className="skeleton h-96" />
          </div>
        </div>
      </AppShell>
    );
  }

  const patch = (changes: Partial<Settings>) => {
    setSettings({ ...settings, ...changes });
    setDirty(true);
  };

  const patchCompany = (changes: Partial<Settings["company"]>) =>
    patch({ company: { ...settings.company, ...changes } });

  const patchPreset = (id: string, changes: Partial<Preset>) =>
    patch({ presets: settings.presets.map((p) => (p.id === id ? { ...p, ...changes } : p)) });

  const save = async () => {
    setSaving(true);
    try {
      await api.saveSettings(settings);
      setDirty(false);
      toast.success("บันทึกการตั้งค่าแล้ว", "ใบเสนอราคาที่สร้างใหม่จะใช้ค่านี้");
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    const ok = await confirm({
      title: "คืนค่าตั้งต้นทั้งหมด?",
      detail: "ข้อมูลบริษัท ค่าตั้งต้น และรายการที่ใช้บ่อย จะกลับเป็นค่าเริ่มต้นของระบบ",
      confirmLabel: "คืนค่า",
      danger: true,
    });
    if (!ok) return;
    setSettings(DEFAULT_SETTINGS);
    setDirty(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="ตั้งค่า"
        subtitle="ข้อมูลบริษัทบนหัวกระดาษ ค่าตั้งต้นของใบใหม่ และรายการงานที่ใช้บ่อย"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={resetDefaults}>
              <RotateCcw size={15} />
              คืนค่าตั้งต้น
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              บันทึก{dirty ? " •" : ""}
            </button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          icon={Building2}
          title="ข้อมูลบริษัท"
          description="ข้อความส่วนหัวของใบเสนอราคาทุกใบ"
        >
          <div className="space-y-3">
            <div>
              <label className="label">บรรทัดภาษาไทย</label>
              <textarea
                className="field resize-y"
                rows={2}
                value={settings.company.nameTh}
                onChange={(e) => patchCompany({ nameTh: e.target.value })}
              />
            </div>
            <div>
              <label className="label">บรรทัดภาษาอังกฤษ</label>
              <textarea
                className="field resize-y"
                rows={2}
                value={settings.company.nameEn}
                onChange={(e) => patchCompany({ nameEn: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">โทรศัพท์</label>
                <input
                  className="field"
                  value={settings.company.phone}
                  onChange={(e) => patchCompany({ phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">อีเมล</label>
                <input
                  className="field"
                  value={settings.company.email}
                  onChange={(e) => patchCompany({ email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">เลขประจำตัวผู้เสียภาษี</label>
              <input
                className="field"
                value={settings.company.taxId}
                onChange={(e) => patchCompany({ taxId: e.target.value })}
              />
            </div>
          </div>
        </Section>

        <Section
          icon={SlidersHorizontal}
          title="ค่าตั้งต้นของใบใหม่"
          description="กรอกไว้ครั้งเดียว ใบใหม่จะเติมให้อัตโนมัติ"
        >
          <div className="space-y-3">
            <div>
              <label className="label">โครงการเริ่มต้น</label>
              <input
                className="field"
                value={settings.defaultProjectName}
                onChange={(e) => patch({ defaultProjectName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">ลูกค้าเริ่มต้น</label>
              <input
                className="field"
                value={settings.defaultCustomerName}
                onChange={(e) => patch({ defaultCustomerName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">ผู้ขอเสนอราคา</label>
              <input
                className="field"
                value={settings.defaultQuoterName}
                onChange={(e) => patch({ defaultQuoterName: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">ค่าดำเนินการ (% ของยอดรายการ)</label>
                <input
                  type="number"
                  step="any"
                  className="field text-right"
                  value={settings.defaultOperationFee}
                  onChange={(e) => patch({ defaultOperationFee: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">ภาษีมูลค่าเพิ่ม (%)</label>
                <input
                  type="number"
                  step="any"
                  className="field text-right"
                  value={settings.vatRate}
                  onChange={(e) => patch({ vatRate: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="label">เงื่อนไขเริ่มต้น (บรรทัดละข้อ)</label>
              <textarea
                className="field resize-y"
                rows={3}
                value={settings.defaultConditions.join("\n")}
                onChange={(e) => patch({ defaultConditions: e.target.value.split("\n") })}
              />
            </div>
          </div>
        </Section>

        <Section
          icon={FolderOpen}
          title="โลโก้และลายเซ็น"
          description="วางไฟล์รูปไว้ในโฟลเดอร์ public/brand/ แล้วใส่ชื่อไฟล์ที่นี่"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["โลโก้", settings.company.logoFile, (v: string) => patchCompany({ logoFile: v })],
                [
                  "ลายเซ็น",
                  settings.company.signatureFile,
                  (v: string) => patchCompany({ signatureFile: v }),
                ],
              ] as const
            ).map(([label, value, setter]) => (
              <div key={label}>
                <label className="label">{label}</label>
                <input className="field" value={value} onChange={(e) => setter(e.target.value)} />
                <div className="mt-2 flex h-24 items-center justify-center rounded-xl border border-[var(--border)] bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-2">
                  {value ? (
                    <Image
                      src={value}
                      alt={label}
                      width={120}
                      height={80}
                      className="max-h-20 w-auto object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-slate-400">ไม่ได้ตั้งค่า</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          icon={Zap}
          title="รายการงานที่ใช้บ่อย"
          description="จะขึ้นเป็นปุ่มลัดในหน้ารายการงาน คลิกเดียวเพิ่มเข้าใบได้เลย"
          action={
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                patch({
                  presets: [
                    ...settings.presets,
                    { id: `p-${Date.now()}`, description: "", unit: "ม.", unitPrice: 0 },
                  ],
                })
              }
            >
              <Plus size={14} />
              เพิ่ม
            </button>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_100px_110px_36px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span>ชื่อรายการ</span>
              <span>หน่วย</span>
              <span className="text-right">ราคา/หน่วย</span>
              <span />
            </div>
            {settings.presets.map((p) => (
              <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_100px_110px_36px] gap-2">
                <input
                  className="field"
                  placeholder="เช่น งานทาสีผนังภายใน"
                  value={p.description}
                  onChange={(e) => patchPreset(p.id, { description: e.target.value })}
                />
                <input
                  className="field"
                  placeholder="ม."
                  value={p.unit}
                  onChange={(e) => patchPreset(p.id, { unit: e.target.value })}
                />
                <input
                  type="number"
                  step="any"
                  className="field text-right tabular-nums"
                  value={p.unitPrice}
                  onChange={(e) => patchPreset(p.id, { unitPrice: Number(e.target.value) })}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-icon"
                  title="ลบ"
                  onClick={() => patch({ presets: settings.presets.filter((x) => x.id !== p.id) })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {settings.presets.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                ยังไม่มีรายการ — กด “เพิ่ม” เพื่อสร้างปุ่มลัด
              </p>
            ) : null}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
