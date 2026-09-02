"use client";

import { useExampleStage } from "@/components/ExampleStage";
import { captureOnlyAdapter, feedbackAdapter } from "@/lib/adapters";
import type { ReactNode } from "react";
import { useCallback } from "react";
import type { AnyclickPayload } from "@ewjdev/anyclick-core";
import type { AnyclickProviderProps } from "@ewjdev/anyclick-react";
import { AnyclickProvider } from "@ewjdev/anyclick-react";

export interface ExampleProviderProps
  extends Omit<AnyclickProviderProps, "adapter" | "children" | "scoped"> {
  /** Which shared adapter to use. "feedback" posts to /api/feedback. */
  adapter?: "feedback" | "captureOnly";
  children: ReactNode;
}

/**
 * A scoped AnyclickProvider for example and docs pages.
 *
 * Server pages can mount this directly: it owns the adapter object so nothing
 * non-serializable crosses the server/client boundary. Inside an ExampleStage
 * it reports every submission (success or failure) to the Stage's reveal.
 * One page, one provider.
 */
export function ExampleProvider({
  adapter = "feedback",
  children,
  onSubmitSuccess,
  onSubmitError,
  ...props
}: ExampleProviderProps) {
  const stage = useExampleStage();

  const handleSuccess = useCallback(
    (payload: AnyclickPayload) => {
      stage?.onCapture(payload, "sent");
      onSubmitSuccess?.(payload);
    },
    [stage, onSubmitSuccess],
  );

  const handleError = useCallback(
    (error: Error, payload: AnyclickPayload) => {
      stage?.onCapture(payload, "error");
      onSubmitError?.(error, payload);
    },
    [stage, onSubmitError],
  );

  return (
    <AnyclickProvider
      adapter={adapter === "captureOnly" ? captureOnlyAdapter : feedbackAdapter}
      scoped
      cooldownMs={0}
      onSubmitSuccess={handleSuccess}
      onSubmitError={handleError}
      {...props}
    >
      {children}
    </AnyclickProvider>
  );
}
