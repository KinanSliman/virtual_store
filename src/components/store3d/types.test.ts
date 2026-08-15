import { describe, expect, it } from "vitest";
import {
  productCategory,
  productDescription,
  productName,
  type StoreProduct,
} from "./types";

const product: StoreProduct = {
  id: 1,
  name: "Red Apples",
  nameAr: "تفاح أحمر",
  description: "Crisp and sweet.",
  descriptionAr: "مقرمش وحلو.",
  price: "3.49",
  stock: 10,
  color: "#e0393e",
  imageUrl: "/products/apples.svg",
  shelf: 1,
  shelfSlot: 0,
  category: "Fruits",
  categoryAr: "فواكه",
};

describe("localised product fields", () => {
  it("returns the Arabic copy for Arabic shoppers", () => {
    expect(productName(product, "ar")).toBe("تفاح أحمر");
    expect(productDescription(product, "ar")).toBe("مقرمش وحلو.");
    expect(productCategory(product, "ar")).toBe("فواكه");
  });

  it("returns English otherwise", () => {
    expect(productName(product, "en")).toBe("Red Apples");
    expect(productDescription(product, "en")).toBe("Crisp and sweet.");
    expect(productCategory(product, "en")).toBe("Fruits");
  });

  it("falls back to English when Arabic is missing", () => {
    const untranslated = {
      ...product,
      nameAr: null,
      descriptionAr: null,
      categoryAr: null,
    };
    expect(productName(untranslated, "ar")).toBe("Red Apples");
    expect(productDescription(untranslated, "ar")).toBe("Crisp and sweet.");
    expect(productCategory(untranslated, "ar")).toBe("Fruits");
  });

  it("treats whitespace-only Arabic as missing", () => {
    const blank = { ...product, nameAr: "   " };
    expect(productName(blank, "ar")).toBe("Red Apples");
  });
});
