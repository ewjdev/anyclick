import { Box, GitBranch, Terminal } from "lucide-react";

const PackagesSection = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Modular Architecture
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Pick only the packages you need. All packages are published under the{" "}
          <code className="text-cyan-400">@anyclick</code> scope.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Core Package */}
        <div className="p-6 rounded-2xl bg-linear-to-br from-violet-500/10 to-transparent border border-violet-500/20">
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
        <div className="p-6 rounded-2xl bg-linear-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-4">
            <Box className="w-6 h-6 text-cyan-400" />
            <code className="text-cyan-300 font-mono">
              @ewjdev/anyclick-react
            </code>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            React provider and context menu UI. Drop-in component that handles
            all UI and event management.
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
        <div className="p-6 rounded-2xl bg-linear-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-6 h-6 text-emerald-400" />
            <code className="text-emerald-300 font-mono">
              @ewjdev/anyclick-github
            </code>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            GitHub Issues integration. HTTP adapter for browser + server-side
            GitHub API client with image uploads.
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
        <div className="p-6 rounded-2xl bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20">
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
  );
};

export default PackagesSection;
