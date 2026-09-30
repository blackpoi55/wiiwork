"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Check,
  Contrast,
  Loader2,
  RotateCcw,
  RotateCw,
  Search,
  Sun,
  Undo2,
  X,
} from "lucide-react";
import { useToast } from "./ui/Toast";

type Props = {
  src: string;
  /** สัดส่วนกรอบ — ใบเสนอราคาใช้จัตุรัส 1:1 */
  aspect?: number;
  onCancel: () => void;
  onSave: (blob: Blob) => Promise<void> | void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function rotatedSize(width: number, height: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

async function renderCrop(
  src: string,
  area: Area,
  rotation: number,
  brightness: number,
  contrast: number,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์ไม่รองรับการตัดรูป");

  const box = rotatedSize(image.width, image.height, rotation);
  canvas.width = Math.round(box.width);
  canvas.height = Math.round(box.height);

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const data = ctx.getImageData(
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
  );

  const out = document.createElement("canvas");
  out.width = Math.round(area.width);
  out.height = Math.round(area.height);
  out.getContext("2d")!.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("แปลงรูปไม่สำเร็จ"))),
      "image/jpeg",
      0.92,
    );
  });
}

export default function PhotoCropper({ src, aspect = 1, onCancel, onSave }: Props) {
  const toast = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const save = async () => {
    if (!area) return;
    setSaving(true);
    try {
      const blob = await renderCrop(src, area, rotation, brightness, contrast);
      await onSave(blob);
    } catch (e) {
      toast.error("บันทึกรูปไม่สำเร็จ", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const sliders: [string, typeof Sun, number, number, number, number, (v: number) => void, string][] = [
    ["ซูม", Search, 0.5, 4, 0.01, zoom, setZoom, `${zoom.toFixed(2)}×`],
    ["หมุน", RotateCw, -180, 180, 1, rotation, setRotation, `${rotation}°`],
    ["ความสว่าง", Sun, 40, 180, 1, brightness, setBrightness, `${brightness}%`],
    ["คอนทราสต์", Contrast, 40, 180, 1, contrast, setContrast, `${contrast}%`],
  ];

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div className="card flex h-full max-h-[760px] w-full max-w-[940px] animate-in flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">จัดแต่งรูป</h2>
            <p className="text-xs text-slate-400">
              ลากเพื่อเลื่อน · กรอบสี่เหลี่ยมจัตุรัสคือส่วนที่จะขึ้นในเอกสาร
            </p>
          </div>
          <button
            type="button"
            className="btn btn-quiet btn-icon"
            onClick={onCancel}
            disabled={saving}
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 bg-slate-800">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              mediaStyle: { filter: `brightness(${brightness}%) contrast(${contrast}%)` },
            }}
          />
        </div>

        <div className="border-t border-[var(--border)] p-4">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {sliders.map(([label, Icon, min, max, step, value, setter, display]) => (
              <label key={label} className="block">
                <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Icon size={13} className="text-slate-400" />
                  {label}
                  <span className="ml-auto tabular-nums text-slate-400">{display}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => setter(Number(e.target.value))}
                  className="w-full accent-[var(--brand)]"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRotation((r) => ((r - 90 + 540) % 360) - 180)}
            >
              <RotateCcw size={14} />
              หมุนซ้าย 90°
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRotation((r) => ((r + 90 + 540) % 360) - 180)}
            >
              <RotateCw size={14} />
              หมุนขวา 90°
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
                setBrightness(100);
                setContrast(100);
              }}
            >
              <Undo2 size={14} />
              รีเซ็ต
            </button>
            <button type="button" className="btn btn-ghost ml-auto" onClick={onCancel} disabled={saving}>
              ยกเลิก
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !area}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? "กำลังบันทึก…" : "บันทึกรูป"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
