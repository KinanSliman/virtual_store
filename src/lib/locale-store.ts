"use client";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "./i18n";

/**
 * The shopper's language lives in localStorage, which React reads through
 * useSyncExternalStore — that keeps the choice across visits without copying
 * it into state during an effect (which would cascade an extra render).
 */

const listeners = new Set<() => void>();
let cached: Locale | null = null;

function read(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function subscribeLocale(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Must return a stable value between renders, hence the cache. */
export function getLocaleSnapshot(): Locale {
  if (cached === null) cached = read();
  return cached;
}

/** During SSR and hydration nobody has picked yet. */
export function getServerLocaleSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function setStoredLocale(next: Locale): void {
  cached = next;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  for (const listener of listeners) listener();
}

/** True on phones and tablets, where there is no mouse to drag with. */
export function subscribeCoarsePointer(onChange: () => void): () => void {
  const query = window.matchMedia("(pointer: coarse)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function getCoarsePointerSnapshot(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function getServerCoarsePointerSnapshot(): boolean {
  return false;
}
