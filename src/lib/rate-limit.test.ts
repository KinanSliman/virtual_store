import { beforeEach, describe, expect, it } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "./rate-limit";

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks the next one", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 60_000, now).allowed).toBe(true);
    }
    expect(rateLimit("k", 3, 60_000, now).allowed).toBe(false);
  });

  it("counts down the remaining allowance", () => {
    const now = 1_000_000;
    expect(rateLimit("k", 3, 60_000, now).remaining).toBe(2);
    expect(rateLimit("k", 3, 60_000, now).remaining).toBe(1);
    expect(rateLimit("k", 3, 60_000, now).remaining).toBe(0);
  });

  it("starts a fresh window once the old one elapses", () => {
    const now = 1_000_000;
    rateLimit("k", 1, 60_000, now);
    expect(rateLimit("k", 1, 60_000, now).allowed).toBe(false);
    expect(rateLimit("k", 1, 60_000, now + 60_001).allowed).toBe(true);
  });

  it("reports how long to wait when blocked", () => {
    const now = 1_000_000;
    rateLimit("k", 1, 60_000, now);
    const blocked = rateLimit("k", 1, 60_000, now + 15_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it("keeps separate counters per key", () => {
    const now = 1_000_000;
    rateLimit("a", 1, 60_000, now);
    expect(rateLimit("a", 1, 60_000, now).allowed).toBe(false);
    expect(rateLimit("b", 1, 60_000, now).allowed).toBe(true);
  });
});

describe("clientKey", () => {
  const request = (headers: Record<string, string>) =>
    new Request("https://example.com", { headers });

  it("uses the first address in x-forwarded-for", () => {
    expect(
      clientKey(request({ "x-forwarded-for": "203.0.113.5, 70.41.3.18" }), "v"),
    ).toBe("v:203.0.113.5");
  });

  it("falls back when the header is absent", () => {
    expect(clientKey(request({}), "v")).toBe("v:unknown");
  });

  it("separates buckets so one route cannot exhaust another", () => {
    const headers = { "x-forwarded-for": "203.0.113.5" };
    expect(clientKey(request(headers), "views")).not.toBe(
      clientKey(request(headers), "orders"),
    );
  });
});
