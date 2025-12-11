import {
  Camera,
  GitBranch,
  Layers,
  MousePointerClick,
  Terminal,
  Zap,
} from "lucide-react";

const FeaturesSection = () => {
  return (
    <div className="max-w-7xl mx-auto relative">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Everything you need for UI context
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          From capturing user intent to automatic code fixes, anyclick
          streamlines the entire feedback workflow.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-violet-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MousePointerClick className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Context-Aware Capture</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Right-click any element to capture its full DOM context, including
            selectors, data attributes, ancestors, and surrounding page
            information.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Visual Capture</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Automatically capture screenshots of the target element, its
            container, and the full page—all included in the feedback payload.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-emerald-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <GitBranch className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Code Source Integration
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Automatically create GitHub Issues with rich context, formatted
            markdown, and embedded screenshots for seamless issue tracking.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-amber-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Terminal className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Agent</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Launch Cursor&apos;s AI agent directly from feedback—locally during
            development or via cloud agent for instant code fixes.
          </p>
        </div>

        {/* Feature 5 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-rose-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Framework Agnostic</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Core library works with any JavaScript framework. Use the React
            provider for React apps, or build your own integration.
          </p>
        </div>

        {/* Feature 6 */}
        <div className="group p-6 rounded-2xl bg-white/2 border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/4">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Zero Config</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Works out of the box with sensible defaults. Right-click anywhere in
            your app and start capturing feedback immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
