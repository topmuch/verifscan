"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal element on scroll using IntersectionObserver.
 * Returns a ref to attach + a boolean indicating if it has been revealed.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { threshold?: number; rootMargin?: string; once?: boolean } = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -60px 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, revealed };
}

/**
 * Animated counter that increments from 0 to `end` when the element enters the viewport.
 */
export function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    let startTime: number | null = null;
    let raf: number;

    const tick = (t: number) => {
      if (startTime === null) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setCount(end);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);

  return count;
}

/**
 * Combination: reveal + counter that starts when revealed.
 */
export function useRevealCounter(end: number, duration = 2000) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const count = useCounter(end, duration, revealed);
  return { ref, count, revealed };
}
