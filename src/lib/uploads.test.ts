import { describe, expect, it } from "vitest";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPT_ATTRIBUTE,
  MAX_UPLOAD_BYTES,
  formatBytes,
  isUploadedImage,
} from "./uploads";

describe("accepted types", () => {
  it("maps every accepted MIME type to an extension", () => {
    expect(ACCEPTED_IMAGE_TYPES["image/png"]).toBe("png");
    expect(ACCEPTED_IMAGE_TYPES["image/jpeg"]).toBe("jpg");
    expect(ACCEPTED_IMAGE_TYPES["image/svg+xml"]).toBe("svg");
  });

  it("builds an accept attribute covering them all", () => {
    for (const type of Object.keys(ACCEPTED_IMAGE_TYPES)) {
      expect(ACCEPT_ATTRIBUTE).toContain(type);
    }
  });

  it("caps uploads at 4MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024);
  });
});

describe("isUploadedImage", () => {
  it("recognises images this app stored", () => {
    expect(isUploadedImage("/api/images/abc.png")).toBe(true);
  });

  it("ignores the seeded illustrations, so they are never deleted", () => {
    expect(isUploadedImage("/products/apples.svg")).toBe(false);
  });

  it("ignores absent and external URLs", () => {
    expect(isUploadedImage(null)).toBe(false);
    expect(isUploadedImage("https://example.com/api/images/abc.png")).toBe(
      false,
    );
  });
});

describe("formatBytes", () => {
  it("uses bytes below a kilobyte", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("uses kilobytes below a megabyte", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("uses megabytes above that, to one decimal", () => {
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
