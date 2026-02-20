"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildAnyclickPayload,
  type AnyclickPayload,
  type ScreenshotData,
} from "@ewjdev/anyclick-core";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  ExternalLink,
} from "lucide-react";
import { buildSelectorBundle, generateHeuristicIssueTitle } from "./titleHeuristics";
import { WorkflowContextSummary } from "./WorkflowContextSummary";
import type {
  WorkflowActionId,
  WorkflowCaptureData,
  WorkflowCaptureState,
  WorkflowLaunchState,
} from "./types";

type GenericActionId = Exclude<
  WorkflowActionId,
  "software.report_bug" | "software.copy_selector"
>;

type FieldKind = "select" | "text" | "textarea";

interface FieldOption {
  label: string;
  value: string;
}

interface FieldConfig {
  key: string;
  kind: FieldKind;
  label: string;
  options?: FieldOption[];
  placeholder?: string;
  required?: boolean;
}

interface GenericStepConfig {
  description: string;
  fields?: FieldConfig[];
  kind?: "form" | "review";
  title: string;
}

interface GenericWorkflowConfig {
  successMessage: string;
  successTitle: string;
  steps: GenericStepConfig[];
}

interface WorkflowFlowRendererProps {
  captureState: WorkflowCaptureState;
  launch: WorkflowLaunchState;
  onClose: () => void;
  onRetryCapture: () => Promise<void>;
}

interface WorkflowSuccessState {
  demo: boolean;
  issueUrl?: string;
  message: string;
  title: string;
}

