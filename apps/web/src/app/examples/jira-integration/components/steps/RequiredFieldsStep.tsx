import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";
import { FieldInput } from "../FieldInput";

interface RequiredFieldsStepProps {
  requiredFields: NormalizedJiraField[];
  currentFieldIndex: number;
  animationClass: string;
  formData: Record<string, any>;
  displayValues: Record<string, string>;
  errors: Record<string, string>;
  requestHeaders: HeadersInit;
  onChangeField: (key: string, value: any, display?: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RequiredFieldsStep({
  requiredFields,
  currentFieldIndex,
  animationClass,
  formData,
  displayValues,
  errors,
  requestHeaders,
  onChangeField,
  onNext,
  onBack,
}: RequiredFieldsStepProps) {
  const currentField = requiredFields[currentFieldIndex];
  if (!currentField) return null;

  return (
    <div
      className={`flex flex-col h-full transition-all duration-200 ease-out ${animationClass}`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-sm mx-auto">
          <div className="mb-6">
            <span className="text-xs text-gray-500">
              {currentFieldIndex + 1} of {requiredFields.length} required fields
            </span>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium text-[#0d3b3e] mb-2">
              {currentField.name}
            </h3>
            {currentField.description && (
              <p className="text-sm text-gray-500">
                {currentField.description}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <FieldInput
              field={currentField}
              value={formData[currentField.key]}
              displayValue={displayValues[currentField.key]}
              hasError={Boolean(errors[currentField.key])}
              requestHeaders={requestHeaders}
              onChange={(value, display) =>
                onChangeField(currentField.key, value, display)}
            />
            {errors[currentField.key] && (
              <p className="text-sm text-red-500">{errors[currentField.key]}</p>
            )}
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
          {currentFieldIndex < requiredFields.length - 1
            ? "Continue"
            : "Review"}
        </button>
      </div>
    </div>
  );
}
