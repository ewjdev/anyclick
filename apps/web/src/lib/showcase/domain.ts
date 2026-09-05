import type { ConversationResult } from "@ewjdev/anyclick-react";
import { z } from "zod";

export const scenarioIds = [
  "software",
  "commerce",
  "healthcare",
  "social",
] as const;
export type ScenarioId = (typeof scenarioIds)[number];
export type SampleObject = {
  id: string;
  label: string;
  kind: string;
  description: string;
  fields: Record<string, string>;
};
export type Activity = { id: string; label: string; at: number };
export type ScenarioState = {
  id: ScenarioId;
  revision: number;
  objects: SampleObject[];
  activity: Activity[];
};
export type Task = {
  id: string;
  label: string;
  objectId: string;
  prompt: string;
  description: string;
  fields: { name: string; label: string; value: string; options?: string[] }[];
};
export const scenarios: Record<
  ScenarioId,
  {
    title: string;
    app: string;
    description: string;
    accent: string;
    tasks: Task[];
  }
> = {
  software: {
    title: "Software",
    app: "Northstar checkout",
    description: "From an unclear interface to a useful fix.",
    accent: "#a5b4fc",
    tasks: [
      {
        id: "issue",
        label: "Report a problem",
        objectId: "checkout",
        prompt:
          "Draft a bug report for this checkout button. Ask about expected behavior if needed.",
        description:
          "Capture the target, review the issue, and open the real result on GitHub.",
        fields: [
          {
            name: "title",
            label: "Issue title",
            value: "Checkout does not complete",
          },
          {
            name: "text",
            label: "Expected behavior and reproduction steps",
            value:
              "Select Complete order. Expected: an order confirmation. Actual: checkout stays on the same page.",
          },
        ],
      },
      {
        id: "improve",
        label: "Improve field copy",
        objectId: "address",
        prompt:
          "Rewrite this field label and help text so a shopper understands what to enter.",
        description: "Preview new copy, apply it to the checkout, and undo it.",
        fields: [
          {
            name: "text",
            label: "Replacement copy",
            value: "Apartment, suite, or unit (optional)",
          },
        ],
      },
      {
        id: "checklist",
        label: "Explain an error",
        objectId: "checkout-error",
        prompt:
          "Explain this error using the supplied checkout context, then draft a reproduction checklist. Distinguish facts from hypotheses.",
        description: "Turn a visible error into reproducible evidence.",
        fields: [
          {
            name: "text",
            label: "Reproduction checklist",
            value:
              "1. Open checkout.\n2. Enter the sample shipping address.\n3. Select Complete order.\n4. Observe HTTP 422: shipping_address.postal_code is required.",
          },
        ],
      },
    ],
  },
  commerce: {
    title: "Commerce",
    app: "Fieldwork order desk",
    description: "Keep the order, evidence, and resolution together.",
    accent: "#fcd34d",
    tasks: [
      {
        id: "update",
        label: "Explain a delay",
        objectId: "order-1042",
        prompt:
          "Explain the shipping delay from the tracking events and draft a helpful customer update. Do not invent an arrival date.",
        description:
          "Read the tracking evidence and save an update to the support thread.",
        fields: [
          {
            name: "text",
            label: "Customer update",
            value:
              "Your order reached the regional hub. The carrier reported a weather delay; a revised delivery date is not available yet.",
          },
        ],
      },
      {
        id: "replacement",
        label: "Resolve a missing item",
        objectId: "order-1042",
        prompt:
          "Help resolve a missing trail bottle from this order. Ask for the quantity, then prepare a replacement request.",
        description:
          "Create a replacement request, follow its status, or cancel it.",
        fields: [
          {
            name: "quantity",
            label: "Missing quantity",
            value: "1",
            options: ["1", "2"],
          },
        ],
      },
      {
        id: "shortlist",
        label: "Compare products",
        objectId: "trail-bottle",
        prompt:
          "Compare @trail-bottle with @camp-bottle using the catalog specifications, and explain their tradeoffs.",
        description: "Compare actual catalog fields and save a shortlist.",
        fields: [
          {
            name: "other",
            label: "Compare with",
            value: "camp-bottle",
            options: ["camp-bottle"],
          },
        ],
      },
    ],
  },
  healthcare: {
    title: "Healthcare",
    app: "Juniper appointment desk",
    description: "Clear administrative follow-ups, with synthetic records.",
    accent: "#6ee7b7",
    tasks: [
      {
        id: "checkin",
        label: "Complete check-in",
        objectId: "appointment-204",
        prompt:
          "Which administrative check-in requirements are missing for this sample appointment?",
        description: "Complete the missing checklist and see readiness update.",
        fields: [
          {
            name: "contact",
            label: "Contact details verified",
            value: "yes",
            options: ["yes", "no"],
          },
          {
            name: "forms",
            label: "Intake forms received",
            value: "yes",
            options: ["yes", "no"],
          },
        ],
      },
      {
        id: "reschedule",
        label: "Find another time",
        objectId: "appointment-204",
        prompt:
          "Help move this appointment to another available sample slot. Present the available options.",
        description: "Choose an available slot and update the schedule.",
        fields: [
          {
            name: "slot",
            label: "Available appointment",
            value: "Tuesday 10:30",
            options: ["Tuesday 10:30", "Wednesday 14:00"],
          },
        ],
      },
      {
        id: "review",
        label: "Flag for staff review",
        objectId: "intake-204",
        prompt:
          "Summarize this administrative intake discrepancy and prepare a staff review task.",
        description:
          "Send a source-linked task to the sample staff queue and add a note.",
        fields: [
          {
            name: "queue",
            label: "Staff queue",
            value: "Front desk",
            options: ["Front desk", "Scheduling"],
          },
          {
            name: "text",
            label: "Review summary",
            value:
              "Preferred contact method differs between the appointment and intake form. Confirm the preference before updating the record.",
          },
        ],
      },
    ],
  },
  social: {
    title: "Social",
    app: "Fieldwork publishing studio",
    description: "Move from a selected sentence to the next published version.",
    accent: "#f9a8d4",
    tasks: [
      {
        id: "rewrite",
        label: "Rewrite a post",
        objectId: "post-18",
        prompt:
          "Rewrite this post in a warm, concise voice for weekend hikers. Offer a version under 180 characters.",
        description:
          "Review the change, apply it to the draft, and refine or undo it.",
        fields: [
          {
            name: "text",
            label: "Post copy",
            value:
              "Pack light. Stay out longer. Meet the Trail Bottle—made for your next weekend outside.",
          },
        ],
      },
      {
        id: "reply",
        label: "Reply with context",
        objectId: "comment-73",
        prompt:
          "Draft a helpful reply to this comment using the parent post and product specifications. Do not invent product features.",
        description:
          "Publish to the sample feed, then edit or remove the reply.",
        fields: [
          {
            name: "text",
            label: "Reply",
            value:
              "The Trail Bottle holds 750 ml and weighs 310 g. It fits most standard bottle pockets; check your pack’s dimensions for the best fit.",
          },
        ],
      },
      {
        id: "experiment",
        label: "Understand performance",
        objectId: "metrics-18",
        prompt:
          "Explain the measured change in this post’s performance. Separate the actual calculations from possible causes, then propose a content experiment.",
        description:
          "Inspect the numbers and save a testable content experiment.",
        fields: [
          {
            name: "text",
            label: "Content experiment",
            value:
              "Test a product-detail caption against a weekend-story caption. Keep the image and posting time consistent; compare engagement rates after seven days.",
          },
        ],
      },
    ],
  },
};

