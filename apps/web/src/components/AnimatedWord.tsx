"use client";

/**
 * AnimatedWord - Component that cycles through words on click with smooth layout animations.
 *
 * @module components/AnimatedWord
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface AnimatedWordProps {
  words: string[];
  onCycleComplete?: () => void;
  className?: string;
}

/**
 * AnimatedWord component that cycles through an array of words on click.
 * When cycling back to the first word (index 0), calls onCycleComplete callback.
 *
 * @param words - Array of words to cycle through
 * @param onCycleComplete - Callback fired when cycling back to the first word
 * @param className - Additional CSS classes
 */
export function AnimatedWord({
  words,
  onCycleComplete,
  className = "",
}: AnimatedWordProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const handleClick = () => {
    if (!hasStarted) {
      // First click: animate out "everything" and show first word
      setHasStarted(true);
      setCurrentIndex(0);
    } else {
      // Subsequent clicks: cycle through words
      const nextIndex = (currentIndex + 1) % words.length;
      setCurrentIndex(nextIndex);

      // If we've cycled back to index 0, trigger completion callback
      if (nextIndex === 0 && onCycleComplete) {
        onCycleComplete();
      }
    }
  };

  const currentWord = hasStarted ? words[currentIndex] : "everything";

  return (
    <motion.span
      layout="size"
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.6 }}
      onClick={handleClick}
      className="inline-block cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Click to cycle through words"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          layout="size"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`inline-block ${className}`}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
