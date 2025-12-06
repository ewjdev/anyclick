import type { JiraIssueType } from "../../types";

interface SummaryStepProps {
  selectedType: JiraIssueType;
  summary: string;
  error?: string;
  animationClass: string;
  targetElement: Element | null;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({
  selectedType,
  summary,
  error,
  animationClass,
  targetElement,
  onChange,
  onNext,
  onBack,
}: SummaryStepProps) {
  return (
    <div
      className={`flex flex-col h-full transition-all duration-200 ease-out ${animationClass}`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-sm mx-auto">
          <div className="mb-8">
            <h3 className="text-xl font-medium text-[#0d3b3e] mb-2">
              What&apos;s the issue?
            </h3>
            <p className="text-sm text-gray-500">
              A brief title for your {selectedType.name.toLowerCase()}
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={summary}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., Button not responding on click"
              autoFocus
              className={`w-full px-4 py-4 text-lg border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
                error ? "border-red-500" : "border-gray-200"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNext();
              }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="mt-6 p-3 bg-[#eef3f3] rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Element:</span>{" "}
              {targetElement?.tagName.toLowerCase() || "page"} on{" "}
              {typeof window !== "undefined" ? window.location.pathname : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-4 py-3 bg-[#0d3b3e] hover:bg-[#0d3b3e]/90 text-white rounded-xl font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
