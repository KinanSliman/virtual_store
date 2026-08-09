import type { Locale } from "@/lib/i18n";
import type { Branding } from "@/lib/branding";

/** Product shape the server page passes into the 3D store. */
export type StoreProduct = {
  id: number;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  price: string;
  stock: number;
  color: string;
  imageUrl: string | null;
  shelf: number;
  shelfSlot: number;
  category: string;
  categoryAr: string | null;
};

export type StoreBranding = Branding;

/** Arabic copy where it exists, English otherwise. */
export function productName(product: StoreProduct, locale: Locale): string {
  return locale === "ar" && product.nameAr?.trim()
    ? product.nameAr
    : product.name;
}

export function productDescription(
  product: StoreProduct,
  locale: Locale,
): string {
  return locale === "ar" && product.descriptionAr?.trim()
    ? product.descriptionAr
    : product.description;
}

export function productCategory(
  product: StoreProduct,
  locale: Locale,
): string {
  return locale === "ar" && product.categoryAr?.trim()
    ? product.categoryAr
    : product.category;
}
