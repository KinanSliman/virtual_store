"use client";

import { useActionState } from "react";
import {
  updateStoreSettings,
  type SettingsFormState,
} from "@/app/dashboard/settings/actions";
import { ImageUploadField } from "./image-upload-field";

const inputClass =
  "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-emerald-500";
const labelClass = "mb-1 block text-sm text-neutral-400";

export function StoreSettingsForm({
  settings,
}: {
  settings: { name: string; nameAr: string | null; logoUrl: string | null };
}) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateStoreSettings, {});

  // No encType/method: React sets multipart itself for a function action, and
  // specifying them logs a warning that they will be overridden.
  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error && (
        <p className="rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state.saved && !state.error && (
        <p className="rounded-md border border-emerald-900 bg-emerald-950 px-3 py-2 text-sm text-emerald-400">
          Saved. The storefront now shows the new branding.
        </p>
      )}

      <div>
        <label className={labelClass} htmlFor="name">
          Store name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={settings.name}
          required
          maxLength={120}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="nameAr">
          Store name in Arabic{" "}
          <span className="text-neutral-500">
            (optional — falls back to the name above)
          </span>
        </label>
        <input
          id="nameAr"
          name="nameAr"
          dir="rtl"
          defaultValue={settings.nameAr ?? ""}
          maxLength={120}
          className={inputClass}
        />
      </div>

      <ImageUploadField
        currentUrl={settings.logoUrl}
        label="Store logo"
        hint="shown on the entry screen and in the dashboard"
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
