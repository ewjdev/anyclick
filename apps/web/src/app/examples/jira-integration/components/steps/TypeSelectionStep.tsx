import { ChevronRight } from "lucide-react";
import type { JiraIssueType, JiraPreferences } from "../../types";
import { getIssueTypeIcon } from "../Icons";

interface TypeSelectionStepProps {
  issueTypes: JiraIssueType[];
  preferences: JiraPreferences;
  onSelect: (type: JiraIssueType) => void;
}

export function TypeSelectionStep(
  { issueTypes, preferences, onSelect }: TypeSelectionStepProps,
) {
  const sortedIssueTypes = [...issueTypes].sort((a, b) => {
    if (a.name === preferences.lastIssueType) return -1;
    if (b.name === preferences.lastIssueType) return 1;
    return 0;
  });

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-xl font-semibold mb-2 text-[#0d3b3e]">
        What would you like to report?
      </h3>
      <p className="text-sm text-gray-500 mb-6">Choose the type of issue</p>

      {issueTypes.length === 0
        ? (
          <div className="text-center py-8 text-gray-500">
            <p>No issue types available</p>
          </div>
        )
        : (
          <div className="space-y-2">
            {sortedIssueTypes.map((type) => {
              const isLastUsed = type.name === preferences.lastIssueType;
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type)}
                  className={`w-full p-4 rounded-xl border transition-all text-left group ${
                    isLastUsed
                      ? "border-[#0d6e7c] bg-[#eef3f3] hover:bg-[#0d6e7c]/10"
                      : "border-gray-200 hover:border-[#0d6e7c]/50 hover:bg-[#eef3f3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isLastUsed
                          ? "bg-[#0d6e7c]/20 text-[#0d6e7c]"
                          : "bg-gray-100 text-gray-600 group-hover:bg-[#0d6e7c]/10 group-hover:text-[#0d6e7c]"
                      }`}
                    >
                      {getIssueTypeIcon(type.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#0d3b3e] flex items-center gap-2">
                        {type.name}
                        {isLastUsed && (
                          <span className="text-xs font-normal bg-[#0d6e7c]/20 text-[#0d6e7c] px-2 py-0.5 rounded-full">
                            Recent
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {type.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0d6e7c] flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}
