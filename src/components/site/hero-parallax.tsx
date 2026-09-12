"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the hero's background layer (photo or illustration) with a subtle
 * pointer-based parallax tilt, for devices with a precise pointer (desktop
 * mice/trackpads) — a small "living" depth cue rather than a static image.
 *
 * No-ops entirely under prefers-reduced-motion or on touch devices (no
 * pointermove events fire there anyway). The wrapper is intentionally
 * larger than the hero (negative inset) so the translation never reveals an
 * edge — the hero section itself clips it via overflow-hidden.
 */
export function HeroParallax({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId = 0;

    function handlePointerMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = relX * -18;
      targetY = relY * -14;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      el!.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="absolute -inset-8 will-change-transform sm:-inset-12">
      {children}
    </div>
  );
}
