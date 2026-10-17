"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_PHOTOS } from "@/lib/constants";
import { btn, cn } from "./ui";

const MAX_DIMENSION = 1280;
const QUALITY = 0.75;

/** Downscales a photo in the browser so uploads stay small on mobile data. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoInput({ name = "photos", label = "Add photos", required = false }: { name?: string; label?: string; required?: boolean }) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    if (fieldRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      fieldRef.current.files = dt.files;
    }
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  async function onPick(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    const compressed = await Promise.all(Array.from(list).map(compress));
    setFiles((prev) => [...prev, ...compressed].slice(0, MAX_PHOTOS));
    setBusy(false);
    if (pickerRef.current) pickerRef.current.value = "";
  }

  return (
    <div>
      {/* The submitted field holds the compressed files; the picker is only for choosing. */}
      <input ref={fieldRef} type="file" name={name} multiple hidden aria-hidden tabIndex={-1} />
      <input
        ref={pickerRef}
        id={`${name}-picker`}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => onPick(e.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        {previews.map((src, i) => (
          <div key={src} className="relative size-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_PHOTOS && (
          <label
            htmlFor={`${name}-picker`}
            className={cn(btn.base, btn.secondary, "size-24 cursor-pointer flex-col border-dashed text-xs")}
          >
            <Camera className="size-5" />
            {busy ? "Processing…" : label}
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Up to {MAX_PHOTOS} photos{required ? " — at least one is required" : ""}. Photos are resized before upload.
      </p>
    </div>
  );
}
