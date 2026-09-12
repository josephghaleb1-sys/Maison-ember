"use client";

import { useEffect, useRef } from "react";

/**
 * A field of glowing embers drifting upward over the hero — pure Canvas 2D +
 * requestAnimationFrame, no animation library. Renders on top of whichever
 * background the Hero is showing (uploaded photo or the built-in glow
 * illustration) and sits below the darkening scrim, so it never fights with
 * the title/tagline for contrast.
 *
 * Each ember is a soft pre-rendered radial-gradient sprite (not a flat dot),
 * blitted via drawImage for performance. Particles carry a "depth" so near
 * ones read larger/brighter/faster than far ones, and a small fraction spawn
 * as brighter, quicker "sparks" for visual variety.
 *
 * Kept safe for phones: a modest particle count, capped device-pixel-ratio,
 * paused while the tab is hidden, and skipped entirely under
 * prefers-reduced-motion.
 */

type Kind = "ember" | "spark";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  driftPhase: number;
  kind: Kind;
  life: number;
  maxLife: number;
  baseOpacity: number;
};

const EMBER_RGB = "221, 177, 88"; // ember-300
const SPARK_RGB = "247, 227, 182"; // warm near-white

function makeGlowSprite(rgb: string, coreAlpha: number): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${rgb}, ${coreAlpha})`);
  gradient.addColorStop(0.35, `rgba(${rgb}, ${coreAlpha * 0.5})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function spawnParticle(width: number, height: number, atBottom: boolean): Particle {
  const isSpark = Math.random() < 0.12;
  const depth = Math.random();
  return {
    x: Math.random() * width,
    y: atBottom ? height + Math.random() * 30 : Math.random() * height,
    size: isSpark ? 9 + depth * 8 : 15 + depth * 27,
    speed: (isSpark ? 32 : 9) + depth * 22,
    drift: 6 + depth * 14,
    driftPhase: Math.random() * Math.PI * 2,
    kind: isSpark ? "spark" : "ember",
    life: 0,
    maxLife: isSpark ? 1600 + Math.random() * 1200 : 5500 + Math.random() * 5500,
    baseOpacity: isSpark ? 0.9 : 0.35 + depth * 0.45,
  };
}

export function EmberParticles({ count = 30 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const emberSprite = makeGlowSprite(EMBER_RGB, 0.9);
    const sparkSprite = makeGlowSprite(SPARK_RGB, 1);

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = parent!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const particles: Particle[] = Array.from({ length: count }, () => {
      const p = spawnParticle(width, height, false);
      p.life = Math.random() * p.maxLife;
      return p;
    });

    let lastTime = performance.now();
    let rafId = 0;

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.life += dt * 1000;
        p.y -= p.speed * dt;
        p.x += Math.sin(p.driftPhase + p.life / 900) * p.drift * dt;

        if (p.life >= p.maxLife || p.y < -40) {
          Object.assign(p, spawnParticle(width, height, true));
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const fade =
          lifeRatio < 0.12 ? lifeRatio / 0.12 : lifeRatio > 0.75 ? (1 - lifeRatio) / 0.25 : 1;
        const opacity = Math.max(0, fade * p.baseOpacity);

        const sprite = p.kind === "spark" ? sparkSprite : emberSprite;
        ctx!.globalAlpha = opacity;
        ctx!.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx!.globalAlpha = 1;

      rafId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafId);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="motion-reduce:hidden pointer-events-none absolute inset-0 size-full"
      aria-hidden
    />
  );
}
