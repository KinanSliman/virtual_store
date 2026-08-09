"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Text drawn to a 2D canvas and mapped onto a plane.
 *
 * drei's <Text> renders with a bundled Latin font, so Arabic comes out as
 * empty boxes. Canvas 2D goes through the platform's text engine instead,
 * which shapes Arabic (joined letterforms, right-to-left) correctly and can
 * fall back per-glyph across the font stack below.
 */

const FONT_STACK =
  '"Segoe UI", Tahoma, "Noto Sans Arabic", "Arial Unicode MS", Arial, sans-serif';

/** Canvas pixels per world unit — the label's resolution. */
const RESOLUTION = 256;

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${line} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function TextPlane({
  text,
  width,
  height,
  fontSize,
  color = "#1a1a1a",
  outlineColor = "#f5f0e6",
  outlineWidth = 0.012,
  bold = false,
  position,
  rotation,
  renderOrder,
}: {
  text: string;
  /** plane size in world units */
  width: number;
  height: number;
  /** font size in world units */
  fontSize: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  bold?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  renderOrder?: number;
}) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * RESOLUTION);
    canvas.height = Math.ceil(height * RESOLUTION);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const px = fontSize * RESOLUTION;
    ctx.font = `${bold ? "700 " : ""}${px}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    const lines = wrapLines(ctx, text, canvas.width * 0.94);
    const lineHeight = px * 1.18;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      if (outlineWidth > 0) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineWidth * RESOLUTION * 2;
        ctx.strokeText(line, canvas.width / 2, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, canvas.width / 2, y);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }, [text, width, height, fontSize, color, outlineColor, outlineWidth, bold]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation} renderOrder={renderOrder}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
