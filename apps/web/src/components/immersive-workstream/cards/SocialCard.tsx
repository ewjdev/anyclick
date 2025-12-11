import {
  Heart,
  ImagePlus,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export function SocialCard() {
  return (
    <div className="relative w-full max-w-md">
      <div
        className="rounded-xl p-6 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.04))",
          border: "1px solid rgba(236, 72, 153, 0.2)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full"
            style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
            }}
          />
          <div>
            <div className="h-3 w-24 rounded bg-white/20" />
            <div className="mt-1 h-2 w-16 rounded bg-white/10" />
          </div>
        </div>

        <div
          className="mt-4 h-32 w-full rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.15))",
          }}
        />

        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-pink-400">
            <Heart size={16} fill="currentColor" />
            <span className="text-sm">2.4k</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <MessageSquare size={16} />
            <span className="text-sm">128</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <TrendingUp size={16} />
            <span className="text-sm">+12%</span>
          </div>
        </div>
      </div>

      <div
        className="absolute -inset-4 -z-10 rounded-2xl opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(236, 72, 153, 0.4), transparent 70%)",
        }}
      />
    </div>
  );
}
