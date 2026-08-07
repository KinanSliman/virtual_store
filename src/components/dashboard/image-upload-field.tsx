"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  formatBytes,
} from "@/lib/uploads";

/**
 * Picks a product image from the local filesystem — click or drag and drop —
 * and previews it before the form is submitted. The file rides along with the
 * rest of the form to the server action as `imageFile`.
 */
export function ImageUploadField({ currentUrl }: { currentUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(
    null,
  );
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // release the previous preview whenever it's replaced or the form unmounts
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function acceptFile(file: File): boolean {
    if (!(file.type in ACCEPTED_IMAGE_TYPES)) {
      setError(
        `"${file.name}" isn't a supported image. Use PNG, JPEG, WebP, GIF, or SVG.`,
      );
      return false;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      );
      return false;
    }
    setError(null);
    setRemoved(false);
    setObjectUrl(URL.createObjectURL(file));
    setPicked({ name: file.name, size: file.size });
    return true;
  }

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  const shownUrl = objectUrl ?? (removed ? null : currentUrl);

  return (
    <div>
      <span className="mb-1 block text-sm text-neutral-400">
        Product image{" "}
        <span className="text-neutral-500">(shown in the store popup)</span>
      </span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          if (acceptFile(file) && inputRef.current) {
            // hand the dropped file to the input so it submits with the form
            const transfer = new DataTransfer();
            transfer.items.add(file);
            inputRef.current.files = transfer.files;
          }
        }}
        className={`flex items-center gap-4 rounded-lg border border-dashed p-4 transition ${
          dragging
            ? "border-emerald-500 bg-emerald-950/30"
            : "border-neutral-700 bg-neutral-900"
        }`}
      >
        {shownUrl ? (
          <Image
            src={shownUrl}
            alt="Product image preview"
            width={80}
            height={80}
            unoptimized
            className="h-20 w-20 shrink-0 rounded-lg bg-neutral-800 object-contain"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-2xl text-neutral-600">
            🖼
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
            >
              {shownUrl ? "Change image…" : "Choose image…"}
            </button>
            {shownUrl && (
              <button
                type="button"
                onClick={() => {
                  clearInput();
                  setObjectUrl(null);
                  setPicked(null);
                  setError(null);
                  setRemoved(true);
                }}
                className="rounded-md border border-neutral-800 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-800"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 truncate text-xs text-neutral-500">
            {picked
              ? `${picked.name} — ${formatBytes(picked.size)}`
              : `Drag an image here, or browse. Max ${formatBytes(MAX_UPLOAD_BYTES)}.`}
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        name="imageFile"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!acceptFile(file)) clearInput();
        }}
      />
      {removed && <input type="hidden" name="removeImage" value="1" />}
    </div>
  );
}
