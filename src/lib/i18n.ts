/**
 * Storefront translations. The dashboard stays English-only — this covers
 * the 3D store, which shoppers see.
 */

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "virtual-store-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export const LOCALE_LABELS: Record<Locale, { label: string; english: string }> =
  {
    en: { label: "English", english: "English" },
    ar: { label: "العربية", english: "Arabic" },
  };

type Dictionary = {
  tagline: string;
  chooseLanguage: string;
  moveKeys: string;
  moveHint: string;
  lookKeys: string;
  lookHint: string;
  touchMove: string;
  touchMoveHint: string;
  touchLook: string;
  touchLookHint: string;
  clickProduct: string;
  clickProductHint: string;
  openDoor: string;
  hudHint: string;
  hudHintTouch: string;
  cart: string;
  yourCart: string;
  cartEmpty: string;
  total: string;
  checkout: string;
  placingOrder: string;
  orderPlaced: (order: number, total: string) => string;
  inStock: (n: number) => string;
  outOfStock: string;
  addToCart: string;
  close: string;
  dashboard: string;
  noDescription: string;
};

const en: Dictionary = {
  tagline: "A tiny grocery store you can walk through.",
  chooseLanguage: "Language",
  moveKeys: "W A S D",
  moveHint: "move up, down, left, right",
  lookKeys: "left click + drag",
  lookHint: "look around",
  touchMove: "joystick",
  touchMoveHint: "move around the store",
  touchLook: "swipe",
  touchLookHint: "look around",
  clickProduct: "tap a product",
  clickProductHint: "see details & add to cart",
  openDoor: "Open the door",
  hudHint: "WASD / arrows to move · hold left mouse + drag to look · click products",
  hudHintTouch: "Drag the pad to walk · swipe to look · tap products",
  cart: "Cart",
  yourCart: "Your cart",
  cartEmpty: "Empty. Tap a product on a shelf to add it.",
  total: "Total",
  checkout: "Checkout (demo — no payment)",
  placingOrder: "Placing order…",
  orderPlaced: (order, total) =>
    `Order #${order} placed — $${total}. Thanks for visiting!`,
  inStock: (n) => `${n} in stock`,
  outOfStock: "Out of stock",
  addToCart: "Add to cart",
  close: "Close",
  dashboard: "Dashboard",
  noDescription: "No description yet.",
};

const ar: Dictionary = {
  tagline: "متجر بقالة صغير يمكنك التجوّل بداخله.",
  chooseLanguage: "اللغة",
  moveKeys: "W A S D",
  moveHint: "للتحرك: أعلى، أسفل، يسار، يمين",
  lookKeys: "زر الفأرة الأيسر + السحب",
  lookHint: "لتغيير اتجاه النظر",
  touchMove: "عصا التحكم",
  touchMoveHint: "للتنقل داخل المتجر",
  touchLook: "اسحب إصبعك",
  touchLookHint: "لتغيير اتجاه النظر",
  clickProduct: "اضغط على منتج",
  clickProductHint: "لعرض التفاصيل وإضافته إلى السلة",
  openDoor: "افتح الباب",
  hudHint: "استخدم WASD أو الأسهم للتحرك · اضغط بزر الفأرة الأيسر واسحب للنظر · اضغط على المنتجات",
  hudHintTouch: "اسحب لوحة التحكم للمشي · اسحب إصبعك للنظر · اضغط على المنتجات",
  cart: "السلة",
  yourCart: "سلة مشترياتك",
  cartEmpty: "السلة فارغة. اضغط على منتج من الرف لإضافته.",
  total: "الإجمالي",
  checkout: "إتمام الطلب (تجريبي — بدون دفع)",
  placingOrder: "جارٍ إرسال الطلب…",
  orderPlaced: (order, total) =>
    `تم تسجيل الطلب رقم ${order} — ‏$${total}. شكراً لزيارتك!`,
  inStock: (n) => `${n} متوفرة`,
  outOfStock: "غير متوفر",
  addToCart: "أضف إلى السلة",
  close: "إغلاق",
  dashboard: "لوحة التحكم",
  noDescription: "لا يوجد وصف بعد.",
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export function t(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
