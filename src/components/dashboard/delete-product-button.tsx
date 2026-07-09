"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/dashboard/actions";

export function DeleteProductButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${name}"?`)) return;
        startTransition(() => deleteProduct(id));
      }}
      className="rounded-md border border-red-900 px-3 py-1 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
