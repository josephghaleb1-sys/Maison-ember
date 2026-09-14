"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pointer-driven 3D tilt with a specular highlight that follows the cursor.
 *
 * Deliberately cheap: no state, no re-renders, no rAF loop. Pointer moves
 * write two CSS custom properties and one transform straight onto the DOM
 * node, which the compositor picks up. Enabled only for fine pointers — on
 * touch there is no hover, so the handlers simply never fire — and the
 * transform is dropped entirely under prefers-reduced-motion via the
 * motion-reduce utility.
 */
export function Tilt({
  children,
  className,
  strength = 7,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  strength?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-opacity", "1");
    el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * strength).toFixed(2)}deg) rotateY(${((x - 0.5) * strength).toFixed(2)}deg) translate3d(0,-2px,0)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--glare-opacity", "0");
    el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      data-motion
      className={cn(
        "relative transition-transform duration-300 ease-out will-change-transform motion-reduce:!transform-none",
        className,
      )}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[var(--glare-opacity,0)] transition-opacity duration-300 motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(420px circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(var(--brand-secondary-rgb), 0.16), transparent 60%)",
          }}
        />
      )}
    </div>
  );
}
