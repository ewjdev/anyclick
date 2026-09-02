"use client";

import { DEFAULT_SENSITIVE_SELECTORS } from "@ewjdev/anyclick-core";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Shield,
} from "lucide-react";

const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function SensitiveMaskingDemoArea() {
  return (
    <AnyclickProvider
      adapter={demoAdapter}
      scoped
      screenshotConfig={{
        enabled: true,
        sensitiveSelectors: [
          ...DEFAULT_SENSITIVE_SELECTORS,
          "[data-sensitive]",
          "[data-mask]",
          ".sensitive",
          ".private",
        ],
        maskColor: "#1a1a1a",
      }}
    >
      <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-emerald-500/10 to-violet-500/10 border border-emerald-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Try It - Right-click to Capture Screenshots
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click any element below and submit feedback with screenshots.
          Notice how sensitive fields are automatically masked in the preview:
        </p>

        {/* Login Form */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-400" />
            Login Form
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                This password field will be masked in screenshots
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10 mt-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Payment Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Card Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Credit card inputs are automatically masked
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Sensitive Elements */}
        <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10 mt-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400" />
            Custom Sensitive Elements
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Social Security Number
              </label>
              <input
                type="text"
                data-sensitive="true"
                placeholder="XXX-XX-XXXX"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with{" "}
                <code className="text-amber-400">data-sensitive="true"</code>{" "}
                are masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Private Notes
              </label>
              <textarea
                data-mask="true"
                placeholder="Enter private information here..."
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with{" "}
                <code className="text-amber-400">data-mask="true"</code> are
                masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Secret API Key
              </label>
              <input
                type="text"
                className="sensitive w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="sk_live_..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with <code className="text-amber-400">.sensitive</code>{" "}
                class are masked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Internal ID
              </label>
              <input
                type="text"
                className="private w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="internal-12345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Elements with <code className="text-amber-400">.private</code>{" "}
                class are masked
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-sm text-emerald-400 flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              All sensitive elements above are automatically detected and masked
              in screenshots. Try right-clicking any element and submitting
              feedback to see the masked preview!
            </span>
          </p>
        </div>
      </div>
    </AnyclickProvider>
  );
}
