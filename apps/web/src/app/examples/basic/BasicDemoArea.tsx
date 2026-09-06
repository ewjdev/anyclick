"use client";

import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider } from "@ewjdev/anyclick-react";
import { MousePointerClick } from "lucide-react";

const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export function BasicDemoArea() {
  return (
    <AnyclickProvider adapter={demoAdapter} scoped>
      <div className="mb-12 p-8 rounded-2xl bg-linear-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-violet-400" />
          Try It
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Right-click any of these elements to see the default feedback menu:
        </p>

        <div className="space-y-4">
          <button className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors">
            Primary Button
          </button>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-medium mb-1">Card Component</h3>
            <p className="text-sm text-gray-400">
              This is a sample card that you can right-click to report issues or
              request features.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
              Tag 1
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
              Tag 2
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm">
              Tag 3
            </span>
          </div>
        </div>
      </div>
    </AnyclickProvider>
  );
}
