import { afterEach, describe, expect, it } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  allowsUnauthenticatedAccess,
  createSessionToken,
  isAuthConfigured,
  verifyPassword,
  verifySessionToken,
} from "./auth";

const ORIGINAL_PASSWORD = process.env.DASHBOARD_PASSWORD;
const ORIGINAL_ENV = process.env.NODE_ENV;

function setPassword(value: string | undefined) {
  if (value === undefined) delete process.env.DASHBOARD_PASSWORD;
  else process.env.DASHBOARD_PASSWORD = value;
}

function setNodeEnv(value: string) {
  // NODE_ENV is readonly in the Next types but writable at runtime
  (process.env as Record<string, string>).NODE_ENV = value;
}

afterEach(() => {
  setPassword(ORIGINAL_PASSWORD);
  setNodeEnv(ORIGINAL_ENV ?? "test");
});

describe("configuration", () => {
  it("reports whether a password is set", () => {
    setPassword("hunter2");
    expect(isAuthConfigured()).toBe(true);

    setPassword(undefined);
    expect(isAuthConfigured()).toBe(false);
  });

  it("treats an empty password as unset", () => {
    setPassword("");
    expect(isAuthConfigured()).toBe(false);
  });

  it("stays open in development but fails closed in production", () => {
    setPassword(undefined);

    setNodeEnv("development");
    expect(allowsUnauthenticatedAccess()).toBe(true);

    setNodeEnv("production");
    expect(allowsUnauthenticatedAccess()).toBe(false);
  });

  it("is never open once a password is configured", () => {
    setPassword("hunter2");
    setNodeEnv("development");
    expect(allowsUnauthenticatedAccess()).toBe(false);
  });
});

describe("verifyPassword", () => {
  it("accepts the configured password and rejects anything else", () => {
    setPassword("correct horse");
    expect(verifyPassword("correct horse")).toBe(true);
    expect(verifyPassword("Correct Horse")).toBe(false);
    expect(verifyPassword("correct hors")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });

  it("rejects everything when no password is configured", () => {
    setPassword(undefined);
    expect(verifyPassword("")).toBe(false);
    expect(verifyPassword("anything")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a freshly issued token", () => {
    setPassword("hunter2");
    expect(verifySessionToken(createSessionToken())).toBe(true);
  });

  it("rejects a token whose signature was tampered with", () => {
    setPassword("hunter2");
    const token = createSessionToken();
    const [expiry] = token.split(".");
    expect(verifySessionToken(`${expiry}.${"0".repeat(64)}`)).toBe(false);
  });

  it("rejects a token whose expiry was extended", () => {
    setPassword("hunter2");
    const token = createSessionToken();
    const signature = token.slice(token.lastIndexOf(".") + 1);
    const forged = `${Date.now() + 10 ** 9}.${signature}`;
    expect(verifySessionToken(forged)).toBe(false);
  });

  it("rejects an expired token", () => {
    setPassword("hunter2");
    const issuedAt = Date.now();
    const token = createSessionToken(issuedAt);
    const afterExpiry = issuedAt + SESSION_MAX_AGE_SECONDS * 1000 + 1;
    expect(verifySessionToken(token, afterExpiry)).toBe(false);
  });

  it("rejects a token signed with a different password", () => {
    setPassword("hunter2");
    const token = createSessionToken();
    setPassword("something-else");
    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects malformed input", () => {
    setPassword("hunter2");
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("no-separator")).toBe(false);
    expect(verifySessionToken(".onlysignature")).toBe(false);
  });

  it("cannot issue a token without a password", () => {
    setPassword(undefined);
    expect(() => createSessionToken()).toThrow(/DASHBOARD_PASSWORD/);
  });
});
