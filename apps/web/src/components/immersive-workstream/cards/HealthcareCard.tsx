import { cn } from "@/lib/utils";
import { HeartPulse } from "lucide-react";

export function HealthcareCard() {
  return (
    <div className="relative w-full max-w-md">
      <div
        className="rounded-xl p-6 backdrop-blur-sm"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          boxShadow:
            "0 8px 32px rgba(16, 185, 129, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1">
            <span className="text-xs font-medium text-emerald-600">Active</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            {
              label: "HR",
              value: "72",
              unit: "bpm",
              color: "text-rose-500",
              bg: "bg-rose-50",
            },
            {
              label: "BP",
              value: "120/80",
              unit: "",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Temp",
              value: "98.6",
              unit: "°F",
              color: "text-cyan-600",
              bg: "bg-cyan-50",
            },
          ].map((vital) => (
            <div
              key={vital.label}
              className={cn("rounded-lg p-3 text-center", vital.bg)}
            >
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                {vital.label}
              </div>
              <div className={cn("text-lg font-bold", vital.color)}>
                {vital.value}
                <span className="text-xs font-normal text-gray-400 ml-0.5">
                  {vital.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 p-3 rounded-lg bg-emerald-50/50">
          <HeartPulse size={18} className="text-emerald-500" />
          <svg className="h-8 flex-1" viewBox="0 0 200 32">
            <path
              d="M0,16 L40,16 L50,6 L60,26 L70,10 L80,22 L90,16 L200,16"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div
        className="absolute -inset-4 -z-10 rounded-2xl opacity-40 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.25), transparent 70%)",
        }}
      />
    </div>
  );
}