const seeds: Record<ScenarioId, SampleObject[]> = {
  software: [
    {
      id: "checkout",
      kind: "button",
      label: "Complete order",
      description: "Checkout action · observed HTTP 422",
      fields: {
        total: "$84.00",
        status: "Order not submitted",
        expected: "Show order confirmation",
        observed: "POST /checkout returns 422",
      },
    },
    {
      id: "address",
      kind: "field",
      label: "Address line 2",
      description: "An optional field with unclear help text",
      fields: { text: "Additional information", value: "", required: "No" },
    },
    {
      id: "checkout-error",
      kind: "error",
      label: "Shipping address rejected",
      description: "A supplied sample server response",
      fields: {
        error: "HTTP 422: shipping_address.postal_code is required",
        request: "POST /checkout",
        observed: "UI submits postalCode; sample API expects postal_code",
      },
    },
  ],
  commerce: [
    {
      id: "order-1042",
      kind: "order",
      label: "Order #1042",
      description: "Two trail bottles · shipment delayed",
      fields: {
        customer: "Alex Morgan (sample)",
        item: "Trail Bottle",
        ordered: "2",
        tracking:
          "Monday: label created → Tuesday: regional hub → Wednesday: weather delay",
        status: "Delayed",
        eta: "Not yet available",
      },
    },
    {
      id: "trail-bottle",
      kind: "product",
      label: "Trail Bottle",
      description: "Lightweight stainless steel · 750 ml",
      fields: {
        price: "$32",
        capacity: "750 ml",
        weight: "310 g",
        material: "Stainless steel",
        insulation: "Single wall",
      },
    },
    {
      id: "camp-bottle",
      kind: "product",
      label: "Camp Bottle",
      description: "Insulated stainless steel · 1 litre",
      fields: {
        price: "$44",
        capacity: "1000 ml",
        weight: "480 g",
        material: "Stainless steel",
        insulation: "Double wall",
      },
    },
  ],
  healthcare: [
    {
      id: "appointment-204",
      kind: "appointment",
      label: "Jamie Lee · appointment #204",
      description: "Synthetic record · administrative workflow",
      fields: {
        slot: "Monday 09:00",
        contact: "no",
        forms: "no",
        status: "Check-in incomplete",
        preferredContact: "Phone",
      },
    },
    {
      id: "intake-204",
      kind: "intake",
      label: "Intake form #204",
      description: "Contact preference needs confirmation",
      fields: {
        preferredContact: "Email",
        appointmentPreference: "Phone",
        discrepancy: "Preferred contact methods do not match",
      },
    },
  ],
  social: [
    {
      id: "post-18",
      kind: "post",
      label: "A bottle for the long way home",
      description: "Draft · Fieldwork Outdoors",
      fields: {
        text: "We are excited to announce our new Trail Bottle. This amazing product is designed for all your outdoor adventures. Check it out today!",
        audience: "Weekend hikers",
        status: "Draft",
      },
    },
    {
      id: "comment-73",
      kind: "comment",
      label: "Sam’s question",
      description: "On the Trail Bottle launch post",
      fields: {
        text: "How much does it hold, and will it fit in my daypack?",
        parent: "post-18",
        product: "750 ml; 310 g; stainless steel; single wall",
      },
    },
    {
      id: "metrics-18",
      kind: "metrics",
      label: "Last two seven-day periods",
      description: "Sample engagement figures",
      fields: {
        previousViews: "2000",
        currentViews: "2500",
        previousEngagements: "100",
        currentEngagements: "150",
        previousRate: "5%",
        currentRate: "6%",
        measuredChange:
          "+25% views; +50% engagements; +1 percentage point engagement rate",
      },
    },
  ],
};

