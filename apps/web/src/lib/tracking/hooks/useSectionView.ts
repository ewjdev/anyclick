"use client";

/**
 * useSectionView - Track when a section becomes visible.
 *
 * @module tracking/hooks/useSectionView
 */

import { useEffect, useRef, type RefObject } from "react";
import { getTrackingManager } from "../manager";
import type { SectionViewConfig } from "../types";

/**
 * Hook for tracking when a section becomes visible in the viewport.
 *
 * @example
 * ```tsx
 * function FeaturesSection() {
 *   const sectionRef = useSectionView({
 *     intent: HomepageIntent.FEATURES_SECTION_VIEW,
 *     threshold: 0.5,
 *     once: true,
 *   });
 *
 *   return (
 *     <section ref={sectionRef}>
 *       ...
 *     </section>
 *   );
 * }
 * ```
 */
export function useSectionView<T extends Element = HTMLElement>(
  config: SectionViewConfig
): RefObject<T | null> {
  const { intent, threshold = 0.5, once = true, minVisibleTime = 0 } = config;

  const ref = useRef<T | null>(null);
  const trackedRef = useRef(false);
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) {
      return;
    }

    const element = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          // Element is visible
          if (trackedRef.current && once) {
            return;
          }

          if (minVisibleTime > 0) {
            // Wait for minimum visible time
            visibleTimerRef.current = setTimeout(() => {
              if (!trackedRef.current || !once) {
                trackedRef.current = true;
                getTrackingManager().track(intent, {
                  engagement: {
                    viewportVisible: true,
                    timeOnSection: minVisibleTime,
                  },
                });
              }
            }, minVisibleTime);
          } else {
            // Track immediately
            trackedRef.current = true;
            getTrackingManager().track(intent, {
              engagement: {
                viewportVisible: true,
              },
            });
          }
        } else {
          // Element left viewport - cancel pending timer
          if (visibleTimerRef.current) {
            clearTimeout(visibleTimerRef.current);
            visibleTimerRef.current = null;
          }
        }
      },
      {
        threshold,
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
      }
    };
  }, [intent, threshold, once, minVisibleTime]);

  return ref;
}

/**
 * Hook for tracking when an existing ref element becomes visible.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const myRef = useRef<HTMLDivElement>(null);
 *
 *   useSectionViewWithRef(myRef, {
 *     intent: HomepageIntent.FEATURES_SECTION_VIEW,
 *   });
 *
 *   return <div ref={myRef}>...</div>;
 * }
 * ```
 */
export function useSectionViewWithRef<T extends Element>(
  ref: RefObject<T | null>,
  config: SectionViewConfig
): void {
  const { intent, threshold = 0.5, once = true, minVisibleTime = 0 } = config;

  const trackedRef = useRef(false);
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) {
      return;
    }

    const element = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          if (trackedRef.current && once) {
            return;
          }

          if (minVisibleTime > 0) {
            visibleTimerRef.current = setTimeout(() => {
              if (!trackedRef.current || !once) {
                trackedRef.current = true;
                getTrackingManager().track(intent, {
                  engagement: {
                    viewportVisible: true,
                    timeOnSection: minVisibleTime,
                  },
                });
              }
            }, minVisibleTime);
          } else {
            trackedRef.current = true;
            getTrackingManager().track(intent, {
              engagement: {
                viewportVisible: true,
              },
            });
          }
        } else {
          if (visibleTimerRef.current) {
            clearTimeout(visibleTimerRef.current);
            visibleTimerRef.current = null;
          }
        }
      },
      {
        threshold,
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
      }
    };
  }, [ref, intent, threshold, once, minVisibleTime]);
}
