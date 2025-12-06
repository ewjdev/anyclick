import { Loader2 } from "lucide-react";

export function SubmittingStep() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#0d6e7c] animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#0d3b3e] mb-2">
          Submitting...
        </h3>
        <p className="text-sm text-gray-500">Creating your issue</p>
      </div>
    </div>
  );
}
