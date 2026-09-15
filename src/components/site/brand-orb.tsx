"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's 3D centrepiece: a gyroscope of gold rings orbiting a faceted
 * gem, on a real CSS 3D stage (`perspective` + `transform-style: preserve-3d`).
 *
 * Why it's built this way rather than with WebGL: every moving part here is a
 * transform or an opacity, which the browser promotes to the compositor and
 * animates off the main thread. The whole scene costs no JavaScript per frame
 * (the rings are CSS keyframes) except an optional pointer parallax, which is
 * rAF-throttled, desktop-only, and writes a single transform on one element.
 * The result reads as genuine 3D while shipping ~1KB of JS and zero textures —
 * a Three.js scene would cost ~150KB before the first pixel.
 */
export function BrandOrb({ monogram }: { monogram: string }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch devices get the (already animated) scene without pointer tracking.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    function onPointerMove(event: PointerEvent) {
      targetY = (event.clientX / window.innerWidth - 0.5) * 26;
      targetX = (0.5 - event.clientY / window.innerHeight) * 18;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function tick() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      stage!.style.transform = `rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;

      // Park the loop once the scene has caught up with the pointer, so an
      // idle page runs no JavaScript at all.
      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none relative aspect-square w-[min(78vw,30rem)]"
      style={{ perspective: "1100px" }}
      aria-hidden
    >
      {/* Ambient light cast behind the orb */}
      <div className="animate-ambient-glow absolute inset-[12%] rounded-full bg-brand/45 blur-[70px]" />
      <div
        className="animate-ambient-glow absolute inset-[26%] rounded-full bg-accent/25 blur-[60px]"
        style={{ animationDelay: "1.4s" }}
      />

      <div
        ref={stageRef}
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="animate-bob absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {/* Three orbiting rings, each on its own axis and speed. */}
          <Ring tilt="rotateX(74deg) rotateZ(6deg)" duration="26s" inset="4%" opacity={0.85} />
          <Ring tilt="rotateX(66deg) rotateY(32deg)" duration="34s" inset="14%" opacity={0.6} reverse />
          <Ring tilt="rotateX(18deg) rotateY(-24deg)" duration="44s" inset="22%" opacity={0.42} />

          {/* Faceted gem: two conic gradients clipped into a brilliant-cut
              silhouette, with a highlight that catches the "light". */}
          <div
            className="absolute left-1/2 top-1/2 size-[34%]"
            style={{ transform: "translate(-50%, -50%) translateZ(40px)" }}
          >
            <div
              className="size-full"
              style={{
                clipPath:
                  "polygon(50% 0%, 82% 28%, 100% 34%, 50% 100%, 0% 34%, 18% 28%)",
                background:
                  "conic-gradient(from 210deg at 50% 38%, color-mix(in oklab, var(--brand-secondary) 55%, #120a06) 0deg, var(--brand-secondary) 70deg, color-mix(in oklab, var(--brand-secondary) 72%, white) 130deg, var(--brand-secondary) 190deg, color-mix(in oklab, var(--brand-secondary) 45%, #120a06) 260deg, color-mix(in oklab, var(--brand-secondary) 70%, white) 320deg, color-mix(in oklab, var(--brand-secondary) 55%, #120a06) 360deg)",
                filter: "drop-shadow(0 12px 28px rgba(var(--brand-secondary-rgb), 0.35))",
              }}
            />
          </div>

          {/* Monogram, floating a little in front of the gem. */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: "translateZ(104px)" }}
          >
            <span className="font-display text-[clamp(2.2rem,7vw,3.6rem)] font-semibold tracking-[0.3em] text-ink-50/95 drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]">
              {monogram}
            </span>
          </div>
        </div>
      </div>

      {/* Reflection on the "floor" below the orb */}
      <div className="absolute inset-x-[18%] bottom-[2%] h-6 rounded-[100%] bg-accent/20 blur-xl" />
    </div>
  );
}

function Ring({
  tilt,
  duration,
  inset,
  opacity,
  reverse = false,
}: {
  tilt: string;
  duration: string;
  inset: string;
  opacity: number;
  reverse?: boolean;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        // The scroll-driven half turn rides on top of the constant spin, so
        // the rings visibly wind on as the page moves.
        transform: `${tilt} rotate(calc(var(--scroll-progress, 0) * ${reverse ? "-" : ""}140deg))`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute rounded-full border border-accent/70"
        style={{
          inset,
          opacity,
          boxShadow: "0 0 24px rgba(var(--brand-secondary-rgb), 0.35)",
          animation: `spin-y ${duration} linear infinite${reverse ? " reverse" : ""}`,
        }}
      >
        {/* A brighter "bead" riding the ring sells the rotation. */}
        <span className="absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent-bright shadow-[0_0_12px_rgba(var(--brand-secondary-rgb),0.9)]" />
      </div>
    </div>
  );
}
