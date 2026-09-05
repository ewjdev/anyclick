"use client";

import type { Preview, Receipt } from "@/lib/showcase/actions";
import {
  type SampleObject,
  type ScenarioId,
  type ScenarioState,
  type Task,
  initialScenario,
  resultForTask,
  scenarioIds,
  scenarios,
} from "@/lib/showcase/domain";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { captureScreenshot } from "@ewjdev/anyclick-core";
import {
  type ActionRequest,
  AnyclickProvider,
  type CompletionItem,
  Conversation,
  type ConversationContext,
  type ConversationResult,
  ConversationResultView,
  type SuggestionProvider,
} from "@ewjdev/anyclick-react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Code2,
  ExternalLink,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  RotateCcw,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import "./showcase.css";

interface Workspace {
  workspaceId: string;
  expiresAt: number;
  states: ScenarioState[];
  capabilities: { ai: boolean; github: boolean; githubRepo: string | null };
}
async function api<T>(
  url: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
    signal,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "The service could not complete this request. Try again.",
    );
  return result;
}
const icons = {
  software: Code2,
  commerce: ShoppingBag,
  healthcare: CalendarDays,
  social: Send,
};

export function Showcase() {
  const [industry, setIndustry] = useState<ScenarioId>("software");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState("issue");
  const [contexts, setContexts] = useState<
    Record<ScenarioId, ConversationContext[]>
  >({ software: [], commerce: [], healthcare: [], social: [] });
  const [threadIds, setThreadIds] = useState<Record<ScenarioId, string>>({
    software: "main",
    commerce: "main",
    healthcare: "main",
    social: "main",
  });
  const [pendingObject, setPendingObject] = useState<SampleObject | null>(null);
  const [initialInput, setInitialInput] = useState("");
  const [panel, setPanel] = useState<"action" | "chat" | "recipe">("action");
  const [draftResult, setDraftResult] = useState<ConversationResult | null>(
    null,
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [screenshot, setScreenshot] = useState<string>();
  const [captureError, setCaptureError] = useState("");
  const [executionId, setExecutionId] = useState("");
  const [mobile, setMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const objectNodes = useRef(new Map<string, HTMLElement>());
  const scene =
    workspace?.states.find((state) => state.id === industry) ??
    initialScenario(industry);
  const definition = scenarios[industry];
  const task =
    definition.tasks.find((item) => item.id === taskId) ?? definition.tasks[0];
  const context = contexts[industry];
  const selectedId = context.at(-1)?.id ?? task.objectId;

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWorkspace(await api<Workspace>("/api/showcase/workspace"));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    const query = matchMedia("(max-width: 900px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (mobile && sheetOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [mobile, sheetOpen]);
  useEffect(() => {
    if (!workspace) return;
    try {
      const id = sessionStorage.getItem(
        `showcase-execution:${workspace.workspaceId}:${industry}`,
      );
      if (id) {
        setExecutionId(id);
        api<Receipt>(`/api/showcase/execution?id=${encodeURIComponent(id)}`)
          .then(setReceipt)
          .catch(() => {});
      } else {
        setReceipt(null);
        setExecutionId("");
      }
    } catch {
      /* Workspace still works without browser storage. */
    }
  }, [workspace?.workspaceId, industry]);

  function track(
    event:
      | "scenario_open"
      | "action_start"
      | "action_complete"
      | "recipe_open"
      | "chat_open",
    scenario = industry,
  ) {
    if (workspace)
      void api("/api/showcase/events", { scenario, event }).catch(() => {});
  }
  async function freshWorkspace() {
    setLoading(true);
    try {
      const next = await api<Workspace>("/api/showcase/workspace", {
        reset: true,
      });
      setWorkspace(next);
      setContexts({ software: [], commerce: [], healthcare: [], social: [] });
      setPreview(null);
      setReceipt(null);
      setDraftResult(null);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }
  function setContext(next: ConversationContext[]) {
    setContexts((current) => ({ ...current, [industry]: next.slice(0, 6) }));
  }
  function reference(object: SampleObject): ConversationContext {
    return {
      id: object.id,
      label: object.label,
      description: object.description,
      revision: scene.revision,
    };
  }
  function select(object: SampleObject) {
    if (
      context.length &&
      !context.some((item) => item.id === object.id) &&
      panel === "chat"
    )
      setPendingObject(object);
    else setContext([reference(object)]);
  }
  function startTask(next: Task) {
    track("action_start");
    setDraftResult(null);
    setTaskId(next.id);
    setPanel("action");
    setPreview(null);
    setCaptureError("");
    setScreenshot(undefined);
    setContext([
      reference(scene.objects.find((object) => object.id === next.objectId)!),
    ]);
    setSheetOpen(true);
  }
  function switchIndustry(next: ScenarioId) {
    track("scenario_open", next);
    setDraftResult(null);
    setIndustry(next);
    setTaskId(scenarios[next].tasks[0].id);
    setPanel("action");
    setPreview(null);
    setInitialInput("");
    setScreenshot(undefined);
    setCaptureError("");
    setPendingObject(null);
  }
  function ask() {
    track("chat_open");
    const related: Record<string, string[]> = {
      shortlist: ["camp-bottle"],
      reply: ["post-18"],
      checklist: ["checkout"],
      review: ["appointment-204"],
    };
    const objectIds = [task.objectId, ...(related[task.id] ?? [])];
    setContext(
      objectIds.map((id) =>
        reference(scene.objects.find((object) => object.id === id)!),
      ),
    );
    setInitialInput(task.prompt);
    setPanel("chat");
    setSheetOpen(true);
  }

  const prepare = useCallback(
    async (request: ActionRequest) => {
      setError("");
      setPreview(null);
      const next = await api<Preview>("/api/showcase/preview", {
        scenario: industry,
        ...request,
        ...(request.actionId === "issue" && screenshot ? { screenshot } : {}),
      });
      setPreview(next);
      setExecutionId(crypto.randomUUID());
      setPanel("action");
      setSheetOpen(true);
    },
    [industry, screenshot],
  );

  async function execute() {
    if (!preview || !workspace || busy) return;
    setBusy(true);
    setError("");
    try {
      try {
        sessionStorage.setItem(
          `showcase-execution:${workspace.workspaceId}:${industry}`,
          executionId,
        );
      } catch {
        /* Saving does not require local storage. */
      }
      const result = await api<Receipt>("/api/showcase/execute", {
        previewId: preview.id,
        idempotencyKey: executionId,
      });
      setReceipt(result);
      setExecutionId(result.id);
      try {
        sessionStorage.setItem(
          `showcase-execution:${workspace.workspaceId}:${industry}`,
          result.id,
        );
      } catch {}
      if (result.status === "succeeded") {
        track("action_complete");
        setPreview(null);
        await reload();
      }
    } catch (cause) {
      setError(
        `${(cause as Error).message} If the submission was interrupted, check its status before retrying.`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function checkExecution() {
    setBusy(true);
    setError("");
    try {
      const result = await api<Receipt>(
        `/api/showcase/execution?id=${encodeURIComponent(executionId)}`,
      );
      setReceipt(result);
      if (result.status === "succeeded") {
        setPreview(null);
        await reload();
      }
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function capture() {
    const target = objectNodes.current.get(task.objectId);
    if (!target) return;
    setBusy(true);
    setCaptureError("");
    try {
      const result = await captureScreenshot(target, target, "element", {
        maxSizeBytes: 500_000,
      });
      if (!result.capture)
        throw new Error(
          result.error?.message ?? "Screenshot could not be captured.",
        );
      setScreenshot(result.capture.dataUrl);
    } catch (cause) {
      setCaptureError(
        `${(cause as Error).message} You can review and submit a text-only issue.`,
      );
    } finally {
      setBusy(false);
    }
  }

  const commands = useMemo<CompletionItem[]>(
    () =>
      definition.tasks.map((item) => ({
        id: item.id,
        kind: "command",
        label: item.label,
        value: item.prompt,
        description: item.description,
      })),
    [definition],
  );
  const objects = useMemo(
    () =>
      scene.objects.map((object) => ({
        id: object.id,
        label: object.label,
        revision: scene.revision,
        description: object.description,
      })),
    [scene.revision, industry, workspace],
  );
  const suggestionCache = useRef(new Map<string, CompletionItem[]>());
  const suggestions = useCallback<SuggestionProvider>(
    async (request) => {
      const cacheKey = JSON.stringify([
        industry,
        scene.revision,
        request.input,
        request.context,
      ]);
      const cached = suggestionCache.current.get(cacheKey);
      if (cached) return cached;
      const result = await api<{ items: CompletionItem[] }>(
        "/api/showcase/suggestions",
        { scenario: industry, input: request.input, context: request.context },
        request.signal,
      );
      if (suggestionCache.current.size > 40) suggestionCache.current.clear();
      suggestionCache.current.set(cacheKey, result.items);
      return result.items;
    },
    [industry, scene.revision],
  );

  const panelContent = (
    <>
      <div
        className="showcase-panel-tabs"
        role="tablist"
        aria-label="Workspace tools"
      >
        {(["action", "chat", "recipe"] as const).map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={panel === item}
            key={item}
            onClick={() => {
              setPanel(item);
              if (item === "recipe") track("recipe_open");
            }}
          >
            {item === "action"
              ? "Action"
              : item === "chat"
                ? "Conversation"
                : "Build this"}
          </button>
        ))}
      </div>
      {panel === "chat" ? (
        <>
          {pendingObject && (
            <div className="showcase-notice">
              <p>Use {pendingObject.label} in this conversation?</p>
              <button
                onClick={() => {
                  setContext([...context, reference(pendingObject)]);
                  setPendingObject(null);
                }}
              >
                Add to conversation
              </button>
              <button
                onClick={() => {
                  setThreadIds((current) => ({
                    ...current,
                    [industry]: crypto.randomUUID(),
                  }));
                  setContext([reference(pendingObject)]);
                  setPendingObject(null);
                  setInitialInput("");
                }}
              >
                Start new conversation
              </button>
            </div>
          )}
          {!workspace?.capabilities.ai && (
            <p className="showcase-notice">
              Live AI is not connected. Action forms remain available when the
              hosted workspace is connected.
            </p>
          )}
          <Conversation
            conversationId={`${industry}:${workspace?.workspaceId ?? "preview"}-${threadIds[industry]}`}
            endpoint="/api/showcase/chat"
            historyEndpoint={workspace ? "/api/showcase/history" : undefined}
            context={context}
            onContextChange={setContext}
            commands={commands}
            objects={objects}
            suggestionProvider={
              workspace?.capabilities.ai ? suggestions : undefined
            }
            actionDispatcher={prepare}
            initialInput={initialInput}
            disabled={!workspace?.capabilities.ai}
            title="A conversation with context"
            presentation={mobile ? "sheet" : "docked"}
          />
        </>
      ) : panel === "recipe" ? (
        <Recipe industry={industry} task={task} />
      ) : (
        <div className="showcase-action-panel">
          <h3>{preview ? "Review your action" : task.label}</h3>
          <p>{task.description}</p>
          {receipt && (
            <section
              className={`showcase-receipt receipt-${receipt.status}`}
              aria-label="Action result"
            >
              <strong>
                {receipt.status === "succeeded"
                  ? "Saved"
                  : receipt.status === "outcome_unknown"
                    ? "Checking submission"
                    : receipt.status === "failed"
                      ? "Action not completed"
                      : "In progress"}
              </strong>
              <p>{receipt.message}</p>
              {receipt.url && (
                <a href={receipt.url} target="_blank" rel="noopener noreferrer">
                  Open GitHub issue <ExternalLink size={14} />
                </a>
              )}
              {receipt.status !== "succeeded" && (
                <button disabled={busy} onClick={() => void checkExecution()}>
                  Check submission status
                </button>
              )}
              {receipt.status === "succeeded" && (
                <div className="showcase-followups">
                  {receipt.undoable && receipt.revision === scene.revision && (
                    <button
                      onClick={() =>
                        void prepare({
                          actionId: "undo",
                          objectId: receipt.objectId,
                          values: { executionId: receipt.id },
                        }).catch((cause) => setError(cause.message))
                      }
                    >
                      <RotateCcw size={14} /> Undo change
                    </button>
                  )}
                  {receipt.actionId === "replacement" && (
                    <button
                      onClick={() =>
                        void prepare({
                          actionId: "cancel",
                          objectId: receipt.objectId,
                          values: {},
                        }).catch((cause) => setError(cause.message))
                      }
                    >
                      Cancel pending replacement
                    </button>
                  )}
                  {receipt.actionId === "reply" && (
                    <ConversationResultView
                      result={{
                        kind: "draft",
                        title: "Edit your reply",
                        actionId: "edit-reply",
                        objectId: receipt.objectId,
                        fields: [
                          {
                            name: "text",
                            label: "Reply text",
                            value:
                              scene.objects.find(
                                (object) => object.id === receipt.objectId,
                              )?.fields.reply ?? "",
                          },
                        ],
                      }}
                      onAction={prepare}
                    />
                  )}
                  {["reply", "edit-reply"].includes(receipt.actionId) && (
                    <button
                      onClick={() =>
                        void prepare({
                          actionId: "remove-reply",
                          objectId: receipt.objectId,
                          values: {},
                        }).catch((cause) => setError(cause.message))
                      }
                    >
                      Remove sample reply
                    </button>
                  )}
                  {receipt.actionId === "review" && (
                    <ConversationResultView
                      result={{
                        kind: "draft",
                        title: "Add a staff note",
                        actionId: "note",
                        objectId: receipt.objectId,
                        fields: [
                          { name: "text", label: "Additional note", value: "" },
                        ],
                      }}
                      onAction={prepare}
                    />
                  )}
                  {["checklist", "improve"].includes(receipt.actionId) && (
                    <button
                      onClick={() =>
                        void prepare({
                          actionId: "issue",
                          objectId: "checkout",
                          values: {
                            title: "Checkout interaction follow-up",
                            text:
                              scene.objects.find(
                                (object) => object.id === receipt.objectId,
                              )?.fields.checklist ??
                              scene.objects.find(
                                (object) => object.id === receipt.objectId,
                              )?.fields.text ??
                              "Checkout follow-up",
                          },
                        }).catch((cause) => setError(cause.message))
                      }
                    >
                      Create GitHub issue from this
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setInitialInput("");
                      setPanel("chat");
                      setSheetOpen(true);
                    }}
                  >
                    Continue in chat
                  </button>
                  <button onClick={() => setPanel("recipe")}>
                    Build this in your app
                  </button>
                </div>
              )}
            </section>
          )}
          {preview ? (
            <>
              <p className="showcase-destination">
                Destination <strong>{preview.destination}</strong>
              </p>
              <dl>
                {Object.entries(preview.input.values).map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {preview.input.screenshot && (
                <img
                  className="showcase-capture"
                  src={preview.input.screenshot}
                  alt="Selected sample element that will be attached"
                />
              )}
              {preview.input.actionId === "issue" && (
                <p className="showcase-notice">
                  This creates a public issue in the demo repository. The issue
                  and its screenshot remain after your sample workspace expires.
                </p>
              )}
              <div className="showcase-button-row">
                <button
                  className="showcase-primary"
                  disabled={
                    busy ||
                    (receipt?.id === executionId &&
                      ["running", "outcome_unknown", "succeeded"].includes(
                        receipt.status,
                      ))
                  }
                  onClick={() => void execute()}
                >
                  {busy ? "Saving…" : "Confirm and save"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    setDraftResult({
                      kind: "draft",
                      title: preview.title,
                      actionId: preview.input.actionId,
                      objectId: preview.input.objectId,
                      fields: Object.entries(preview.input.values).map(
                        ([name, value]) => ({
                          name,
                          label: name === "text" ? "Draft text" : name,
                          value,
                        }),
                      ),
                    });
                    setPreview(null);
                  }}
                >
                  Edit draft
                </button>
              </div>
            </>
          ) : (
            <>
              <button className="showcase-ask" onClick={ask}>
                <MessageSquare size={16} /> Draft with live AI{" "}
                <ArrowRight size={16} />
              </button>
              <p className="showcase-form-caption">
                Or edit the action fields yourself
              </p>
              <ConversationResultView
                key={
                  draftResult
                    ? JSON.stringify(draftResult)
                    : `${workspace?.workspaceId}-${industry}-${task.id}`
                }
                draftKey={
                  draftResult
                    ? undefined
                    : `${workspace?.workspaceId ?? "preview"}:${industry}:${task.id}`
                }
                result={draftResult ?? resultForTask(scene, task)}
                onAction={
                  workspace
                    ? prepare
                    : async () => {
                        throw new Error(
                          "Connect the hosted workspace before saving. Your draft stays here.",
                        );
                      }
                }
              />
              {task.id === "issue" && (
                <div className="showcase-screenshot-controls">
                  <button disabled={busy} onClick={() => void capture()}>
                    {screenshot
                      ? "Recapture selected element"
                      : "Attach selected element screenshot"}
                  </button>
                  {screenshot && (
                    <>
                      <img
                        className="showcase-capture"
                        src={screenshot}
                        alt="Selected element capture preview"
                      />
                      <button onClick={() => setScreenshot(undefined)}>
                        Remove screenshot
                      </button>
                    </>
                  )}
                  {captureError && <p role="alert">{captureError}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <section
      id="showcase"
      className="showcase"
      style={{ "--showcase-accent": definition.accent } as CSSProperties}
      aria-label="Interactive AnyClick workbench"
    >
      <div className="showcase-intro">
        <div>
          <h2>One click. A better way forward.</h2>
          <p>
            Choose an application. Select something specific. See what happens
            next.
          </p>
        </div>
        <span className="showcase-session">
          <span aria-hidden className={workspace ? "connected-dot" : ""} />
          {loading
            ? "Connecting workspace…"
            : workspace
              ? "Sample data · Hosted workspace"
              : "Sample data · Preview only"}
        </span>
      </div>
      <div className="showcase-industries" role="tablist" aria-label="Industry">
        {scenarioIds.map((id) => {
          const Icon = icons[id];
          return (
            <button
              role="tab"
              aria-selected={industry === id}
              aria-controls="showcase-application"
              id={`industry-${id}`}
              key={id}
              onClick={() => switchIndustry(id)}
            >
              <Icon size={18} />
              {scenarios[id].title}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="showcase-error" role="alert">
          <p>{error}</p>
          {error.includes("expired") ? (
            <button onClick={() => void freshWorkspace()}>
              Start fresh workspace
            </button>
          ) : (
            <button onClick={() => void reload()}>Reconnect workspace</button>
          )}
          {executionId && (
            <button onClick={() => void checkExecution()}>
              Check submission status
            </button>
          )}
        </div>
      )}
      <div className="showcase-workbench">
        <div
          className="showcase-app"
          id="showcase-application"
          role="tabpanel"
          aria-labelledby={`industry-${industry}`}
        >
          <header className="showcase-app-header">
            <div>
              <h3>{definition.app}</h3>
              <p>{definition.description}</p>
            </div>
            <span>Sample application</span>
          </header>
          <div className="showcase-task-list" aria-label="Try a workflow">
            {definition.tasks.map((item) => (
              <button
                key={item.id}
                aria-pressed={task.id === item.id}
                onClick={() => startTask(item)}
              >
                {item.label}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <p className="showcase-selection-hint">
            <MousePointer2 size={14} /> Right-click a record, or use its actions
            button.
          </p>
          <div className={`showcase-objects showcase-${industry}`}>
            {scene.objects.map((object) => (
              <AnyclickProvider
                key={object.id}
                scoped
                adapter={{
                  submitAnyclick: async () => {
                    throw new Error("Choose an explicit showcase action.");
                  },
                }}
                menuItems={[
                  ...definition.tasks
                    .filter((item) => item.objectId === object.id)
                    .map((item) => ({
                      label: item.label,
                      type: `showcase-${item.id}`,
                      onClick: ({ closeMenu }: { closeMenu: () => void }) => {
                        closeMenu();
                        startTask(item);
                        return false;
                      },
                    })),
                  {
                    label: "Ask about this object",
                    type: "showcase-ask",
                    onClick: ({ closeMenu }: { closeMenu: () => void }) => {
                      closeMenu();
                      select(object);
                      setPanel("chat");
                      setSheetOpen(true);
                      return false;
                    },
                  },
                ]}
              >
                <article
                  ref={(node) => {
                    if (node) objectNodes.current.set(object.id, node);
                    else objectNodes.current.delete(object.id);
                  }}
                  data-showcase-object={object.id}
                  className={`showcase-object ${selectedId === object.id ? "is-selected" : ""}`}
                  onContextMenuCapture={() => {
                    if (panel !== "chat") setContext([reference(object)]);
                  }}
                >
                  <header>
                    <div>
                      <span className="showcase-object-kind">
                        {object.kind}
                      </span>
                      <h4>{object.label}</h4>
                      <p>{object.description}</p>
                    </div>
                    <button
                      aria-label={`Actions for ${object.label}`}
                      onClick={() => {
                        select(object);
                        const next = definition.tasks.find(
                          (item) => item.objectId === object.id,
                        );
                        if (next && panel !== "chat") startTask(next);
                        else {
                          setPanel("chat");
                          setSheetOpen(true);
                        }
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </header>
                  {object.kind === "product" && (
                    <div className="showcase-product-art" aria-hidden>
                      <div
                        className={`showcase-bottle ${object.id === "camp-bottle" ? "camp" : ""}`}
                      >
                        <span>FIELDWORK</span>
                      </div>
                    </div>
                  )}
                  {object.kind === "button" && (
                    <div className="showcase-checkout">
                      <div>
                        <span>Trail Bottle × 2</span>
                        <strong>$64.00</strong>
                      </div>
                      <div>
                        <span>Shipping & tax</span>
                        <strong>$20.00</strong>
                      </div>
                      <button onClick={() => startTask(definition.tasks[0])}>
                        Complete order · $84.00
                      </button>
                      <small>Sample error: shipping address rejected</small>
                    </div>
                  )}
                  <dl>
                    {Object.entries(object.fields)
                      .filter(
                        ([name]) =>
                          !(
                            object.kind === "button" &&
                            ["total", "expected", "observed"].includes(name)
                          ),
                      )
                      .map(([name, value]) => (
                        <div key={name}>
                          <dt>{name.replace(/([A-Z])/g, " $1")}</dt>
                          <dd>{value || "Not entered"}</dd>
                        </div>
                      ))}
                  </dl>
                </article>
              </AnyclickProvider>
            ))}
          </div>
          <section
            className="showcase-activity"
            aria-label="Workspace activity"
          >
            <h4>Activity</h4>
            {scene.activity.length ? (
              scene.activity.map((item) => (
                <p key={item.id}>
                  <Check size={14} />
                  {item.label}
                </p>
              ))
            ) : (
              <p>Your completed actions will appear here.</p>
            )}
          </section>
        </div>
        {!mobile && (
          <aside
            data-anyclick-ui
            className="showcase-panel"
            aria-label="Action and conversation panel"
          >
            {panelContent}
          </aside>
        )}
      </div>
      {mobile && (
        <>
          <button
            className="showcase-mobile-open"
            onClick={() => setSheetOpen(true)}
          >
            <MessageSquare size={18} /> Open actions and conversation
          </button>
          <dialog
            data-anyclick-ui
            ref={dialog}
            className="showcase-mobile-sheet"
            aria-label="Actions and conversation"
            onClose={() => setSheetOpen(false)}
          >
            <button
              className="showcase-sheet-close"
              onClick={() => setSheetOpen(false)}
            >
              <X size={18} /> Return to application
            </button>
            {panelContent}
          </dialog>
        </>
      )}
      <footer className="showcase-footer">
        <p>
          {workspace
            ? "Changes stay in your private sample workspace for 24 hours."
            : "Explore the sample objects while the hosted service is unavailable."}
        </p>
        <Link href="/docs/showcase">
          How this works <ArrowRight size={15} />
        </Link>
      </footer>
    </section>
  );
}

function Recipe({ industry, task }: { industry: ScenarioId; task: Task }) {
  const code = `import { Conversation } from '@ewjdev/anyclick-react';\n\n<Conversation\n  conversationId="${industry}:main"\n  endpoint="/api/showcase/chat"\n  historyEndpoint="/api/showcase/history"\n  context={selectedObjects}\n  onContextChange={setSelectedObjects}\n  actionDispatcher={async (action) => {\n    const preview = await fetch('/api/showcase/preview', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ scenario: '${industry}', ...action })\n    }).then(response => response.json());\n    setPreview(preview); // Review before execution\n  }}\n/>`;
  const [notice, setNotice] = useState("");
  return (
    <div className="showcase-recipe">
      <h3>Build “{task.label}”</h3>
      <p>
        The page supplies object context. AnyClick handles the conversation and
        editable result. Your server validates and executes the action.
      </p>
      <pre>
        <code>{code}</code>
      </pre>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setNotice("Recipe copied.");
          } catch {
            setNotice("Select the code above to copy it.");
          }
        }}
      >
        Copy recipe
      </button>
      {notice && <p role="status">{notice}</p>}
      <Link href="/docs/showcase">
        Full server contract and setup <ArrowRight size={16} />
      </Link>
      <Link href="/examples/custom-menu">Advanced menu configuration</Link>
    </div>
  );
}
