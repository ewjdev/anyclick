"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Key,
  Loader2,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import type { NormalizedJiraField } from "@ewjdev/anyclick-jira";

// ============================================================================
// Types
// ============================================================================

interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

interface AutocompleteOption {
  id: string;
  name: string;
  value?: string;
}

interface JiraSubmitResult {
  url?: string;
}

interface JiraFeedbackMenuProps {
  targetElement: Element | null;
  containerElement: Element | null;
  position: { x: number; y: number };
  onClose: () => void;
  onSubmit: (
    type: string,
    comment: string,
    customFields: Record<string, any>,
  ) => Promise<JiraSubmitResult | void>;
}

interface JiraCredentials {
  jiraUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

interface JiraPreferences {
  credentials?: JiraCredentials;
  fieldDefaults: {
    [issueType: string]: Record<string, any>;
  };
  displayValueDefaults: {
    [issueType: string]: Record<string, string>;
  };
  lastIssueType?: string;
}

// ============================================================================
// Session Storage for Jira Preferences
// ============================================================================

const STORAGE_KEY = "anyclick-jira-preferences";

function getJiraPreferences(): JiraPreferences {
  if (typeof window === "undefined") {
    return { fieldDefaults: {}, displayValueDefaults: {} };
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("[JiraPreferences] Failed to read preferences:", e);
  }
  return { fieldDefaults: {}, displayValueDefaults: {} };
}

function saveJiraPreferences(prefs: JiraPreferences): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("[JiraPreferences] Failed to save preferences:", e);
  }
}

function useJiraPreferences() {
  const [preferences, setPreferences] = useState<JiraPreferences>(() =>
    getJiraPreferences()
  );

  const updatePreferences = useCallback((updates: Partial<JiraPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      saveJiraPreferences(updated);
      return updated;
    });
  }, []);

  const saveCredentials = useCallback((creds: JiraCredentials) => {
    updatePreferences({ credentials: creds });
  }, [updatePreferences]);

  const saveFieldDefaults = useCallback(
    (
      issueType: string,
      fields: Record<string, any>,
      displayValues: Record<string, string>,
    ) => {
      setPreferences((prev) => {
        const updated = {
          ...prev,
          fieldDefaults: {
            ...prev.fieldDefaults,
            [issueType]: fields,
          },
          displayValueDefaults: {
            ...prev.displayValueDefaults,
            [issueType]: displayValues,
          },
          lastIssueType: issueType,
        };
        saveJiraPreferences(updated);
        return updated;
      });
    },
    [],
  );

  const getFieldDefaults = useCallback(
    (
      issueType: string,
    ): {
      fields: Record<string, any>;
      displayValues: Record<string, string>;
    } => {
      return {
        fields: preferences.fieldDefaults[issueType] || {},
        displayValues: preferences.displayValueDefaults[issueType] || {},
      };
    },
    [preferences.fieldDefaults, preferences.displayValueDefaults],
  );

  return {
    preferences,
    updatePreferences,
    saveCredentials,
    saveFieldDefaults,
    getFieldDefaults,
    hasCredentials: !!preferences.credentials,
  };
}

// ============================================================================
// Context Description Generator
// ============================================================================

function generateContextDescription(
  targetElement: Element | null,
  containerElement: Element | null,
): string {
  if (typeof window === "undefined") return "";

  const tag = targetElement?.tagName.toLowerCase() || "element";
  const testId = targetElement?.getAttribute("data-testid");
  const id = targetElement?.id;
  const classes = targetElement?.className
    ? `.${targetElement.className.split(" ").slice(0, 3).join(".")}`
    : "";
  const page = window.location.pathname;
  const url = window.location.href;

  const selectorParts = [tag];
  if (testId) selectorParts.push(`[data-testid="${testId}"]`);
  else if (id) selectorParts.push(`#${id}`);
  else if (classes) selectorParts.push(classes);

  return `**Element:** \`${selectorParts.join("")}\`
**Page:** ${page}
**URL:** ${url}

**Issue Description:**
`;
}

/**
 * Safely extract a primitive string value from a potentially nested value.
 * Handles cases where value might be: string, number, {id: x}, {value: x}, {name: x}, etc.
 */
function extractPrimitiveValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Already a primitive
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // It's an object - try to extract the actual value
  if (typeof value === "object") {
    // Try common Jira field value patterns
    if (value.id !== undefined && typeof value.id !== "object") {
      return String(value.id);
    }
    if (value.value !== undefined && typeof value.value !== "object") {
      return String(value.value);
    }
    if (value.name !== undefined && typeof value.name !== "object") {
      return String(value.name);
    }
    if (value.key !== undefined && typeof value.key !== "object") {
      return String(value.key);
    }
    if (value.accountId !== undefined) {
      return String(value.accountId);
    }

    // If it's an array with one item, extract from that
    if (Array.isArray(value) && value.length === 1) {
      return extractPrimitiveValue(value[0]);
    }

    // Last resort - try to find any string/number property
    for (const key of Object.keys(value)) {
      const v = value[key];
      if (typeof v === "string" || typeof v === "number") {
        console.warn(
          `[extractPrimitiveValue] Using fallback key "${key}" for value:`,
          value,
        );
        return String(v);
      }
    }

    console.error(
      "[extractPrimitiveValue] Could not extract primitive from:",
      value,
    );
    return "";
  }

  return String(value);
}

