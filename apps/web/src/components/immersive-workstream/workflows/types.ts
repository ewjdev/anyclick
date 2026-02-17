import type {
  ElementContext,
  PageContext,
  ScreenshotCapture,
} from "@ewjdev/anyclick-core";

export type WorkflowWorkstreamId =
  | "software"
  | "ecommerce"
  | "healthcare"
  | "social";

export type WorkflowActionId =
  | "software.report_bug"
  | "software.send_to_cursor"
  | "software.copy_selector"
  | "ecommerce.item_missing"
  | "ecommerce.shipping_issue"
  | "ecommerce.escalate_order"
  | "ecommerce.view_stock_details"
  | "ecommerce.adjust_stock"
  | "ecommerce.set_restock_alert"
  | "ecommerce.view_discounts"
  | "ecommerce.change_price"
  | "ecommerce.schedule_promotion"
  | "ecommerce.edit_product"
  | "ecommerce.upload_product_media"
  | "ecommerce.update_product_copy"
  | "healthcare.check_in_issue"
  | "healthcare.vital_alert"
  | "healthcare.flag_urgent"
  | "social.save_asset"
  | "social.flag_content"
  | "social.quick_reply";

export type WorkflowSubmitMode = "demo" | "github-or-demo";

export interface WorkflowStepDefinition {
  id: string;
  title: string;
  description: string;
}

export interface WorkflowActionDefinition {
  id: WorkflowActionId;
  workstream: WorkflowWorkstreamId;
  menuLabel: string;
  menuType: string;
  submitMode: WorkflowSubmitMode;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowLaunchState {
  action: WorkflowActionDefinition;
  containerElement: Element | null;
  openedAt: string;
  targetElement: Element | null;
}

export interface WorkflowCaptureData {
  capturedAt: string;
  containerContext: ElementContext | null;
  containerSelector: string;
  containerScreenshot?: ScreenshotCapture;
  pageContext: PageContext;
  screenshotError?: string;
  targetContext: ElementContext | null;
  targetSelector: string;
}

export interface WorkflowCaptureState {
  data: WorkflowCaptureData | null;
  error?: string;
  status: "capturing" | "idle" | "ready";
}
