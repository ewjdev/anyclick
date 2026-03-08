import type {
  WorkflowActionDefinition,
  WorkflowActionId,
  WorkflowWorkstreamId,
} from "./types";

const WORKFLOW_ACTIONS: WorkflowActionDefinition[] = [
  {
    id: "software.report_bug",
    workstream: "software",
    menuLabel: "Report this bug",
    menuType: "software_report_bug",
    submitMode: "github-or-demo",
    steps: [
      {
        id: "ticket-system",
        title: "Ticket System",
        description: "Pick where the bug should be routed.",
      },
      {
        id: "issue-details",
        title: "Issue Details",
        description: "Capture title, summary, and routing metadata.",
      },
      {
        id: "review-submit",
        title: "Review & Submit",
        description: "Review captured context and submit.",
      },
    ],
  },
  {
    id: "software.send_to_cursor",
    workstream: "software",
    menuLabel: "Send to Cursor",
    menuType: "software_send_to_cursor",
    submitMode: "demo",
    steps: [
      {
        id: "fix-scope",
        title: "Fix Scope",
        description: "Select what should be fixed.",
      },
      {
        id: "prompt-constraints",
        title: "Prompt & Constraints",
        description: "Tune prompt details for agent handoff.",
      },
      {
        id: "review",
        title: "Review",
        description: "Review payload before sending.",
      },
    ],
  },
  {
    id: "software.copy_selector",
    workstream: "software",
    menuLabel: "Copy selector",
    menuType: "software_copy_selector",
    submitMode: "demo",
    steps: [
      {
        id: "selector-format",
        title: "Selector Format",
        description: "Choose the selector output format.",
      },
      {
        id: "copy-bundle",
        title: "Copy Bundle",
        description: "Copy selector, container, and snippet.",
      },
    ],
  },
  {
    id: "ecommerce.item_missing",
    workstream: "ecommerce",
    menuLabel: "Item missing",
    menuType: "ecommerce_item_missing",
    submitMode: "demo",
    steps: [
      {
        id: "incident-details",
        title: "Incident Details",
        description: "Capture order and inventory details.",
      },
      {
        id: "resolution-path",
        title: "Resolution Path",
        description: "Select remediation and owner.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "ecommerce.shipping_issue",
    workstream: "ecommerce",
    menuLabel: "Shipping issue",
    menuType: "ecommerce_shipping_issue",
    submitMode: "demo",
    steps: [
      {
        id: "shipment-details",
        title: "Shipment Details",
        description: "Capture carrier and order impact.",
      },
      {
        id: "customer-impact",
        title: "Customer Impact",
        description: "Define urgency and communication plan.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "ecommerce.escalate_order",
    workstream: "ecommerce",
    menuLabel: "Escalate order",
    menuType: "ecommerce_escalate_order",
    submitMode: "demo",
    steps: [
      {
        id: "escalation-target",
        title: "Escalation Target",
        description: "Pick team and escalation reason.",
      },
      {
        id: "priority-sla",
        title: "Priority & SLA",
        description: "Set priority and resolution target.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "ecommerce.view_stock_details",
    workstream: "ecommerce",
    menuLabel: "View stock details",
    menuType: "ecommerce_view_stock_details",
    submitMode: "demo",
    steps: [
      {
        id: "inventory-snapshot",
        title: "Inventory Snapshot",
        description: "Review stock, reserve, and fulfillment data.",
      },
      {
        id: "source-location",
        title: "Source Location",
        description: "Inspect which warehouse feeds this product.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review context and complete.",
      },
    ],
  },
  {
    id: "ecommerce.adjust_stock",
    workstream: "ecommerce",
    menuLabel: "Adjust stock",
    menuType: "ecommerce_adjust_stock",
    submitMode: "demo",
    steps: [
      {
        id: "adjustment-type",
        title: "Adjustment Type",
        description: "Select increase, decrease, or reserve release.",
      },
      {
        id: "quantity-reason",
        title: "Quantity & Reason",
        description: "Enter quantity delta and operational reason.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review update and complete.",
      },
    ],
  },
  {
    id: "ecommerce.set_restock_alert",
    workstream: "ecommerce",
    menuLabel: "Set restock alert",
    menuType: "ecommerce_set_restock_alert",
    submitMode: "demo",
    steps: [
      {
        id: "threshold",
        title: "Threshold",
        description: "Set low-stock threshold for this SKU.",
      },
      {
        id: "notification-route",
        title: "Notification Route",
        description: "Pick destination channels and escalation delay.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review alert setup and complete.",
      },
    ],
  },
  {
    id: "ecommerce.view_discounts",
    workstream: "ecommerce",
    menuLabel: "View discounts",
    menuType: "ecommerce_view_discounts",
    submitMode: "demo",
    steps: [
      {
        id: "active-promotions",
        title: "Active Promotions",
        description: "Inspect current coupons and promo campaigns.",
      },
      {
        id: "margin-impact",
        title: "Margin Impact",
        description: "Review effective margin and revenue impact.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review findings and complete.",
      },
    ],
  },
  {
    id: "ecommerce.change_price",
    workstream: "ecommerce",
    menuLabel: "Change price",
    menuType: "ecommerce_change_price",
    submitMode: "demo",
    steps: [
      {
        id: "new-price",
        title: "New Price",
        description: "Set new list price and effective window.",
      },
      {
        id: "guardrails",
        title: "Guardrails",
        description: "Validate floor price and approval requirements.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review price update and complete.",
      },
    ],
  },
  {
    id: "ecommerce.schedule_promotion",
    workstream: "ecommerce",
    menuLabel: "Schedule promotion",
    menuType: "ecommerce_schedule_promotion",
    submitMode: "demo",
    steps: [
      {
        id: "promotion-details",
        title: "Promotion Details",
        description: "Define campaign type and discount value.",
      },
      {
        id: "timing-audience",
        title: "Timing & Audience",
        description: "Set campaign window and customer segment.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review promotion setup and complete.",
      },
    ],
  },
  {
    id: "ecommerce.edit_product",
    workstream: "ecommerce",
    menuLabel: "Edit product details",
    menuType: "ecommerce_edit_product",
    submitMode: "demo",
    steps: [
      {
        id: "core-fields",
        title: "Core Fields",
        description: "Update title, brand, and category metadata.",
      },
      {
        id: "description-highlights",
        title: "Description & Highlights",
        description: "Refine customer-facing copy and key bullets.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review product edits and complete.",
      },
    ],
  },
  {
    id: "ecommerce.upload_product_media",
    workstream: "ecommerce",
    menuLabel: "Upload product media",
    menuType: "ecommerce_upload_product_media",
    submitMode: "demo",
    steps: [
      {
        id: "media-source",
        title: "Media Source",
        description: "Select upload source and media type.",
      },
      {
        id: "variants-alt-text",
        title: "Variants & Alt Text",
        description: "Assign variant mapping and accessibility text.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review media update and complete.",
      },
    ],
  },
  {
    id: "ecommerce.update_product_copy",
    workstream: "ecommerce",
    menuLabel: "Update product copy",
    menuType: "ecommerce_update_product_copy",
    submitMode: "demo",
    steps: [
      {
        id: "copy-focus",
        title: "Copy Focus",
        description: "Select headline, description, or bullets to update.",
      },
      {
        id: "tone-seo",
        title: "Tone & SEO",
        description: "Apply tone direction and SEO target phrase.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review copy updates and complete.",
      },
    ],
  },
  {
    id: "healthcare.check_in_issue",
    workstream: "healthcare",
    menuLabel: "Check-in issue",
    menuType: "healthcare_check_in_issue",
    submitMode: "demo",
    steps: [
      {
        id: "issue-type",
        title: "Issue Type",
        description: "Classify the front-desk issue.",
      },
      {
        id: "patient-context",
        title: "Patient Context",
        description: "Capture non-PHI context for routing.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.vital_alert",
    workstream: "healthcare",
    menuLabel: "Vital alert",
    menuType: "healthcare_vital_alert",
    submitMode: "demo",
    steps: [
      {
        id: "vital-entry",
        title: "Vital Entry",
        description: "Record out-of-range vital details.",
      },
      {
        id: "clinical-action",
        title: "Clinical Action",
        description: "Select escalation and care response.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.flag_urgent",
    workstream: "healthcare",
    menuLabel: "Flag urgent",
    menuType: "healthcare_flag_urgent",
    submitMode: "demo",
    steps: [
      {
        id: "urgency-classification",
        title: "Urgency Classification",
        description: "Classify urgency and risk level.",
      },
      {
        id: "notification-route",
        title: "Notification Route",
        description: "Select recipients and response window.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.verify_identity_token",
    workstream: "healthcare",
    menuLabel: "Verify identity token",
    menuType: "healthcare_verify_identity_token",
    submitMode: "demo",
    steps: [
      {
        id: "verification-source",
        title: "Verification Source",
        description: "Choose where verification context was pulled from.",
      },
      {
        id: "mismatch-details",
        title: "Mismatch Details",
        description: "Capture non-PHI mismatch details for routing.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.coverage_exception",
    workstream: "healthcare",
    menuLabel: "Coverage exception",
    menuType: "healthcare_coverage_exception",
    submitMode: "demo",
    steps: [
      {
        id: "payer-trigger",
        title: "Payer & Trigger",
        description: "Record payer and eligibility trigger reason.",
      },
      {
        id: "authorization-path",
        title: "Authorization Path",
        description: "Route to the appropriate authorization queue.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.request_vital_recheck",
    workstream: "healthcare",
    menuLabel: "Request vital recheck",
    menuType: "healthcare_request_vital_recheck",
    submitMode: "demo",
    steps: [
      {
        id: "vital-threshold",
        title: "Vital & Threshold",
        description: "Select the vital and threshold concern.",
      },
      {
        id: "recheck-owner",
        title: "Recheck Timing & Owner",
        description: "Set recheck timing and assigned owner.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.open_trend_review",
    workstream: "healthcare",
    menuLabel: "Open trend review",
    menuType: "healthcare_open_trend_review",
    submitMode: "demo",
    steps: [
      {
        id: "trend-window",
        title: "Trend Window",
        description: "Choose trend time horizon for review.",
      },
      {
        id: "clinical-context",
        title: "Clinical Context",
        description: "Add non-PHI clinical context notes.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.notify_care_team",
    workstream: "healthcare",
    menuLabel: "Notify care team",
    menuType: "healthcare_notify_care_team",
    submitMode: "demo",
    steps: [
      {
        id: "team-selection",
        title: "Team Selection",
        description: "Choose care team recipients.",
      },
      {
        id: "message-priority",
        title: "Message & Priority",
        description: "Compose summary and priority level.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "healthcare.escalate_handoff",
    workstream: "healthcare",
    menuLabel: "Escalate handoff",
    menuType: "healthcare_escalate_handoff",
    submitMode: "demo",
    steps: [
      {
        id: "handoff-target",
        title: "Handoff Target",
        description: "Select destination team for escalation.",
      },
      {
        id: "risk-sla",
        title: "Risk & SLA",
        description: "Define risk posture and response target.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "social.save_asset",
    workstream: "social",
    menuLabel: "Save asset",
    menuType: "social_save_asset",
    submitMode: "demo",
    steps: [
      {
        id: "destination",
        title: "Destination",
        description: "Select where the asset should be stored.",
      },
      {
        id: "metadata-tags",
        title: "Metadata & Tags",
        description: "Add campaign metadata and tags.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "social.flag_content",
    workstream: "social",
    menuLabel: "Flag content",
    menuType: "social_flag_content",
    submitMode: "demo",
    steps: [
      {
        id: "policy-category",
        title: "Policy Category",
        description: "Choose policy violation type.",
      },
      {
        id: "enforcement-action",
        title: "Enforcement Action",
        description: "Choose moderation response and queue.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
  {
    id: "social.quick_reply",
    workstream: "social",
    menuLabel: "Quick reply",
    menuType: "social_quick_reply",
    submitMode: "demo",
    steps: [
      {
        id: "draft-reply",
        title: "Draft Reply",
        description: "Create a contextual response.",
      },
      {
        id: "tone-approval",
        title: "Tone & Approval",
        description: "Set tone, risk level, and approvals.",
      },
      {
        id: "confirm",
        title: "Confirm",
        description: "Review and complete the workflow.",
      },
    ],
  },
];

const WORKFLOW_BY_ID = new Map<WorkflowActionId, WorkflowActionDefinition>(
  WORKFLOW_ACTIONS.map((action) => [action.id, action]),
);

export function isWorkflowWorkstreamId(
  value: string,
): value is WorkflowWorkstreamId {
  return (
    value === "software" ||
    value === "ecommerce" ||
    value === "healthcare" ||
    value === "social"
  );
}

export function getWorkflowActionsForWorkstream(
  workstream: WorkflowWorkstreamId,
): WorkflowActionDefinition[] {
  return WORKFLOW_ACTIONS.filter((action) => action.workstream === workstream);
}

export function getWorkflowActionById(
  actionId: WorkflowActionId,
): WorkflowActionDefinition {
  const action = WORKFLOW_BY_ID.get(actionId);
  if (!action) {
    throw new Error(`Unknown workflow action: ${actionId}`);
  }
  return action;
}
