import Link from "next/link";
import {
  MousePointerClick,
  Code2,
  Camera,
  GitBranch,
  Zap,
  Layers,
  ArrowRight,
  Terminal,
  Box,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0a0f] to-[#1a0a2e]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                <MousePointerClick className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur transition-opacity" />
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
      <section className="relative pt-24 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Now with screenshot capture & AI agent integration</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              UI feedback
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              that codes itself
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Right-click any element in your app to capture feedback with full
            DOM context, screenshots, and automatic integration with GitHub
            Issues or AI coding agents.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/docs/getting-started"
              className="group px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/25 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/examples/basic"
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition-all flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              View Examples
            </Link>
          </div>
        </div>

        {/* Code Preview */}
        <div className="max-w-3xl mx-auto mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden shadow-2xl">
            {/* Window controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-gray-500 font-mono">
                app/layout.tsx
              </span>
            </div>
            <pre className="p-6 text-sm font-mono overflow-x-auto">
              <code>
                <span className="text-purple-400">import</span>
                <span className="text-gray-300">{" { "}</span>
                <span className="text-cyan-400">FeedbackProvider</span>
                <span className="text-gray-300">{" } "}</span>
                <span className="text-purple-400">from</span>
                <span className="text-emerald-400">
                  {" '@ewjdev/anyclick-react'"}
                </span>
                <span className="text-gray-500">;</span>
                {"\n"}
                <span className="text-purple-400">import</span>
                <span className="text-gray-300">{" { "}</span>
                <span className="text-cyan-400">createHttpAdapter</span>
                <span className="text-gray-300">{" } "}</span>
                <span className="text-purple-400">from</span>
                <span className="text-emerald-400">
                  {" '@ewjdev/anyclick-github'"}
                </span>
                <span className="text-gray-500">;</span>
                {"\n\n"}
                <span className="text-purple-400">const</span>
                <span className="text-cyan-400">{" adapter"}</span>
                <span className="text-gray-300">{" = "}</span>
                <span className="text-yellow-400">createHttpAdapter</span>
                <span className="text-gray-300">{"({"}</span>
                {"\n  "}
                <span className="text-cyan-300">endpoint</span>
                <span className="text-gray-300">: </span>
                <span className="text-emerald-400">{`'/api/feedback'`}</span>
                {"\n"}
                <span className="text-gray-300">{"});"}</span>
                {"\n\n"}
                <span className="text-purple-400">export default function</span>
                <span className="text-yellow-400">{" RootLayout"}</span>
                <span className="text-gray-300">{"({ children }) {"}</span>
                {"\n  "}
                <span className="text-purple-400">return</span>
                <span className="text-gray-300">{" ("}</span>
                {"\n    "}
                <span className="text-gray-500">{"<"}</span>
                <span className="text-red-400">FeedbackProvider</span>
                <span className="text-cyan-300">{" adapter"}</span>
                <span className="text-gray-300">{"={"}</span>
                <span className="text-cyan-400">adapter</span>
                <span className="text-gray-300">{"}"}</span>
                <span className="text-gray-500">{">"}</span>
                {"\n      "}
                <span className="text-gray-300">{"{children}"}</span>
                {"\n    "}
                <span className="text-gray-500">{"</"}</span>
                <span className="text-red-400">FeedbackProvider</span>
                <span className="text-gray-500">{">"}</span>
                {"\n  "}
                <span className="text-gray-300">{");"}</span>
                {"\n"}
                <span className="text-gray-300">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for UI feedback
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From capturing user intent to automatic code fixes, anyclick
              streamlines the entire feedback workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MousePointerClick className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Context-Aware Capture
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Right-click any element to capture its full DOM context,
                including selectors, data attributes, ancestors, and surrounding
                page information.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Screenshot Capture</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Automatically capture screenshots of the target element, its
                container, and the full page—all included in the feedback
                payload.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Automatically create GitHub Issues with rich context, formatted
                markdown, and embedded screenshots for seamless issue tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cursor AI Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Launch Cursor&apos;s AI agent directly from feedback—locally
                during development or via cloud agent for instant code fixes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Framework Agnostic</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Core library works with any JavaScript framework. Use the React
                provider for React apps, or build your own integration.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.04]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero Config</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Works out of the box with sensible defaults. Right-click
                anywhere in your app and start capturing feedback immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Modular Architecture
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Pick only the packages you need. All packages are published under
              the <code className="text-cyan-400">@anyclick</code> scope.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Core Package */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Box className="w-6 h-6 text-violet-400" />
                <code className="text-violet-300 font-mono">
                  @ewjdev/anyclick-core
                </code>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Framework-agnostic core library. DOM capture, payload building,
                screenshot utilities, and adapter interface.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  TypeScript
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  ESM + CJS
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Zero Dependencies
                </span>
              </div>
            </div>

            {/* React Package */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Box className="w-6 h-6 text-cyan-400" />
                <code className="text-cyan-300 font-mono">
                  @ewjdev/anyclick-react
                </code>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                React provider and context menu UI. Drop-in component that
                handles all UI and event management.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  React 19+
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Context Menu
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Highlights
                </span>
              </div>
            </div>

            {/* GitHub Package */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <GitBranch className="w-6 h-6 text-emerald-400" />
                <code className="text-emerald-300 font-mono">
                  @ewjdev/anyclick-github
                </code>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                GitHub Issues integration. HTTP adapter for browser +
                server-side GitHub API client with image uploads.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  GitHub API
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Image Upload
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Markdown
                </span>
              </div>
            </div>

            {/* Cursor Packages */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-6 h-6 text-amber-400" />
                <code className="text-amber-300 font-mono">
                  @ewjdev/anyclick-cursor-*
                </code>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Cursor AI integrations. Local adapter runs cursor-agent on your
                machine; cloud adapter uses Cursor&apos;s API.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  cursor-agent
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Cloud Agent
                </span>
                <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400">
                  Auto-fix
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Quick Start</h2>
            <p className="text-gray-400">
              Get up and running in under 2 minutes
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Install the packages</h3>
                <div className="rounded-xl bg-[#0d1117] border border-white/10 p-4 font-mono text-sm">
                  <span className="text-gray-500">$</span>{" "}
                  <span className="text-cyan-400">npm install</span>{" "}
                  <span className="text-emerald-400">
                    @ewjdev/anyclick-react @ewjdev/anyclick-github
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Create an API route</h3>
                <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5 text-xs text-gray-500 font-mono">
                    app/api/feedback/route.ts
                  </div>
                  <pre className="p-4 text-sm font-mono overflow-x-auto">
                    <code>
                      <span className="text-purple-400">import</span>
                      <span className="text-gray-300">{" { "}</span>
                      <span className="text-cyan-400">createGitHubAdapter</span>
                      <span className="text-gray-300">{" } "}</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">
                        {" '@ewjdev/anyclick-github/server'"}
                      </span>
                      <span className="text-gray-500">;</span>
                      {"\n\n"}
                      <span className="text-purple-400">const</span>
                      <span className="text-cyan-400">{" github"}</span>
                      <span className="text-gray-300">{" = "}</span>
                      <span className="text-yellow-400">
                        createGitHubAdapter
                      </span>
                      <span className="text-gray-300">{"({"}</span>
                      {"\n  "}
                      <span className="text-cyan-300">owner</span>
                      <span className="text-gray-300">: </span>
                      <span className="text-emerald-400">{`'your-org'`}</span>
                      <span className="text-gray-300">,</span>
                      {"\n  "}
                      <span className="text-cyan-300">repo</span>
                      <span className="text-gray-300">: </span>
                      <span className="text-emerald-400">{`'your-repo'`}</span>
                      <span className="text-gray-300">,</span>
                      {"\n  "}
                      <span className="text-cyan-300">token</span>
                      <span className="text-gray-300">: </span>
                      <span className="text-cyan-400">process.env</span>
                      <span className="text-gray-300">.</span>
                      <span className="text-cyan-400">GITHUB_TOKEN</span>
                      {"\n"}
                      <span className="text-gray-300">{"});"}</span>
                      {"\n\n"}
                      <span className="text-purple-400">
                        export async function
                      </span>
                      <span className="text-yellow-400">{" POST"}</span>
                      <span className="text-gray-300">{"(req) {"}</span>
                      {"\n  "}
                      <span className="text-purple-400">const</span>
                      <span className="text-cyan-400">{" payload"}</span>
                      <span className="text-gray-300">{" = "}</span>
                      <span className="text-purple-400">await</span>
                      <span className="text-gray-300">{" req."}</span>
                      <span className="text-yellow-400">json</span>
                      <span className="text-gray-300">();</span>
                      {"\n  "}
                      <span className="text-purple-400">const</span>
                      <span className="text-cyan-400">{" result"}</span>
                      <span className="text-gray-300">{" = "}</span>
                      <span className="text-purple-400">await</span>
                      <span className="text-gray-300">{" github."}</span>
                      <span className="text-yellow-400">submit</span>
                      <span className="text-gray-300">(payload);</span>
                      {"\n  "}
                      <span className="text-purple-400">return</span>
                      <span className="text-gray-300">{" Response."}</span>
                      <span className="text-yellow-400">json</span>
                      <span className="text-gray-300">(result);</span>
                      {"\n"}
                      <span className="text-gray-300">{"}"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Wrap your app</h3>
                <div className="rounded-xl bg-[#0d1117] border border-white/10 overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/5 text-xs text-gray-500 font-mono">
                    app/layout.tsx
                  </div>
                  <pre className="p-4 text-sm font-mono overflow-x-auto">
                    <code>
                      <span className="text-purple-400">import</span>
                      <span className="text-gray-300">{" { "}</span>
                      <span className="text-cyan-400">FeedbackProvider</span>
                      <span className="text-gray-300">{" } "}</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">
                        {" '@ewjdev/anyclick-react'"}
                      </span>
                      <span className="text-gray-500">;</span>
                      {"\n"}
                      <span className="text-purple-400">import</span>
                      <span className="text-gray-300">{" { "}</span>
                      <span className="text-cyan-400">createHttpAdapter</span>
                      <span className="text-gray-300">{" } "}</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">
                        {" '@ewjdev/anyclick-github'"}
                      </span>
                      <span className="text-gray-500">;</span>
                      {"\n\n"}
                      <span className="text-purple-400">const</span>
                      <span className="text-cyan-400">{" adapter"}</span>
                      <span className="text-gray-300">{" = "}</span>
                      <span className="text-yellow-400">createHttpAdapter</span>
                      <span className="text-gray-300">{"({ "}</span>
                      <span className="text-cyan-300">endpoint</span>
                      <span className="text-gray-300">: </span>
                      <span className="text-emerald-400">{`'/api/feedback'`}</span>
                      <span className="text-gray-300">{" });"}</span>
                      {"\n\n"}
                      <span className="text-purple-400">
                        export default function
                      </span>
                      <span className="text-yellow-400">{" Layout"}</span>
                      <span className="text-gray-300">
                        {"({ children }) {"}
                      </span>
                      {"\n  "}
                      <span className="text-purple-400">return</span>
                      <span className="text-gray-300">{" ("}</span>
                      {"\n    "}
                      <span className="text-gray-500">{"<"}</span>
                      <span className="text-red-400">FeedbackProvider</span>
                      <span className="text-cyan-300">{" adapter"}</span>
                      <span className="text-gray-300">{"={"}</span>
                      <span className="text-cyan-400">adapter</span>
                      <span className="text-gray-300">{"}"}</span>
                      <span className="text-gray-500">{">"}</span>
                      {"\n      "}
                      <span className="text-gray-300">{"{children}"}</span>
                      {"\n    "}
                      <span className="text-gray-500">{"</"}</span>
                      <span className="text-red-400">FeedbackProvider</span>
                      <span className="text-gray-500">{">"}</span>
                      {"\n  "}
                      <span className="text-gray-300">{");"}</span>
                      {"\n"}
                      <span className="text-gray-300">{"}"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-3">Right-click anywhere!</h3>
                <p className="text-gray-400">
                  That&apos;s it! Right-click any element in your app to open
                  the feedback menu. Select a feedback type, add a comment, and
                  submit. Your feedback is now on GitHub.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Read the full documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">anyclick</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentation
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
