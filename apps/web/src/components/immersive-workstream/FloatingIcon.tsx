import { type MotionValue, motion, useTransform } from "motion/react";
import type { FloatingElement } from "./types";

interface FloatingIconProps {
  element: FloatingElement;
  scrollYProgress: MotionValue<number>;
}

export function FloatingIcon({ element, scrollYProgress }: FloatingIconProps) {
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -150 * element.parallaxMultiplier],
  );

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: element.position.x,
        top: element.position.y,
        y,
        fontSize: element.size,
        opacity: element.opacity,
        rotate: element.rotation || 0,
      }}
    >
      {element.icon}
    </motion.div>
  );
}
