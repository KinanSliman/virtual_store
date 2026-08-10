"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { useCart, cartTotal } from "@/lib/cart-store";
import { playDoorCreak } from "@/lib/sfx";
import { LOCALES, LOCALE_LABELS, dir, t, type Locale } from "@/lib/i18n";
import {
  getCoarsePointerSnapshot,
  getLocaleSnapshot,
  getServerCoarsePointerSnapshot,
  getServerLocaleSnapshot,
  setStoredLocale,
  subscribeCoarsePointer,
  subscribeLocale,
} from "@/lib/locale-store";
import { localizedStoreName } from "@/lib/branding";
import { Scene } from "./Scene";
import { ThumbStick } from "./ThumbStick";
import { resetMoveInput } from "./controls-state";
import {
  productCategory,
  productDescription,
  productName,
  type StoreBranding,
  type StoreProduct,
} from "./types";

export function VirtualStore({
  products,
  settings,
}: {
  products: StoreProduct[];
  settings: StoreBranding;
}) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );
  const isTouch = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getServerCoarsePointerSnapshot,
  );
  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    | { status: "idle" | "pending" }
    | { status: "done"; orderId: number; total: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const cart = useCart();
  const copy = t(locale);
  const storeName = localizedStoreName(settings, locale);
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

  // Arabic flips the whole document; reset on the way out so the
  // dashboard doesn't inherit RTL after a client-side navigation
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir(locale);
    return () => {
      root.lang = "en";
      root.dir = "ltr";
    };
  }, [locale]);

  // a stuck stick would keep the shopper walking while a dialog is open
  useEffect(() => {
    if (selected || cartOpen) resetMoveInput();
  }, [selected, cartOpen]);

  function chooseLocale(next: Locale) {
    setStoredLocale(next);
  }

  const selectProduct = useCallback((p: StoreProduct) => {
    setSelected(p);
    // analytics: log the click, fire-and-forget
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id }),
    }).catch(() => {});
  }, []);

  async function checkout() {
    setCheckoutState({ status: "pending" });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      cart.clear();
      setCheckoutState({
        status: "done",
        orderId: data.orderId,
        total: data.total,
      });
    } catch (err) {
      setCheckoutState({
        status: "error",
        message: err instanceof Error ? err.message : "Checkout failed",
      });
    }
  }

  return (
    <div className="h-viewport relative w-full shrink-0 select-none overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.6, 5], fov: 70 }}
        style={{ touchAction: "none" }}
      >
        <Scene
          products={products}
          entered={entered}
          locale={locale}
          storeName={storeName}
          onSelectProduct={selectProduct}
        />
      </Canvas>

      {/* ---- entry / language / instructions overlay ---- */}
      {!entered && (
        <div
          dir={dir(locale)}
          className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/90 p-6 text-neutral-100 shadow-2xl sm:p-8">
            <div className="mb-1 flex items-center gap-3">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 shrink-0 rounded-lg bg-neutral-800 object-contain"
                />
              ) : (
                <span className="text-2xl">🛒</span>
              )}
              <h1 className="text-xl font-semibold sm:text-2xl">{storeName}</h1>
            </div>
            <p className="mb-5 text-sm text-neutral-400">{copy.tagline}</p>

            {/* language choice — before the door opens */}
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                {copy.chooseLanguage}
              </p>
              <div className="flex gap-2">
                {LOCALES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => chooseLocale(code)}
                    aria-pressed={locale === code}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition ${
                      locale === code
                        ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                        : "border-white/15 text-neutral-300 hover:bg-white/5"
                    }`}
                  >
                    {LOCALE_LABELS[code].label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mb-7 space-y-3 text-sm">
              {isTouch ? (
                <>
                  <InstructionRow keys={copy.touchMove} hint={copy.touchMoveHint} />
                  <InstructionRow keys={copy.touchLook} hint={copy.touchLookHint} />
                </>
              ) : (
                <>
                  <InstructionRow
                    keys={`${copy.moveKeys}  /  ↑ ↓ ← →`}
                    hint={copy.moveHint}
                  />
                  <InstructionRow keys={copy.lookKeys} hint={copy.lookHint} />
                </>
              )}
              <InstructionRow
                keys={copy.clickProduct}
                hint={copy.clickProductHint}
              />
            </ul>

            <button
              type="button"
              onClick={() => {
                // user gesture — safe to start the AudioContext
                playDoorCreak();
                setEntered(true);
              }}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500"
            >
              {copy.openDoor}
            </button>
          </div>
        </div>
      )}

      {/* ---- in-store HUD ---- */}
      {entered && (
        <>
          <p
            dir={dir(locale)}
            className="pointer-events-none absolute bottom-3 start-1/2 w-[92%] max-w-lg -translate-x-1/2 rounded-lg bg-black/50 px-3 py-2 text-center text-[11px] text-white/80 sm:bottom-4 sm:text-xs rtl:translate-x-1/2"
          >
            {isTouch ? copy.hudHintTouch : copy.hudHint}
          </p>
          {isTouch && (
            <div className="absolute bottom-20 start-5 sm:bottom-24">
              <ThumbStick hint={copy.touchMoveHint} />
            </div>
          )}
        </>
      )}

      {/* ---- cart button ---- */}
      <button
        type="button"
        onClick={() => {
          setCartOpen((o) => !o);
          setCheckoutState({ status: "idle" });
        }}
        className="absolute end-3 top-3 rounded-full bg-neutral-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-neutral-800 sm:end-4 sm:top-4"
      >
        🛒 {copy.cart}
        {count > 0 && ` (${count})`}
      </button>

      <Link
        href="/dashboard"
        className="absolute start-3 top-3 rounded-full bg-neutral-900/70 px-3 py-2 text-xs text-white/70 shadow-lg hover:bg-neutral-800 sm:start-4 sm:top-4"
      >
        {copy.dashboard}
      </Link>

      {/* ---- cart panel ---- */}
      {cartOpen && (
        <div
          dir={dir(locale)}
          className="absolute inset-x-3 top-16 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-2xl sm:inset-x-auto sm:end-4 sm:w-80"
        >
          <h2 className="mb-3 font-semibold">{copy.yourCart}</h2>

          {checkoutState.status === "done" ? (
            <div className="rounded-lg bg-emerald-950 p-3 text-emerald-300">
              ✅{" "}
              {copy.orderPlaced(
                checkoutState.orderId,
                Number(checkoutState.total).toFixed(2),
              )}
            </div>
          ) : cart.items.length === 0 ? (
            <p className="text-neutral-400">{copy.cartEmpty}</p>
          ) : (
            <>
              <ul className="mb-3 space-y-2">
                {cart.items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: product.color }}
                      />
                      <span className="truncate">{product.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <QtyBtn
                        onClick={() =>
                          cart.setQuantity(product.id, quantity - 1)
                        }
                      >
                        −
                      </QtyBtn>
                      <span className="w-6 text-center">{quantity}</span>
                      <QtyBtn
                        onClick={() =>
                          cart.setQuantity(product.id, quantity + 1)
                        }
                      >
                        +
                      </QtyBtn>
                      <span className="ms-2 w-14 text-end text-neutral-300">
                        ${(Number(product.price) * quantity).toFixed(2)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-3 flex justify-between border-t border-white/10 pt-3 font-medium">
                <span>{copy.total}</span>
                <span>${cartTotal(cart.items).toFixed(2)}</span>
              </div>
              {checkoutState.status === "error" && (
                <p className="mb-2 text-xs text-red-400">
                  {checkoutState.message}
                </p>
              )}
              <button
                type="button"
                disabled={checkoutState.status === "pending"}
                onClick={checkout}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {checkoutState.status === "pending"
                  ? copy.placingOrder
                  : copy.checkout}
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- product popup ---- */}
      {selected && (
        <div
          dir={dir(locale)}
          className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/95 p-5 text-neutral-100 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl && (
              <Image
                src={selected.imageUrl}
                alt={productName(selected, locale)}
                width={112}
                height={112}
                unoptimized
                className="mx-auto mb-4 h-24 w-24 rounded-xl sm:h-28 sm:w-28"
              />
            )}
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-sm"
                style={{ backgroundColor: selected.color }}
              />
              <h2 className="text-lg font-semibold">
                {productName(selected, locale)}
              </h2>
            </div>
            <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">
              {productCategory(selected, locale)}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-neutral-300">
              {productDescription(selected, locale) || copy.noDescription}
            </p>
            <div className="mb-5 flex items-center justify-between">
              <span className="text-2xl font-semibold">
                ${Number(selected.price).toFixed(2)}
              </span>
              <span
                className={`text-xs ${
                  selected.stock > 0 ? "text-neutral-400" : "text-red-400"
                }`}
              >
                {selected.stock > 0
                  ? copy.inStock(selected.stock)
                  : copy.outOfStock}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={selected.stock <= 0}
                onClick={() => {
                  cart.add({
                    id: selected.id,
                    name: productName(selected, locale),
                    price: selected.price,
                    color: selected.color,
                  });
                  setSelected(null);
                  setCartOpen(true);
                  setCheckoutState({ status: "idle" });
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copy.addToCart}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/20 px-4 py-2.5 text-sm hover:bg-white/10"
              >
                {copy.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InstructionRow({ keys, hint }: { keys: string; hint: string }) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <kbd className="rounded-md border border-white/20 bg-neutral-800 px-2 py-1 font-mono text-xs">
        {keys}
      </kbd>
      <span className="text-neutral-300">{hint}</span>
    </li>
  );
}

function QtyBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 w-7 rounded-md border border-white/20 text-center leading-none hover:bg-white/10"
    >
      {children}
    </button>
  );
}
