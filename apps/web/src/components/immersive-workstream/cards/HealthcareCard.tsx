import type { CSSProperties, ReactNode } from "react";
import { PointerProvider } from "@ewjdev/anyclick-pointer";
import { AnyclickProvider, type ContextMenuItem } from "@ewjdev/anyclick-react";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { adapter } from "../adapter";

interface HealthcareCardProps {
  menuStyle: CSSProperties;
  pointerCircleColor: string;
  pointerColor: string;
  pointerIcon: ReactNode;
  primaryColor: string;
  statusMenuItems: ContextMenuItem[];
  summaryMenuItems: ContextMenuItem[];
  vitalsMenuItems: ContextMenuItem[];
}

const VITALS = [
  {
    bg: "bg-rose-50",
    color: "text-rose-500",
    label: "HR",
    unit: "bpm",
    value: "72",
  },
  {
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    label: "BP",
    unit: "",
    value: "120/80",
  },
  {
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    label: "Temp",
    unit: "deg F",
    value: "98.6",
  },
];

export function HealthcareCard({
  menuStyle,
  pointerCircleColor,
  pointerColor,
  pointerIcon,
  primaryColor,
  statusMenuItems,
  summaryMenuItems,
  vitalsMenuItems,
}: HealthcareCardProps) {
  const providerTheme = {
    menuStyle,
    highlightConfig: {
      enabled: true,
      colors: {
        targetColor: primaryColor,
        containerColor: `${primaryColor}30`,
      },
    },
  };

  const pointerTheme = {
    colors: {
      pointerColor,
      circleColor: pointerCircleColor,
    },
    pointerIcon,
  };

  return (
    <div className="relative w-full max-w-lg">
      <div
        className="rounded-xl p-6 backdrop-blur-sm"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          boxShadow:
            "0 8px 32px rgba(16, 185, 129, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <AnyclickProvider
          adapter={adapter}
          menuItems={summaryMenuItems}
          metadata={{ workstream: "healthcare", zone: "summary" }}
          theme={providerTheme}
          header={<></>}
          scoped
        >
          <PointerProvider theme={pointerTheme}>
            <div
              className="rounded-lg border border-transparent p-2 transition-colors hover:border-emerald-300/60"
              data-workflow-zone="summary"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700/80">
                    Patient Summary
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    Token PT-80321
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Bed B-12 | Intake queue routed
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1">
                  <span className="text-xs font-medium text-emerald-600">
                    Active
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Right-click to run check-in and identity workflows.
              </p>
            </div>
          </PointerProvider>
        </AnyclickProvider>

        <AnyclickProvider
          adapter={adapter}
          menuItems={vitalsMenuItems}
          metadata={{ workstream: "healthcare", zone: "vitals" }}
          theme={providerTheme}
          header={<></>}
          scoped
        >
          <PointerProvider theme={pointerTheme}>
            <div
              className="mt-4 rounded-lg border border-transparent p-2 transition-colors hover:border-emerald-300/60"
              data-workflow-zone="vitals"
            >
              <div className="grid grid-cols-3 gap-3">
                {VITALS.map((vital) => (
                  <div
                    key={vital.label}
                    className={cn("rounded-lg p-3 text-center", vital.bg)}
                  >
                    <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      {vital.label}
                    </div>
                    <div className={cn("text-lg font-bold", vital.color)}>
                      {vital.value}
                      <span className="ml-1 text-[10px] font-normal text-gray-400">
                        {vital.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50/50 p-3">
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

              <p className="mt-2 text-xs text-gray-500">
                Right-click vitals to alert, recheck, or open trend review.
              </p>
            </div>
          </PointerProvider>
        </AnyclickProvider>

        <AnyclickProvider
          adapter={adapter}
          menuItems={statusMenuItems}
          metadata={{ workstream: "healthcare", zone: "status" }}
          theme={providerTheme}
          header={<></>}
          scoped
        >
          <PointerProvider theme={pointerTheme}>
            <div
              className="mt-4 rounded-lg border border-transparent bg-emerald-50/40 p-3 transition-colors hover:border-emerald-300/60"
              data-workflow-zone="status"
            >
              <div className="grid grid-cols-3 gap-3 text-[11px] text-gray-700">
                <div>
                  <p className="uppercase tracking-wide text-gray-500">
                    Care Status
                  </p>
                  <p className="mt-1 font-medium">Monitoring stable</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-gray-500">Team</p>
                  <p className="mt-1 font-medium">Primary RN + On-call</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-gray-500">Route</p>
                  <p className="mt-1 font-medium">Unit board task queue</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded bg-emerald-200/50">
                <div className="h-full w-2/3 rounded bg-emerald-500/80" />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Right-click status to flag urgent, notify care team, or escalate
                handoff.
              </p>
            </div>
          </PointerProvider>
        </AnyclickProvider>
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
