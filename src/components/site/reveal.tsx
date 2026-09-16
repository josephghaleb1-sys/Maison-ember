"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades + slides a section in the first time it scrolls into view. Pure
 * CSS transition driven by an IntersectionObserver — no animation library.
 * Respects prefers-reduced-motion (see motion-reduce: below).
 *
 * Sections start at opacity 0, so an entrance animation could in principle be
 * the reason a page looks empty. Each root carries `data-reveal`, and the
 * site layout ships a <noscript> rule that forces those elements visible —
 * with JavaScript disabled the content is simply there, unanimated.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms — handy for animating a list item-by-item. */
  delay?: number;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = cn(
    "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
    visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
    className,
  );
  const style = { transitionDelay: visible ? `${delay}ms` : "0ms" };

  if (as === "section") {
    return (
      <section ref={ref} data-reveal style={style} className={classes}>
        {children}
      </section>
    );
  }

  return (
    <div ref={ref} data-reveal style={style} className={classes}>
      {children}
    </div>
  );
}
