import type { Locale } from "./i18n";

/**
 * Pure branding helpers. Kept free of database imports so client components
 * can use them — importing store-settings.ts would pull `pg` into the browser
 * bundle.
 */

export type Branding = {
  name: string;
  nameAr: string | null;
  logoUrl: string | null;
};

export const DEFAULT_BRANDING: Branding = {
  name: "Fresh Mart",
  nameAr: null,
  logoUrl: null,
};

/** The store name in the shopper's language, falling back to the default. */
export function localizedStoreName(
  settings: Pick<Branding, "name" | "nameAr">,
  locale: Locale,
): string {
  if (locale === "ar" && settings.nameAr?.trim()) return settings.nameAr;
  return settings.name;
}
