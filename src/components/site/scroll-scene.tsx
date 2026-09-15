"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Publishes the section's own scroll progress as a CSS variable
 * (`--scroll-progress`, 0 at the top of the viewport, 1 once it has scrolled
 * fully past) so children can be animated with plain CSS transforms.
 *
 * Why not a scroll listener per element, or a library: this writes ONE custom
 * property on ONE node, coalesced into a single requestAnimationFrame, and
 * only while the section is actually on screen — an IntersectionObserver
 * detaches the listener the moment it isn't. Everything that moves in response
 * is a transform or an opacity, so the work lands on the compositor rather
 * than causing layout.
 *
 * Under prefers-reduced-motion the variable is never written and stays 0.
 */
export function ScrollScene({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let listening = false;

    function measure() {
      frame = 0;
      const rect = el!.getBoundingClientRect();
      const height = rect.height || 1;
      const progress = Math.min(1, Math.max(0, -rect.top / height));
      el!.style.setProperty("--scroll-progress", progress.toFixed(4));
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    }

    function listen() {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      measure();
    }

    function stop() {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) listen();
      else stop();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  return (
    <div ref={ref} className={className} style={{ "--scroll-progress": 0 } as React.CSSProperties}>
      {children}
    </div>
  );
}
