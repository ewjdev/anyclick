import { useIntentStore } from "./store";

export function AcDebugPanel() {
  const contexts = useIntentStore((s) => s.contexts);
  const intents = useIntentStore((s) => s.intents);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: 16,
        borderRadius: 8,
        fontSize: 12,
        maxWidth: 400,
        maxHeight: 300,
        overflow: "auto",
        zIndex: 9999,
      }}
    >
      <h4 style={{ margin: "0 0 8px" }}>Ac Registry</h4>
      <div>
        <strong>Contexts ({contexts.size}):</strong>
        <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
          {Array.from(contexts.values()).map((ctx) => (
            <li key={ctx.id}>
              {ctx.name ?? ctx.id} (depth: {ctx.depth}, actions:{" "}
              {ctx.actions.length})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Intents ({intents.size}):</strong>
        <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
          {Array.from(intents.values()).map((intent) => (
            <li key={intent.id}>
              {intent.intent.split(".").slice(-4).join(".")}
              {intent.optOut && " (opt-out)"}
            </li>
          ))}
          {/* {intents.size > 10 && <li>...and {intents.size - 10} more</li>} */}
        </ul>
      </div>
    </div>
  );
}

export default AcDebugPanel;
