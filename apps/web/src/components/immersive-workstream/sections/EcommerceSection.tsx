import { useMemo } from "react";
import { MousePointer2 } from "lucide-react";
import { type MotionValue, motion } from "motion/react";
import { FloatingIcon } from "../FloatingIcon";
import { EcommerceCard } from "../cards/EcommerceCard";
import type { ImmersiveTheme } from "../types";
import { WorkflowDrawer } from "../workflows/WorkflowDrawer";
import { useWorkflowLauncher } from "../workflows/useWorkflowLauncher";

interface EcommerceSectionProps {
  bgY: MotionValue<string>;
  isInView: boolean;
  scrollYProgress: MotionValue<number>;
  theme: ImmersiveTheme;
}

export function EcommerceSection({
  bgY,
  isInView,
  scrollYProgress,
  theme,
}: EcommerceSectionProps) {
  const { activeWorkflow, closeWorkflow, getMenuItemsForActionIds } =
    useWorkflowLauncher("ecommerce");

  const orderMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "ecommerce.item_missing",
        "ecommerce.shipping_issue",
        "ecommerce.escalate_order",
      ]),
    [getMenuItemsForActionIds],
  );

  const stockMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "ecommerce.view_stock_details",
        "ecommerce.adjust_stock",
        "ecommerce.set_restock_alert",
      ]),
    [getMenuItemsForActionIds],
  );

  const pricingMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "ecommerce.view_discounts",
        "ecommerce.change_price",
        "ecommerce.schedule_promotion",
      ]),
    [getMenuItemsForActionIds],
  );

  const productMenuItems = useMemo(
    () =>
      getMenuItemsForActionIds([
        "ecommerce.edit_product",
        "ecommerce.upload_product_media",
        "ecommerce.update_product_copy",
      ]),
    [getMenuItemsForActionIds],
  );

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

      {theme.floatingElements.map((element, index) => (
        <FloatingIcon
          key={index}
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

        <div>
          <div className="group">
            <EcommerceCard
              menuStyle={theme.menuStyle}
              orderMenuItems={orderMenuItems}
              pointerCircleColor={`${theme.primaryColor}60`}
              pointerColor={theme.primaryColor}
              pointerIcon={theme.pointerIcon}
              pricingMenuItems={pricingMenuItems}
              primaryColor={theme.primaryColor}
              productMenuItems={productMenuItems}
              stockMenuItems={stockMenuItems}
            />
            <motion.div
              className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <MousePointer2 size={14} />
              <span>
                Right-click stock, pricing, product details, or order rows
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 -z-10"
        style={{
          background: `linear-gradient(to top, ${theme.glowColor}, transparent)`,
          opacity: 0.3,
        }}
      />

      <WorkflowDrawer activeWorkflow={activeWorkflow} onClose={closeWorkflow} />
    </>
  );
}
