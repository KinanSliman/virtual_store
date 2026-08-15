import { describe, expect, it } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats the strings Drizzle returns for numeric columns", () => {
    expect(formatPrice("3.49")).toBe("$3.49");
  });

  it("formats numbers too", () => {
    expect(formatPrice(3.5)).toBe("$3.50");
  });

  it("always shows two decimal places", () => {
    expect(formatPrice("10")).toBe("$10.00");
  });

  it("groups thousands", () => {
    expect(formatPrice("1234.5")).toBe("$1,234.50");
  });

  it("handles zero", () => {
    expect(formatPrice("0")).toBe("$0.00");
  });
});
