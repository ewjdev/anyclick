import React, { useCallback, useEffect, useState } from "react";
import {
  type CaptureStatus,
  DEFAULTS,
  DEFAULT_T3CHAT_SYSTEM_PROMPT,
  STORAGE_KEYS,
} from "../types";
import { Header } from "./components/Header";
import { SettingsSection } from "./components/SettingsSection";
import { StatusBanner } from "./components/StatusBanner";
import { T3ChatAdapter, UploadThingAdapter } from "./components/adapters";
import { Button, Separator } from "./components/ui";
import { useStorageMulti } from "./hooks/useStorage";

// Storage keys and defaults
const STORAGE_KEYS_ARRAY = [
  STORAGE_KEYS.ENABLED,
  STORAGE_KEYS.ENDPOINT,
  STORAGE_KEYS.TOKEN,
  STORAGE_KEYS.LAST_CAPTURE,
  STORAGE_KEYS.LAST_STATUS,
  STORAGE_KEYS.UPLOADTHING_ENABLED,
  STORAGE_KEYS.UPLOADTHING_ENDPOINT,
  STORAGE_KEYS.UPLOADTHING_API_KEY,
  STORAGE_KEYS.T3CHAT_ENABLED,
  STORAGE_KEYS.T3CHAT_BASE_URL,
  STORAGE_KEYS.T3CHAT_AUTO_REFINE,
  STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT,
  STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT,
  STORAGE_KEYS.CUSTOM_MENU_OVERRIDE,
];

