"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crop,
  GripVertical,
  ImagePlus,
  Images,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { api, photoUrl } from "@/lib/client";
import type { PhotosPerPage } from "@/lib/layout";
import { useToast } from "./ui/Toast";
import { useConfirm } from "./ui/Confirm";
import type { Photo } from "@/lib/types";
import PhotoCropper from "./PhotoCropper";

type Props = {
  refKey: string | null;
  photos: Photo[];
  photosPerPage: PhotosPerPage;
  /** autoSave = true เมื่อเป็นการเพิ่ม/ลบ/สลับรูป ซึ่งควรบันทึกลงไฟล์ทันที */
  onChange: (photos: Photo[], autoSave?: boolean) => void;
  onNeedSave?: () => void;
};

export default function PhotoManager({
  refKey,
  photos,
  photosPerPage,
  onChange,
  onNeedSave,
}: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const sorted = [...photos].sort((a, b) => a.order - b.order);
  const pages = Math.ceil(sorted.length / photosPerPage);

  const commit = (list: Photo[]) => onChange(list.map((p, i) => ({ ...p, order: i })), true);

  const upload = async (files: FileList | File[] | null) => {
    if (!files || !refKey) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    try {
      const { files: created } = await api.uploadPhotos(refKey, list);
      const next = [...sorted];
      created.forEach((file) => next.push({ id: file, file, caption: "", order: next.length }));
      commit(next);
      toast.success(`เพิ่มรูปแล้ว ${created.length} รูป`);
    } catch (e) {
      toast.error("อัปโหลดไม่สำเร็จ", (e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (photo: Photo) => {
    if (!refKey) return;
    const ok = await confirm({
      title: "ลบรูปนี้?",
      detail: "ไฟล์รูปจะถูกลบออกจากโฟลเดอร์ด้วย",
      confirmLabel: "ลบรูป",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deletePhoto(refKey, photo.file);
      commit(sorted.filter((p) => p.file !== photo.file));
    } catch (e) {
      toast.error("ลบรูปไม่สำเร็จ", (e as Error).message);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sorted.length) return;
    const next = [...sorted];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };

  const saveCrop = async (blob: Blob) => {
    if (!refKey || !editing) return;
    await api.replacePhoto(refKey, editing.file, blob);
    setVersions((v) => ({ ...v, [editing.file]: Date.now() }));
    setEditing(null);
    toast.success("บันทึกรูปที่จัดแต่งแล้ว");
  };

  if (!refKey) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-slate-300">
          <Images size={26} />
        </div>
        <p className="font-semibold text-slate-700">บันทึกใบเสนอราคาก่อนจึงแนบรูปได้</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          ระบบต้องสร้างโฟลเดอร์ตามวันที่และห้องก่อน รูปที่อัปโหลดถึงจะเก็บไว้ถูกที่
        </p>
        {onNeedSave ? (
          <button type="button" className="btn btn-primary mt-4" onClick={onNeedSave}>
            <Save size={16} />
            บันทึกใบเสนอราคา
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ------------------------------- แถบเครื่องมือ ------------------------------ */}
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImagePlus size={16} />
          )}
          {uploading ? "กำลังอัปโหลด…" : "เพิ่มรูป"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{sorted.length}</span> รูป ·{" "}
          <span className="font-semibold text-slate-800">{pages}</span> หน้า (หน้าละ {photosPerPage}{" "}
          รูป)
        </div>
        <p className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <GripVertical size={13} />
          ลากรูปเพื่อสลับลำดับ
        </p>
      </div>

      {/* -------------------------------- พื้นที่วาง ------------------------------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes("Files")) setDropActive(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDropActive(false);
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files?.length) {
            e.preventDefault();
            setDropActive(false);
            void upload(e.dataTransfer.files);
          }
        }}
        className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
          dropActive
            ? "border-[var(--brand)] bg-[var(--brand-soft)]"
            : "border-transparent bg-transparent"
        }`}
      >
        {sorted.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="card flex w-full flex-col items-center justify-center p-12 text-center transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-slate-300">
              <Upload size={26} />
            </div>
            <p className="font-semibold text-slate-700">ลากรูปมาวางที่นี่ หรือคลิกเพื่อเลือก</p>
            <p className="mt-1 text-sm text-slate-500">
              เลือกได้หลายรูปพร้อมกัน · รองรับ JPG / PNG / HEIC จากมือถือ
            </p>
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {sorted.map((photo, index) => {
              const page = Math.floor(index / photosPerPage) + 1;
              const slot = (index % photosPerPage) + 1;
              const isDragging = dragIndex === index;
              const isOver = overIndex === index && dragIndex !== index;
              return (
                <div
                  key={photo.file}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    if (dragIndex === null) return;
                    e.preventDefault();
                    setOverIndex(index);
                  }}
                  onDrop={(e) => {
                    if (dragIndex === null) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIndex !== index) move(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={`card group overflow-hidden transition-all ${
                    isDragging ? "opacity-40" : ""
                  } ${isOver ? "ring-2 ring-[var(--brand)] ring-offset-2" : ""}`}
                >
                  <div className="relative aspect-square cursor-grab bg-slate-100 active:cursor-grabbing">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(refKey, photo.file, versions[photo.file] ?? 0)}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      หน้า {page} · ช่อง {slot}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-slate-900/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1.5 text-slate-700 hover:bg-white disabled:opacity-40"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        title="เลื่อนไปก่อนหน้า"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/90 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                        onClick={() => setEditing(photo)}
                      >
                        <Crop size={14} className="mr-1 inline" />
                        จัดแต่ง
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1.5 text-rose-600 hover:bg-white"
                        onClick={() => remove(photo)}
                        title="ลบรูป"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1.5 text-slate-700 hover:bg-white disabled:opacity-40"
                        onClick={() => move(index, index + 1)}
                        disabled={index === sorted.length - 1}
                        title="เลื่อนไปถัดไป"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                  <input
                    className="field-inline border-t border-[var(--border)] !rounded-none text-xs"
                    placeholder="คำบรรยายใต้รูป (ไม่ใส่ก็ได้)"
                    value={photo.caption}
                    onChange={(e) =>
                      onChange(
                        photos.map((p) =>
                          p.file === photo.file ? { ...p, caption: e.target.value } : p,
                        ),
                      )
                    }
                  />
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[0.875rem] border-2 border-dashed border-[var(--border-strong)] text-slate-400 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            >
              <ImagePlus size={24} />
              <span className="text-sm font-semibold">เพิ่มรูป</span>
              <span className="text-[11px]">หรือลากไฟล์มาวาง</span>
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <PhotoCropper
          src={photoUrl(refKey, editing.file, versions[editing.file] ?? 0)}
          onCancel={() => setEditing(null)}
          onSave={saveCrop}
        />
      ) : null}
    </div>
  );
}
