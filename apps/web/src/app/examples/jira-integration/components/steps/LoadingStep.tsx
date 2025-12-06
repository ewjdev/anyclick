import { Loader2 } from "lucide-react";

export function LoadingStep() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#0d6e7c] animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#0d3b3e] mb-2">
          Connecting...
        </h3>
        <p className="text-sm text-gray-500">Fetching available issue types</p>
      </div>
    </div>
  );
}
