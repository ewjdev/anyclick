import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { FieldInput } from "../FieldInput";
import { getDisplayValue } from "../../utils/jiraHelpers";

interface ReviewStepProps {
  requiredFields: NormalizedJiraField[];
  optionalFields: NormalizedJiraField[];
  formData: Record<string, any>;
  displayValues: Record<string, string>;
  errors: Record<string, string>;
  animationClass: string;
  showOptionalFields: boolean;
  requestHeaders: HeadersInit;
  onToggleOptional: () => void;
  onEditSummary: () => void;
  onEditDescription: () => void;
  onEditRequiredField: (index: number) => void;
  onChangeField: (key: string, value: any, display?: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewStep({
  requiredFields,
  optionalFields,
  formData,
  displayValues,
  errors,
  animationClass,
  showOptionalFields,
  requestHeaders,
  onToggleOptional,
  onEditSummary,
  onEditDescription,
  onEditRequiredField,
  onChangeField,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  return (
    <div
      className={`flex flex-col h-full transition-all duration-200 ease-out ${animationClass}`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-[#0d3b3e] mb-2">
            Review your issue
          </h3>
          <p className="text-sm text-gray-500">
            Make sure everything looks correct
          </p>
        </div>

        <div className="space-y-4">
          <div
            className="p-4 bg-[#eef3f3] rounded-xl cursor-pointer hover:bg-[#0d6e7c]/10 transition-colors"
            onClick={onEditSummary}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 mb-1">Summary</p>
                <p className="text-[#0d3b3e] font-medium">{formData.summary}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {formData.description && (
            <div
              className="p-4 bg-[#eef3f3] rounded-xl cursor-pointer hover:bg-[#0d6e7c]/10 transition-colors"
              onClick={onEditDescription}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 text-sm truncate">
                    {formData.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </div>
          )}

          {requiredFields.map((field, index) => (
            <div
              key={field.key}
              className="p-4 bg-[#eef3f3] rounded-xl cursor-pointer hover:bg-[#0d6e7c]/10 transition-colors"
              onClick={() => onEditRequiredField(index)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{field.name}</p>
                  <p className="text-gray-700 text-sm">
                    {getDisplayValue(field, formData[field.key], displayValues)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}

          {optionalFields.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onToggleOptional}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    More options
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {optionalFields.length}
                  </span>
                </div>
                {showOptionalFields
                  ? <ChevronUp className="w-5 h-5 text-gray-500" />
                  : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </button>

              {showOptionalFields && (
                <div className="mt-4 space-y-4">
                  {optionalFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name}
                      </label>
                      <FieldInput
                        field={field}
                        value={formData[field.key]}
                        displayValue={displayValues[field.key]}
                        requestHeaders={requestHeaders}
                        onChange={(value, display) =>
                          onChangeField(field.key, value, display)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}
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
          onClick={onSubmit}
          className="flex-1 px-4 py-3 bg-[#0d3b3e] hover:bg-[#0d3b3e]/90 text-white rounded-xl font-medium transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
