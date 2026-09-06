"use client";

import { ExampleProvider } from "@/components/ExampleProvider";
import { DEFAULT_SENSITIVE_SELECTORS } from "@ewjdev/anyclick-core";
import type { ContextMenuItem, ScreenshotConfig } from "@ewjdev/anyclick-react";
import { CreditCard, Lock } from "lucide-react";

export const MASK_SELECTORS = [...DEFAULT_SENSITIVE_SELECTORS, ".my-secret"];

const screenshotConfig: ScreenshotConfig = {
  sensitiveSelectors: MASK_SELECTORS,
  maskColor: "#000000",
  showPreview: true,
};

const menuItems: ContextMenuItem[] = [
  { type: "capture", label: "Capture & compare", showComment: false },
];

const highlightConfig = { containerSelectors: ["[data-stage-card]"] };

const inputClass =
  "w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500";

/**
 * A fake login/checkout card. Nothing here is real, and the adapter never
 * leaves the browser: the point is to compare the masked screenshot with the
 * raw payload.
 */
export function SensitiveMaskingDemo() {
  return (
    <ExampleProvider
      adapter="captureOnly"
      menuItems={menuItems}
      screenshotConfig={screenshotConfig}
      highlightConfig={highlightConfig}
    >
      <div
        data-stage-card
        className="mx-auto max-w-md rounded-xl bg-[#14141c] border border-white/10 p-6 space-y-5"
      >
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-400" />
          Sign in &amp; pay
        </h3>

        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">Email (not masked)</span>
          <input
            type="email"
            defaultValue="ada@example.com"
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">
            Password{" "}
            <code className="text-emerald-400">
              input[type=&quot;password&quot;]
            </code>
          </span>
          <input
            type="password"
            defaultValue="correct-horse-battery"
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="block text-gray-400 mb-1 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Card number{" "}
            <code className="text-emerald-400">
              autocomplete=&quot;cc-number&quot;
            </code>
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            defaultValue="4242 4242 4242 4242"
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className="block text-gray-400 mb-1">
            Delivery note{" "}
            <code className="text-emerald-400">
              data-sensitive=&quot;true&quot;
            </code>
          </span>
          <input
            type="text"
            data-sensitive="true"
            defaultValue="Gate code 4471, key under the mat"
            className={inputClass}
          />
        </label>

        <p className="text-xs text-gray-500">
          Internal reference{" "}
          <code className="text-emerald-400">.my-secret</code>:{" "}
          <span className="my-secret text-gray-300">sk_live_51H…9fQ2</span>
        </p>
      </div>
    </ExampleProvider>
  );
}
