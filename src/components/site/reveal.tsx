"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades + lifts an element the first time it enters the viewport.
 *
 * One shared IntersectionObserver for every Reveal on the page (rather than
 * one per element), the observer unobserves each element after it fires, and
 * the animation itself is a plain CSS transition of opacity + transform.
 * Nothing re-renders — the class is toggled on the DOM node directly.
 */

let sharedObserver: IntersectionObserver | null = null;

function getObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          sharedObserver?.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
  }
  return sharedObserver;
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in ms, for animating a list item by item. */
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    const observer = getObserver();
    if (!el || !observer) return;
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <Tag
      ref={ref}
      data-motion
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "translate-y-6 opacity-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "data-[revealed=true]:translate-y-0 data-[revealed=true]:opacity-100",
        "motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
