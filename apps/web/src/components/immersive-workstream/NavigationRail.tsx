import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import type { ImmersiveTheme } from "./types";

interface NavigationRailProps {
  themes: ImmersiveTheme[];
  activeIndex: number;
  isVisible: boolean;
  onNavigate: (index: number) => void;
}

export function NavigationRail({
  themes,
  activeIndex,
  isVisible,
  onNavigate,
}: NavigationRailProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex flex-row items-center gap-3 md:right-6 md:top-1/2 md:left-auto md:-translate-y-1/2 md:translate-x-0 md:flex-col"
        >
          {themes.map((theme, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={theme.id}
                onClick={() => onNavigate(index)}
                className={cn(
                  "group relative flex items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? "h-4 w-4 scale-100"
                    : "h-3 w-3 hover:scale-110 opacity-50 hover:opacity-100",
                )}
                style={{
                  backgroundColor: isActive
                    ? theme.primaryColor
                    : theme.mode === "light"
                      ? "rgba(0,0,0,0.2)"
                      : "rgba(255,255,255,0.2)",
                  boxShadow: isActive
                    ? `0 0 16px ${theme.primaryColor}, 0 0 32px ${theme.primaryColor}40`
                    : "none",
                }}
                aria-label={`Navigate to ${theme.title}`}
              >
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:mb-0"
                  style={{
                    backgroundColor: isActive
                      ? `${theme.primaryColor}cc`
                      : "rgba(0,0,0,0.8)",
                  }}
                >
                  {theme.title}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
