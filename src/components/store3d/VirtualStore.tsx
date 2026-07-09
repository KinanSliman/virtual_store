"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import Image from "next/image";
import { useCart, cartTotal } from "@/lib/cart-store";
import { playDoorCreak } from "@/lib/sfx";
import { Scene } from "./Scene";
import type { StoreProduct } from "./types";

export function VirtualStore({ products }: { products: StoreProduct[] }) {
  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutState, setCheckoutState] = useState<
    | { status: "idle" | "pending" }
    | { status: "done"; orderId: number; total: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const cart = useCart();
  const count = cart.items.reduce((n, i) => n + i.quantity, 0);

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
    <div className="relative h-screen w-full select-none overflow-hidden">
      <Canvas shadows camera={{ position: [0, 1.6, 5], fov: 70 }}>
        <Scene
          products={products}
          entered={entered}
          onSelectProduct={selectProduct}
        />
      </Canvas>

      {/* ---- entry / instructions overlay ---- */}
      {!entered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-neutral-900/90 p-8 text-neutral-100 shadow-2xl">
            <h1 className="mb-1 text-2xl font-semibold">🛒 Fresh Mart</h1>
            <p className="mb-6 text-sm text-neutral-400">
              A tiny grocery store you can walk through.
            </p>
            <ul className="mb-8 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Kbd>W A S D</Kbd> or <Kbd>↑ ↓ ← →</Kbd>
                <span className="text-neutral-300">
                  move up, down, left, right
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Kbd>🖱 left click + drag</Kbd>
                <span className="text-neutral-300">look around</span>
              </li>
              <li className="flex items-center gap-3">
                <Kbd>click a product</Kbd>
                <span className="text-neutral-300">
                  see details &amp; add to cart
                </span>
              </li>
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
              Open the door
            </button>
          </div>
        </div>
      )}

      {/* ---- persistent controls hint ---- */}
      {entered && (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-2 text-xs text-white/80">
          WASD / arrows to move · hold left mouse + drag to look · click
          products
        </div>
      )}

      {/* ---- cart button ---- */}
      <button
        type="button"
        onClick={() => {
          setCartOpen((o) => !o);
          setCheckoutState({ status: "idle" });
        }}
        className="absolute right-4 top-4 rounded-full bg-neutral-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-neutral-800"
      >
        🛒 Cart{count > 0 && ` (${count})`}
      </button>

      <Link
        href="/dashboard"
        className="absolute left-4 top-4 rounded-full bg-neutral-900/70 px-4 py-2 text-xs text-white/70 shadow-lg hover:bg-neutral-800"
      >
        Dashboard
      </Link>

      {/* ---- cart panel ---- */}
      {cartOpen && (
        <div className="absolute right-4 top-16 w-80 rounded-xl border border-white/10 bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-2xl">
          <h2 className="mb-3 font-semibold">Your cart</h2>

          {checkoutState.status === "done" ? (
            <div className="rounded-lg bg-emerald-950 p-3 text-emerald-300">
              ✅ Order #{checkoutState.orderId} placed — $
              {Number(checkoutState.total).toFixed(2)}. Thanks for visiting!
            </div>
          ) : cart.items.length === 0 ? (
            <p className="text-neutral-400">
              Empty. Click a product on a shelf to add it.
            </p>
          ) : (
            <>
              <ul className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                {cart.items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: product.color }}
                      />
                      <span className="truncate">{product.name}</span>
                    </span>
                    <span className="flex items-center gap-1">
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
                      <span className="ml-2 w-14 text-right text-neutral-300">
                        ${(Number(product.price) * quantity).toFixed(2)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-3 flex justify-between border-t border-white/10 pt-3 font-medium">
                <span>Total</span>
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
                  ? "Placing order…"
                  : "Checkout (demo — no payment)"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- product popup ---- */}
      {selected && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/95 p-6 text-neutral-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl && (
              <Image
                src={selected.imageUrl}
                alt={selected.name}
                width={112}
                height={112}
                unoptimized
                className="mx-auto mb-4 h-28 w-28 rounded-xl"
              />
            )}
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-sm"
                style={{ backgroundColor: selected.color }}
              />
              <h2 className="text-lg font-semibold">{selected.name}</h2>
            </div>
            <p className="mb-3 text-xs uppercase tracking-wide text-neutral-500">
              {selected.category}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-neutral-300">
              {selected.description || "No description yet."}
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
                  ? `${selected.stock} in stock`
                  : "Out of stock"}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={selected.stock <= 0}
                onClick={() => {
                  cart.add({
                    id: selected.id,
                    name: selected.name,
                    price: selected.price,
                    color: selected.color,
                  });
                  setSelected(null);
                  setCartOpen(true);
                  setCheckoutState({ status: "idle" });
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/20 bg-neutral-800 px-2 py-1 font-mono text-xs">
      {children}
    </kbd>
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
      className="h-6 w-6 rounded-md border border-white/20 text-center leading-none hover:bg-white/10"
    >
      {children}
    </button>
  );
}
