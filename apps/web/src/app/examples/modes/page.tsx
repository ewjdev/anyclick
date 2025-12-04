"use client";

import Link from "next/link";
import { AnyclickProvider, FeedbackMenuItem } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { CodeBlock } from "@/components/CodePreview";
import {
  ArrowRight,
  Car,
  Keyboard,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const demoAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

export default function PointerModesPage() {
  const [funEnabled, setFunEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuOpen) {
        const target = event.target as Node;
        if (trackRef.current && !trackRef.current.contains(target)) {
          setMenuOpen(false);
        }
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  const openModeMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuPos({ x: event.clientX, y: event.clientY });
    setMenuOpen(true);
  };

  const toggleMode = useMemo(
    () => (enable: boolean) => {
      setFunEnabled(enable);
      setMenuOpen(false);
    },
    [],
  );

  // Prevent the global feedback menu so our local mode switcher shows
  const handleTrackContextMenuCapture = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openModeMenu(event);
  };

  const menuItems = useMemo(
    () =>
      [
        {
          type: "game_mode",
          label: "Enter game mode",
          onClick: () => toggleMode(true),
        },
        {
          type: "game_mode_exit",
          label: "Exit game mode",
          onClick: () => toggleMode(false),
        },
      ] as FeedbackMenuItem[],
    [toggleMode],
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Pointer Modes</span>
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Pointer Modes (Normal ↔ Fun)
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Drive the cursor like a go-kart inside a scoped provider. Fun mode is
          opt-in and activates only while your pointer is inside the section
          below. Use WASD or arrow keys to steer; bounce off the walls and the
          blocks inside the track.
        </p>
      </div>

      {/* Live fun-mode track */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3 text-sm text-amber-300 flex-wrap">
          <Keyboard className="w-4 h-4" />
          <span>
            Controls: WASD / Arrow keys to drive. Stay inside the track.
          </span>
          <span className="text-gray-300">
            Current mode: {funEnabled ? "Fun (Go-Kart)" : "Normal"}
          </span>
        </div>

        <AnyclickProvider
          adapter={demoAdapter}
          scoped
          theme={{ funMode: funEnabled }}
          menuItems={menuItems}
          menuPositionMode="inView"
        >
          <div
            ref={trackRef}
            onContextMenuCapture={handleTrackContextMenuCapture}
            className="relative p-6 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-semibold">Fun Mode Track</h2>
              </div>
              <span className="text-xs text-gray-400">
                Right-click here to choose mode. Pointer switches to go-kart
                only after selecting game mode.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-300">
              {[
                "Obstacle A",
                "Obstacle B",
                "Checkpoint",
                "Banner",
                "Card",
                "Widget",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur-sm shadow-sm"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Try weaving between the blocks—collisions bounce the kart.
            </div>
          </div>
        </AnyclickProvider>
      </div>

      {/* How it works */}
      <div className="mb-12 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-3">How it works</h2>
          <ul className="space-y-2 text-gray-300">
            <li>
              <span className="text-pink-300">1.</span> Add{" "}
              <code className="text-cyan-400">FunModeBridge</code> inside your{" "}
              <code className="text-cyan-400">PointerProvider</code> (already
              done in this docs site).
            </li>
            <li>
              <span className="text-pink-300">2.</span> Mark a scoped{" "}
              <code className="text-cyan-400">AnyclickProvider</code> with{" "}
              <code className="text-cyan-400">
                theme={`{ funMode: userSelected }`}
              </code>
            </li>
            <li>
              <span className="text-pink-300">3.</span> The bridge switches the
              pointer to{" "}
              <code className="text-cyan-400">mode=&quot;fun&quot;</code> only
              while the cursor is inside that scoped area.
            </li>
          </ul>
        </div>

        <CodeBlock filename="app/providers.tsx">{`'use client';

import { PointerProvider } from '@ewjdev/anyclick-pointer';
import { FunModeBridge } from '@ewjdev/anyclick-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PointerProvider>
      <FunModeBridge />
      {children}
    </PointerProvider>
  );
}`}</CodeBlock>

        <CodeBlock filename="app/examples/modes/page.tsx">{`import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({ endpoint: '/api/feedback' });

export default function ModesExample() {
  return (
    <AnyclickProvider adapter={adapter} scoped theme={{ funMode: true }}>
      <div className="p-6 rounded-2xl border border-pink-500/30 bg-pink-500/5">
        Drive me with WASD/arrow keys. The track is this scoped provider,
        and collisions bounce off siblings/children.
      </div>
    </AnyclickProvider>
  );
}
`}</CodeBlock>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
        <h3 className="font-semibold mb-2">
          Want to switch modes programmatically?
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          You can call{" "}
          <code className="text-cyan-400">setConfig({`{ mode: "fun" }`})</code>{" "}
          from <code className="text-cyan-400">usePointer()</code> to toggle fun
          mode manually, or set
          <code className="text-cyan-400">mode=&quot;normal&quot;</code> to
          revert.
        </p>
        <Link
          href="/examples/custom-pointer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          Explore Pointer Theming
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
