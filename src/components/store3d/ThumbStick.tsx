"use client";

import { useRef, useState } from "react";
import { moveInput, resetMoveInput } from "./controls-state";

const RADIUS = 46; // px the knob can travel from centre

/**
 * On-screen movement stick for touch devices. Writes straight into the
 * shared moveInput object rather than React state — the 3D loop reads it
 * every frame, and re-rendering on each move would be wasteful.
 */
export function ThumbStick({ hint }: { hint: string }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function updateFrom(clientX: number, clientY: number) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > RADIUS) {
      dx = (dx / distance) * RADIUS;
      dy = (dy / distance) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    moveInput.strafe = dx / RADIUS;
    moveInput.forward = -dy / RADIUS; // pushing up walks forward
  }

  function release() {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    resetMoveInput();
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={baseRef}
        onPointerDown={(e) => {
          pointerId.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFrom(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (pointerId.current !== e.pointerId) return;
          updateFrom(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative h-28 w-28 touch-none rounded-full border border-white/25 bg-black/30 backdrop-blur-sm"
        role="application"
        aria-label={hint}
      >
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/70 shadow-lg"
          style={{
            transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
