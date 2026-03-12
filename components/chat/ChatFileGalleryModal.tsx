"use client";
import { useEffect, useCallback } from "react";
import { X, Download, FileText } from "lucide-react";
export type GalleryItem = {
  fileName: string;
  publicUrl: string;
  sentAt?: string;
  senderLabel?: string;
};
function isProbablyImage(fileName: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName);
}
export function ChatFileGalleryModal({
  open,
  onClose,
  items,
  title = "Files in this chat",
}: {
  open: boolean;
  onClose: () => void;
  items: GalleryItem[];
  title?: string;
}) {
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );
  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onKey]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-gallery-title"
      onClick={onClose}
    >
      {" "}
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {" "}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          {" "}
          <h2
            id="chat-gallery-title"
            className="text-lg font-semibold text-slate-900"
          >
            {" "}
            {title}{" "}
          </h2>{" "}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            {" "}
            <X className="h-5 w-5" />{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex-1 overflow-y-auto p-5">
          {" "}
          {items.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No files shared in this appointment yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {" "}
              {items.map((item) => (
                <li
                  key={`${item.publicUrl}-${item.fileName}-${item.sentAt ?? ""}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  {" "}
                  <div className="flex items-center justify-center bg-white p-2 min-h-[140px]">
                    {" "}
                    {isProbablyImage(item.fileName) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */ <img
                        src={item.publicUrl}
                        alt={item.fileName}
                        className="max-h-48 w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                        {" "}
                        <FileText className="h-12 w-12" />{" "}
                        <span className="text-xs">
                          Preview not available
                        </span>{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                  <div className="space-y-1 border-t border-slate-200 bg-slate-50 p-3">
                    {" "}
                    <p
                      className="truncate text-sm font-medium text-slate-900"
                      title={item.fileName}
                    >
                      {" "}
                      {item.fileName}{" "}
                    </p>{" "}
                    {(item.senderLabel || item.sentAt) && (
                      <p className="text-xs text-slate-500">
                        {" "}
                        {item.senderLabel}{" "}
                        {item.senderLabel && item.sentAt ? " · " : ""}{" "}
                        {item.sentAt}{" "}
                      </p>
                    )}{" "}
                    <div className="flex gap-2 pt-1">
                      {" "}
                      <a
                        href={item.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {" "}
                        Open{" "}
                      </a>{" "}
                      <a
                        href={item.publicUrl}
                        download={item.fileName}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {" "}
                        <Download className="h-3.5 w-3.5" /> Download{" "}
                      </a>{" "}
                    </div>{" "}
                  </div>{" "}
                </li>
              ))}{" "}
            </ul>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