const GENERIC_WORKFLOWS: Record<GenericActionId, GenericWorkflowConfig> = {
  "ecommerce.escalate_order": {
    successTitle: "Escalation workflow simulated",
    successMessage:
      "Order escalation payload was assembled with context and ready for adapter routing.",
    steps: [
      {
        title: "Escalation Target",
        description: "Route this incident to the right team.",
        kind: "form",
        fields: [
          {
            key: "targetTeam",
            kind: "select",
            label: "Target Team",
            required: true,
            options: [
              { value: "fulfillment", label: "Fulfillment" },
              { value: "support", label: "Customer Support" },
              { value: "operations", label: "Operations" },
            ],
          },
          {
            key: "escalationReason",
            kind: "textarea",
            label: "Escalation Reason",
            placeholder: "Describe why this order should be escalated.",
            required: true,
          },
        ],
      },
      {
        title: "Priority & SLA",
        description: "Set urgency and expected response window.",
        kind: "form",
        fields: [
          {
            key: "priority",
            kind: "select",
            label: "Priority",
            required: true,
            options: [
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ],
          },
          {
            key: "slaWindow",
            kind: "select",
            label: "Target SLA",
            required: true,
            options: [
              { value: "30m", label: "30 minutes" },
              { value: "2h", label: "2 hours" },
              { value: "24h", label: "24 hours" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review the escalation request.",
        kind: "review",
      },
    ],
  },
  "ecommerce.item_missing": {
    successTitle: "Missing item workflow simulated",
    successMessage:
      "Incident details are packaged with selectors and screenshot context for routing.",
    steps: [
      {
        title: "Incident Details",
        description: "Capture missing item details.",
        kind: "form",
        fields: [
          {
            key: "orderId",
            kind: "text",
            label: "Order ID",
            placeholder: "ORD-102944",
            required: true,
          },
          {
            key: "sku",
            kind: "text",
            label: "SKU",
            placeholder: "SKU-3482",
            required: true,
          },
          {
            key: "quantityMissing",
            kind: "text",
            label: "Quantity Missing",
            placeholder: "1",
            required: true,
          },
        ],
      },
      {
        title: "Resolution Path",
        description: "Define next action and owner.",
        kind: "form",
        fields: [
          {
            key: "resolutionPath",
            kind: "select",
            label: "Resolution Path",
            required: true,
            options: [
              { value: "reship", label: "Reship item" },
              { value: "refund", label: "Refund line item" },
              { value: "investigate", label: "Investigate warehouse pick" },
            ],
          },
          {
            key: "owner",
            kind: "select",
            label: "Owner",
            required: true,
            options: [
              { value: "warehouse", label: "Warehouse Lead" },
              { value: "support", label: "Support Manager" },
              { value: "ops", label: "Operations Duty" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.shipping_issue": {
    successTitle: "Shipping issue workflow simulated",
    successMessage:
      "Shipping disruption data was captured with page and DOM context.",
    steps: [
      {
        title: "Shipment Details",
        description: "Capture shipment-level context.",
        kind: "form",
        fields: [
          {
            key: "carrier",
            kind: "select",
            label: "Carrier",
            required: true,
            options: [
              { value: "ups", label: "UPS" },
              { value: "fedex", label: "FedEx" },
              { value: "usps", label: "USPS" },
              { value: "other", label: "Other" },
            ],
          },
          {
            key: "trackingId",
            kind: "text",
            label: "Tracking ID",
            placeholder: "1Z999AA10123456784",
            required: true,
          },
        ],
      },
      {
        title: "Customer Impact",
        description: "Capture impact and communication strategy.",
        kind: "form",
        fields: [
          {
            key: "impactLevel",
            kind: "select",
            label: "Impact Level",
            required: true,
            options: [
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ],
          },
          {
            key: "customerMessage",
            kind: "textarea",
            label: "Customer Message",
            placeholder: "Draft a customer-facing update.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.view_stock_details": {
    successTitle: "Stock details workflow simulated",
    successMessage:
      "Inventory and warehouse context were assembled for operational review.",
    steps: [
      {
        title: "Inventory Snapshot",
        description: "Inspect the current stock position.",
        kind: "form",
        fields: [
          {
            key: "sku",
            kind: "text",
            label: "SKU",
            placeholder: "SKU-4821",
            required: true,
          },
          {
            key: "availableUnits",
            kind: "text",
            label: "Available Units",
            placeholder: "128",
            required: true,
          },
          {
            key: "reservedUnits",
            kind: "text",
            label: "Reserved Units",
            placeholder: "27",
            required: true,
          },
        ],
      },
      {
        title: "Source Location",
        description: "Review warehouse and replenishment source.",
        kind: "form",
        fields: [
          {
            key: "warehouse",
            kind: "select",
            label: "Primary Warehouse",
            required: true,
            options: [
              { value: "wh-west", label: "WH-West" },
              { value: "wh-central", label: "WH-Central" },
              { value: "wh-east", label: "WH-East" },
            ],
          },
          {
            key: "restockEta",
            kind: "text",
            label: "Restock ETA",
            placeholder: "2026-02-22 14:00",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review stock context and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.adjust_stock": {
    successTitle: "Stock adjustment workflow simulated",
    successMessage:
      "Inventory adjustment instructions were prepared with captured UI context.",
    steps: [
      {
        title: "Adjustment Type",
        description: "Choose how inventory should be adjusted.",
        kind: "form",
        fields: [
          {
            key: "adjustmentType",
            kind: "select",
            label: "Adjustment Type",
            required: true,
            options: [
              { value: "increase", label: "Increase stock" },
              { value: "decrease", label: "Decrease stock" },
              { value: "release", label: "Release reserved units" },
            ],
          },
          {
            key: "channel",
            kind: "select",
            label: "Inventory Channel",
            required: true,
            options: [
              { value: "online", label: "Online store" },
              { value: "marketplace", label: "Marketplace" },
              { value: "all", label: "All channels" },
            ],
          },
        ],
      },
      {
        title: "Quantity & Reason",
        description: "Specify quantity change and audit reason.",
        kind: "form",
        fields: [
          {
            key: "delta",
            kind: "text",
            label: "Quantity Delta",
            placeholder: "+24",
            required: true,
          },
          {
            key: "adjustReason",
            kind: "textarea",
            label: "Reason",
            placeholder: "Cycle count reconciliation after receiving batch.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review adjustment details and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.set_restock_alert": {
    successTitle: "Restock alert workflow simulated",
    successMessage:
      "Threshold and notification routing were captured for alert automation.",
    steps: [
      {
        title: "Threshold",
        description: "Define when low-stock alerts should fire.",
        kind: "form",
        fields: [
          {
            key: "thresholdUnits",
            kind: "text",
            label: "Threshold Units",
            placeholder: "20",
            required: true,
          },
          {
            key: "lookbackWindow",
            kind: "select",
            label: "Sales Velocity Window",
            required: true,
            options: [
              { value: "7d", label: "Last 7 days" },
              { value: "14d", label: "Last 14 days" },
              { value: "30d", label: "Last 30 days" },
            ],
          },
        ],
      },
      {
        title: "Notification Route",
        description: "Select where alerts should be sent.",
        kind: "form",
        fields: [
          {
            key: "notifyTarget",
            kind: "select",
            label: "Notify Target",
            required: true,
            options: [
              { value: "ops-slack", label: "Ops Slack" },
              { value: "inventory-email", label: "Inventory Email" },
              { value: "pager", label: "On-call Pager" },
            ],
          },
          {
            key: "escalationDelay",
            kind: "select",
            label: "Escalation Delay",
            required: true,
            options: [
              { value: "15m", label: "15 minutes" },
              { value: "60m", label: "1 hour" },
              { value: "4h", label: "4 hours" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review alert configuration and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.view_discounts": {
    successTitle: "Discount review workflow simulated",
    successMessage:
      "Discount and margin context were prepared for pricing review.",
    steps: [
      {
        title: "Active Promotions",
        description: "Inspect currently applied discount programs.",
        kind: "form",
        fields: [
          {
            key: "promoSource",
            kind: "select",
            label: "Promotion Source",
            required: true,
            options: [
              { value: "catalog", label: "Catalog pricing rules" },
              { value: "coupon", label: "Coupon campaign" },
              { value: "bundle", label: "Bundle offer" },
            ],
          },
          {
            key: "activeDiscount",
            kind: "text",
            label: "Current Discount",
            placeholder: "15%",
            required: true,
          },
        ],
      },
      {
        title: "Margin Impact",
        description: "Evaluate margin effect before changes.",
        kind: "form",
        fields: [
          {
            key: "grossMargin",
            kind: "text",
            label: "Gross Margin",
            placeholder: "32%",
            required: true,
          },
          {
            key: "impactNotes",
            kind: "textarea",
            label: "Impact Notes",
            placeholder: "Describe expected revenue and conversion impact.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review pricing signals and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.change_price": {
    successTitle: "Price change workflow simulated",
    successMessage:
      "Price update details were captured with guardrails and approval routing.",
    steps: [
      {
        title: "New Price",
        description: "Set the new price and effective window.",
        kind: "form",
        fields: [
          {
            key: "currentPrice",
            kind: "text",
            label: "Current Price",
            placeholder: "49.99",
            required: true,
          },
          {
            key: "newPrice",
            kind: "text",
            label: "New Price",
            placeholder: "44.99",
            required: true,
          },
          {
            key: "effectiveAt",
            kind: "text",
            label: "Effective At",
            placeholder: "2026-02-20 09:00",
            required: true,
          },
        ],
      },
      {
        title: "Guardrails",
        description: "Validate floor and approval requirements.",
        kind: "form",
        fields: [
          {
            key: "floorPrice",
            kind: "text",
            label: "Floor Price",
            placeholder: "39.99",
            required: true,
          },
          {
            key: "approvalRoute",
            kind: "select",
            label: "Approval Route",
            required: true,
            options: [
              { value: "pricing-manager", label: "Pricing manager" },
              { value: "merch-lead", label: "Merchandising lead" },
              { value: "auto", label: "Auto-approved under threshold" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review the price update and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.schedule_promotion": {
    successTitle: "Promotion scheduling workflow simulated",
    successMessage:
      "Promotion timing and audience parameters were prepared for launch.",
    steps: [
      {
        title: "Promotion Details",
        description: "Define promotion mechanics.",
        kind: "form",
        fields: [
          {
            key: "promotionType",
            kind: "select",
            label: "Promotion Type",
            required: true,
            options: [
              { value: "percent", label: "Percent off" },
              { value: "fixed", label: "Fixed amount off" },
              { value: "bogo", label: "BOGO" },
            ],
          },
          {
            key: "promotionValue",
            kind: "text",
            label: "Promotion Value",
            placeholder: "20%",
            required: true,
          },
        ],
      },
      {
        title: "Timing & Audience",
        description: "Configure activation window and target segment.",
        kind: "form",
        fields: [
          {
            key: "window",
            kind: "text",
            label: "Active Window",
            placeholder: "2026-02-21 to 2026-02-28",
            required: true,
          },
          {
            key: "audience",
            kind: "select",
            label: "Audience",
            required: true,
            options: [
              { value: "all", label: "All customers" },
              { value: "new", label: "New customers" },
              { value: "vip", label: "VIP segment" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review the promotion setup and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.edit_product": {
    successTitle: "Product edit workflow simulated",
    successMessage:
      "Product metadata and merchandising changes were staged with context.",
    steps: [
      {
        title: "Core Fields",
        description: "Update product metadata.",
        kind: "form",
        fields: [
          {
            key: "productName",
            kind: "text",
            label: "Product Name",
            placeholder: "Trail Running Jacket",
            required: true,
          },
          {
            key: "category",
            kind: "select",
            label: "Category",
            required: true,
            options: [
              { value: "outerwear", label: "Outerwear" },
              { value: "footwear", label: "Footwear" },
              { value: "accessories", label: "Accessories" },
            ],
          },
        ],
      },
      {
        title: "Description & Highlights",
        description: "Tune copy and merchandising bullets.",
        kind: "form",
        fields: [
          {
            key: "shortDescription",
            kind: "textarea",
            label: "Short Description",
            placeholder: "Lightweight shell with weatherproof finish.",
            required: true,
          },
          {
            key: "highlightBullet",
            kind: "text",
            label: "Highlight Bullet",
            placeholder: "Breathable 3-layer fabric",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review product edits and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.upload_product_media": {
    successTitle: "Product media workflow simulated",
    successMessage:
      "Media upload details were captured for image pipeline handoff.",
    steps: [
      {
        title: "Media Source",
        description: "Select media input details.",
        kind: "form",
        fields: [
          {
            key: "mediaType",
            kind: "select",
            label: "Media Type",
            required: true,
            options: [
              { value: "image", label: "Image" },
              { value: "video", label: "Video" },
              { value: "360", label: "360 view" },
            ],
          },
          {
            key: "sourcePath",
            kind: "text",
            label: "Source URL / Path",
            placeholder: "https://cdn.example.com/product/sku-4821/front.jpg",
            required: true,
          },
        ],
      },
      {
        title: "Variants & Alt Text",
        description: "Map to variants and accessibility copy.",
        kind: "form",
        fields: [
          {
            key: "variantMap",
            kind: "text",
            label: "Variant Mapping",
            placeholder: "color:black,size:m",
            required: true,
          },
          {
            key: "altText",
            kind: "textarea",
            label: "Alt Text",
            placeholder: "Front view of black trail running jacket on white background.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review media updates and complete.",
        kind: "review",
      },
    ],
  },
  "ecommerce.update_product_copy": {
    successTitle: "Product copy workflow simulated",
    successMessage:
      "Content edits were captured with SEO and tone guidance.",
    steps: [
      {
        title: "Copy Focus",
        description: "Choose which copy section to revise.",
        kind: "form",
        fields: [
          {
            key: "copySection",
            kind: "select",
            label: "Copy Section",
            required: true,
            options: [
              { value: "headline", label: "Headline" },
              { value: "description", label: "Description" },
              { value: "bullets", label: "Feature bullets" },
            ],
          },
          {
            key: "draftCopy",
            kind: "textarea",
            label: "Draft Copy",
            placeholder: "Write the updated product copy.",
            required: true,
          },
        ],
      },
      {
        title: "Tone & SEO",
        description: "Set tone and search target phrase.",
        kind: "form",
        fields: [
          {
            key: "copyTone",
            kind: "select",
            label: "Tone",
            required: true,
            options: [
              { value: "premium", label: "Premium" },
              { value: "practical", label: "Practical" },
              { value: "energetic", label: "Energetic" },
            ],
          },
          {
            key: "seoPhrase",
            kind: "text",
            label: "SEO Phrase",
            placeholder: "lightweight waterproof running jacket",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review content changes and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.check_in_issue": {
    successTitle: "Check-in issue workflow simulated",
    successMessage:
      "Non-PHI intake issue details are prepared for front-desk routing.",
    steps: [
      {
        title: "Issue Type",
        description: "Classify the check-in issue.",
        kind: "form",
        fields: [
          {
            key: "checkinIssueType",
            kind: "select",
            label: "Issue Type",
            required: true,
            options: [
              { value: "insurance", label: "Insurance mismatch" },
              { value: "identity", label: "Identity verification" },
              { value: "appointment", label: "Appointment mismatch" },
            ],
          },
          {
            key: "deskQueue",
            kind: "select",
            label: "Front Desk Queue",
            required: true,
            options: [
              { value: "intake", label: "Intake Queue" },
              { value: "billing", label: "Billing Queue" },
              { value: "triage", label: "Triage Queue" },
            ],
          },
        ],
      },
      {
        title: "Patient Context",
        description: "Capture non-PHI context fields.",
        kind: "form",
        fields: [
          {
            key: "patientToken",
            kind: "text",
            label: "Patient Token",
            placeholder: "PT-80321",
            required: true,
          },
          {
            key: "contextNotes",
            kind: "textarea",
            label: "Context Notes",
            placeholder: "No names or DOB. Include only operational context.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.flag_urgent": {
    successTitle: "Urgent flag workflow simulated",
    successMessage:
      "Urgency classification and notifications are prepared for routing.",
    steps: [
      {
        title: "Urgency Classification",
        description: "Define urgency and risk posture.",
        kind: "form",
        fields: [
          {
            key: "urgencyLevel",
            kind: "select",
            label: "Urgency Level",
            required: true,
            options: [
              { value: "stat", label: "STAT" },
              { value: "high", label: "High" },
              { value: "moderate", label: "Moderate" },
            ],
          },
          {
            key: "riskCategory",
            kind: "select",
            label: "Risk Category",
            required: true,
            options: [
              { value: "safety", label: "Patient safety" },
              { value: "compliance", label: "Compliance" },
              { value: "operational", label: "Operational" },
            ],
          },
        ],
      },
      {
        title: "Notification Route",
        description: "Choose whom to notify.",
        kind: "form",
        fields: [
          {
            key: "notifyGroup",
            kind: "select",
            label: "Notify Group",
            required: true,
            options: [
              { value: "oncall", label: "On-call clinician" },
              { value: "charge", label: "Charge nurse" },
              { value: "ops", label: "Clinical operations" },
            ],
          },
          {
            key: "responseWindow",
            kind: "select",
            label: "Response Window",
            required: true,
            options: [
              { value: "5m", label: "5 minutes" },
              { value: "15m", label: "15 minutes" },
              { value: "30m", label: "30 minutes" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.vital_alert": {
    successTitle: "Vital alert workflow simulated",
    successMessage:
      "Vital threshold and action details were captured for triage.",
    steps: [
      {
        title: "Vital Entry",
        description: "Document observed vital values.",
        kind: "form",
        fields: [
          {
            key: "vitalType",
            kind: "select",
            label: "Vital Type",
            required: true,
            options: [
              { value: "hr", label: "Heart rate" },
              { value: "bp", label: "Blood pressure" },
              { value: "spo2", label: "SpO2" },
              { value: "temp", label: "Temperature" },
            ],
          },
          {
            key: "vitalValue",
            kind: "text",
            label: "Observed Value",
            placeholder: "e.g. 88/54",
            required: true,
          },
        ],
      },
      {
        title: "Clinical Action",
        description: "Define immediate clinical response.",
        kind: "form",
        fields: [
          {
            key: "clinicalAction",
            kind: "select",
            label: "Clinical Action",
            required: true,
            options: [
              { value: "notify", label: "Notify provider" },
              { value: "repeat", label: "Repeat measurement" },
              { value: "rapid", label: "Call rapid response" },
            ],
          },
          {
            key: "actionNotes",
            kind: "textarea",
            label: "Action Notes",
            placeholder: "Document immediate next steps.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.verify_identity_token": {
    successTitle: "Identity verification workflow simulated",
    successMessage:
      "Verification and mismatch details were prepared using non-PHI context.",
    steps: [
      {
        title: "Verification Source",
        description: "Capture token verification source.",
        kind: "form",
        fields: [
          {
            key: "verificationSource",
            kind: "select",
            label: "Source",
            required: true,
            options: [
              { value: "kiosk", label: "Check-in kiosk" },
              { value: "frontdesk", label: "Front desk scan" },
              { value: "portal", label: "Patient portal token" },
            ],
          },
          {
            key: "verificationMode",
            kind: "select",
            label: "Verification Mode",
            required: true,
            options: [
              { value: "qr", label: "QR token" },
              { value: "wristband", label: "Wristband barcode" },
              { value: "manual", label: "Manual confirmation token" },
            ],
          },
        ],
      },
      {
        title: "Mismatch Details",
        description: "Document mismatch details (non-PHI only).",
        kind: "form",
        fields: [
          {
            key: "patientTokenRef",
            kind: "text",
            label: "Patient Token Reference",
            placeholder: "PT-TOKEN-49211",
            required: true,
          },
          {
            key: "mismatchDetails",
            kind: "textarea",
            label: "Mismatch Details",
            placeholder:
              "Use operational details only. Do not include patient name, DOB, or MRN.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.coverage_exception": {
    successTitle: "Coverage exception workflow simulated",
    successMessage:
      "Coverage and authorization routing details were staged with context.",
    steps: [
      {
        title: "Payer & Trigger",
        description: "Capture coverage trigger details.",
        kind: "form",
        fields: [
          {
            key: "payerType",
            kind: "select",
            label: "Payer",
            required: true,
            options: [
              { value: "commercial", label: "Commercial" },
              { value: "medicare", label: "Medicare" },
              { value: "medicaid", label: "Medicaid" },
            ],
          },
          {
            key: "exceptionTrigger",
            kind: "select",
            label: "Eligibility Trigger",
            required: true,
            options: [
              { value: "inactive", label: "Inactive coverage" },
              { value: "auth", label: "Authorization required" },
              { value: "benefit", label: "Benefit limitation" },
            ],
          },
        ],
      },
      {
        title: "Authorization Path",
        description: "Choose routing and follow-up path.",
        kind: "form",
        fields: [
          {
            key: "authorizationQueue",
            kind: "select",
            label: "Authorization Queue",
            required: true,
            options: [
              { value: "billing-auth", label: "Billing authorization" },
              { value: "clinical-auth", label: "Clinical authorization" },
              { value: "supervisor", label: "Supervisor review" },
            ],
          },
          {
            key: "coverageNotes",
            kind: "textarea",
            label: "Operational Notes",
            placeholder:
              "Use token references and workflow context only. Exclude PHI.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.request_vital_recheck": {
    successTitle: "Vital recheck workflow simulated",
    successMessage:
      "Recheck timing and ownership were captured for bedside follow-up.",
    steps: [
      {
        title: "Vital & Threshold",
        description: "Define concerning vital threshold.",
        kind: "form",
        fields: [
          {
            key: "recheckVitalType",
            kind: "select",
            label: "Vital Type",
            required: true,
            options: [
              { value: "hr", label: "Heart rate" },
              { value: "bp", label: "Blood pressure" },
              { value: "spo2", label: "SpO2" },
              { value: "temp", label: "Temperature" },
            ],
          },
          {
            key: "thresholdRule",
            kind: "text",
            label: "Threshold Rule",
            placeholder: "HR > 120 for 5 min",
            required: true,
          },
        ],
      },
      {
        title: "Recheck Timing & Owner",
        description: "Assign recheck timing and owner.",
        kind: "form",
        fields: [
          {
            key: "recheckWindow",
            kind: "select",
            label: "Recheck Window",
            required: true,
            options: [
              { value: "5m", label: "5 minutes" },
              { value: "10m", label: "10 minutes" },
              { value: "15m", label: "15 minutes" },
            ],
          },
          {
            key: "recheckOwner",
            kind: "select",
            label: "Owner",
            required: true,
            options: [
              { value: "primary-rn", label: "Primary RN" },
              { value: "charge-rn", label: "Charge RN" },
              { value: "rapid-team", label: "Rapid response team" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.open_trend_review": {
    successTitle: "Trend review workflow simulated",
    successMessage:
      "Trend review request and clinical context were prepared for analysis.",
    steps: [
      {
        title: "Trend Window",
        description: "Select time range for trend review.",
        kind: "form",
        fields: [
          {
            key: "trendWindow",
            kind: "select",
            label: "Trend Window",
            required: true,
            options: [
              { value: "30m", label: "Last 30 minutes" },
              { value: "2h", label: "Last 2 hours" },
              { value: "24h", label: "Last 24 hours" },
            ],
          },
          {
            key: "trendFocus",
            kind: "select",
            label: "Focus",
            required: true,
            options: [
              { value: "instability", label: "Instability pattern" },
              { value: "response", label: "Treatment response" },
              { value: "artifact", label: "Potential monitor artifact" },
            ],
          },
        ],
      },
      {
        title: "Clinical Context",
        description: "Capture non-PHI context notes.",
        kind: "form",
        fields: [
          {
            key: "clinicalContextNotes",
            kind: "textarea",
            label: "Clinical Context Notes",
            placeholder:
              "Operational context only. Use unit/bed tokens and no patient identifiers.",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.notify_care_team": {
    successTitle: "Care team notification workflow simulated",
    successMessage:
      "Care team notification and urgency context were prepared for routing.",
    steps: [
      {
        title: "Team Selection",
        description: "Select notification recipients.",
        kind: "form",
        fields: [
          {
            key: "careTeamTarget",
            kind: "select",
            label: "Care Team",
            required: true,
            options: [
              { value: "primary-team", label: "Primary care team" },
              { value: "consult-team", label: "Consult team" },
              { value: "oncall-team", label: "On-call coverage" },
            ],
          },
          {
            key: "notifyChannel",
            kind: "select",
            label: "Channel",
            required: true,
            options: [
              { value: "ehr-inbox", label: "EHR inbox (demo)" },
              { value: "secure-chat", label: "Secure chat (demo)" },
              { value: "unit-board", label: "Unit board task" },
            ],
          },
        ],
      },
      {
        title: "Message & Priority",
        description: "Set priority and write handoff message.",
        kind: "form",
        fields: [
          {
            key: "notifyPriority",
            kind: "select",
            label: "Priority",
            required: true,
            options: [
              { value: "routine", label: "Routine" },
              { value: "high", label: "High" },
              { value: "urgent", label: "Urgent" },
            ],
          },
          {
            key: "notifyMessage",
            kind: "textarea",
            label: "Message",
            placeholder:
              "Use operational context and token references only (no PHI).",
            required: true,
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "healthcare.escalate_handoff": {
    successTitle: "Handoff escalation workflow simulated",
    successMessage:
      "Handoff escalation target and SLA requirements were captured.",
    steps: [
      {
        title: "Handoff Target",
        description: "Choose escalation destination.",
        kind: "form",
        fields: [
          {
            key: "handoffTarget",
            kind: "select",
            label: "Target Team",
            required: true,
            options: [
              { value: "charge-nurse", label: "Charge nurse" },
              { value: "hospitalist", label: "Hospitalist coverage" },
              { value: "rapid-response", label: "Rapid response coordinator" },
            ],
          },
          {
            key: "handoffReason",
            kind: "textarea",
            label: "Escalation Reason",
            placeholder:
              "Summarize operational urgency and context with non-PHI details.",
            required: true,
          },
        ],
      },
      {
        title: "Risk & SLA",
        description: "Define risk posture and response timeline.",
        kind: "form",
        fields: [
          {
            key: "handoffRisk",
            kind: "select",
            label: "Risk Level",
            required: true,
            options: [
              { value: "moderate", label: "Moderate" },
              { value: "high", label: "High" },
              { value: "critical", label: "Critical" },
            ],
          },
          {
            key: "handoffSla",
            kind: "select",
            label: "SLA Target",
            required: true,
            options: [
              { value: "10m", label: "10 minutes" },
              { value: "30m", label: "30 minutes" },
              { value: "60m", label: "60 minutes" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review and complete.",
        kind: "review",
      },
    ],
  },
  "social.flag_content": {
    successTitle: "Content flag workflow simulated",
    successMessage:
      "Moderation policy and enforcement intent were captured with context.",
    steps: [
      {
        title: "Policy Category",
        description: "Choose applicable policy category.",
        kind: "form",
        fields: [
          {
            key: "policyCategory",
            kind: "select",
            label: "Policy Category",
            required: true,
            options: [
              { value: "harassment", label: "Harassment" },
              { value: "misinfo", label: "Misinformation" },
              { value: "spam", label: "Spam" },
              { value: "other", label: "Other" },
            ],
          },
          {
            key: "flagNotes",
            kind: "textarea",
            label: "Flag Notes",
            placeholder: "Add reviewer context.",
            required: true,
          },
        ],
      },
      {
        title: "Enforcement Action",
        description: "Choose moderation action.",
        kind: "form",
        fields: [
          {
            key: "enforcementAction",
            kind: "select",
            label: "Action",
            required: true,
            options: [
              { value: "hide", label: "Hide content" },
              { value: "warn", label: "Warn account" },
              { value: "escalate", label: "Escalate for review" },
            ],
          },
          {
            key: "reviewQueue",
            kind: "select",
            label: "Review Queue",
            required: true,
            options: [
              { value: "safety", label: "Safety queue" },
              { value: "trust", label: "Trust queue" },
              { value: "legal", label: "Legal queue" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "social.quick_reply": {
    successTitle: "Quick reply workflow simulated",
    successMessage:
      "Reply draft and moderation guardrails were captured.",
    steps: [
      {
        title: "Draft Reply",
        description: "Compose contextual response.",
        kind: "form",
        fields: [
          {
            key: "draftReply",
            kind: "textarea",
            label: "Draft Reply",
            placeholder: "Write the reply that should be suggested.",
            required: true,
          },
        ],
      },
      {
        title: "Tone & Approval",
        description: "Set tone and approval requirements.",
        kind: "form",
        fields: [
          {
            key: "replyTone",
            kind: "select",
            label: "Tone",
            required: true,
            options: [
              { value: "friendly", label: "Friendly" },
              { value: "formal", label: "Formal" },
              { value: "empathetic", label: "Empathetic" },
            ],
          },
          {
            key: "approvalLevel",
            kind: "select",
            label: "Approval",
            required: true,
            options: [
              { value: "auto", label: "Auto-send" },
              { value: "manager", label: "Manager approval" },
              { value: "legal", label: "Legal approval" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "social.save_asset": {
    successTitle: "Save asset workflow simulated",
    successMessage:
      "Asset destination and metadata tagging were captured for handoff.",
    steps: [
      {
        title: "Destination",
        description: "Pick where the asset should be stored.",
        kind: "form",
        fields: [
          {
            key: "assetDestination",
            kind: "select",
            label: "Destination",
            required: true,
            options: [
              { value: "campaign", label: "Campaign library" },
              { value: "brand", label: "Brand vault" },
              { value: "draft", label: "Draft workspace" },
            ],
          },
          {
            key: "assetName",
            kind: "text",
            label: "Asset Name",
            placeholder: "holiday-launch-variant-b",
            required: true,
          },
        ],
      },
      {
        title: "Metadata & Tags",
        description: "Attach categorization metadata.",
        kind: "form",
        fields: [
          {
            key: "assetTags",
            kind: "text",
            label: "Tags",
            placeholder: "holiday,retargeting,ugc",
            required: true,
          },
          {
            key: "usageRights",
            kind: "select",
            label: "Usage Rights",
            required: true,
            options: [
              { value: "internal", label: "Internal" },
              { value: "paid", label: "Paid media" },
              { value: "global", label: "Global unrestricted" },
            ],
          },
        ],
      },
      {
        title: "Confirm",
        description: "Review details and complete.",
        kind: "review",
      },
    ],
  },
  "software.send_to_cursor": {
    successTitle: "Cursor handoff workflow simulated",
    successMessage:
      "Fix scope, prompt, and constraints are staged for Cursor integration.",
    steps: [
      {
        title: "Fix Scope",
        description: "Select scope and expected output.",
        kind: "form",
        fields: [
          {
            key: "fixScope",
            kind: "select",
            label: "Fix Scope",
            required: true,
            options: [
              { value: "element", label: "Selected element only" },
              { value: "container", label: "Container component" },
              { value: "page", label: "Whole page" },
            ],
          },
          {
            key: "impact",
            kind: "select",
            label: "Impact",
            required: true,
            options: [
              { value: "blocker", label: "Blocker" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
            ],
          },
        ],
      },
      {
        title: "Prompt & Constraints",
        description: "Specify agent prompt and boundaries.",
        kind: "form",
        fields: [
          {
            key: "cursorPrompt",
            kind: "textarea",
            label: "Prompt",
            placeholder: "Describe the fix that should be generated.",
            required: true,
          },
          {
            key: "branchName",
            kind: "text",
            label: "Branch",
            placeholder: "codex/fix-login-button",
            required: true,
          },
          {
            key: "constraints",
            kind: "textarea",
            label: "Constraints",
            placeholder: "Do not modify API contracts. Keep visual styles stable.",
            required: false,
          },
        ],
      },
      {
        title: "Review",
        description: "Review payload and context before send.",
        kind: "review",
      },
    ],
  },
};

const INITIAL_FORM_VALUES: Partial<Record<WorkflowActionId, Record<string, string>>> =
  {
    "software.report_bug": {
      ticketSystem: "github",
      severity: "medium",
      labels: "bug,homepage",
    },
    "software.copy_selector": {
      selectorFormat: "css",
    },
    "software.send_to_cursor": {
      branchName: "codex/fix-ui-feedback",
    },
  };

const DEFAULT_BUG_SUMMARY_PLACEHOLDER =
  "Observed UI behavior does not match expected interaction.";

function isGenericAction(actionId: WorkflowActionId): actionId is GenericActionId {
  return actionId !== "software.report_bug" && actionId !== "software.copy_selector";
}

function defaultSummaryFromCapture(capture: WorkflowCaptureData | null): string {
  if (!capture) {
    return "Observed UI behavior does not match expected interaction.";
  }

  const text = capture.targetContext?.innerText?.trim();
  if (text) {
    return `Observed unexpected behavior on \"${text.slice(0, 80)}\" when interacting in ${capture.pageContext.title}.`;
  }

  return `Observed unexpected behavior on ${capture.targetSelector} in ${capture.pageContext.title}.`;
}

function formatFormValue(value: string): string {
  if (!value) return "Not provided";
  return value;
}

function parseLabels(csvValue: string): string[] {
  return csvValue
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

async function writeClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API not available");
  }
  await navigator.clipboard.writeText(text);
}

function buildMetadata(
  launch: WorkflowLaunchState,
  formState: Record<string, string>,
  capture: WorkflowCaptureData | null,
) {
  return {
    routing: {
      adapter: "github",
    },
    workflow: {
      actionId: launch.action.id,
      actionLabel: launch.action.menuLabel,
      source: "homepage-immersive-workstream",
      ticketSystem: formState.ticketSystem,
      workstream: launch.action.workstream,
      severity: formState.severity,
      labels: parseLabels(formState.labels || ""),
    },
    context: {
      containerSelector: capture?.containerSelector || "unknown",
      targetSelector: capture?.targetSelector || "unknown",
      pageTitle: capture?.pageContext.title || "",
    },
    github: {
      title: formState.bugTitle,
    },
  };
}

function buildScreenshots(capture: WorkflowCaptureData | null): ScreenshotData | undefined {
  if (!capture) return undefined;

  const screenshots: ScreenshotData = {
    capturedAt: capture.capturedAt,
  };

  if (capture.containerScreenshot) {
    screenshots.container = capture.containerScreenshot;
  }

  if (capture.screenshotError) {
    screenshots.errors = {
      container: {
        message: capture.screenshotError,
        name: "SCREENSHOT_CAPTURE_ERROR",
      },
    };
  }

  if (!screenshots.container && !screenshots.errors) {
    return undefined;
  }

  return screenshots;
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--workflow-accent-text-muted)" }}
      >
        {field.label}
      </span>
      {field.kind === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="min-h-24 w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[var(--workflow-accent)] focus:outline-none"
        />
      ) : field.kind === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white focus:border-[var(--workflow-accent)] focus:outline-none"
        >
          <option value="">Select an option</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[var(--workflow-accent)] focus:outline-none"
        />
      )}
    </label>
  );
}

export function WorkflowFlowRenderer({
  captureState,
  launch,
  onClose,
  onRetryCapture,
}: WorkflowFlowRendererProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<WorkflowSuccessState | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>("");

  const action = launch.action;
  const captureData = captureState.data;

  const selectorBundle = useMemo(() => {
    if (!captureData) return null;
    return buildSelectorBundle(captureData);
  }, [captureData]);

  const genericWorkflow = isGenericAction(action.id)
    ? GENERIC_WORKFLOWS[action.id]
    : null;

  useEffect(() => {
    const defaults = {
      ...(INITIAL_FORM_VALUES[action.id] || {}),
    };

    if (action.id === "software.report_bug") {
      defaults.bugSummary = DEFAULT_BUG_SUMMARY_PLACEHOLDER;
    }

    setFormState(defaults);
    setStepIndex(0);
    setStepError(null);
    setSubmitError(null);
    setSuccessState(null);
    setIsSubmitting(false);
    setCopyStatus("");
  }, [action.id, launch.openedAt]);

  useEffect(() => {
    if (action.id !== "software.report_bug") return;
    if (!captureData) return;

    setFormState((current) => {
      if (current.bugTitle) {
        return current;
      }

      return {
        ...current,
        bugTitle: generateHeuristicIssueTitle(captureData),
        bugSummary:
          !current.bugSummary ||
          current.bugSummary === DEFAULT_BUG_SUMMARY_PLACEHOLDER
            ? defaultSummaryFromCapture(captureData)
            : current.bugSummary,
      };
    });
  }, [action.id, captureData]);

  const setField = (key: string, value: string) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const isLastStep = stepIndex === action.steps.length - 1;

  const selectedCopyValue = useMemo(() => {
    if (!selectorBundle) return "";
    const selectorFormat = formState.selectorFormat || "css";

    if (selectorFormat === "xpath") return selectorBundle.xpath;
    if (selectorFormat === "testid") return selectorBundle.testId;
    return selectorBundle.css;
  }, [formState.selectorFormat, selectorBundle]);

  const validateCurrentStep = (): string | null => {
    if (action.id === "software.report_bug") {
      if (stepIndex === 0 && !formState.ticketSystem) {
        return "Select a ticket system.";
      }

      if (stepIndex === 1) {
        if (formState.ticketSystem === "github") {
          if (!formState.bugTitle?.trim()) return "Issue title is required.";
          if (!formState.bugSummary?.trim()) {
            return "Issue summary is required.";
          }
        } else {
          if (!formState.jiraProject?.trim()) return "Project key is required.";
          if (!formState.jiraIssueType?.trim()) {
            return "Issue type is required.";
          }
        }
      }

      return null;
    }

    if (action.id === "software.copy_selector") {
      return null;
    }

    if (!genericWorkflow) {
      return null;
    }

    const step = genericWorkflow.steps[stepIndex];
    if (!step || step.kind === "review") {
      return null;
    }

    for (const field of step.fields || []) {
      if (!field.required) continue;
      const value = formState[field.key] || "";
      if (!value.trim()) {
        return `${field.label} is required.`;
      }
    }

    return null;
  };

  const completeAsDemo = (title?: string, message?: string) => {
    if (isGenericAction(action.id) && !title && !message) {
      setSuccessState({
        demo: true,
        title: GENERIC_WORKFLOWS[action.id].successTitle,
        message: GENERIC_WORKFLOWS[action.id].successMessage,
      });
      return;
    }

    if (action.id === "software.copy_selector" && !title && !message) {
      setSuccessState({
        demo: true,
        title: "Selector bundle ready",
        message:
          "Selector output and snippet are prepared. In production this would route to adapter actions.",
      });
      return;
    }

    setSuccessState({
      demo: true,
      title: title || "Workflow simulation complete",
      message:
        message ||
        "This workflow is configured as a demo and is ready for adapter integration.",
    });
  };

  const submitSoftwareBugToGitHub = async () => {
    if (!launch.targetElement) {
      setSubmitError("No target element available for GitHub issue creation.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: AnyclickPayload = buildAnyclickPayload(
        launch.targetElement,
        "issue",
        {
          comment: formState.bugSummary,
          metadata: buildMetadata(launch, formState, captureData),
        },
      );

      const screenshots = buildScreenshots(captureData);
      if (screenshots) {
        payload.screenshots = screenshots;
      }

      const response = await fetch("/api/feedback/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            error?: string;
            issue?: { htmlUrl?: string; url?: string };
            success?: boolean;
          }
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || `GitHub submission failed with status ${response.status}`,
        );
      }

      setSuccessState({
        demo: false,
        issueUrl: data.issue?.htmlUrl || data.issue?.url,
        message:
          "GitHub issue was created successfully with Anyclick element and container context.",
        title: "GitHub issue created",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create GitHub issue. You can still complete as demo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeWorkflow = async () => {
    if (action.id === "software.report_bug") {
      if (formState.ticketSystem === "github") {
        await submitSoftwareBugToGitHub();
      } else {
        completeAsDemo(
          "Jira workflow simulated",
          "Jira is marked as needs integration. Workflow steps are captured for adapter wiring.",
        );
      }
      return;
    }

    completeAsDemo();
  };

  const handleNext = async () => {
    setStepError(null);

    const validationError = validateCurrentStep();
    if (validationError) {
      setStepError(validationError);
      return;
    }

    if (!isLastStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    await completeWorkflow();
  };

  const handleBack = () => {
    setStepError(null);
    setSubmitError(null);

    if (stepIndex === 0) return;
    setStepIndex((current) => current - 1);
  };

  const regenerateTitle = () => {
    if (!captureData) return;
    setField("bugTitle", generateHeuristicIssueTitle(captureData));
  };

  const copySelectedOutput = async () => {
    if (!selectedCopyValue) return;

    try {
      await writeClipboard(selectedCopyValue);
      setCopyStatus("Copied selected selector.");
    } catch {
      setCopyStatus("Clipboard permission denied.");
    }
  };

  const copyBundleSnippet = async () => {
    if (!selectorBundle) return;

    try {
      await writeClipboard(selectorBundle.snippet);
      setCopyStatus("Copied selector bundle snippet.");
    } catch {
      setCopyStatus("Clipboard permission denied.");
    }
  };

  const renderSoftwareBug = () => {
    if (stepIndex === 0) {
      const selectedSystem = formState.ticketSystem || "";

      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            Choose the ticket system for this bug report workflow.
          </p>

          <div className="grid gap-2">
            {[{ value: "jira", label: "Jira (needs integration)" }, {
              value: "github",
              label: "GitHub",
            }].map((option) => {
              const active = selectedSystem === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setField("ticketSystem", option.value)}
                  className={`rounded-md border px-3 py-3 text-left text-sm transition-colors ${
                    active
                      ? "text-white"
                      : "border-white/15 bg-white/5 text-gray-200 hover:border-white/30"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: "var(--workflow-accent-soft-bg)",
                          borderColor: "var(--workflow-accent-soft-border)",
                          color: "var(--workflow-accent-text)",
                        }
                      : undefined
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (stepIndex === 1) {
      if (formState.ticketSystem === "github") {
        return (
          <div className="space-y-3">
            <div
              className="rounded-md border px-3 py-2 text-xs"
              style={{
                backgroundColor: "var(--workflow-accent-soft-bg)",
                borderColor: "var(--workflow-accent-soft-border)",
                color: "var(--workflow-accent-text)",
              }}
            >
              GitHub form auto-populates title from selector and page context.
            </div>

            <label className="space-y-1.5">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--workflow-accent-text-muted)" }}
              >
                AI-generated title
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formState.bugTitle || ""}
                  onChange={(event) => setField("bugTitle", event.target.value)}
                  className="w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white focus:border-[var(--workflow-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={regenerateTitle}
                  className="rounded-md border border-white/20 px-2.5 py-2 text-xs text-gray-200 hover:bg-white/10"
                >
                  Regenerate
                </button>
              </div>
            </label>

            <label className="space-y-1.5">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--workflow-accent-text-muted)" }}
              >
                Summary
              </span>
              <textarea
                value={formState.bugSummary || ""}
                onChange={(event) => setField("bugSummary", event.target.value)}
                className="min-h-24 w-full rounded-md border border-white/15 bg-black/25 px-3 py-2 text-sm text-white focus:border-[var(--workflow-accent)] focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <FieldControl
                field={{
                  key: "severity",
                  kind: "select",
                  label: "Severity",
                  required: true,
                  options: [
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "critical", label: "Critical" },
                  ],
                }}
                value={formState.severity || ""}
                onChange={(value) => setField("severity", value)}
              />
              <FieldControl
                field={{
                  key: "labels",
                  kind: "text",
                  label: "Labels (comma-separated)",
                  placeholder: "bug,homepage,ui",
                }}
                value={formState.labels || ""}
                onChange={(value) => setField("labels", value)}
              />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <div className="rounded-md border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Jira flow is UI-only in this demo. This step shows the proposed form
            shape before adapter integration.
          </div>

          <FieldControl
            field={{
              key: "jiraProject",
              kind: "text",
              label: "Project Key",
              placeholder: "WEB",
              required: true,
            }}
            value={formState.jiraProject || ""}
            onChange={(value) => setField("jiraProject", value)}
          />

          <FieldControl
            field={{
              key: "jiraIssueType",
              kind: "select",
              label: "Issue Type",
              required: true,
              options: [
                { value: "Bug", label: "Bug" },
                { value: "Task", label: "Task" },
                { value: "Incident", label: "Incident" },
              ],
            }}
            value={formState.jiraIssueType || ""}
            onChange={(value) => setField("jiraIssueType", value)}
          />

          <FieldControl
            field={{
              key: "jiraAssignee",
              kind: "text",
              label: "Assignee",
              placeholder: "qa-team",
            }}
            value={formState.jiraAssignee || ""}
            onChange={(value) => setField("jiraAssignee", value)}
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-gray-200">
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <h5
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--workflow-accent-text-muted)" }}
          >
            Review
          </h5>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-400">Ticket system</dt>
              <dd>{formatFormValue(formState.ticketSystem || "")}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-400">Severity</dt>
              <dd>{formatFormValue(formState.severity || "")}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Summary</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded bg-black/25 p-2 text-[11px]">
                {formatFormValue(formState.bugSummary || "")}
              </dd>
            </div>
          </dl>
        </div>

        {submitError && (
          <div className="rounded-md border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-100">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5" />
              <div>
                <p className="font-medium">GitHub submission failed</p>
                <p className="mt-1 text-rose-100/90">{submitError}</p>
              </div>
            </div>

            {formState.ticketSystem === "github" && (
              <button
                type="button"
                onClick={() =>
                  completeAsDemo(
                    "Completed as demo",
                    "GitHub was unavailable. Workflow completed as demo fallback.",
                  )
                }
                className="mt-3 rounded border border-rose-200/50 px-2.5 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-200/10"
              >
                Complete as demo
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSoftwareCopySelector = () => {
    if (stepIndex === 0) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            Select which selector format should be generated for the workflow
            bundle.
          </p>

          <FieldControl
            field={{
              key: "selectorFormat",
              kind: "select",
              label: "Selector Format",
              required: true,
              options: [
                { value: "css", label: "CSS selector" },
                { value: "xpath", label: "XPath selector" },
                { value: "testid", label: "data-testid selector" },
              ],
            }}
            value={formState.selectorFormat || "css"}
            onChange={(value) => setField("selectorFormat", value)}
          />

          <div
            className="rounded-md border border-white/10 bg-black/20 p-2 text-xs font-mono break-all"
            style={{ color: "var(--workflow-accent-text)" }}
          >
            {selectedCopyValue || "Waiting for captured selector..."}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-300">
          Copy selector output and integration snippet.
        </p>

        <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
          <div>
            <p
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "var(--workflow-accent-text-muted)" }}
            >
              Selected output
            </p>
            <pre
              className="mt-1 whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-xs"
              style={{ color: "var(--workflow-accent-text)" }}
            >
              {selectedCopyValue || "No selector available"}
            </pre>
          </div>

          <div>
            <p
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "var(--workflow-accent-text-muted)" }}
            >
              Bundle snippet
            </p>
            <pre
              className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-xs"
              style={{ color: "var(--workflow-accent-text)" }}
            >
              {selectorBundle?.snippet || "No snippet available"}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void copySelectedOutput();
            }}
            className="inline-flex items-center gap-1 rounded border border-white/20 px-2.5 py-1.5 text-xs text-gray-100 hover:bg-white/10"
          >
            <Clipboard size={13} /> Copy selector
          </button>
          <button
            type="button"
            onClick={() => {
              void copyBundleSnippet();
            }}
            className="inline-flex items-center gap-1 rounded border border-white/20 px-2.5 py-1.5 text-xs text-gray-100 hover:bg-white/10"
          >
            <Clipboard size={13} /> Copy bundle
          </button>
        </div>

        {copyStatus && (
          <p
            className="rounded border px-2.5 py-1.5 text-xs"
            style={{
              backgroundColor: "var(--workflow-accent-soft-bg)",
              borderColor: "var(--workflow-accent-soft-border)",
              color: "var(--workflow-accent-text)",
            }}
          >
            {copyStatus}
          </p>
        )}
      </div>
    );
  };

  const renderGenericWorkflow = () => {
    if (!genericWorkflow) {
      return null;
    }

    const step = genericWorkflow.steps[stepIndex];
    if (!step) {
      return null;
    }

    if (step.kind === "review") {
      const fields = genericWorkflow.steps
        .flatMap((item) => item.fields || [])
        .filter((field, index, list) =>
          list.findIndex((candidate) => candidate.key === field.key) === index,
        );

      return (
        <div className="space-y-2 rounded-md border border-white/10 bg-white/5 p-3">
          <h5
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--workflow-accent-text-muted)" }}
          >
            Review
          </h5>
          <dl className="space-y-1 text-xs">
            {fields.map((field) => (
              <div key={field.key} className="flex items-start justify-between gap-3">
                <dt className="text-gray-400">{field.label}</dt>
                <dd className="text-right text-gray-100">
                  {formatFormValue(formState[field.key] || "")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {(step.fields || []).map((field) => (
          <FieldControl
            key={field.key}
            field={field}
            value={formState[field.key] || ""}
            onChange={(value) => setField(field.key, value)}
          />
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    if (action.id === "software.report_bug") {
      return renderSoftwareBug();
    }

    if (action.id === "software.copy_selector") {
      return renderSoftwareCopySelector();
    }

    return renderGenericWorkflow();
  };

  const currentStepLabel = action.steps[stepIndex];

  const primaryLabel = (() => {
    if (!isLastStep) {
      return "Next";
    }

    if (action.id === "software.report_bug") {
      return formState.ticketSystem === "github"
        ? isSubmitting
          ? "Creating issue..."
          : "Create GitHub issue"
        : "Complete as demo";
    }

    return "Complete demo";
  })();

  if (successState) {
    return (
      <div className="flex h-[calc(100%-68px)] flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--workflow-accent-soft-bg)",
              borderColor: "var(--workflow-accent-soft-border)",
              color: "var(--workflow-accent-text)",
            }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">{successState.title}</h4>
                <p className="mt-1 text-sm">
                  {successState.message}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide">
                  {successState.demo ? "Demo mode" : "Live GitHub submission"}
                </p>

                {successState.issueUrl && (
                  <a
                    href={successState.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: "var(--workflow-accent-soft-border)",
                      color: "var(--workflow-accent-text)",
                    }}
                  >
                    View issue <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <WorkflowContextSummary
            captureState={captureState}
            onRetryCapture={onRetryCapture}
          />
        </div>

        <div className="flex items-center justify-end border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-medium text-[#061018]"
            style={{ backgroundColor: "var(--workflow-accent-strong-bg)" }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100%-68px)] flex-col">
      <div className="border-b border-white/10 px-5 py-3">
        <div className="flex items-center justify-between text-xs text-gray-300">
          <span
            className="uppercase tracking-[0.12em]"
            style={{ color: "var(--workflow-accent-text-muted)" }}
          >
            Step {stepIndex + 1} of {action.steps.length}
          </span>
          <span>{currentStepLabel?.title}</span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
          <div
            className="h-full rounded transition-all duration-300"
            style={{
              width: `${((stepIndex + 1) / action.steps.length) * 100}%`,
              backgroundColor: "var(--workflow-accent)",
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white">
            {currentStepLabel?.title}
          </h4>
          <p className="mt-1 text-sm text-gray-400">
            {currentStepLabel?.description}
          </p>
        </div>

        {renderStepContent()}

        {stepError && (
          <div className="mt-3 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
            {stepError}
          </div>
        )}

        <WorkflowContextSummary
          captureState={captureState}
          onRetryCapture={onRetryCapture}
        />
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={stepIndex === 0 || isSubmitting}
          className="rounded-md border border-white/20 px-3 py-2 text-sm text-gray-200 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => {
            void handleNext();
          }}
          disabled={isSubmitting}
          className="rounded-md px-3 py-2 text-sm font-medium text-[#061018] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "var(--workflow-accent-strong-bg)" }}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
