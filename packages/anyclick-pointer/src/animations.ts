import type { Transition, Variants } from "motion/react";

/**
 * Spring transition for smooth, natural animations
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

/**
 * Quick spring for responsive interactions
 */
export const quickSpringTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

/**
 * Fade transition for opacity changes
 */
export const fadeTransition: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

/**
 * Animation variants for the pointer icon
 */
export const pointerVariants: Variants = {
  normal: {
    scale: 1,
    opacity: 1,
    rotate: 0,
  },
  rightClick: {
    scale: 0,
    opacity: 0,
    rotate: -15,
  },
  pressing: {
    scale: 0.9,
    opacity: 1,
    rotate: 0,
  },
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
};

/**
 * Animation variants for the circle element (touch indicator)
 */
export const circleVariants: Variants = {
  normal: {
    scale: 0,
    opacity: 0,
  },
  rightClick: {
    scale: 1,
    opacity: 1,
  },
  pressing: {
    scale: 0.6,
    opacity: 0.6,
  },
  hidden: {
    scale: 0,
    opacity: 0,
  },
};

/**
 * Ripple effect variants for the circle
 */
export const rippleVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0.6,
  },
  animate: {
    scale: 1.4,
    opacity: 0,
  },
};

/**
 * Container variants for enter/exit animations
 */
export const containerVariants: Variants = {
  visible: {
    opacity: 1,
    scale: 1,
  },
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
};

/**
 * Get animation transition based on reduced motion preference
 */
export function getTransition(
  prefersReducedMotion: boolean,
  type: "spring" | "quick" | "fade" = "spring"
): Transition {
  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  switch (type) {
    case "quick":
      return quickSpringTransition;
    case "fade":
      return fadeTransition;
    case "spring":
    default:
      return springTransition;
  }
}

/**
 * Create custom spring transition with overrides
 */
export function createSpringTransition(
  overrides?: Partial<{
    stiffness: number;
    damping: number;
    mass: number;
  }>
): Transition {
  return {
    type: "spring",
    stiffness: overrides?.stiffness ?? 400,
    damping: overrides?.damping ?? 30,
    mass: overrides?.mass ?? 0.8,
  };
}

