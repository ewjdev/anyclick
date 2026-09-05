"use client";
import { useEffect, useState } from "react";
import type { ActionRequest, ConversationResult } from "./types";

export function ConversationResultView({
  result,
  onAction,
  draftKey,
}: {
  result: ConversationResult;
  onAction?: (request: ActionRequest) => Promise<void>;
  draftKey?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults = Object.fromEntries(
      (result.fields ?? []).map((field) => [field.name, field.value]),
    );
    try {
      if (draftKey) {
        const saved = JSON.parse(
          sessionStorage.getItem(`anyclick-result:${draftKey}`) ?? "null",
        );
        if (saved && typeof saved === "object")
          for (const name of Object.keys(defaults))
            if (typeof saved[name] === "string") defaults[name] = saved[name];
      }
    } catch {
      /* Keep supplied defaults. */
    }
    return defaults;
  });
  useEffect(() => {
    if (draftKey)
      try {
        sessionStorage.setItem(
          `anyclick-result:${draftKey}`,
          JSON.stringify(values),
        );
      } catch {
        /* Editing works without storage. */
      }
  }, [draftKey, values]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="ac-result" aria-label={result.title}>
      <h4>{result.title}</h4>
      {result.before && (
        <details>
          <summary>Before</summary>
          <p>{result.before}</p>
        </details>
      )}
      {result.text && <p style={{ whiteSpace: "pre-wrap" }}>{result.text}</p>}
      {result.columns && (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                {result.columns.map((column, i) => (
                  <th key={i}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows?.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.sources?.length ? (
        <small>
          Based on: {result.sources.map((source) => source.label).join(" · ")}
        </small>
      ) : null}
      {result.fields?.map((field) => (
        <label key={field.name}>
          {field.label}
          {field.options ? (
            <select
              value={values[field.name] ?? ""}
              onChange={(event) =>
                setValues({ ...values, [field.name]: event.target.value })
              }
            >
              {field.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <textarea
              rows={field.name === "text" ? 4 : 2}
              value={values[field.name] ?? ""}
              onChange={(event) =>
                setValues({ ...values, [field.name]: event.target.value })
              }
            />
          )}
        </label>
      ))}
      {result.actionId && onAction && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onAction({
                actionId: result.actionId!,
                objectId: result.objectId!,
                values,
              });
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not prepare this action. Try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Preparing…" : "Review action"}
        </button>
      )}
      {result.url && /^https:\/\//.test(result.url) && (
        <a href={result.url} target="_blank" rel="noopener noreferrer">
          Open result
        </a>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
