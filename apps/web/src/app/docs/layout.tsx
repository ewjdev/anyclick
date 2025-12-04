"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MousePointerClick,
  BookOpen,
  Rocket,
  Box,
  Component,
  Plug,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Introduction", href: "/docs", icon: BookOpen },
  { name: "Getting Started", href: "/docs/getting-started", icon: Rocket },
  { name: "@ewjdev/anyclick-core", href: "/docs/core", icon: Box },
  { name: "@ewjdev/anyclick-react", href: "/docs/react", icon: Component },
  { name: "Adapters", href: "/docs/adapters", icon: Plug },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0a0f] to-[#1a0a2e]" />
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#0a0a0f]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">anyclick</span>
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">docs</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/examples"
                className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Examples
              </Link>
              <a
                href="https://github.com/ewjdev/anyclick"
                className="text-sm text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/5 pb-8 overflow-y-auto lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:bg-transparent lg:backdrop-blur-none lg:border-none transition-transform duration-200",
              mobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0",
            )}
          >
            <nav className="px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive
                          ? "text-cyan-400"
                          : "text-gray-500 group-hover:text-gray-400",
                      )}
                    />
                    {item.name}
                    {isActive && (
                      <ChevronRight className="w-3 h-3 ml-auto text-cyan-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Overlay for mobile */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0 py-8 lg:py-12 lg:pl-8">
            <div className="max-w-3xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
