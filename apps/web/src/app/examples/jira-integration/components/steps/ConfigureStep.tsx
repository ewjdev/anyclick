import { AlertCircle, ChevronRight, Eye, EyeOff, Key } from "lucide-react";
import type { FieldErrorMap, JiraCredentials } from "../../types";

interface ConfigureStepProps {
  credentialForm: JiraCredentials;
  credentialErrors: FieldErrorMap;
  showApiToken: boolean;
  onChange: (updates: Partial<JiraCredentials>) => void;
  onToggleApiToken: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ConfigureStep({
  credentialForm,
  credentialErrors,
  showApiToken,
  onChange,
  onToggleApiToken,
  onSave,
  onCancel,
}: ConfigureStepProps) {
  const isUpdating = Boolean(
    credentialForm.jiraUrl || credentialForm.email || credentialForm.apiToken,
  );

  return (
    <div className="p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#0d3b3e]">
            {isUpdating ? "Update Credentials" : "Connect to Jira"}
          </h3>
          <p className="text-sm text-gray-600">
            {isUpdating
              ? "Update your Jira credentials below"
              : "Enter your Jira credentials to get started"}
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong>{" "}
          Your credentials are stored in this browser session only and are not
          saved to any server.
        </p>
      </div>

      <div className="space-y-4" data-form-type="other">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jira URL
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="url"
            name="jira-instance-url"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.jiraUrl}
            onChange={(e) => onChange({ jiraUrl: e.target.value })}
            placeholder="https://your-company.atlassian.net"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
              credentialErrors.jiraUrl ? "border-red-500" : "border-gray-200"
            }`}
          />
          {credentialErrors.jiraUrl && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.jiraUrl}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="jira-account-email"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="your-email@company.com"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
              credentialErrors.email ? "border-red-500" : "border-gray-200"
            }`}
          />
          {credentialErrors.email && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Token
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d6e7c] hover:underline"
            >
              Create an API token
            </a>{" "}
            in your Atlassian account settings
          </p>
          <div className="relative">
            <input
              type={showApiToken ? "text" : "password"}
              name="jira-api-token"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              value={credentialForm.apiToken}
              onChange={(e) => onChange({ apiToken: e.target.value })}
              placeholder="Enter your API token"
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 ${
                credentialErrors.apiToken ? "border-red-500" : "border-gray-200"
              }`}
            />
            <button
              type="button"
              onClick={onToggleApiToken}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiToken
                ? <EyeOff className="w-5 h-5" />
                : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {credentialErrors.apiToken && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.apiToken}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Key
            <span className="text-red-500 ml-1">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The key of your Jira project (e.g., PROJ, DEV, SUPPORT)
          </p>
          <input
            type="text"
            name="jira-project-key"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            value={credentialForm.projectKey}
            onChange={(e) =>
              onChange({ projectKey: e.target.value.toUpperCase() })}
            placeholder="PROJ"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6e7c] text-gray-900 uppercase ${
              credentialErrors.projectKey ? "border-red-500" : "border-gray-200"
            }`}
          />
          {credentialErrors.projectKey && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.projectKey}
            </p>
          )}
        </div>

        {credentialErrors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{credentialErrors.submit}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 px-4 py-3 bg-[#0d3b3e] hover:bg-[#0d3b3e]/90 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {isUpdating ? "Update & Connect" : "Connect"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
