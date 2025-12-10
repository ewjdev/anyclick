import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { MousePointer2 } from "lucide-react";
import { type MotionValue, motion } from "motion/react";
import { FloatingIcon } from "../FloatingIcon";
import { adapter } from "../adapter";
import type { ImmersiveTheme } from "../types";

interface DefaultWorkstreamSectionProps {
  theme: ImmersiveTheme;
  scrollYProgress: MotionValue<number>;
  isInView: boolean;
  bgY: MotionValue<string>;
}

export function DefaultWorkstreamSection({
  theme,
  scrollYProgress,
  isInView,
  bgY,
}: DefaultWorkstreamSectionProps) {
  return (
    <>
      <motion.div
        className="absolute inset-0 -z-20"
        style={{ background: theme.backgroundGradient, y: bgY }}
      />

      {theme.gridPattern && (
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{ background: theme.gridPattern }}
        />
      )}

      {theme.floatingElements.map((element, i) => (
        <FloatingIcon
          key={i}
          element={element}
          scrollYProgress={scrollYProgress}
        />
      ))}

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            className="mb-3 text-4xl font-bold md:text-5xl"
            style={{ color: theme.primaryColor }}
          >
            {theme.title}
          </h2>
          <p className="text-lg text-gray-400">{theme.tagline}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <AnyclickProvider
            adapter={adapter}
            menuItems={theme.menuItems}
            metadata={{ workstream: theme.id }}
            theme={{
              menuStyle: theme.menuStyle,
              highlightConfig: {
                enabled: true,
                colors: {
                  targetColor: theme.primaryColor,
                  containerColor: `${theme.primaryColor}40`,
                },
              },
            }}
            header={<></>}
            scoped
          >
            <PointerProvider
              theme={{
                colors: {
                  pointerColor: theme.primaryColor,
                  circleColor: `${theme.primaryColor}60`,
                },
                pointerIcon: theme.pointerIcon,
              }}
              config={{ visibility: "always", hideDefaultCursor: true }}
            >
              <div className="group cursor-none">
                {theme.cardContent}
                <motion.div
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <MousePointer2 size={14} />
                  <span>Right-click to interact</span>
                </motion.div>
              </div>
            </PointerProvider>
          </AnyclickProvider>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 -z-10"
        style={{
          background: `linear-gradient(to top, ${theme.glowColor}, transparent)`,
          opacity: 0.3,
        }}
      />
    </>
  );
}
