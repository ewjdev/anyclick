"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  ExternalLink,
  Image,
  Loader2,
  MousePointer2,
  Sparkles,
  Tag,
  Ticket,
  XCircle,
} from "lucide-react";
import { CodeBlock } from "@/components/CodePreview";
import { AnyclickProvider, type ContextMenuItem } from "@ewjdev/anyclick-react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { JiraFeedbackMenu } from "@ewjdev/anyclick-jira/react";

// Create HTTP adapter for Jira submissions
const jiraAdapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

interface AdapterStatus {
  configured: boolean;
  missing: string[];
  hint: string;
}

interface ConfigStatus {
  adapters: {
    jira: AdapterStatus;
    github: AdapterStatus;
  };
  ready: boolean;
}

export default function JiraIntegrationPage() {
  const [customMenuVisible, setCustomMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [containerElement, setContainerElement] = useState<Element | null>(
    null,
  );

  const [lastSubmission, setLastSubmission] = useState<
    {
      success: boolean;
      results?: Array<{ adapter: string; success: boolean; url?: string }>;
      error?: string;
    } | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Check adapter configuration on mount
  useEffect(() => {
    async function checkConfig() {
      try {
        // Check Jira status from dedicated Jira API
        const jiraResponse = await fetch("/api/ac/jira?action=status");
        const jiraStatus = await jiraResponse.json();

        // Also check general feedback API for GitHub status
        const feedbackResponse = await fetch("/api/feedback");
        const feedbackStatus = await feedbackResponse.json();

        setConfigStatus({
          adapters: {
            jira: {
              configured: jiraStatus.configured,
              missing: jiraStatus.missing || [],
              hint: jiraStatus.hint || "",
            },
            github: feedbackStatus.adapters?.github || {
              configured: false,
              missing: ["GITHUB_TOKEN"],
              hint: "",
            },
          },
          ready: jiraStatus.configured ||
            feedbackStatus.adapters?.github?.configured,
        });
      } catch (error) {
        console.error("Failed to check config:", error);
      } finally {
        setConfigLoading(false);
      }
    }
    checkConfig();
  }, []);

  // Custom menu items that open our Jira-specific menu
  const jiraMenuItems: ContextMenuItem[] = [
    {
      type: "bug",
      label: "Report Bug to Jira",
      icon: <Bug className="w-4 h-4" />,
      showComment: false,
      onClick: ({ targetElement, containerElement, closeMenu }) => {
        const rect = targetElement?.getBoundingClientRect();
        if (rect) {
          setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
          setTargetElement(targetElement);
          setContainerElement(containerElement);
          setCustomMenuVisible(true);
        }
        closeMenu();
        return false; // Prevent default submission
      },
    },
    {
      type: "feature",
      label: "Request Feature in Jira",
      icon: <Sparkles className="w-4 h-4" />,
      showComment: false,
      onClick: ({ targetElement, containerElement, closeMenu }) => {
        const rect = targetElement?.getBoundingClientRect();
        if (rect) {
          setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
          setTargetElement(targetElement);
          setContainerElement(containerElement);
          setCustomMenuVisible(true);
        }
        closeMenu();
        return false; // Prevent default submission
      },
    },
  ];

  const handleJiraSubmit = async (
    type: string,
    comment: string,
    customFields: Record<string, any>,
    credentials?: {
      jiraUrl: string;
      email: string;
      apiToken: string;
      projectKey: string;
    },
  ) => {
    setIsSubmitting(true);
    // Don't close the menu yet - wait for the response
    // setCustomMenuVisible(false);

    try {
      // Get element bounding rect
      const rect = targetElement?.getBoundingClientRect();

      // Extract data attributes from target element
      const dataAttributes: Record<string, string> = {};
      if (targetElement) {
        Array.from(targetElement.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-")) {
            dataAttributes[attr.name.replace("data-", "")] = attr.value;
          }
        });
      }

      // Build headers - include credentials if provided
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (credentials) {
        headers["x-jira-credentials"] = JSON.stringify(credentials);
      }

      // Create a complete payload matching AnyclickPayload interface
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type,
          comment,
          element: {
            selector: targetElement?.getAttribute("data-testid")
              ? `[data-testid="${targetElement.getAttribute("data-testid")}"]`
              : targetElement?.tagName.toLowerCase() || "unknown",
            tag: targetElement?.tagName.toLowerCase() || "unknown",
            id: targetElement?.id || "",
            classes: Array.from(targetElement?.classList || []),
            dataAttributes,
            innerText: targetElement?.textContent?.slice(0, 500) || "",
            outerHTML: targetElement?.outerHTML?.slice(0, 2000) || "",
            boundingRect: {
              top: rect?.top || 0,
              left: rect?.left || 0,
              width: rect?.width || 0,
              height: rect?.height || 0,
            },
            ancestors: [],
          },
          page: {
            url: window.location.href,
            title: document.title,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            screen: {
              width: window.screen.width,
              height: window.screen.height,
            },
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer || "",
          },
          metadata: customFields,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastSubmission({
          success: true,
          results: result.results,
        });
        // Return the URL so JiraFeedbackMenu can display it
        const jiraResult = result.results?.find(
          (r: { adapter: string }) => r.adapter === "Jira",
        );
        return { url: jiraResult?.url };
      } else {
        // Extract missing fields from Jira failures
        const jiraFailure = result.failures?.find(
          (f: { adapter: string }) => f.adapter === "Jira",
        );
        const missingFields = jiraFailure?.missingFields || [];

        // Create error with structured data encoded in it
        const errorData = {
          message: result.error || "Failed to create issue",
          missingFields,
        };
        throw new Error(JSON.stringify(errorData));
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to submit";
      setLastSubmission({
        success: false,
        error: errorMessage,
      });
      // Re-throw so JiraFeedbackMenu can handle error display
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">Jira Integration</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Jira Integration with Custom Forms
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          A production-ready Jira integration with custom styled menus and
          multi-step forms for collecting all required Jira fields before
          submission.
        </p>
      </div>

      {/* Configuration Status */}
      {!configLoading && configStatus &&
        !configStatus.adapters.jira.configured && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-red-300">
                Jira Not Configured
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                The following environment variables are missing from your{" "}
                <code className="text-cyan-400">.env.local</code> file:
              </p>
              <ul className="space-y-1 mb-3">
                {configStatus.adapters.jira.missing.map((varName) => (
                  <li key={varName} className="text-sm font-mono text-red-300">
                    • {varName}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-400">
                Add these variables and restart the dev server to test the Jira
                integration.
              </p>
            </div>
          </div>
        </div>
      )}

      {!configLoading && configStatus?.adapters.jira.configured && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">
              Jira is configured and ready to receive feedback!
            </span>
          </div>
        </div>
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-blue-300">Creating Jira issue...</span>
        </div>
      )}

      {lastSubmission && !isSubmitting && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            lastSubmission.success
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-red-500/10 border-red-500/20"
          }`}
        >
          <div className="flex items-start gap-3">
            {lastSubmission.success
              ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )
              : (
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                {lastSubmission.success
                  ? "Jira issue created successfully!"
                  : "Failed to create Jira issue"}
              </h3>
              {lastSubmission.success && lastSubmission.results && (
                <div className="space-y-2">
                  {lastSubmission.results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span className="font-medium">{result.adapter}:</span>
                      {result.url
                        ? (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1"
                          >
                            View Issue
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )
                        : (
                          <span className="text-emerald-400">
                            Created successfully
                          </span>
                        )}
                    </div>
                  ))}
                </div>
              )}
              {lastSubmission.error && (
                <p className="text-sm text-red-300">{lastSubmission.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Demo Section - Scoped Anyclick with Custom Menu */}
      <AnyclickProvider
        adapter={jiraAdapter}
        menuItems={jiraMenuItems}
        scoped={true}
        screenshotConfig={{
          enabled: true,
          quality: 0.9,
        }}
        theme={{
          menuStyle: {
            "--anyclick-menu-bg": "#ffffff",
            "--anyclick-menu-text": "#1e3a8a",
            "--anyclick-menu-border": "#93c5fd",
            "--anyclick-menu-hover": "#dbeafe",
            "--anyclick-menu-accent": "#2563eb",
          } as React.CSSProperties,
        }}
      >
        <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-4">
            <MousePointer2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">
              Try It Now - Interactive Demo
            </h2>
          </div>
          <p className="text-gray-400 mb-6">
            Right-click on any of the elements below to open the custom Jira
            feedback menu. You&apos;ll see a multi-step form that collects all
            required Jira fields before submission.
          </p>

          <div className="space-y-4">
            {/* Demo Button */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all">
              <h3 className="font-semibold mb-2">Submit Button Example</h3>
              <p className="text-sm text-gray-400 mb-3">
                Right-click this button to report a bug with priority and
                severity fields
              </p>
              <button
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                data-testid="demo-submit-button"
              >
                Submit Form
              </button>
            </div>

            {/* Demo Input */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-blue-500/30 transition-all">
              <h3 className="font-semibold mb-2">Input Field Example</h3>
              <p className="text-sm text-gray-400 mb-3">
                Right-click this input to request a feature with business value
                justification
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                data-testid="demo-email-input"
              />
            </div>

            {/* Demo Card */}
            <div
              className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
              data-testid="demo-card"
            >
              <h3 className="font-semibold mb-2">Interactive Card</h3>
              <p className="text-sm text-gray-400 mb-3">
                Right-click anywhere on this card to see the custom Jira menu
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400">
                  Active
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                  Featured
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1 text-amber-300">
                  Configuration Required
                </h4>
                <p className="text-sm text-gray-400">
                  Make sure you have configured JIRA_URL, JIRA_EMAIL,
                  JIRA_API_TOKEN, and JIRA_PROJECT_KEY in your .env.local file
                  before testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnyclickProvider>

      {/* Custom Jira Menu Overlay */}
      {customMenuVisible && (
        <JiraFeedbackMenu
          targetElement={targetElement}
          containerElement={containerElement}
          position={menuPosition}
          onClose={() => setCustomMenuVisible(false)}
          onSubmit={handleJiraSubmit}
        />
      )}

      {/* Features Section */}
      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-400" />
          What&apos;s Included in This Example
        </h2>
        <ul className="space-y-3">
          {[
            { icon: Check, text: "Custom-styled Jira context menu" },
            {
              icon: Check,
              text: "Multi-step form for collecting required fields",
            },
            {
              icon: Check,
              text: "Priority, Severity, and Business Value fields",
            },
            { icon: Check, text: "Real-time validation and error handling" },
            { icon: Image, text: "Automatic screenshot capture and upload" },
            { icon: Tag, text: "Element context automatically included" },
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-gray-300 text-sm"
            >
              <item.icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Implementation Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Implementation Guide</h2>
        <p className="text-gray-400 mb-4">
          This example demonstrates how to create a custom Jira integration with
          a multi-step form that collects all required fields before submission.
        </p>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          1. Environment Setup
        </h3>
        <CodeBlock filename=".env.local">
          {`# Jira Cloud instance URL
JIRA_URL=https://your-company.atlassian.net

# Your Jira account email
JIRA_EMAIL=your-email@company.com

# Jira API token
JIRA_API_TOKEN=your-api-token-here

# Project key where issues will be created
JIRA_PROJECT_KEY=PROJ`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          2. Custom Menu Items
        </h3>
        <p className="text-gray-400 mb-4">
          Define menu items with custom onClick handlers that open your custom
          form:
        </p>
        <CodeBlock>
          {`const jiraMenuItems: ContextMenuItem[] = [
  {
    type: "bug",
    label: "Report Bug to Jira",
    icon: <Bug className="w-4 h-4" />,
    showComment: false,
    onClick: ({ targetElement, closeMenu }) => {
      // Open custom Jira form
      openCustomJiraForm(targetElement);
      closeMenu();
      return false; // Prevent default submission
    },
  },
];`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          3. Custom Styled Menu
        </h3>
        <p className="text-gray-400 mb-4">
          Apply custom styles to make the menu visually distinct for Jira:
        </p>
        <CodeBlock>
          {`<AnyclickProvider
  adapter={jiraAdapter}
  menuItems={jiraMenuItems}
  theme={{
    menuStyle: {
      "--anyclick-menu-bg": "#ffffff",
      "--anyclick-menu-text": "#1e3a8a",
      "--anyclick-menu-border": "#93c5fd",
      "--anyclick-menu-hover": "#dbeafe",
      "--anyclick-menu-accent": "#2563eb",
    },
  }}
>
  {children}
</AnyclickProvider>`}
        </CodeBlock>

        <h3 className="text-xl font-semibold mb-3 mt-6">
          4. Using the JiraFeedbackMenu Component
        </h3>
        <p className="text-gray-400 mb-4">
          Import and use the pre-built JiraFeedbackMenu component from the
          package:
        </p>
        <CodeBlock>
          {`import { JiraFeedbackMenu } from "@ewjdev/anyclick-jira/react";

// Render the menu when needed
{customMenuVisible && (
  <JiraFeedbackMenu
    targetElement={targetElement}
    containerElement={containerElement}
    position={menuPosition}
    onClose={() => setCustomMenuVisible(false)}
    onSubmit={handleJiraSubmit}
    // Optional: override the default API endpoint
    // apiEndpoint="/api/my-jira-endpoint"
  />
)}

// Or wrap with a provider for global config
import { JiraFeedbackProvider } from "@ewjdev/anyclick-jira/react";

<JiraFeedbackProvider config={{ apiEndpoint: "/api/ac/jira" }}>
  <App />
</JiraFeedbackProvider>`}
        </CodeBlock>
      </div>

      {/* Next steps */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20">
        <h3 className="font-semibold mb-2">
          Next: Explore More Examples
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Check out other integration examples and customization options.
        </p>
        <Link
          href="/examples/github-integration"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          GitHub Integration Example
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
