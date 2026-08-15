"use server";

import { revalidatePath } from "next/cache";
import { db, storeSettings } from "@/db";
import { deleteUploadedImage, saveUploadedImage } from "@/lib/uploads-server";
import { getStoreSettings, SETTINGS_ROW_ID } from "@/lib/store-settings";
import { requireDashboardSession } from "@/lib/auth-session";

export type SettingsFormState = {
  error?: string;
  saved?: boolean;
};

export async function updateStoreSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireDashboardSession();
  const name = String(formData.get("name") ?? "").trim();
  const nameAr = String(formData.get("nameAr") ?? "").trim() || null;
  if (!name) return { error: "Store name is required." };
  if (name.length > 120) return { error: "Store name is too long." };

  const current = await getStoreSettings();

  let logoUrl = current.logoUrl;
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedImage(file);
    if ("error" in saved) return { error: saved.error };
    await deleteUploadedImage(current.logoUrl);
    logoUrl = saved.url;
  } else if (formData.get("removeImage") === "1") {
    await deleteUploadedImage(current.logoUrl);
    logoUrl = null;
  }

  await db
    .insert(storeSettings)
    .values({ id: SETTINGS_ROW_ID, name, nameAr, logoUrl })
    .onConflictDoUpdate({
      target: storeSettings.id,
      set: { name, nameAr, logoUrl, updatedAt: new Date() },
    });

  // the name and logo appear on both the storefront and the dashboard chrome
  revalidatePath("/", "layout");
  return { saved: true };
}
