import { AlertCircle, Key } from "lucide-react";
import type { JiraPreferences } from "../../types";

interface ErrorStepProps {
  loadError: string | null;
  preferences: JiraPreferences;
  onReconfigure: () => void;
  onClose: () => void;
}

export function ErrorStep(
  { loadError, preferences, onReconfigure, onClose }: ErrorStepProps,
) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Configuration Error
        </h3>
        <p className="text-sm text-gray-600 mb-4">{loadError}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onReconfigure}
            className="px-4 py-2 bg-[#0d3b3e] hover:bg-[#0d3b3e]/90 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            {preferences.credentials ? "Update Credentials" : "Configure Jira"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
