"use client";

import { captureOnlyAdapter, feedbackAdapter } from "@/lib/adapters";
import type { ReactNode } from "react";
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
 * non-serializable crosses the server/client boundary. One page, one provider.
 */
export function ExampleProvider({
  adapter = "feedback",
  children,
  ...props
}: ExampleProviderProps) {
  return (
    <AnyclickProvider
      adapter={adapter === "captureOnly" ? captureOnlyAdapter : feedbackAdapter}
      scoped
      cooldownMs={0}
      {...props}
    >
      {children}
    </AnyclickProvider>
  );
}
