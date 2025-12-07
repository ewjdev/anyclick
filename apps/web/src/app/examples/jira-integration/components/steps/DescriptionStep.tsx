import type { JiraIssueType } from "../../types";

interface DescriptionStepProps {
  selectedType: JiraIssueType;
  description: string;
  animationClass: string;
  hasRequiredFields: boolean;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DescriptionStep({
  selectedType,
  description,
  animationClass,
  hasRequiredFields,
  onChange,
  onNext,
  onBack,
}: DescriptionStepProps) {
  return (
    <div
      className={`flex flex-col h-full transition-all duration-200 ease-out ${animationClass}`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-sm mx-auto">
          <div className="mb-8">
            <h3 className="text-xl font-medium text-[#0d3b3e] mb-2">
              Add some details
            </h3>
            <p className="text-sm text-gray-500">
              Optional - describe what happened
            </p>
          </div>

          <textarea
            value={description}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Steps to reproduce, expected behavior, or any additional context..."
            rows={6}
            autoFocus
            className="w-full px-4 py-4 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] resize-none text-gray-900"
          />
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
          {hasRequiredFields ? "Continue" : "Review"}
        </button>
      </div>
    </div>
  );
}
