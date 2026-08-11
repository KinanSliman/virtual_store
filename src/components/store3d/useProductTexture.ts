"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

const TEXTURE_SIZE = 256;
/** Fraction of the face the artwork covers, leaving a border of box colour. */
const IMAGE_INSET = 0.84;

/**
 * Builds a square texture for a product box: the product's colour as the
 * background with its image composited on top.
 *
 * Drawing through a canvas rather than handing the URL to TextureLoader buys
 * three things — uploaded PNGs with transparency get an opaque backdrop
 * instead of black, non-square artwork is letterboxed instead of stretched
 * across the face, and the result is always a clean power-of-two texture.
 *
 * Returns null while loading, and stays null if the image fails to load, so
 * the caller can fall back to a plain coloured box.
 */
export function useProductTexture(
  url: string | null,
  backgroundColor: string,
): THREE.CanvasTexture | null {
  // The URL is stored alongside the texture so a stale one is never returned
  // while a new image loads — cheaper than resetting state from the effect,
  // which would cascade an extra render.
  const [loaded, setLoaded] = useState<{
    url: string;
    texture: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    if (!url || typeof document === "undefined") return;

    let cancelled = false;
    const image = new Image();
    // uploads and seeded art are same-origin; set anyway so the canvas is
    // never tainted if an image is ever served from elsewhere
    image.crossOrigin = "anonymous";

    image.onload = () => {
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      canvas.width = TEXTURE_SIZE;
      canvas.height = TEXTURE_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

      // "contain" fit; SVGs without intrinsic size report 0, so fall back square
      const naturalWidth = image.naturalWidth || TEXTURE_SIZE;
      const naturalHeight = image.naturalHeight || TEXTURE_SIZE;
      const scale = Math.min(
        (TEXTURE_SIZE * IMAGE_INSET) / naturalWidth,
        (TEXTURE_SIZE * IMAGE_INSET) / naturalHeight,
      );
      const drawWidth = naturalWidth * scale;
      const drawHeight = naturalHeight * scale;
      ctx.drawImage(
        image,
        (TEXTURE_SIZE - drawWidth) / 2,
        (TEXTURE_SIZE - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );

      const canvasTexture = new THREE.CanvasTexture(canvas);
      canvasTexture.colorSpace = THREE.SRGBColorSpace;
      canvasTexture.anisotropy = 8;
      setLoaded({ url, texture: canvasTexture });
    };

    image.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, backgroundColor]);

  useEffect(() => {
    return () => loaded?.texture.dispose();
  }, [loaded]);

  return loaded && loaded.url === url ? loaded.texture : null;
}
