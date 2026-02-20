import { useMemo } from "react";
import { MousePointer2 } from "lucide-react";
import { type MotionValue, motion } from "motion/react";
import { FloatingIcon } from "../FloatingIcon";
import { HealthcareMedicalBackground } from "../backgrounds/HealthcareMedicalBackground";
import { HealthcareCard } from "../cards/HealthcareCard";
import type { ImmersiveTheme } from "../types";
import { WorkflowDrawer } from "../workflows/WorkflowDrawer";
import { useWorkflowLauncher } from "../workflows/useWorkflowLauncher";

interface HealthcareSectionProps {
  theme: ImmersiveTheme;
  scrollYProgress: MotionValue<number>;
  isInView: boolean;
  bgY: MotionValue<string>;
}

export function HealthcareSection({
  theme,
  scrollYProgress,
  isInView,
  bgY,
}: HealthcareSectionProps) {
  const { activeWorkflow, closeWorkflow, getMenuItemsForActionIds } =
    useWorkflowLauncher("healthcare");

  const summaryMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "healthcare.check_in_issue",
        "healthcare.verify_identity_token",
        "healthcare.coverage_exception",
      ]),
    [getMenuItemsForActionIds],
  );

  const vitalsMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "healthcare.vital_alert",
        "healthcare.request_vital_recheck",
        "healthcare.open_trend_review",
      ]),
    [getMenuItemsForActionIds],
  );

  const statusMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "healthcare.flag_urgent",
        "healthcare.notify_care_team",
        "healthcare.escalate_handoff",
      ]),
    [getMenuItemsForActionIds],
  );

  return (
    <>
      <motion.div
        className="absolute inset-0 -z-20"
        style={{ background: theme.backgroundGradient, y: bgY }}
      />

      <HealthcareMedicalBackground />

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
          <p className="text-lg text-gray-600">{theme.tagline}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <div className="group">
            <HealthcareCard
              menuStyle={theme.menuStyle}
              pointerCircleColor={`${theme.primaryColor}50`}
              pointerColor={theme.primaryColor}
              pointerIcon={theme.pointerIcon}
              primaryColor={theme.primaryColor}
              statusMenuItems={statusMenuItems}
              summaryMenuItems={summaryMenuItems}
              vitalsMenuItems={vitalsMenuItems}
            />
            <motion.div
              className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <MousePointer2 size={14} />
              <span>
                Right-click patient summary, vitals, or care status to interact
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 -z-10"
        style={{
          background: `linear-gradient(to top, rgba(16, 185, 129, 0.1), transparent)`,
        }}
      />

      <WorkflowDrawer activeWorkflow={activeWorkflow} onClose={closeWorkflow} />
    </>
  );
}
