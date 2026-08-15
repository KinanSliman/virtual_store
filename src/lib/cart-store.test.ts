import { beforeEach, describe, expect, it } from "vitest";
import { cartTotal, useCart, type CartProduct } from "./cart-store";

const apples: CartProduct = {
  id: 1,
  name: "Red Apples",
  price: "3.49",
  color: "#e0393e",
};
const milk: CartProduct = {
  id: 2,
  name: "Whole Milk",
  price: "1.59",
  color: "#f4f6fb",
};

const cart = () => useCart.getState();

beforeEach(() => cart().clear());

describe("useCart", () => {
  it("adds a product with quantity one", () => {
    cart().add(apples);
    expect(cart().items).toEqual([{ product: apples, quantity: 1 }]);
  });

  it("increments instead of duplicating an existing product", () => {
    cart().add(apples);
    cart().add(apples);
    expect(cart().items).toHaveLength(1);
    expect(cart().items[0].quantity).toBe(2);
  });

  it("keeps separate lines per product", () => {
    cart().add(apples);
    cart().add(milk);
    expect(cart().items.map((i) => i.product.id)).toEqual([1, 2]);
  });

  it("sets an explicit quantity", () => {
    cart().add(apples);
    cart().setQuantity(1, 5);
    expect(cart().items[0].quantity).toBe(5);
  });

  it("drops the line when quantity reaches zero", () => {
    cart().add(apples);
    cart().add(milk);
    cart().setQuantity(1, 0);
    expect(cart().items.map((i) => i.product.id)).toEqual([2]);
  });

  it("drops the line for a negative quantity", () => {
    cart().add(apples);
    cart().setQuantity(1, -3);
    expect(cart().items).toEqual([]);
  });

  it("removes and clears", () => {
    cart().add(apples);
    cart().add(milk);
    cart().remove(1);
    expect(cart().items).toHaveLength(1);
    cart().clear();
    expect(cart().items).toEqual([]);
  });
});

describe("cartTotal", () => {
  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("multiplies price by quantity across lines", () => {
    const total = cartTotal([
      { product: apples, quantity: 2 }, // 6.98
      { product: milk, quantity: 3 }, // 4.77
    ]);
    expect(total).toBeCloseTo(11.75, 2);
  });

  it("reads prices stored as strings", () => {
    expect(cartTotal([{ product: apples, quantity: 1 }])).toBeCloseTo(3.49, 2);
  });
});
