"use client";

import { useEffect, useRef } from "react";

/**
 * A slow field of glowing motes drifting upward — Canvas 2D +
 * requestAnimationFrame, no animation library, ~2KB of client JS.
 *
 * Performance rules this component follows:
 *   • Each mote is a pre-rendered radial-gradient sprite blitted with
 *     drawImage — no per-frame gradient creation.
 *   • Device pixel ratio is capped at 2 so a 3x phone doesn't render 9x the
 *     pixels.
 *   • The loop is suspended when the tab is hidden *and* when the canvas
 *     scrolls out of view (IntersectionObserver), so it costs nothing once
 *     the visitor is reading further down the page.
 *   • Nothing here touches layout — only canvas pixels.
 *   • Skipped entirely under prefers-reduced-motion.
 */

type Mote = {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  bright: boolean;
  life: number;
  maxLife: number;
  opacity: number;
};

function makeSprite(rgb: string, coreAlpha: number): HTMLCanvasElement {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${rgb}, ${coreAlpha})`);
  gradient.addColorStop(0.4, `rgba(${rgb}, ${coreAlpha * 0.45})`);
  gradient.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function spawn(width: number, height: number, fromBottom: boolean): Mote {
  const depth = Math.random();
  return {
    x: Math.random() * width,
    y: fromBottom ? height + Math.random() * 60 : Math.random() * height,
    size: 3 + depth * 9,
    speed: 6 + depth * 16,
    drift: 4 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    bright: Math.random() < 0.16,
    life: fromBottom ? 0 : Math.random() * 6000,
    maxLife: 9000 + Math.random() * 9000,
    opacity: 0.18 + depth * 0.4,
  };
}

export function DustField({
  rgb = "212, 175, 55",
  brightRgb,
  density = 34,
  className = "",
}: {
  /** "r, g, b" of the drifting motes — usually the brand's accent colour. */
  rgb?: string;
  /** Colour of the occasional brighter mote; defaults to a warm near-white. */
  brightRgb?: string;
  /** Mote count at ~1280px wide; scaled down proportionally on phones. */
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const sprite = makeSprite(rgb, 0.9);
    const brightSprite = makeSprite(brightRgb ?? "255, 244, 214", 1);

    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let rafId = 0;
    let running = false;
    let onScreen = true;
    let lastTime = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(10, Math.round((density * width) / 1280));
      if (motes.length !== count) {
        motes = Array.from({ length: count }, () => spawn(width, height, false));
      }
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      ctx!.clearRect(0, 0, width, height);

      for (const mote of motes) {
        mote.life += dt * 1000;
        mote.y -= mote.speed * dt;
        mote.x += Math.sin(mote.phase + mote.life / 1100) * mote.drift * dt;

        if (mote.life >= mote.maxLife || mote.y < -30) {
          Object.assign(mote, spawn(width, height, true));
          continue;
        }

        const ratio = mote.life / mote.maxLife;
        const fade = ratio < 0.15 ? ratio / 0.15 : ratio > 0.7 ? (1 - ratio) / 0.3 : 1;
        ctx!.globalAlpha = Math.max(0, fade * mote.opacity);
        const image = mote.bright ? brightSprite : sprite;
        ctx!.drawImage(image, mote.x - mote.size / 2, mote.y - mote.size / 2, mote.size, mote.size);
      }

      ctx!.globalAlpha = 1;
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || !onScreen || document.visibilityState !== "visible") return;
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    intersectionObserver.observe(canvas);

    function handleVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [rgb, brightRgb, density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 size-full motion-reduce:hidden ${className}`}
      aria-hidden
    />
  );
}