/**
 * Parse Jira error messages to extract field names that are required.
 * Handles messages like "Please enter a value for the Team and Epic Link fields"
 */
function parseJiraErrorForMissingFields(errorMessage: string): string[] {
  const missingFields: string[] = [];

  // Pattern 1: "Please enter a value for the X and Y fields"
  // Pattern 2: "Please enter a value for the X field"
  const valuePattern = /Please enter a value for the (.+?) fields?/gi;
  let match = valuePattern.exec(errorMessage);

  while (match) {
    const fieldsPart = match[1];
    // Split by " and " to handle multiple fields
    const fieldNames = fieldsPart.split(/\s+and\s+/i);
    for (const name of fieldNames) {
      // Also split by comma in case of "A, B and C"
      const subNames = name.split(/,\s*/);
      for (const subName of subNames) {
        const trimmed = subName.trim();
        if (trimmed) {
          missingFields.push(trimmed);
        }
      }
    }
    match = valuePattern.exec(errorMessage);
  }

  // Pattern 3: Check for "X is required" patterns
  const requiredPattern = /['"]?([^'"]+)['"]?\s+is required/gi;
  match = requiredPattern.exec(errorMessage);
  while (match) {
    const fieldName = match[1].trim();
    if (fieldName && !missingFields.includes(fieldName)) {
      missingFields.push(fieldName);
    }
    match = requiredPattern.exec(errorMessage);
  }

  // Pattern 4: Check errors object keys if they exist in the error JSON
  try {
    const jsonMatch = errorMessage.match(/\{[\s\S]*"errors"[\s\S]*\}/);
    if (jsonMatch) {
      const errorJson = JSON.parse(jsonMatch[0]);
      if (errorJson.errors && typeof errorJson.errors === "object") {
        for (const fieldKey of Object.keys(errorJson.errors)) {
          if (!missingFields.includes(fieldKey)) {
            missingFields.push(fieldKey);
          }
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return missingFields;
}

/**
 * Find field keys by their display names.
 * Matches case-insensitively and handles partial matches.
 */
function findFieldKeysByNames(
  fields: NormalizedJiraField[],
  names: string[],
): Set<string> {
  const matchedKeys = new Set<string>();

  for (const name of names) {
    const lowerName = name.toLowerCase();
    for (const field of fields) {
      // Exact match on name
      if (field.name.toLowerCase() === lowerName) {
        matchedKeys.add(field.key);
        continue;
      }
      // Check if field name contains the search name (for "Epic Link" matching "Epic Link (CP)")
      if (field.name.toLowerCase().includes(lowerName)) {
        matchedKeys.add(field.key);
        continue;
      }
      // Check if search name contains the field name
      if (lowerName.includes(field.name.toLowerCase())) {
        matchedKeys.add(field.key);
      }
    }
  }

  return matchedKeys;
}

// Map issue type names to icons
const issueTypeIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="w-5 h-5" />,
  story: <FileText className="w-5 h-5" />,
  task: <Settings className="w-5 h-5" />,
  feature: <Sparkles className="w-5 h-5" />,
  epic: <Sparkles className="w-5 h-5" />,
};

function getIssueTypeIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  return issueTypeIcons[lower] || <FileText className="w-5 h-5" />;
}

// Autocomplete input component
function AutocompleteInput({
  field,
  value,
  displayValue,
  onChange,
  onSelect,
  hasError,
  requestHeaders,
}: {
  field: NormalizedJiraField;
  value: string;
  displayValue: string;
  onChange: (value: string, display: string) => void;
  onSelect: (id: string, display: string) => void;
  hasError: boolean;
  requestHeaders?: HeadersInit;
}) {
  const [query, setQuery] = useState(displayValue || "");
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for options
  const searchOptions = useCallback(async (searchQuery: string) => {
    // Allow empty query for Epic/Team fields to show recent/all options
    const isSpecialField = field.name.toLowerCase().includes("epic") ||
      field.name.toLowerCase() === "team" ||
      field.key?.toLowerCase().includes("epic");

    if (!searchQuery.trim() && !isSpecialField) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/ac/jira?action=search&field=${
          encodeURIComponent(field.name)
        }&fieldKey=${encodeURIComponent(field.key || "")}&query=${
          encodeURIComponent(searchQuery)
        }`,
        { headers: requestHeaders },
      );
      const data = await response.json();
      if (data.results) {
        setOptions(data.results);
      }
    } catch (error) {
      console.error("Failed to search field values:", error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [field.name, field.key, requestHeaders]);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange("", newQuery); // Clear the ID when typing
    setIsOpen(true);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchOptions(newQuery);
    }, 300);
  };

  const handleSelect = (option: AutocompleteOption) => {
    setQuery(option.name);
    onSelect(option.id, option.name);
    setIsOpen(false);
  };

  const baseInputClasses =
    `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            // For special fields like Epic/Team, trigger search on focus even with empty query
            const isSpecialField = field.name.toLowerCase().includes("epic") ||
              field.name.toLowerCase() === "team" ||
              field.key?.toLowerCase().includes("epic");
            if (query.trim() || isSpecialField) {
              searchOptions(query);
            }
          }}
          placeholder={field.placeholder || `Search for ${field.name}...`}
          className={`${baseInputClasses} pr-10`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (options.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
        >
          {isLoading && options.length === 0
            ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )
            : options.length === 0
            ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No results found
              </div>
            )
            : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-medium text-gray-900">
                    {option.name}
                  </span>
                  {option.id !== option.name && (
                    <span className="text-gray-500 ml-2">({option.id})</span>
                  )}
                </button>
              ))
            )}
        </div>
      )}

      {/* Show selected value indicator */}
      {value && (
        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Selected: {displayValue || value}
        </div>
      )}
    </div>
  );
}

