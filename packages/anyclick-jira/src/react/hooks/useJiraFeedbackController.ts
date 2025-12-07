"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NormalizedJiraField } from "../../types";
import {
  extractPrimitiveValue,
  findFieldKeysByNames,
  generateContextDescription,
  parseJiraErrorForMissingFields,
  sanitizeErrorMessage,
} from "../utils/jiraHelpers";
import { useJiraPreferences } from "./useJiraPreferences";
import { getApiEndpoint, useJiraFeedbackConfig } from "../JiraFeedbackContext";
import type {
  FieldErrorMap,
  JiraCredentials,
  JiraFeedbackMenuProps,
  JiraIssueType,
  StepState,
} from "../types";

const normalizeJiraUrl = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    // Ensure protocol so URL parsing works, then keep only the origin
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const parsed = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    return `${parsed.origin.replace(/\/+$/, "")}/`;
  } catch {
    // Fallback: strip trailing slashes/backslashes and add a single slash
    return `${trimmed.replace(/[\\/]+$/, "")}/`;
  }
};

export function useJiraFeedbackController({
  targetElement,
  containerElement,
  onClose,
  onSubmit,
  apiEndpoint: propApiEndpoint,
}: JiraFeedbackMenuProps) {
  const contextConfig = useJiraFeedbackConfig();
  const apiEndpoint = getApiEndpoint(propApiEndpoint, contextConfig);

  const [step, setStep] = useState<StepState>("loading");
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedType, setSelectedType] = useState<JiraIssueType | null>(null);
  const [fields, setFields] = useState<NormalizedJiraField[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    {},
  );
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<
    "forward" | "backward"
  >("forward");
  const [conditionallyRequiredFields, setConditionallyRequiredFields] =
    useState<Set<string>>(new Set());
  const [createdIssueUrl, setCreatedIssueUrl] = useState<string | null>(null);
  const [backendConfigured, setBackendConfigured] = useState<boolean | null>(
    null,
  );
  const [useSessionCredentials, setUseSessionCredentials] = useState(false);
  const [credentialForm, setCredentialForm] = useState<JiraCredentials>({
    jiraUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
  });
  const [showApiToken, setShowApiToken] = useState(false);
  const [credentialErrors, setCredentialErrors] = useState<FieldErrorMap>({});

  const {
    preferences,
    saveCredentials,
    saveFieldDefaults,
    getFieldDefaults,
    hasCredentials,
  } = useJiraPreferences();

  const getRequestHeaders = useCallback(
    (overrideCredentials?: JiraCredentials): HeadersInit => {
      const headers: HeadersInit = {};
      const creds = overrideCredentials || preferences.credentials;
      if (
        (useSessionCredentials || !backendConfigured || overrideCredentials) &&
        creds
      ) {
        headers["x-jira-credentials"] = JSON.stringify(creds);
      }
      return headers;
    },
    [backendConfigured, useSessionCredentials, preferences.credentials],
  );

  const fetchIssueTypes = useCallback(
    async (overrideCredentials?: JiraCredentials) => {
      try {
        const response = await fetch(`${apiEndpoint}?action=issue-types`, {
          headers: getRequestHeaders(overrideCredentials),
        });
        const data = await response.json();

        if (data.error) {
          setLoadError(sanitizeErrorMessage(data.error));
          setStep("error");
          return false;
        }

        setIssueTypes(data.issueTypes || []);
        return true;
      } catch (error) {
        console.error("Failed to fetch issue types:", error);
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        setLoadError(sanitizeErrorMessage(errorMessage));
        setStep("error");
        return false;
      }
    },
    [apiEndpoint, getRequestHeaders],
  );

  const animateToStep = useCallback(
    (nextStep: StepState, direction: "forward" | "backward" = "forward") => {
      setAnimationDirection(direction);
      setIsAnimating(true);
      setTimeout(() => {
        setStep(nextStep);
        setTimeout(() => setIsAnimating(false), 50);
      }, 150);
    },
    [],
  );

  useEffect(() => {
    async function checkConfigAndLoad() {
      try {
        const statusResponse = await fetch(`${apiEndpoint}?action=status`);
        const statusData = await statusResponse.json();
        const isBackendConfigured = statusData.configured;
        setBackendConfigured(isBackendConfigured);

        if (isBackendConfigured) {
          const success = await fetchIssueTypes();
          if (success) setStep("type-selection");
        } else if (hasCredentials) {
          setUseSessionCredentials(true);
          const success = await fetchIssueTypes(preferences.credentials!);
          if (success) setStep("type-selection");
        } else {
          setStep("configure");
        }
      } catch (error) {
        console.error("Failed to check config:", error);
        setLoadError("Failed to connect to Jira API");
        setStep("error");
      }
    }

    checkConfigAndLoad();
  }, [apiEndpoint, fetchIssueTypes, hasCredentials, preferences.credentials]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 200);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const fetchFieldsForType = useCallback(
    async (issueType: JiraIssueType) => {
      setFieldsLoading(true);
      try {
        const response = await fetch(
          `${apiEndpoint}?action=fields&issueType=${
            encodeURIComponent(
              issueType.name,
            )
          }&includeOptional=true`,
          { headers: getRequestHeaders() },
        );
        const data = await response.json();

        if (data.error) {
          console.error("Failed to fetch fields:", data.error);
          setLoadError(sanitizeErrorMessage(data.error));
          setStep("error");
          return;
        }

        const fetchedFields = data.fields as NormalizedJiraField[];
        setFields(fetchedFields);

        const {
          fields: rememberedFields,
          displayValues: rememberedDisplayValues,
        } = getFieldDefaults(issueType.name);

        const initialData: Record<string, unknown> = {
          summary: `Issue with ${
            targetElement?.tagName.toLowerCase() || "element"
          } element`,
          description: "",
        };

        const initialDisplayValues: Record<string, string> = {
          ...rememberedDisplayValues,
        };

        for (const field of fetchedFields) {
          if (rememberedFields[field.key] !== undefined) {
            initialData[field.key] = rememberedFields[field.key];
          } else if (field.defaultValue !== undefined) {
            initialData[field.key] = field.defaultValue;
          } else if (field.options?.length === 1) {
            initialData[field.key] = field.options[0].id;
          } else if (field.name.toLowerCase() === "priority" && field.options) {
            const medium = field.options.find(
              (option) =>
                option.label.toLowerCase().includes("medium") ||
                option.value.toLowerCase().includes("medium"),
            );
            if (medium) {
              initialData[field.key] = medium.id;
            }
          }
        }

        setFormData(initialData);
        setDisplayValues(initialDisplayValues);
        setShowOptionalFields(false);
        setConditionallyRequiredFields(new Set());
        setErrors({});
        setCurrentFieldIndex(0);
        setStep("summary");
      } catch (error) {
        console.error("Failed to fetch fields:", error);
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        setLoadError(sanitizeErrorMessage(errorMessage));
        setStep("error");
      } finally {
        setFieldsLoading(false);
      }
    },
    [apiEndpoint, targetElement, getRequestHeaders, getFieldDefaults],
  );

  const handleTypeSelect = useCallback(
    (type: JiraIssueType) => {
      setStep("loading");
      setSelectedType(type);
      setErrors({});
      fetchFieldsForType(type);
    },
    [fetchFieldsForType],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (
      !formData.summary ||
      (typeof formData.summary === "string" && !formData.summary.trim())
    ) {
      newErrors.summary = "Summary is required";
    }

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
  }, [conditionallyRequiredFields, fields, formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedType) return;

    setStep("submitting");

    try {
      const customFields: Record<string, unknown> = {};

      for (const field of fields) {
        const value = formData[field.key];
        if (value === undefined || value === null || value === "") continue;

        const primitiveValue = extractPrimitiveValue(value);
        if (!primitiveValue) continue;

        if (field.key === "priority") {
          const option = field.options?.find(
            (opt) =>
              opt.id === primitiveValue ||
              opt.value === primitiveValue ||
              opt.label === primitiveValue,
          );
          customFields[field.key] = {
            name: option ? option.label : primitiveValue,
          };
          continue;
        }

        switch (field.type) {
          case "select": {
            const option = field.options?.find(
              (opt) =>
                opt.id === primitiveValue || opt.value === primitiveValue,
            );
            customFields[field.key] = {
              id: option ? option.id : primitiveValue,
            };
            break;
          }
          case "multiselect": {
            const arrayValue = Array.isArray(value) ? value : [value];
            customFields[field.key] = arrayValue
              .map((item) => {
                const primitive = extractPrimitiveValue(item);
                const option = field.options?.find(
                  (opt) => opt.id === primitive || opt.value === primitive,
                );
                return option ? { id: option.id } : { id: primitive };
              })
              .filter((item) => item.id);
            break;
          }
          case "number": {
            const numValue = parseFloat(primitiveValue);
            if (!Number.isNaN(numValue)) {
              customFields[field.key] = numValue;
            }
            break;
          }
          case "boolean": {
            customFields[field.key] = primitiveValue === "true" ||
              primitiveValue === "1";
            break;
          }
          case "user": {
            customFields[field.key] = { accountId: primitiveValue };
            break;
          }
          case "array": {
            if (Array.isArray(value)) {
              customFields[field.key] = value
                .map((item) => extractPrimitiveValue(item))
                .filter(Boolean);
            } else {
              customFields[field.key] = [primitiveValue];
            }
            break;
          }
          case "text":
          case "textarea": {
            customFields[field.key] = primitiveValue;
            break;
          }
          default: {
            if (field.autoCompleteUrl || field.schema?.custom) {
              customFields[field.key] = { id: primitiveValue };
            } else {
              customFields[field.key] = primitiveValue;
            }
          }
        }
      }

      const contextInfo = generateContextDescription(
        targetElement,
        containerElement,
      );
      const userDescription = typeof formData.description === "string"
        ? formData.description.trim()
        : "";
      const fullDescription = userDescription
        ? `${contextInfo}${userDescription}`
        : contextInfo.replace("**Issue Description:**\n", "");

      const result = await onSubmit(
        selectedType.name.toLowerCase(),
        fullDescription,
        { summary: formData.summary, ...customFields },
        useSessionCredentials ? preferences.credentials : undefined,
      );

      if (result?.url) {
        setCreatedIssueUrl(result.url);
      }

      const fieldsToSave = { ...formData };
      delete fieldsToSave.summary;
      delete fieldsToSave.description;
      saveFieldDefaults(
        selectedType.name,
        fieldsToSave,
        displayValues,
      );

      setStep("success");
    } catch (error) {
      console.error("Failed to submit:", error);
      setStep("review");

      const rawErrorMessage = error instanceof Error
        ? error.message
        : "Failed to create issue";
      const newErrors: Record<string, string> = {};
      let missingFieldNames: string[] = [];
      let displayMessage = rawErrorMessage;

      try {
        const errorData = JSON.parse(rawErrorMessage);
        if (errorData.message) {
          displayMessage = errorData.message;
        }
        if (Array.isArray(errorData.missingFields)) {
          missingFieldNames = errorData.missingFields;
        }
      } catch {
        missingFieldNames = parseJiraErrorForMissingFields(rawErrorMessage);
      }

      if (missingFieldNames.length > 0) {
        const matchedKeys = findFieldKeysByNames(fields, missingFieldNames);
        if (matchedKeys.size > 0) {
          const matchedKeysArray = Array.from(matchedKeys);
          setConditionallyRequiredFields((prev) => {
            const updated = new Set(prev);
            matchedKeysArray.forEach((key) => updated.add(key));
            return updated;
          });

          matchedKeysArray.forEach((key) => {
            const field = fields.find((f) => f.key === key);
            if (field) {
              newErrors[key] = `${field.name} is required`;
            }
          });

          const optionalFieldsList = fields.filter((field) => !field.required);
          const hasOptionalMissing = optionalFieldsList.some((field) =>
            matchedKeys.has(field.key)
          );
          if (hasOptionalMissing) {
            setShowOptionalFields(true);
          }

          newErrors.submit = `Please fill in the required fields: ${
            missingFieldNames.join(
              ", ",
            )
          }`;
        } else {
          newErrors.submit = displayMessage;
        }
      } else {
        newErrors.submit = displayMessage;
      }

      setErrors(newErrors);
    }
  }, [
    validateForm,
    selectedType,
    fields,
    formData,
    targetElement,
    containerElement,
    onSubmit,
    useSessionCredentials,
    preferences.credentials,
    saveFieldDefaults,
    displayValues,
  ]);

  const handleReconfigure = useCallback(() => {
    if (preferences.credentials) {
      setCredentialForm(preferences.credentials);
    }
    setCredentialErrors({});
    setLoadError(null);
    setStep("configure");
  }, [preferences.credentials]);

  const validateCredentials = useCallback((): boolean => {
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
  }, [credentialForm]);

  const handleSaveCredentials = useCallback(async () => {
    if (!validateCredentials()) return;

    const normalizedJiraUrl = normalizeJiraUrl(credentialForm.jiraUrl);

    const normalizedCreds: JiraCredentials = {
      jiraUrl: normalizedJiraUrl,
      email: credentialForm.email.trim(),
      apiToken: credentialForm.apiToken.trim(),
      projectKey: credentialForm.projectKey.trim().toUpperCase(),
    };

    setStep("loading");
    const success = await fetchIssueTypes(normalizedCreds);
    if (success) {
      saveCredentials(normalizedCreds);
      setUseSessionCredentials(true);
      setStep("type-selection");
    } else {
      setStep("configure");
      setCredentialErrors({
        submit: "Failed to connect to Jira. Please check your credentials.",
      });
    }
  }, [credentialForm, fetchIssueTypes, saveCredentials, validateCredentials]);

  const requiredFields = useMemo(
    () =>
      fields.filter(
        (field) => field.required || conditionallyRequiredFields.has(field.key),
      ),
    [conditionallyRequiredFields, fields],
  );

  const optionalFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          !field.required && !conditionallyRequiredFields.has(field.key),
      ),
    [conditionallyRequiredFields, fields],
  );

  const animationClass = isAnimating
    ? animationDirection === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  const getTotalSteps = useCallback(
    () => 2 + requiredFields.length + 1,
    [requiredFields.length],
  );

  const getCurrentStepNumber = useCallback(() => {
    switch (step) {
      case "summary":
        return 1;
      case "description":
        return 2;
      case "required-fields":
        return 3 + currentFieldIndex;
      case "review":
        return getTotalSteps();
      default:
        return 0;
    }
  }, [currentFieldIndex, getTotalSteps, step]);

  const handleFieldChange = useCallback(
    (key: string, value: unknown, display?: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (display !== undefined) {
        setDisplayValues((prev) => ({ ...prev, [key]: display }));
      }
    },
    [],
  );

  const handleRequiredNext = useCallback(() => {
    const currentField = requiredFields[currentFieldIndex];
    if (!currentField) {
      animateToStep("review", "forward");
      return;
    }
    if (!formData[currentField.key]) {
      setErrors({
        [currentField.key]:
          `Please select a ${currentField.name.toLowerCase()}`,
      });
      return;
    }
    setErrors({});
    if (currentFieldIndex < requiredFields.length - 1) {
      setCurrentFieldIndex((prev) => prev + 1);
      animateToStep("required-fields", "forward");
    } else {
      animateToStep("review", "forward");
    }
  }, [animateToStep, currentFieldIndex, formData, requiredFields]);

  const handleRequiredBack = useCallback(() => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex((prev) => prev - 1);
      animateToStep("required-fields", "backward");
    } else {
      animateToStep("description", "backward");
    }
  }, [animateToStep, currentFieldIndex]);

  const handleReviewBack = useCallback(() => {
    if (requiredFields.length > 0) {
      setCurrentFieldIndex(requiredFields.length - 1);
      animateToStep("required-fields", "backward");
    } else {
      animateToStep("description", "backward");
    }
  }, [animateToStep, requiredFields.length]);

  return {
    state: {
      step,
      issueTypes,
      selectedType,
      fields,
      formData,
      displayValues,
      errors,
      loadError,
      isClosing,
      fieldsLoading,
      showOptionalFields,
      currentFieldIndex,
      animationClass,
      getCurrentStepNumber,
      getTotalSteps,
      requiredFields,
      optionalFields,
      createdIssueUrl,
      preferences,
      credentialForm,
      credentialErrors,
      showApiToken,
      useSessionCredentials,
      backendConfigured,
      hasCredentials,
    },
    handlers: {
      animateToStep,
      handleTypeSelect,
      handleFieldChange,
      handleRequiredNext,
      handleRequiredBack,
      handleReviewBack,
      handleSubmit,
      handleSaveCredentials,
      handleReconfigure,
      handleClose: () => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 200);
      },
      setShowOptionalFields,
      setCredentialForm,
      setShowApiToken,
      setErrors,
      setFormData,
      setStep,
      setCurrentFieldIndex,
    },
    helpers: {
      getRequestHeaders,
    },
  };
}
