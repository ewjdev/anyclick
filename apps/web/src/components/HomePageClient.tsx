"use client";

/**
 * HomePageClient - Client-side wrapper for homepage with intent tracking.
 *
 * @module components/HomePageClient
 */
import { AnyclickLogo } from "@/components/AnyclickLogo";
import { HeroCodeBlock } from "@/components/CodePreview";
import FeaturesSection from "@/components/FeaturesSection";
import { ImmersiveWorkstreamShowcase } from "@/components/ImmersiveWorkstreamShowcase";
import { HomepageTracking } from "@/components/IntentProvider";
import PackagesSection from "@/components/PackagesSection";
import QuickStartSection from "@/components/QuickStartSection";
import RoadmapSummary from "@/components/RoadmapSummary";
import { Ac } from "@/components/tracking";
import { HomepageIntent } from "@/lib/intents";
import { useTrackIntent } from "@/lib/tracking";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HomePageClient() {
  // Only need track for non-interactive callbacks like onCopy
  const { track } = useTrackIntent();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Track scroll depth and time on page */}
      <HomepageTracking />

      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-[#0d1117] via-[#0a0a0f] to-[#1a0a2e]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <Ac.Context name="navigation" metadata={{}} asChild>
        <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/2">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Ac.Intent intent={HomepageIntent.NAV_LOGO_CLICK}>
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <AnyclickLogo size="lg" />
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-30 blur transition-opacity" />
                </div>
                <span className="text-xl font-semibold tracking-tight">
                  anyclick
                </span>
              </Link>
            </Ac.Intent>
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
                <Ac.Intent intent={HomepageIntent.NAV_DOCS_CLICK}>
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    Docs
                  </Link>
                </Ac.Intent>
                <Ac.Intent intent={HomepageIntent.NAV_EXAMPLES_CLICK}>
                  <Link
                    href="/examples"
                    className="hover:text-white transition-colors"
                  >
                    Examples
                  </Link>
                </Ac.Intent>
                <Ac.Intent intent={HomepageIntent.NAV_GITHUB_CLICK}>
                  <a
                    href="https://github.com/ewjdev/anyclick"
                    className="hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </Ac.Intent>
              </div>
              <Ac.Intent intent={HomepageIntent.NAV_GET_STARTED_CLICK}>
                <Link
                  href="/docs/getting-started"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors backdrop-blur-sm border border-white/10"
                >
                  Get Started
                </Link>
              </Ac.Intent>
            </div>
          </div>
        </nav>
      </Ac.Context>

      {/* Hero Section */}
      <Ac.Context name="hero" metadata={{}} asChild>
        <Ac.View intent={HomepageIntent.HERO_VIEW} threshold={0.3}>
          <section className="relative pt-24 pb-32 px-0 md:px-6">
            <div className="max-w-5xl mx-auto text-center">
              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 mx-2">
                <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  UX done right
                </span>
                <br />
                <span className="bg-linear-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Why not click on everything?
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed px-2">
                Right-click any element in your app to get the right context,
                anyclick will format it for consumers and adapters will
                automagically route it to the appropriate system. Issues or AI
                agents.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Ac.Intent intent={HomepageIntent.HERO_CTA_CLICK}>
                  <Link
                    href="/docs/getting-started"
                    className="group px-8 py-3 rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Ac.Intent>
              </div>
            </div>

            {/* Code Preview */}
            <HeroCodeBlock
              className="max-w-3xl mx-auto mt-20"
              filename="app/layout.tsx"
              language="tsx"
              code={`import { AnyclickProvider } from '@ewjdev/anyclick-react';
import { createHttpAdapter } from '@ewjdev/anyclick-github';

const adapter = createHttpAdapter({
  endpoint: '/api/feedback'
});

export default function RootLayout({ children }) {
  return (
    <AnyclickProvider adapter={adapter}>
      {children}
    </AnyclickProvider>
  );
}`}
              onCopy={() => track(HomepageIntent.HERO_CODE_COPY)}
            />
          </section>
        </Ac.View>
      </Ac.Context>

      {/* Immersive Workstream Section */}
      <Ac.Context metadata={{}} name="workstream" asChild>
        <section className="relative">
          <div className="text-center py-16 px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built to extend browser workflows
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Scroll through immersive experiences. Each workflow has its own
              visual identity and context menu. Right-click to try it.
            </p>
          </div>

          <ImmersiveWorkstreamShowcase />
        </section>
      </Ac.Context>

      {/* Roadmap Summary */}
      <Ac.Context name="roadmap" metadata={{}} asChild>
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <RoadmapSummary />
          </div>
        </section>
      </Ac.Context>

      {/* Features Section */}
      <Ac.Context name="features" metadata={{}} asChild>
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-violet-500/5 to-transparent" />
          <FeaturesSection />
        </section>
      </Ac.Context>

      {/* Packages Section */}
      <Ac.Context name="packages" metadata={{}} asChild>
        <section className="py-24 px-6">
          <PackagesSection />
        </section>
      </Ac.Context>

      {/* Quick Start Section (hidden on mobile) */}
      <Ac.Context name="quickstart" metadata={{}} asChild>
        <section className="py-24 px-6 relative hidden md:block">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent" />
          <QuickStartSection />
        </section>
      </Ac.Context>

      {/* Footer */}
      <Ac.Context name="footer" metadata={{}} asChild>
        <Ac.View intent={HomepageIntent.FOOTER_VIEW} threshold={0.5}>
          <footer className="py-12 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <AnyclickLogo size="md" />
                <span className="font-semibold">anyclick</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <Ac.Intent
                  intent={HomepageIntent.FOOTER_LINK_CLICK}
                  metadata={{ link: "docs" }}
                >
                  <Link
                    href="/docs"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </Ac.Intent>
                <Ac.Intent
                  intent={HomepageIntent.FOOTER_LINK_CLICK}
                  metadata={{ link: "roadmap" }}
                >
                  <Link
                    href="/roadmap"
                    className="hover:text-white transition-colors"
                  >
                    Roadmap
                  </Link>
                </Ac.Intent>
                <Ac.Intent
                  intent={HomepageIntent.FOOTER_LINK_CLICK}
                  metadata={{ link: "examples" }}
                >
                  <Link
                    href="/examples"
                    className="hover:text-white transition-colors"
                  >
                    Examples
                  </Link>
                </Ac.Intent>
                <Ac.Intent
                  intent={HomepageIntent.FOOTER_LINK_CLICK}
                  metadata={{ link: "github" }}
                >
                  <a
                    href="https://github.com/ewjdev/anyclick"
                    className="hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </Ac.Intent>
                <Ac.Intent
                  intent={HomepageIntent.FOOTER_LINK_CLICK}
                  metadata={{ link: "npm" }}
                >
                  <a
                    href="https://www.npmjs.com/org/anyclick"
                    className="hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    npm
                  </a>
                </Ac.Intent>
              </div>
              <p className="text-sm text-gray-500">
                MIT License © {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </Ac.View>
      </Ac.Context>
    </div>
  );
}
