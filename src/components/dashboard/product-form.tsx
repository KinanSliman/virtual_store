"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Category, Product } from "@/db/schema";
import type { ProductFormState } from "@/app/dashboard/actions";
import { ImageUploadField } from "./image-upload-field";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";
const labelClass = "mb-1 block text-sm text-neutral-400";

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: Category[];
  product?: Product;
  action: (
    prev: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="max-w-xl space-y-4"
    >
      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={product?.name}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description{" "}
          <span className="text-neutral-500">
            (shown in the 3D store popup)
          </span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="price">
            Price (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="stock">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="categoryId">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? categories[0]?.id}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="color">
            3D box color
          </label>
          <input
            id="color"
            name="color"
            type="color"
            defaultValue={product?.color ?? "#22c55e"}
            className="h-9 w-full cursor-pointer rounded-md border border-neutral-700 bg-neutral-900"
          />
        </div>
      </div>

      <ImageUploadField currentUrl={product?.imageUrl ?? null} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="shelf">
            Shelf
          </label>
          <select
            id="shelf"
            name="shelf"
            defaultValue={product?.shelf ?? 1}
            className={inputClass}
          >
            <option value={1}>Shelf 1 (left)</option>
            <option value={2}>Shelf 2 (right)</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="shelfSlot">
            Slot (0–5, left to right)
          </label>
          <input
            id="shelfSlot"
            name="shelfSlot"
            type="number"
            min="0"
            max="5"
            step="1"
            defaultValue={product?.shelfSlot ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 accent-emerald-600"
        />
        Visible in the 3D store
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
