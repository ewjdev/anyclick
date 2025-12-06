import { CheckCircle2 } from "lucide-react";

interface SuccessStepProps {
  createdIssueUrl: string | null;
  onClose: () => void;
}

export function SuccessStep({ createdIssueUrl, onClose }: SuccessStepProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#0d7a5d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-[#0d7a5d]" />
        </div>
        <h3 className="text-xl font-medium text-[#0d3b3e] mb-2">Done!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Your issue has been created
        </p>
        {createdIssueUrl && (
          <a
            href={createdIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d3b3e] hover:bg-[#0d3b3e]/90 text-white rounded-lg font-medium transition-colors"
          >
            View Issue
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
        <button
          onClick={onClose}
          className="mt-4 block mx-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
