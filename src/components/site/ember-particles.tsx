"use client";

import { useEffect, useRef } from "react";

/**
 * A sparse field of glowing embers drifting upward over the hero — pure
 * Canvas 2D + requestAnimationFrame, no animation library. Renders on top
 * of whichever background the Hero is showing (uploaded photo or the
 * built-in glow illustration) and sits below the darkening scrim, so it
 * never fights with the title/tagline for contrast.
 *
 * Kept deliberately light for phones: a small, fixed particle count, capped
 * device-pixel-ratio, paused while the tab is hidden, and skipped entirely
 * under prefers-reduced-motion.
 */

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  driftPhase: number;
  color: string;
  life: number;
  maxLife: number;
};

// rgb() triplets for the ember-200/300/400 tokens in globals.css.
const PARTICLE_COLORS = ["231, 200, 131", "221, 177, 88", "212, 160, 58"];

function spawnParticle(width: number, height: number, atBottom: boolean): Particle {
  return {
    x: Math.random() * width,
    y: atBottom ? height + Math.random() * 30 : Math.random() * height,
    radius: 1 + Math.random() * 1.8,
    speed: 10 + Math.random() * 16,
    drift: 6 + Math.random() * 12,
    driftPhase: Math.random() * Math.PI * 2,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    life: 0,
    maxLife: 6000 + Math.random() * 5000,
  };
}

export function EmberParticles({ count = 26 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

        if (p.life >= p.maxLife || p.y < -20) {
          Object.assign(p, spawnParticle(width, height, true));
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        const opacity =
          lifeRatio < 0.15 ? lifeRatio / 0.15 : lifeRatio > 0.8 ? (1 - lifeRatio) / 0.2 : 1;

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${p.color}, ${Math.max(0, opacity * 0.75)})`;
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

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
