"use client";

import { AnyclickProviderWrapper } from "@/components/AnyclickProviderWrapper";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Conditionally wraps children with AnyclickProviderWrapper based on the current route.
 *
 * Routes under /examples and /docs are excluded so each example page can mount
 * its own provider with custom configuration. Marketing/home pages get the
 * chrome provider for the global experience.
 *
 * Part of #78 / PR 1 (#79): Remove global provider from examples/docs.
 */
export function ConditionalAnyclickWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const shouldExcludeGlobalProvider =
    pathname === "/" ||
    pathname.startsWith("/examples") ||
    pathname.startsWith("/docs");

  if (shouldExcludeGlobalProvider) {
    return <>{children}</>;
  }

  return <AnyclickProviderWrapper>{children}</AnyclickProviderWrapper>;
}
