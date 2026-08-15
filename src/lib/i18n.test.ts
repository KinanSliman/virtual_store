import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, dir, isLocale, t } from "./i18n";
import { localizedStoreName } from "./branding";

describe("locales", () => {
  it("offers English and Arabic, defaulting to English", () => {
    expect(LOCALES).toEqual(["en", "ar"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("validates stored values, so a stale localStorage entry can't break", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });

  it("maps Arabic to right-to-left", () => {
    expect(dir("ar")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
  });
});

describe("translations", () => {
  it("differs between locales", () => {
    expect(t("en").openDoor).not.toBe(t("ar").openDoor);
  });

  it("defines every key in both locales", () => {
    expect(Object.keys(t("ar")).sort()).toEqual(Object.keys(t("en")).sort());
  });

  it("has no empty strings", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(t(locale))) {
        if (typeof value === "string") {
          expect(value.trim(), `${locale}.${key}`).not.toBe("");
        }
      }
    }
  });

  it("interpolates the order confirmation and stock count", () => {
    expect(t("en").orderPlaced(7, "12.50")).toContain("7");
    expect(t("en").orderPlaced(7, "12.50")).toContain("12.50");
    expect(t("ar").orderPlaced(7, "12.50")).toContain("7");
    expect(t("en").inStock(3)).toContain("3");
    expect(t("ar").inStock(3)).toContain("3");
  });
});

describe("localizedStoreName", () => {
  const settings = { name: "Fresh Mart", nameAr: "فريش مارت" };

  it("picks the language-appropriate name", () => {
    expect(localizedStoreName(settings, "en")).toBe("Fresh Mart");
    expect(localizedStoreName(settings, "ar")).toBe("فريش مارت");
  });

  it("falls back to English when the Arabic name is missing or blank", () => {
    expect(localizedStoreName({ name: "Fresh Mart", nameAr: null }, "ar")).toBe(
      "Fresh Mart",
    );
    expect(localizedStoreName({ name: "Fresh Mart", nameAr: "   " }, "ar")).toBe(
      "Fresh Mart",
    );
  });
});
