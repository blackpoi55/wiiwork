import { Suspense } from "react";
import EditorClient from "./EditorClient";

export const dynamic = "force-dynamic";

export default function EditPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">กำลังโหลด…</div>}>
      <EditorClient />
    </Suspense>
  );
}