export function initialScenario(id: ScenarioId): ScenarioState {
  return { id, revision: 0, objects: structuredClone(seeds[id]), activity: [] };
}
export function taskFor(id: ScenarioId, actionId: string) {
  return scenarios[id].tasks.find((task) => task.id === actionId);
}
export function getObject(state: ScenarioState, id: string) {
  const object = state.objects.find((item) => item.id === id);
  if (!object)
    throw new DomainError("This object is no longer available.", 404);
  return object;
}
export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const actionInput = z
  .object({
    scenario: z.enum(scenarioIds),
    actionId: z.string().min(1).max(60),
    objectId: z.string().min(1).max(100),
    values: z
      .record(z.string().max(8000))
      .refine((values) => Object.keys(values).length <= 8),
    screenshot: z.string().max(1_400_000).optional(),
  })
  .strict();
export type ActionInput = z.infer<typeof actionInput>;

export function validateAction(state: ScenarioState, input: ActionInput) {
  const object = getObject(state, input.objectId);
  const task = taskFor(state.id, input.actionId);
  if (
    !task &&
    !["undo", "cancel", "note", "edit-reply", "remove-reply"].includes(
      input.actionId,
    )
  )
    throw new DomainError("This action is not available here.");
  if (task && task.objectId !== object.id)
    throw new DomainError("This action does not apply to the selected object.");
  if (task)
    for (const field of task.fields) {
      const value = input.values[field.name]?.trim();
      if (!value) throw new DomainError(`${field.label} is required.`);
      if (field.options && !field.options.includes(value))
        throw new DomainError(
          `Choose an available ${field.label.toLowerCase()}.`,
        );
    }
  if (input.actionId === "cancel" && object.fields.replacement !== "Pending")
    throw new DomainError("There is no pending replacement to cancel.", 409);
  if (
    ["edit-reply", "remove-reply"].includes(input.actionId) &&
    !object.fields.reply
  )
    throw new DomainError("There is no published sample reply.", 409);
  if (
    ["note", "edit-reply"].includes(input.actionId) &&
    !input.values.text?.trim()
  )
    throw new DomainError("Enter the text to save.");
  if (input.actionId === "note" && !object.fields.review)
    throw new DomainError("Create a staff review task first.");
  if (
    input.actionId === "replacement" &&
    object.fields.replacement === "Pending"
  )
    throw new DomainError(
      "A replacement is already pending. View or cancel it first.",
      409,
    );
  if (input.actionId === "reply" && object.fields.reply)
    throw new DomainError("A reply already exists. Edit it instead.", 409);
  if (
    input.screenshot &&
    (input.actionId !== "issue" ||
      !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(input.screenshot))
  )
    throw new DomainError(
      "Only a captured PNG can be attached to a GitHub issue.",
    );
  if (
    input.screenshot &&
    !input.screenshot.startsWith("data:image/png;base64,iVBORw0KGgo")
  )
    throw new DomainError("The screenshot is not a valid PNG capture.");
  return object;
}

