import { AnyclickLogo } from "@/components/AnyclickLogo";
import { HeroCodeBlock } from "@/components/CodePreview";
import FeaturesSection from "@/components/FeaturesSection";
import { ImmersiveWorkstreamShowcase } from "@/components/ImmersiveWorkstreamShowcase";
import PackagesSection from "@/components/PackagesSection";
import QuickStartSection from "@/components/QuickStartSection";
import RoadmapSummary from "@/components/RoadmapSummary";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
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
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <AnyclickLogo size="lg" />
              <div className="absolute -inset-1 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-30 blur transition-opacity" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              anyclick
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <Link
                href="/examples"
                className="hover:text-white transition-colors"
              >
                Examples
              </Link>
              <a
                href="https://github.com/ewjdev/anyclick"
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
            <Link
              href="/docs/getting-started"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors backdrop-blur-sm border border-white/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-0 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Now with screenshot capture & AI agent integration</span>
          </div> */}

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
            Click any element in your app to capture context, anyclick will
            format it for consumers and adapters will automagically route it to
            the appropriate system and workflow.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="group px-8 py-3 rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
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
        />
      </section>

      {/* Immersive Workstream Section */}
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

      {/* Roadmap Summary */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <RoadmapSummary />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-violet-500/5 to-transparent" />
        <FeaturesSection />
      </section>

      {/* Packages Section */}
      <section className="py-24 px-6">
        <PackagesSection />
      </section>

      {/* 
        Quick Start Section
        Hidden on mobile cause you wouldn't be taking the actions of starting on mobile
       */}
      <section className="py-24 px-6 relative hidden md:block">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent" />
        <QuickStartSection />
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AnyclickLogo size="md" />
            <span className="font-semibold">anyclick</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentation
            </Link>
            <Link
              href="/roadmap"
              className="hover:text-white transition-colors"
            >
              Roadmap
            </Link>
            <Link
              href="/examples"
              className="hover:text-white transition-colors"
            >
              Examples
            </Link>
            <a
              href="https://github.com/ewjdev/anyclick"
              className="hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/org/anyclick"
              className="hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
          </div>
          <p className="text-sm text-gray-500">
            MIT License © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
