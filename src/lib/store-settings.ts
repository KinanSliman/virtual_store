import { eq } from "drizzle-orm";
import { db, storeSettings } from "@/db";
import { DEFAULT_BRANDING, type Branding } from "./branding";

/**
 * Server-side access to store branding. Imports the database, so only
 * server components and actions may use this module — client components
 * should import the pure helpers from ./branding instead.
 */

/** Branding lives in a single row so the dashboard has one thing to edit. */
export const SETTINGS_ROW_ID = 1;

/** Reads store branding, falling back to defaults before the row exists. */
export async function getStoreSettings(): Promise<Branding> {
  const [row] = await db
    .select({
      name: storeSettings.name,
      nameAr: storeSettings.nameAr,
      logoUrl: storeSettings.logoUrl,
    })
    .from(storeSettings)
    .where(eq(storeSettings.id, SETTINGS_ROW_ID));

  return row ?? DEFAULT_BRANDING;
}
