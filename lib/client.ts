import type { Quotation, QuotationSummary, Settings } from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `เกิดข้อผิดพลาด (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ไม่มี body */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  listQuotations: () => fetch("/api/quotations").then(json<QuotationSummary[]>),

  getQuotation: (ref: string) =>
    fetch(`/api/quotations/item?ref=${encodeURIComponent(ref)}`).then(
      json<{ ref: string; quotation: Quotation; photoFiles: string[]; exports: string[] }>,
    ),

  createQuotation: (q: Quotation) =>
    fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    }).then(json<{ ref: string }>),

  saveQuotation: (ref: string, q: Quotation) =>
    fetch(`/api/quotations/item?ref=${encodeURIComponent(ref)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    }).then(json<{ ref: string }>),

  deleteQuotation: (ref: string) =>
    fetch(`/api/quotations/item?ref=${encodeURIComponent(ref)}`, { method: "DELETE" }).then(
      json<{ ok: true }>,
    ),

  uploadPhotos: (ref: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return fetch(`/api/photos?ref=${encodeURIComponent(ref)}`, {
      method: "POST",
      body: form,
    }).then(json<{ files: string[] }>);
  },

  replacePhoto: (ref: string, file: string, blob: Blob) =>
    fetch(`/api/photos?ref=${encodeURIComponent(ref)}&file=${encodeURIComponent(file)}`, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: blob,
    }).then(json<{ ok: true; file: string; v: number }>),

  deletePhoto: (ref: string, file: string) =>
    fetch(`/api/photos?ref=${encodeURIComponent(ref)}&file=${encodeURIComponent(file)}`, {
      method: "DELETE",
    }).then(json<{ ok: true }>),

  exportQuotation: (ref: string) =>
    fetch(`/api/export?ref=${encodeURIComponent(ref)}`, { method: "POST" }).then(
      json<{ ref: string; pdf: string; xlsx: string; monthlyXlsx: string; folder: string }>,
    ),

  reveal: (scope: "data" | "quotations" | "quotation" | "export" | "month", ref?: string) =>
    fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, ref }),
    }).then(json<{ ok: true; path: string }>),

  paths: () => fetch("/api/reveal").then(json<{ dataRoot: string; quotationsRoot: string }>),

  getSettings: () => fetch("/api/settings").then(json<Settings>),

  saveSettings: (s: Settings) =>
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }).then(json<{ ok: true }>),
};

export function photoUrl(ref: string, file: string, version = 0): string {
  return `/api/photos/file?ref=${encodeURIComponent(ref)}&file=${encodeURIComponent(file)}${
    version ? `&v=${version}` : ""
  }`;
}

export function exportUrl(ref: string, file: string, download = false): string {
  return `/api/export/file?ref=${encodeURIComponent(ref)}&file=${encodeURIComponent(file)}${
    download ? "&download=1" : ""
  }`;
}