export function JiraFeedbackMenu({
  targetElement,
  containerElement,
  position,
  onClose,
  onSubmit,
}: JiraFeedbackMenuProps) {
  const [step, setStep] = useState<
    | "loading"
    | "configure"
    | "type-selection"
    | "form"
    | "submitting"
    | "success"
    | "error"
  >("loading");
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedType, setSelectedType] = useState<JiraIssueType | null>(null);
  const [fields, setFields] = useState<NormalizedJiraField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  // Track fields that Jira requires conditionally (based on other field values)
  const [conditionallyRequiredFields, setConditionallyRequiredFields] =
    useState<Set<string>>(new Set());
  // Store the URL of the created issue for display in success view
  const [createdIssueUrl, setCreatedIssueUrl] = useState<string | null>(null);
  // Track if backend is configured
  const [backendConfigured, setBackendConfigured] = useState<boolean | null>(
    null,
  );
  // Credential form state
  const [credentialForm, setCredentialForm] = useState<JiraCredentials>({
    jiraUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
  });
  const [showApiToken, setShowApiToken] = useState(false);
  const [credentialErrors, setCredentialErrors] = useState<
    Record<string, string>
  >({});

  // Use preferences hook
  const {
    preferences,
    saveCredentials,
    saveFieldDefaults,
    getFieldDefaults,
    hasCredentials,
  } = useJiraPreferences();

  // Build headers with session credentials if needed
  const getRequestHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {};
    if (!backendConfigured && preferences.credentials) {
      headers["x-jira-credentials"] = JSON.stringify(preferences.credentials);
    }
    return headers;
  }, [backendConfigured, preferences.credentials]);

  // Fetch issue types (with credential support)
  const fetchIssueTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/ac/jira?action=issue-types", {
        headers: getRequestHeaders(),
      });
      const data = await response.json();

      if (data.error) {
        setLoadError(data.error);
        setStep("error");
        return false;
      }

      setIssueTypes(data.issueTypes || []);
      return true;
    } catch (error) {
      console.error("Failed to fetch issue types:", error);
      setLoadError(
        "Failed to connect to Jira. Please check your configuration.",
      );
      setStep("error");
      return false;
    }
  }, [getRequestHeaders]);

  // Check configuration and load issue types on mount
  useEffect(() => {
    async function checkConfigAndLoad() {
      try {
        // First check if backend is configured
        const statusResponse = await fetch("/api/ac/jira?action=status");
        const statusData = await statusResponse.json();
        const isBackendConfigured = statusData.configured;
        setBackendConfigured(isBackendConfigured);

        if (isBackendConfigured) {
          // Backend is configured, fetch issue types directly
          const success = await fetchIssueTypes();
          if (success) {
            // Check if we have a remembered issue type to auto-select
            if (preferences.lastIssueType) {
              // We'll handle auto-select in type-selection, just go there
              setStep("type-selection");
            } else {
              setStep("type-selection");
            }
          }
        } else if (hasCredentials) {
          // No backend config but we have session credentials
          const success = await fetchIssueTypes();
          if (success) {
            setStep("type-selection");
          }
        } else {
          // No backend config and no session credentials - show configure step
          setStep("configure");
        }
      } catch (error) {
        console.error("Failed to check config:", error);
        setLoadError("Failed to connect to Jira API");
        setStep("error");
      }
    }

    checkConfigAndLoad();
  }, [fetchIssueTypes, hasCredentials, preferences.lastIssueType]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 200);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Check if a field needs autocomplete
  const needsAutocomplete = (field: NormalizedJiraField): boolean => {
    const lowerName = field.name.toLowerCase();
    const lowerKey = field.key?.toLowerCase() || "";

    // Fields with autoCompleteUrl need autocomplete
    if (field.autoCompleteUrl) return true;

    // User fields need autocomplete
    if (field.type === "user") return true;

    // Epic Link fields need autocomplete (search for Epic issues)
    if (lowerName.includes("epic") || lowerKey.includes("epic")) return true;

    // Team fields need autocomplete
    if (lowerName === "team" || lowerName.includes("team")) return true;

    // Fields without options that are not simple text types
    if (!field.options && ["user", "array"].includes(field.type)) return true;

    return false;
  };

  // Fetch fields for selected issue type
  const fetchFieldsForType = useCallback(async (issueType: JiraIssueType) => {
    setFieldsLoading(true);
    try {
      const response = await fetch(
        `/api/ac/jira?action=fields&issueType=${
          encodeURIComponent(issueType.name)
        }&includeOptional=true`,
        { headers: getRequestHeaders() },
      );
      const data = await response.json();

      if (data.error) {
        console.error("Failed to fetch fields:", data.error);
        setLoadError(data.error);
        return;
      }

      const fetchedFields = data.fields as NormalizedJiraField[];
      setFields(fetchedFields);

      // Log fetched fields for debugging
      console.log("\n========== JIRA FEEDBACK MENU - FIELDS LOADED ==========");
      console.log("[JiraMenu] Total fields fetched:", fetchedFields.length);
      console.log(
        "[JiraMenu] Required fields:",
        fetchedFields.filter((f) => f.required).map((f) => ({
          key: f.key,
          name: f.name,
          type: f.type,
          hasOptions: !!f.options?.length,
        })),
      );
      console.log(
        "[JiraMenu] Optional fields:",
        fetchedFields.filter((f) => !f.required).length,
      );

      // Get remembered defaults for this issue type
      const {
        fields: rememberedFields,
        displayValues: rememberedDisplayValues,
      } = getFieldDefaults(issueType.name);
      console.log("[JiraMenu] Remembered field defaults:", rememberedFields);

      // Initialize form data with defaults, remembered values, and auto-selected values
      const initialData: Record<string, any> = {
        // Always include summary with element context
        summary: `Issue with ${
          targetElement?.tagName.toLowerCase() || "element"
        } element`,
        // Pre-fill description with rich context
        description: generateContextDescription(
          targetElement,
          containerElement,
        ),
      };

      // Initialize display values with remembered values
      const initialDisplayValues: Record<string, string> = {
        ...rememberedDisplayValues,
      };

      // Apply defaults from fields, then override with remembered values
      for (const field of fetchedFields) {
        // First check if we have a remembered value for this field
        if (rememberedFields[field.key] !== undefined) {
          initialData[field.key] = rememberedFields[field.key];
          console.log(
            `[JiraMenu] Restored ${field.key} from memory:`,
            rememberedFields[field.key],
          );
        } else if (field.defaultValue !== undefined) {
          initialData[field.key] = field.defaultValue;
          console.log(
            `[JiraMenu] Auto-filled ${field.key} with default:`,
            field.defaultValue,
          );
        } // Auto-select if there's only one option
        else if (field.options?.length === 1) {
          initialData[field.key] = field.options[0].id;
          console.log(
            `[JiraMenu] Auto-selected ${field.key} (single option):`,
            field.options[0].id,
          );
        } // Auto-select "Medium" priority if available
        else if (field.name.toLowerCase() === "priority" && field.options) {
          const medium = field.options.find(
            (o) =>
              o.label.toLowerCase().includes("medium") ||
              o.value.toLowerCase().includes("medium"),
          );
          if (medium) {
            initialData[field.key] = medium.id;
            console.log(
              `[JiraMenu] Auto-selected ${field.key} (medium priority):`,
              medium.id,
            );
          }
        }
      }

      console.log("[JiraMenu] Initial form data:", initialData);
      setFormData(initialData);
      setDisplayValues(initialDisplayValues);
      setShowOptionalFields(false);
      setConditionallyRequiredFields(new Set()); // Reset conditional requirements
      setErrors({}); // Clear any previous errors
      setStep("form");
    } catch (error) {
      console.error("Failed to fetch fields:", error);
      setLoadError("Failed to load form fields");
    } finally {
      setFieldsLoading(false);
    }
  }, [targetElement, containerElement, getRequestHeaders, getFieldDefaults]);

  const handleTypeSelect = (type: JiraIssueType) => {
    setSelectedType(type);
    setErrors({});
    fetchFieldsForType(type);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Always require summary
    if (!formData.summary?.trim()) {
      newErrors.summary = "Summary is required";
    }

    // Validate required fields (including conditionally required ones)
    for (const field of fields) {
      const isRequired = field.required ||
        conditionallyRequiredFields.has(field.key);
      if (isRequired) {
        const value = formData[field.key];
        if (value === undefined || value === null || value === "") {
          newErrors[field.key] = `${field.name} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("\n========== JIRA FEEDBACK MENU - SUBMIT ==========");
    console.log("[JiraMenu] Validating form...");
    console.log("[JiraMenu] Current form data:", formData);
    console.log(
      "[JiraMenu] Required fields:",
      fields.filter((f) => f.required).map((f) => ({
        key: f.key,
        name: f.name,
        value: formData[f.key],
        hasValue: formData[f.key] !== undefined && formData[f.key] !== null &&
          formData[f.key] !== "",
      })),
    );

    if (!validateForm() || !selectedType) {
      console.log("[JiraMenu] Validation failed, errors:", errors);
      return;
    }

    console.log("[JiraMenu] Validation passed, submitting...");
    setStep("submitting");

    try {
      // Format custom fields for Jira API
      const customFields: Record<string, any> = {};

      for (const field of fields) {
        const value = formData[field.key];
        if (value === undefined || value === null || value === "") {
          console.log(`[JiraMenu] Skipping empty field: ${field.key}`);
          continue;
        }

        // Extract the primitive value first (handles cases where value is already an object)
        const primitiveValue = extractPrimitiveValue(value);
        console.log(
          `[JiraMenu] Field ${field.key}: raw=${
            JSON.stringify(value)
          }, primitive="${primitiveValue}"`,
        );

        if (!primitiveValue) {
          console.log(
            `[JiraMenu] Skipping field ${field.key} - no primitive value extracted`,
          );
          continue;
        }

        // Format based on field type and key
        // Priority is a special case - Jira expects { name: "Name" }
        if (field.key === "priority") {
          const option = field.options?.find((o) =>
            o.id === primitiveValue || o.value === primitiveValue ||
            o.label === primitiveValue
          );
          if (option) {
            // Use the label (display name) for priority
            customFields[field.key] = { name: option.label };
          } else {
            // Fallback - use the value directly as the name
            customFields[field.key] = { name: primitiveValue };
          }
          console.log(
            `[JiraMenu] Formatted priority field:`,
            customFields[field.key],
          );
          continue;
        }

        // Format based on field type
        switch (field.type) {
          case "select":
            // Check if it matches an option
            const option = field.options?.find((o) =>
              o.id === primitiveValue || o.value === primitiveValue
            );
            if (option) {
              // Use the option's ID
              customFields[field.key] = { id: option.id };
            } else {
              // For autocomplete fields, value is already the ID
              customFields[field.key] = { id: primitiveValue };
            }
            console.log(
              `[JiraMenu] Formatted select field ${field.key}:`,
              customFields[field.key],
            );
            break;

          case "multiselect":
            // Handle array of values
            const arrayValue = Array.isArray(value) ? value : [value];
            customFields[field.key] = arrayValue.map((v) => {
              const pv = extractPrimitiveValue(v);
              const opt = field.options?.find((o) =>
                o.id === pv || o.value === pv
              );
              return opt ? { id: opt.id } : { id: pv };
            }).filter((item) => item.id); // Remove empty items
            break;

          case "number":
            const numValue = parseFloat(primitiveValue);
            if (!isNaN(numValue)) {
              customFields[field.key] = numValue;
            }
            break;

          case "boolean":
            customFields[field.key] = primitiveValue === "true" ||
              primitiveValue === "1";
            break;

          case "user":
            customFields[field.key] = { accountId: primitiveValue };
            break;

          case "array":
            // Array fields (like labels) - pass as strings
            if (Array.isArray(value)) {
              customFields[field.key] = value.map((v) =>
                extractPrimitiveValue(v)
              ).filter(Boolean);
            } else {
              customFields[field.key] = [primitiveValue];
            }
            break;

          case "text":
          case "textarea":
            // Text fields - pass as string
            customFields[field.key] = primitiveValue;
            break;

          default:
            // For any other field type, check if it looks like it needs object format
            // Custom fields with autocomplete typically need { id: "string" } format
            if (field.autoCompleteUrl || field.schema?.custom) {
              customFields[field.key] = { id: primitiveValue };
              console.log(
                `[JiraMenu] Formatted custom/autocomplete field ${field.key}:`,
                customFields[field.key],
              );
            } else {
              customFields[field.key] = primitiveValue;
            }
        }
      }

      console.log(
        "[JiraMenu] Final custom fields to submit:",
        JSON.stringify(customFields, null, 2),
      );

      const result = await onSubmit(
        selectedType.name.toLowerCase(),
        formData.description || "",
        {
          summary: formData.summary,
          ...customFields,
        },
      );

      // Store the created issue URL if available
      if (result?.url) {
        setCreatedIssueUrl(result.url);
      }

      // Save field values for future auto-fill (exclude description/summary as they're context-specific)
      const fieldsToSave = { ...formData };
      delete fieldsToSave.summary;
      delete fieldsToSave.description;
      saveFieldDefaults(selectedType.name, fieldsToSave, displayValues);
      console.log(
        "[JiraMenu] Saved field defaults for",
        selectedType.name,
        fieldsToSave,
      );

      setStep("success");
    } catch (error) {
      console.error("Failed to submit:", error);
      setStep("form");

      const rawErrorMessage = error instanceof Error
        ? error.message
        : "Failed to create issue";
      const newErrors: Record<string, string> = {};
      let missingFieldNames: string[] = [];
      let displayMessage = rawErrorMessage;

      // Try to parse structured error data from the API
      try {
        const errorData = JSON.parse(rawErrorMessage);
        if (errorData.message) {
          displayMessage = errorData.message;
        }
        if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
          missingFieldNames = errorData.missingFields;
          console.log(
            "[JiraMenu] Missing fields from API:",
            missingFieldNames,
          );
        }
      } catch {
        // Not JSON, try to parse from error message string
        missingFieldNames = parseJiraErrorForMissingFields(rawErrorMessage);
        console.log(
          "[JiraMenu] Parsed missing fields from message:",
          missingFieldNames,
        );
      }

      // If we have missing field names, find and mark them as required
      if (missingFieldNames.length > 0) {
        // Find the field keys that match these names
        const matchedKeys = findFieldKeysByNames(fields, missingFieldNames);
        console.log("[JiraMenu] Matched field keys:", Array.from(matchedKeys));

        if (matchedKeys.size > 0) {
          const matchedKeysArray = Array.from(matchedKeys);

          // Update conditionally required fields
          setConditionallyRequiredFields((prev) => {
            const updated = new Set(prev);
            matchedKeysArray.forEach((key) => updated.add(key));
            return updated;
          });

          // Add errors for the missing fields
          matchedKeysArray.forEach((key) => {
            const field = fields.find((f) => f.key === key);
            if (field) {
              newErrors[key] = `${field.name} is required`;
            }
          });

          // Auto-expand optional fields section if any missing fields are in there
          const optionalFields = fields.filter((f) => !f.required);
          const hasOptionalMissing = optionalFields.some((f) =>
            matchedKeys.has(f.key)
          );
          if (hasOptionalMissing) {
            setShowOptionalFields(true);
          }

          // Create user-friendly error message
          newErrors.submit = `Please fill in the required fields: ${
            missingFieldNames.join(", ")
          }`;
        } else {
          // Couldn't match field names to known fields - show original error
          newErrors.submit = displayMessage;
        }
      } else {
        // No missing fields identified - show the error message
        newErrors.submit = displayMessage;
      }

      setErrors(newErrors);

      // Log the errors for debugging
      console.log("[JiraMenu] Submission errors:", newErrors);
    }
  };

  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Loading Jira Configuration...
        </h3>
        <p className="text-sm text-gray-600">Fetching available issue types</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Configuration Error
        </h3>
        <p className="text-sm text-gray-600 mb-4">{loadError}</p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  const validateCredentials = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!credentialForm.jiraUrl.trim()) {
      newErrors.jiraUrl = "Jira URL is required";
    } else if (!credentialForm.jiraUrl.includes("atlassian.net")) {
      newErrors.jiraUrl =
        "Please enter a valid Atlassian URL (e.g., https://your-company.atlassian.net)";
    }

    if (!credentialForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!credentialForm.email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!credentialForm.apiToken.trim()) {
      newErrors.apiToken = "API Token is required";
    }

    if (!credentialForm.projectKey.trim()) {
      newErrors.projectKey = "Project Key is required";
    } else if (
      !/^[A-Z][A-Z0-9]*$/.test(credentialForm.projectKey.toUpperCase())
    ) {
      newErrors.projectKey =
        "Project key should be uppercase letters (e.g., PROJ)";
    }

    setCredentialErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCredentials = async () => {
    if (!validateCredentials()) return;

    // Normalize credentials
    const normalizedCreds: JiraCredentials = {
      jiraUrl: credentialForm.jiraUrl.trim().replace(/\/$/, ""), // Remove trailing slash
      email: credentialForm.email.trim(),
      apiToken: credentialForm.apiToken.trim(),
      projectKey: credentialForm.projectKey.trim().toUpperCase(),
    };

    // Save to session storage
    saveCredentials(normalizedCreds);

    // Try to fetch issue types with the new credentials
    setStep("loading");
    const success = await fetchIssueTypes();
    if (success) {
      setStep("type-selection");
    } else {
      // If failed, go back to configure step
      setStep("configure");
      setCredentialErrors({
        submit: "Failed to connect to Jira. Please check your credentials.",
      });
    }
  };

  const renderConfigure = () => (
    <div className="p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-blue-900">
            Configure Jira
          </h3>
          <p className="text-sm text-gray-600">
            Enter your Jira credentials to get started
          </p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong>{" "}
          Your credentials are stored in this browser session only and are not
          saved to any server. They will be cleared when you close this tab.
        </p>
      </div>

      <div className="space-y-4">
        {/* Jira URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jira URL
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="url"
            value={credentialForm.jiraUrl}
            onChange={(e) =>
              setCredentialForm({ ...credentialForm, jiraUrl: e.target.value })}
            placeholder="https://your-company.atlassian.net"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              credentialErrors.jiraUrl ? "border-red-500" : "border-gray-300"
            }`}
          />
          {credentialErrors.jiraUrl && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.jiraUrl}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="email"
            value={credentialForm.email}
            onChange={(e) =>
              setCredentialForm({ ...credentialForm, email: e.target.value })}
            placeholder="your-email@company.com"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              credentialErrors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {credentialErrors.email && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.email}
            </p>
          )}
        </div>

        {/* API Token */}
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
              className="text-blue-600 hover:underline"
            >
              Create an API token
            </a>{" "}
            in your Atlassian account settings
          </p>
          <div className="relative">
            <input
              type={showApiToken ? "text" : "password"}
              value={credentialForm.apiToken}
              onChange={(e) =>
                setCredentialForm({
                  ...credentialForm,
                  apiToken: e.target.value,
                })}
              placeholder="Enter your API token"
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                credentialErrors.apiToken ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowApiToken(!showApiToken)}
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

        {/* Project Key */}
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
            value={credentialForm.projectKey}
            onChange={(e) =>
              setCredentialForm({
                ...credentialForm,
                projectKey: e.target.value.toUpperCase(),
              })}
            placeholder="PROJ"
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase ${
              credentialErrors.projectKey ? "border-red-500" : "border-gray-300"
            }`}
          />
          {credentialErrors.projectKey && (
            <p className="text-xs text-red-500 mt-1">
              {credentialErrors.projectKey}
            </p>
          )}
        </div>

        {/* Submit Error */}
        {credentialErrors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{credentialErrors.submit}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleClose}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveCredentials}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Connect to Jira
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderTypeSelection = () => {
    // Sort issue types to put last used one first
    const sortedIssueTypes = [...issueTypes].sort((a, b) => {
      if (a.name === preferences.lastIssueType) return -1;
      if (b.name === preferences.lastIssueType) return 1;
      return 0;
    });

    return (
      <div className="p-4 sm:p-6">
        <h3 className="text-xl font-semibold mb-2 text-blue-900">
          Report to Jira
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the type of issue you&apos;d like to create
        </p>

        {issueTypes.length === 0
          ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No issue types available</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {sortedIssueTypes.map((type) => {
                const isLastUsed = type.name === preferences.lastIssueType;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                      isLastUsed
                        ? "border-blue-400 bg-blue-50 hover:border-blue-500 hover:bg-blue-100"
                        : "border-blue-100 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          isLastUsed
                            ? "bg-blue-200 text-blue-700"
                            : "bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700"
                        }`}
                      >
                        {getIssueTypeIcon(type.name)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                          {type.name}
                          {isLastUsed && (
                            <span className="text-xs font-normal bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                              Last used
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {type.description || `Create a ${type.name} issue`}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 mt-2" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </div>
    );
  };

  const renderFieldInput = (field: NormalizedJiraField) => {
    const value = formData[field.key] ?? "";
    const hasError = !!errors[field.key];

    const baseInputClasses =
      `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
        hasError ? "border-red-500" : "border-gray-300"
      }`;

    // Check if this field needs autocomplete
    if (needsAutocomplete(field)) {
      return (
        <AutocompleteInput
          field={field}
          value={value}
          displayValue={displayValues[field.key] || ""}
          onChange={(id, display) => {
            setFormData({ ...formData, [field.key]: id });
            setDisplayValues({ ...displayValues, [field.key]: display });
          }}
          onSelect={(id, display) => {
            setFormData({ ...formData, [field.key]: id });
            setDisplayValues({ ...displayValues, [field.key]: display });
          }}
          hasError={hasError}
          requestHeaders={getRequestHeaders()}
        />
      );
    }

    switch (field.type) {
      case "select":
        return (
          <select
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            className={baseInputClasses}
          >
            <option value="">Select {field.name}</option>
            {field.options?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) =>
                o.value);
              setFormData({ ...formData, [field.key]: selected });
            }}
            className={`${baseInputClasses} min-h-[100px]`}
          >
            {field.options?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} resize-none`}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`field-${field.key}`}
              checked={value === true || value === "true"}
              onChange={(e) =>
                setFormData({ ...formData, [field.key]: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor={`field-${field.key}`}
              className="text-sm text-gray-700"
            >
              {field.placeholder || "Yes"}
            </label>
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            className={baseInputClasses}
          />
        );

      case "datetime":
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            className={baseInputClasses}
          />
        );

      case "text":
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  const renderForm = () => {
    if (!selectedType) return null;

    // Separate required and optional fields
    // Fields that are conditionally required (from Jira validation) should also appear as required
    const requiredFields = fields.filter(
      (f) => f.required || conditionallyRequiredFields.has(f.key),
    );
    const optionalFields = fields.filter(
      (f) => !f.required && !conditionallyRequiredFields.has(f.key),
    );

    // Check if a field is conditionally required (for special styling)
    const isConditionallyRequired = (field: NormalizedJiraField) =>
      !field.required && conditionallyRequiredFields.has(field.key);

    return (
      <div className="flex flex-col h-full">
        {/* Form Header */}
        <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-gray-100">
          <button
            onClick={() => setStep("type-selection")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              {getIssueTypeIcon(selectedType.name)}
            </div>
            <h3 className="text-lg font-semibold text-blue-900">
              {selectedType.name}
            </h3>
          </div>
        </div>

        {fieldsLoading
          ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )
          : (
            <>
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-5">
                  {/* Summary - Always first */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Summary
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      A brief title for this issue
                    </p>
                    <input
                      type="text"
                      value={formData.summary || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Brief description of the issue"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        errors.summary ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.summary && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.summary}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Detailed explanation of the issue
                    </p>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })}
                      placeholder="Describe the issue, steps to reproduce, expected behavior..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                    />
                  </div>

                  {/* Required Fields */}
                  {requiredFields.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">
                          Required Fields
                          {conditionallyRequiredFields.size > 0 && (
                            <span className="ml-2 text-xs font-normal text-amber-600">
                              (some fields required by Jira configuration)
                            </span>
                          )}
                        </h4>
                      </div>
                      {requiredFields.map((field) => (
                        <div
                          key={field.key}
                          className={isConditionallyRequired(field)
                            ? "p-3 -mx-3 rounded-lg bg-amber-50 border border-amber-200"
                            : ""}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.name}
                            <span className="text-red-500 ml-1">*</span>
                            {isConditionallyRequired(field) && (
                              <span className="ml-2 text-xs font-normal text-amber-600">
                                (required by Jira)
                              </span>
                            )}
                          </label>
                          {field.description && (
                            <p className="text-xs text-gray-500 mb-2">
                              {field.description}
                            </p>
                          )}
                          {renderFieldInput(field)}
                          {errors[field.key] && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors[field.key]}
                            </p>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Element Context Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Element Context
                    </h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <div>
                        <strong>Tag:</strong>{" "}
                        {targetElement?.tagName.toLowerCase()}
                      </div>
                      <div>
                        <strong>Selector:</strong>{" "}
                        {targetElement?.getAttribute("data-testid") ||
                          targetElement?.id || "N/A"}
                      </div>
                      <div>
                        <strong>Page:</strong> {typeof window !== "undefined"
                          ? window.location.pathname
                          : ""}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Screenshots and full context will be automatically
                      attached to the Jira issue.
                    </p>
                  </div>

                  {/* Optional Fields Toggle */}
                  {optionalFields.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShowOptionalFields(!showOptionalFields)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">
                            Optional Fields
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
                        <div className="mt-4 space-y-5">
                          {optionalFields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.name}
                              </label>
                              {field.description && (
                                <p className="text-xs text-gray-500 mb-2">
                                  {field.description}
                                </p>
                              )}
                              {renderFieldInput(field)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-700 mb-2">
                            {errors.submit}
                          </p>
                          {/* Show field-specific errors */}
                          {Object.entries(errors).filter(([k]) =>
                                k !== "submit" && k !== "summary"
                              ).length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium text-red-600">
                                Field errors:
                              </p>
                              {Object.entries(errors)
                                .filter(([k]) =>
                                  k !== "submit" && k !== "summary"
                                )
                                .map(([fieldKey, errorMsg]) => (
                                  <p
                                    key={fieldKey}
                                    className="text-xs text-red-600"
                                  >
                                    • <strong>{fieldKey}</strong>: {errorMsg}
                                  </p>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-100 bg-white">
                <button
                  onClick={() => setStep("type-selection")}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Create Issue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
      </div>
    );
  };

  const renderSubmitting = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Creating Jira Issue...
        </h3>
        <p className="text-sm text-gray-600">
          Uploading screenshots and submitting to Jira
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-emerald-900 mb-2">
          Issue Created!
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your feedback has been submitted to Jira
        </p>
        {createdIssueUrl && (
          <a
            href={createdIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            View in Jira
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
          onClick={handleClose}
          className="mt-4 block mx-auto text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-[9999] transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed z-[10000] bg-white shadow-2xl flex flex-col
          transition-transform duration-200 ease-out
          
          /* Mobile: Full screen */
          inset-0
          
          /* Desktop: Pinned to right */
          sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[450px] sm:border-l sm:border-gray-200
          
          ${
          isClosing ? "translate-x-full sm:translate-x-full" : "translate-x-0"
        }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.5 0L0 11.5L11.5 23L23 11.5L11.5 0ZM11.5 18.5L5.5 11.5L11.5 4.5L17.5 11.5L11.5 18.5Z" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-blue-900 text-lg">
                Jira Feedback
              </span>
              <p className="text-xs text-blue-600">
                Report issues & request features
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-blue-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-blue-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {step === "loading" && renderLoading()}
          {step === "configure" && renderConfigure()}
          {step === "error" && renderError()}
          {step === "type-selection" && renderTypeSelection()}
          {step === "form" && renderForm()}
          {step === "submitting" && renderSubmitting()}
          {step === "success" && renderSuccess()}
        </div>
      </div>
    </>
  );
}
