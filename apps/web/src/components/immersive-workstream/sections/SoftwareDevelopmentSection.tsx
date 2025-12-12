import { useCallback, useState } from "react";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";
import { MousePointer2 } from "lucide-react";
import { type MotionValue, motion } from "motion/react";
import { FloatingIcon } from "../FloatingIcon";
import { adapter } from "../adapter";
import { SoftwareEditorCard } from "../cards/SoftwareEditorCard";
import type { ImmersiveTheme } from "../types";

interface SoftwareDevelopmentSectionProps {
  theme: ImmersiveTheme;
  scrollYProgress: MotionValue<number>;
  isInView: boolean;
  bgY: MotionValue<string>;
}

export function SoftwareDevelopmentSection({
  theme,
  scrollYProgress,
  isInView,
  bgY,
}: SoftwareDevelopmentSectionProps) {
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>(
    theme.menuItems,
  );
  const handleMenuItemsChange = useCallback(
    (items: ContextMenuItem[]) => setMenuItems(items),
    [],
  );

  return (
    <>
      <motion.div
        className="absolute inset-0 -z-20"
        style={{
          background: theme.backgroundGradient,
          y: bgY,
        }}
      />

      <div
        className="absolute inset-0 -z-15 opacity-20"
        // style={{
        //   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff41' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        // }}
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
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            className="mb-3 text-4xl font-bold md:text-5xl font-mono"
            style={{
              color: theme.primaryColor,
              textShadow: `0 0 30px ${theme.primaryColor}40`,
            }}
          >
            {theme.title}
          </h2>
          <p className="text-lg text-[#00ff41]/60 font-mono">{theme.tagline}</p>
        </motion.div>

        <AnyclickProvider
          adapter={adapter}
          menuItems={menuItems}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
            }
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <PointerProvider
              theme={{
                colors: {
                  pointerColor: theme.primaryColor,
                  circleColor: `${theme.primaryColor}60`,
                },
                pointerIcon: theme.pointerIcon,
              }}
            >
              <div>
                <SoftwareEditorCard onMenuItemsChange={handleMenuItemsChange} />

                <motion.div
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-[#00ff41]/50 font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <MousePointer2 size={14} />
                  <span>Right-click to see your custom menu</span>
                </motion.div>
              </div>
            </PointerProvider>
          </motion.div>
        </AnyclickProvider>
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