const DEFAULT_VALUES = {
  [STORAGE_KEYS.ENABLED]: DEFAULTS.ENABLED,
  [STORAGE_KEYS.ENDPOINT]: DEFAULTS.ENDPOINT,
  [STORAGE_KEYS.TOKEN]: DEFAULTS.TOKEN,
  [STORAGE_KEYS.LAST_CAPTURE]: "",
  [STORAGE_KEYS.LAST_STATUS]: "",
  [STORAGE_KEYS.UPLOADTHING_ENABLED]: DEFAULTS.UPLOADTHING_ENABLED,
  [STORAGE_KEYS.UPLOADTHING_ENDPOINT]: DEFAULTS.UPLOADTHING_ENDPOINT,
  [STORAGE_KEYS.UPLOADTHING_API_KEY]: DEFAULTS.UPLOADTHING_API_KEY,
  [STORAGE_KEYS.T3CHAT_ENABLED]: DEFAULTS.T3CHAT_ENABLED,
  [STORAGE_KEYS.T3CHAT_BASE_URL]: DEFAULTS.T3CHAT_BASE_URL,
  [STORAGE_KEYS.T3CHAT_AUTO_REFINE]: DEFAULTS.T3CHAT_AUTO_REFINE,
  [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: "",
  [STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT]: DEFAULTS.T3CHAT_REFINE_ENDPOINT,
  [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: DEFAULTS.CUSTOM_MENU_OVERRIDE,
};

export function PopupApp() {
  const [settings, setSettings, loading] = useStorageMulti(
    STORAGE_KEYS_ARRAY,
    DEFAULT_VALUES,
  );

  const [contentLive, setContentLive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSettings, setSavedSettings] = useState<Record<string, unknown>>(
    {},
  );
  const [toast, setToast] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);

  // Shorthand accessors
  const enabled = settings[STORAGE_KEYS.ENABLED] as boolean;
  const endpoint = settings[STORAGE_KEYS.ENDPOINT] as string;
  const token = settings[STORAGE_KEYS.TOKEN] as string;
  const customMenuOverride = settings[
    STORAGE_KEYS.CUSTOM_MENU_OVERRIDE
  ] as boolean;
  const uploadthingEnabled = settings[
    STORAGE_KEYS.UPLOADTHING_ENABLED
  ] as boolean;
  const uploadthingEndpoint = settings[
    STORAGE_KEYS.UPLOADTHING_ENDPOINT
  ] as string;
  const uploadthingApiKey = settings[
    STORAGE_KEYS.UPLOADTHING_API_KEY
  ] as string;
  const t3chatEnabled = settings[STORAGE_KEYS.T3CHAT_ENABLED] as boolean;
  const t3chatBaseUrl = settings[STORAGE_KEYS.T3CHAT_BASE_URL] as string;
  const t3chatAutoRefine = settings[STORAGE_KEYS.T3CHAT_AUTO_REFINE] as boolean;
  const t3chatSystemPrompt = settings[
    STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT
  ] as string;
  const t3chatRefineEndpoint = settings[
    STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT
  ] as string;
  const lastCapture = settings[STORAGE_KEYS.LAST_CAPTURE] as string;
  const lastStatus = settings[STORAGE_KEYS.LAST_STATUS] as string;

  // Check content script liveness
  const checkContentLiveness = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        setContentLive(true);
        return;
      }
      chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          setContentLive(false);
        } else {
          setContentLive(true);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      checkContentLiveness();
      // Initialize saved settings when first loaded
      if (Object.keys(savedSettings).length === 0) {
        setSavedSettings({ ...settings });
      }
    }
  }, [loading, checkContentLiveness, settings, savedSettings]);

  // Notify active tab on enable change
  const handleEnabledChange = useCallback(
    async (newEnabled: boolean) => {
      await setSettings({ [STORAGE_KEYS.ENABLED]: newEnabled });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) {
          chrome.tabs
            .sendMessage(tabId, {
              type: "SET_ENABLED_STATE",
              enabled: newEnabled,
            })
            .catch(() => {});
        }
      });
      checkContentLiveness();
    },
    [setSettings, checkContentLiveness],
  );

  // Refresh active tab
  const handleRefresh = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      const handleUpdated = (
        updatedTabId: number,
        info: chrome.tabs.TabChangeInfo,
      ) => {
        if (updatedTabId !== tabId || info.status !== "complete") return;

        chrome.tabs.onUpdated.removeListener(handleUpdated);

        // Allow the refreshed tab a moment to re-inject the content script,
        // then re-check liveness so the warning can clear.
        setTimeout(checkContentLiveness, 200);
      };

      chrome.tabs.onUpdated.addListener(handleUpdated);
      chrome.tabs.reload(tabId);
    });
  }, [checkContentLiveness]);

  // Show toast
  const showToast = useCallback((message: string, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Validate URL
  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Save settings
  const handleSave = useCallback(async () => {
    // Validate URLs
    if (endpoint && !isValidUrl(endpoint)) {
      showToast("Invalid capture endpoint URL", true);
      return;
    }
    if (uploadthingEndpoint && !isValidUrl(uploadthingEndpoint)) {
      showToast("Invalid UploadThing endpoint URL", true);
      return;
    }
    if (t3chatBaseUrl && !isValidUrl(t3chatBaseUrl)) {
      showToast("Invalid T3.chat URL", true);
      return;
    }
    if (t3chatRefineEndpoint && !isValidUrl(t3chatRefineEndpoint)) {
      showToast("Invalid refine endpoint URL", true);
      return;
    }
    if (t3chatSystemPrompt.length > 1000) {
      showToast("System prompt too long (max 1000 chars)", true);
      return;
    }

    setSaving(true);
    try {
      const settingsToSave = {
        [STORAGE_KEYS.ENDPOINT]: endpoint,
        [STORAGE_KEYS.TOKEN]: token,
        [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: customMenuOverride,
        [STORAGE_KEYS.UPLOADTHING_ENABLED]: uploadthingEnabled,
        [STORAGE_KEYS.UPLOADTHING_ENDPOINT]: uploadthingEndpoint,
        [STORAGE_KEYS.UPLOADTHING_API_KEY]: uploadthingApiKey,
        [STORAGE_KEYS.T3CHAT_ENABLED]: t3chatEnabled,
        [STORAGE_KEYS.T3CHAT_BASE_URL]:
          t3chatBaseUrl || DEFAULTS.T3CHAT_BASE_URL,
        [STORAGE_KEYS.T3CHAT_AUTO_REFINE]: t3chatAutoRefine,
        [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: t3chatSystemPrompt,
        [STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT]:
          t3chatRefineEndpoint || DEFAULTS.T3CHAT_REFINE_ENDPOINT,
      };
      await setSettings(settingsToSave);
      setSavedSettings({ ...settings, ...settingsToSave });
      showToast("Settings saved!");
      checkContentLiveness();
    } catch {
      showToast("Failed to save settings", true);
    } finally {
      setSaving(false);
    }
  }, [
    endpoint,
    token,
    customMenuOverride,
    uploadthingEnabled,
    uploadthingEndpoint,
    uploadthingApiKey,
    t3chatEnabled,
    t3chatBaseUrl,
    t3chatAutoRefine,
    t3chatSystemPrompt,
    t3chatRefineEndpoint,
    setSettings,
    showToast,
    checkContentLiveness,
  ]);

  // Test T3Chat endpoint
  const handleTestT3ChatEndpoint = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "REFINE_PROMPT",
        selectedText: "test",
        context: "Test connection",
        systemPrompt: "Just respond with 'OK'",
        refineEndpoint: t3chatRefineEndpoint,
        timestamp: new Date().toISOString(),
      });
      return { success: response?.success ?? false, error: response?.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, [t3chatRefineEndpoint]);

  // Reset T3Chat system prompt
  const handleResetSystemPrompt = useCallback(() => {
    setSettings({
      [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: DEFAULT_T3CHAT_SYSTEM_PROMPT,
    });
    showToast("System prompt reset to default");
  }, [setSettings, showToast]);

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "None";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  // Parse status
  const parsedStatus = (() => {
    if (!lastStatus) return { message: "Ready", success: true };
    try {
      return JSON.parse(lastStatus) as CaptureStatus;
    } catch {
      return { message: "Ready", success: true };
    }
  })();

  // Check if settings are dirty (have unsaved changes)
  const isDirty = (() => {
    if (Object.keys(savedSettings).length === 0) return false;
    const relevantKeys = [
      STORAGE_KEYS.ENDPOINT,
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.CUSTOM_MENU_OVERRIDE,
      STORAGE_KEYS.UPLOADTHING_ENABLED,
      STORAGE_KEYS.UPLOADTHING_ENDPOINT,
      STORAGE_KEYS.UPLOADTHING_API_KEY,
      STORAGE_KEYS.T3CHAT_ENABLED,
      STORAGE_KEYS.T3CHAT_BASE_URL,
      STORAGE_KEYS.T3CHAT_AUTO_REFINE,
      STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT,
      STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT,
    ];
    return relevantKeys.some((key) => {
      const current = settings[key];
      const saved = savedSettings[key];
      // Handle empty string vs default values
      if (key === STORAGE_KEYS.T3CHAT_BASE_URL) {
        const currentVal = current || DEFAULTS.T3CHAT_BASE_URL;
        const savedVal = saved || DEFAULTS.T3CHAT_BASE_URL;
        return currentVal !== savedVal;
      }
      if (key === STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT) {
        const currentVal = current || DEFAULTS.T3CHAT_REFINE_ENDPOINT;
        const savedVal = saved || DEFAULTS.T3CHAT_REFINE_ENDPOINT;
        return currentVal !== savedVal;
      }
      return current !== saved;
    });
  })();

  if (loading) {
    return (
      <div
        data-anyclick-root
        className="ac:w-[380px] ac:min-h-[400px] ac:bg-surface ac:text-text ac:flex ac:items-center ac:justify-center"
      >
        <div className="ac:text-sm ac:text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div
      data-anyclick-root
      className="ac:w-[380px] ac:min-h-[600px] ac:max-h-[600px] ac:bg-surface ac:text-text ac:flex ac:flex-col ac:overflow-hidden"
    >
      <Header enabled={enabled} onEnabledChange={handleEnabledChange} />

      {!contentLive && (
        <StatusBanner
          message="We couldn't reach the content script on this page. The extension may have reloaded. Refresh to re-enable the custom menu."
          onRefresh={handleRefresh}
        />
      )}

      <div className="ac:flex-1 ac:overflow-y-auto">
        <div className="ac:p-4 ac:space-y-4">
          {/* Status */}
          <div className="ac:flex ac:items-center ac:justify-between ac:text-xs">
            <div className="ac:flex ac:items-center ac:gap-2">
              <span className="ac:text-text-muted">Last capture:</span>
              <span className="ac:text-text">
                {formatRelativeTime(lastCapture)}
              </span>
            </div>
            <div className="ac:flex ac:items-center ac:gap-2">
              <span className="ac:text-text-muted">Status:</span>
              <span
                className={
                  parsedStatus.success
                    ? "ac:text-green-400"
                    : "ac:text-destructive"
                }
              >
                {parsedStatus.message}
              </span>
            </div>
          </div>

          <Separator />

          {/* General Settings */}
          <SettingsSection
            endpoint={endpoint}
            token={token}
            customMenuOverride={customMenuOverride}
            onEndpointChange={(v) =>
              setSettings({ [STORAGE_KEYS.ENDPOINT]: v })
            }
            onTokenChange={(v) => setSettings({ [STORAGE_KEYS.TOKEN]: v })}
            onCustomMenuOverrideChange={(v) =>
              setSettings({ [STORAGE_KEYS.CUSTOM_MENU_OVERRIDE]: v })
            }
            disabled={!enabled}
          />

          <Separator />

          {/* Adapters */}
          <div className="ac:space-y-2">
            <h2 className="ac:text-sm ac:font-semibold ac:text-text">
              Integrations
            </h2>
            <div className="ac:space-y-2">
              <T3ChatAdapter
                enabled={t3chatEnabled}
                baseUrl={t3chatBaseUrl}
                autoRefine={t3chatAutoRefine}
                systemPrompt={t3chatSystemPrompt}
                refineEndpoint={t3chatRefineEndpoint}
                onEnabledChange={(v) =>
                  setSettings({ [STORAGE_KEYS.T3CHAT_ENABLED]: v })
                }
                onBaseUrlChange={(v) =>
                  setSettings({ [STORAGE_KEYS.T3CHAT_BASE_URL]: v })
                }
                onAutoRefineChange={(v) =>
                  setSettings({ [STORAGE_KEYS.T3CHAT_AUTO_REFINE]: v })
                }
                onSystemPromptChange={(v) =>
                  setSettings({ [STORAGE_KEYS.T3CHAT_SYSTEM_PROMPT]: v })
                }
                onRefineEndpointChange={(v) =>
                  setSettings({ [STORAGE_KEYS.T3CHAT_REFINE_ENDPOINT]: v })
                }
                onResetSystemPrompt={handleResetSystemPrompt}
                onTestEndpoint={handleTestT3ChatEndpoint}
                disabled={!enabled}
                defaultSystemPrompt={DEFAULT_T3CHAT_SYSTEM_PROMPT}
              />

              <UploadThingAdapter
                enabled={uploadthingEnabled}
                endpoint={uploadthingEndpoint}
                apiKey={uploadthingApiKey}
                onEnabledChange={(v) =>
                  setSettings({ [STORAGE_KEYS.UPLOADTHING_ENABLED]: v })
                }
                onEndpointChange={(v) =>
                  setSettings({ [STORAGE_KEYS.UPLOADTHING_ENDPOINT]: v })
                }
                onApiKeyChange={(v) =>
                  setSettings({ [STORAGE_KEYS.UPLOADTHING_API_KEY]: v })
                }
                disabled={!enabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Pinned to bottom */}
      <div className="ac:flex-shrink-0 ac:p-4 ac:border-t ac:border-border ac:bg-surface">
        <Button
          className={`ac:w-full ac:transition-all ${
            isDirty
              ? "ac:bg-accent-muted hover:ac:bg-accent-muted/90 ac:border-accent/30"
              : ""
          }`}
          onClick={handleSave}
          disabled={!enabled || saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`ac:fixed ac:bottom-4 ac:left-4 ac:right-4 ac:p-3 ac:rounded-lg ac:text-sm ac:text-center ac:transition-all ac:duration-300 ${
            toast.error
              ? "ac:bg-destructive ac:text-white"
              : "ac:bg-accent ac:text-accent-foreground"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
