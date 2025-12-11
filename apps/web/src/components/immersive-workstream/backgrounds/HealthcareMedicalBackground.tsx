import {
  Activity,
  Clipboard,
  Cross,
  Heart,
  Pill,
  Stethoscope,
  Syringe,
  Thermometer,
} from "lucide-react";

export function HealthcareMedicalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
        <defs>
          <pattern
            id="medical-pattern"
            x="0"
            y="0"
            width="200"
            height="200"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 30 h10 v-10 h10 v10 h10 v10 h-10 v10 h-10 v-10 h-10 z"
              fill="#10b981"
            />
            <path
              d="M140 130 h8 v-8 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 z"
              fill="#14b8a6"
            />
            <path
              d="M90 80 c-5-10 -20-10 -20 5 c0 15 20 25 20 25 s20-10 20-25 c0-15-15-15-20-5"
              fill="#f43f5e"
            />
            <ellipse
              cx="170"
              cy="50"
              rx="15"
              ry="8"
              fill="#8b5cf6"
              transform="rotate(30 170 50)"
            />
            <ellipse
              cx="30"
              cy="150"
              rx="12"
              ry="6"
              fill="#06b6d4"
              transform="rotate(-20 30 150)"
            />
            <circle
              cx="100"
              cy="170"
              r="12"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
            />
            <path
              d="M88 170 q-10-30 0-50"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#medical-pattern)" />
      </svg>

      <div className="absolute top-[10%] left-[15%] text-emerald-400/20">
        <Stethoscope size={48} />
      </div>
      <div className="absolute top-[20%] right-[20%] text-rose-400/15">
        <Heart size={36} />
      </div>
      <div className="absolute bottom-[25%] left-[10%] text-violet-400/15">
        <Pill size={32} />
      </div>
      <div className="absolute bottom-[15%] right-[15%] text-cyan-400/20">
        <Thermometer size={40} />
      </div>
      <div className="absolute top-[40%] right-[8%] text-emerald-400/15">
        <Activity size={44} />
      </div>
      <div className="absolute bottom-[40%] left-[20%] text-teal-400/15">
        <Cross size={36} />
      </div>
      <div className="absolute top-[60%] left-[5%] text-emerald-500/10">
        <Clipboard size={32} />
      </div>
      <div className="absolute top-[15%] left-[40%] text-rose-300/10">
        <Syringe size={28} />
      </div>
    </div>
  );
}
