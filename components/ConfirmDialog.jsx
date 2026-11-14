"use client";

import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Go back", confirming = false, destructive = false, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(92vw,400px)] rounded-[16px] border border-[#C8C5D0]/60 bg-white p-5 shadow-xl backdrop:bg-black/55"
      onCancel={(e) => {
        e.preventDefault();
        if (!confirming) onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !confirming) onCancel();
      }}
    >
      <h2 id="confirm-dialog-title" className="text-[17px] font-semibold text-[#1C1B1F]">
        {title}
      </h2>
      <div className="mt-2 text-[14px] leading-relaxed text-[#74707A]">{description}</div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={confirming} className="inline-flex items-center justify-center rounded-[10px] border border-[#C8C5D0] px-4 py-2.5 text-[13px] font-semibold text-[#47464F] transition hover:border-[#A0146C] hover:text-[#A0146C] disabled:cursor-not-allowed disabled:opacity-60">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={confirming} className={`inline-flex items-center justify-center rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-[#A0146C] hover:bg-[#8F125F]" : "bg-[#1C1B1F] hover:bg-[#47464F]"}`}>
          {confirming ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