export function mutateScenario(
  state: ScenarioState,
  input: ActionInput,
  executionId: string,
  now: number,
): ScenarioState {
  validateAction(state, input);
  const next = structuredClone(state);
  const object = getObject(next, input.objectId);
  const value = input.values;
  switch (input.actionId) {
    case "improve":
    case "rewrite":
      object.fields.text = value.text;
      break;
    case "checklist":
      object.fields.checklist = value.text;
      break;
    case "update":
      object.fields.customerUpdate = value.text;
      break;
    case "replacement":
      object.fields.replacement = "Pending";
      object.fields.replacementQuantity = value.quantity;
      break;
    case "cancel":
      object.fields.replacement = "Cancelled";
      break;
    case "shortlist":
      object.fields.shortlist = `${object.id}, ${value.other}`;
      break;
    case "checkin":
      object.fields.contact = value.contact;
      object.fields.forms = value.forms;
      object.fields.status =
        value.contact === "yes" && value.forms === "yes"
          ? "Ready for appointment"
          : "Check-in incomplete";
      break;
    case "reschedule":
      object.fields.slot = value.slot;
      break;
    case "review":
      object.fields.review = value.text;
      object.fields.queue = value.queue;
      object.fields.reviewStatus = "Open";
      break;
    case "note":
      object.fields.note = value.text;
      break;
    case "reply":
    case "edit-reply":
      object.fields.reply = value.text;
      break;
    case "remove-reply":
      delete object.fields.reply;
      break;
    case "experiment":
      object.fields.experiment = value.text;
      object.fields.experimentStatus = "Planned";
      break;
    default:
      throw new DomainError(
        "This action requires a different execution handler.",
      );
  }
  next.revision++;
  next.activity = [
    {
      id: executionId,
      label: `${taskFor(state.id, input.actionId)?.label ?? input.actionId} · ${object.label}`,
      at: now,
    },
    ...next.activity,
  ].slice(0, 30);
  return next;
}

export function resultForTask(
  state: ScenarioState,
  task: Task,
  text?: string,
): ConversationResult {
  const object = getObject(state, task.objectId);
  const fields = structuredClone(task.fields);
  if (text) {
    const field = fields.find((item) => item.name === "text");
    if (field) field.value = text;
  }
  const result: ConversationResult = {
    kind: fields.some((field) => field.options) ? "form" : "draft",
    title: task.label,
    actionId: task.id,
    objectId: object.id,
    fields,
    sources: [{ id: object.id, label: object.label }],
  };
  if (["rewrite", "improve"].includes(task.id))
    result.before = object.fields.text;
  if (task.id === "shortlist") {
    const other = getObject(state, "camp-bottle");
    result.kind = "comparison";
    result.columns = ["Specification", object.label, other.label];
    result.rows = Object.keys(object.fields)
      .filter((key) => key !== "shortlist")
      .map((key) => [
        key,
        object.fields[key],
        other.fields[key] ?? "Not supplied",
      ]);
  }
  if (task.id === "experiment") result.text = object.fields.measuredChange;
  return result;
}
