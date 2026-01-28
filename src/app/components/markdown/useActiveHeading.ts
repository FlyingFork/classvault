"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Heading } from "./utils";

interface UseActiveHeadingOptions {
  /** Offset from top for navbar (default: 100px) */
  topOffset?: number;
  /** Debounce delay for hash updates in ms (default: 150) */
  debounceDelay?: number;
  /** Whether to update URL hash on scroll (default: true) */
  updateHash?: boolean;
}

/**
 * Hook that tracks which heading is currently active based on scroll position.
 * Uses IntersectionObserver for performance.
 */
export function useActiveHeading(
  headings: Heading[],
  options: UseActiveHeadingOptions = {},
) {
  const { topOffset = 100, debounceDelay = 150, updateHash = true } = options;

  // Initialize with URL hash or first heading
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash.slice(1);
    if (hash && headings.some((h) => h.id === hash)) {
      return hash;
    }
    return headings[0]?.id ?? "";
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hashUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibleHeadingsRef = useRef<Map<string, number>>(new Map());

  // Debounced hash update
  const updateUrlHash = useCallback(
    (id: string) => {
      if (!updateHash) return;

      if (hashUpdateTimeoutRef.current) {
        clearTimeout(hashUpdateTimeoutRef.current);
      }

      hashUpdateTimeoutRef.current = setTimeout(() => {
        if (id && typeof window !== "undefined") {
          const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
          window.history.replaceState(null, "", newUrl);
        }
      }, debounceDelay);
    },
    [debounceDelay, updateHash],
  );

  // Find the topmost visible heading
  const updateActiveHeading = useCallback(() => {
    const visibleHeadings = visibleHeadingsRef.current;

    if (visibleHeadings.size === 0) {
      return;
    }

    // Find the heading closest to the top of the viewport
    let topmostId = "";
    let topmostPosition = Infinity;

    visibleHeadings.forEach((position, id) => {
      if (position < topmostPosition) {
        topmostPosition = position;
        topmostId = id;
      }
    });

    if (topmostId && topmostId !== activeId) {
      setActiveId(topmostId);
      updateUrlHash(topmostId);
    }
  }, [activeId, updateUrlHash]);

  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;

          if (entry.isIntersecting) {
            // Track visible headings and their positions
            visibleHeadingsRef.current.set(id, entry.boundingClientRect.top);
          } else {
            visibleHeadingsRef.current.delete(id);
          }
        });

        updateActiveHeading();
      },
      {
        // Root margin: negative top (for navbar), negative bottom (activate when in top third)
        rootMargin: `-${topOffset}px 0px -66% 0px`,
        threshold: [0, 1],
      },
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (hashUpdateTimeoutRef.current) {
        clearTimeout(hashUpdateTimeoutRef.current);
      }
    };
  }, [headings, topOffset, updateActiveHeading]);

  // Handle hash change events (e.g., browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && headings.some((h) => h.id === hash)) {
        // Use timeout to avoid synchronous setState in event handler
        setTimeout(() => setActiveId(hash), 0);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [headings]);

  return { activeId, setActiveId };
}
