"use client";

import { createContext, type ReactNode, useContext } from "react";

export interface JiraFeedbackConfig {
  /**
   * The base API endpoint for Jira operations.
   * Defaults to "/api/ac/jira"
   */
  apiEndpoint?: string;
}

const defaultConfig: JiraFeedbackConfig = {
  apiEndpoint: "/api/ac/jira",
};

const JiraFeedbackContext = createContext<JiraFeedbackConfig>(defaultConfig);

export interface JiraFeedbackProviderProps {
  /**
   * Configuration options for the Jira feedback components
   */
  config?: JiraFeedbackConfig;
  children: ReactNode;
}

/**
 * Provider component that configures Jira feedback settings for child components.
 *
 * @example
 * ```tsx
 * <JiraFeedbackProvider config={{ apiEndpoint: "/api/my-jira" }}>
 *   <JiraFeedbackMenu {...props} />
 * </JiraFeedbackProvider>
 * ```
 */
export function JiraFeedbackProvider({
  config,
  children,
}: JiraFeedbackProviderProps) {
  const mergedConfig: JiraFeedbackConfig = {
    ...defaultConfig,
    ...config,
  };

  return (
    <JiraFeedbackContext.Provider value={mergedConfig}>
      {children}
    </JiraFeedbackContext.Provider>
  );
}

/**
 * Hook to access Jira feedback configuration from the nearest provider.
 * Returns default configuration if no provider is present.
 */
export function useJiraFeedbackConfig(): JiraFeedbackConfig {
  return useContext(JiraFeedbackContext);
}

/**
 * Get the resolved API endpoint, with prop override taking precedence over provider config.
 */
export function getApiEndpoint(
  propEndpoint?: string,
  contextConfig?: JiraFeedbackConfig,
): string {
  return propEndpoint || contextConfig?.apiEndpoint ||
    defaultConfig.apiEndpoint!;
}
