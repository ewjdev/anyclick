"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { CSSProperties, useMemo } from "react";
import { createHttpAdapter } from "@ewjdev/anyclick-github";
import { AnyclickProvider, type ContextMenuItem } from "@ewjdev/anyclick-react";
import { Check, Copy, FileCode, Terminal } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type TokenType =
  | "keyword"
  | "string"
  | "comment"
  | "function"
  | "variable"
  | "property"
  | "operator"
  | "punctuation"
  | "tag"
  | "attribute"
  | "number"
  | "plain";

interface Token {
  type: TokenType;
  value: string;
}

type CodePreviewVariant = "default" | "hero" | "terminal";

export interface CodePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The code content to display (preferred) */
  code?: string;
  /** Programming language for syntax highlighting */
  language?:
    | "typescript"
    | "javascript"
    | "bash"
    | "json"
    | "env"
    | "tsx"
    | "jsx"
    | "css";
  /** Optional filename to display in header */
  filename?: string;
  /** Visual variant */
  variant?: CodePreviewVariant;
  /** Show copy button */
  showCopy?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Custom label for terminal variant */
  terminalLabel?: string;
  /** @deprecated Use `code` prop instead. Kept for backward compatibility */
  children?: string;
}

// ============================================================================
// SYNTAX HIGHLIGHTING
// ============================================================================

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: "text-purple-400",
  string: "text-emerald-400",
  comment: "text-gray-500",
  function: "text-yellow-400",
  variable: "text-cyan-400",
  property: "text-cyan-300",
  operator: "text-gray-300",
  punctuation: "text-gray-300",
  tag: "text-red-400",
  attribute: "text-cyan-300",
  number: "text-amber-400",
  plain: "text-gray-300",
};

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "function",
  "async",
  "await",
  "return",
  "if",
  "else",
  "try",
  "catch",
  "throw",
  "new",
  "class",
  "extends",
  "implements",
  "interface",
  "type",
  "default",
  "null",
  "undefined",
  "true",
  "false",
  "typeof",
  "instanceof",
]);

const BUILTIN_FUNCTIONS = new Set([
  "console",
  "process",
  "Response",
  "Request",
  "JSON",
  "Object",
  "Array",
  "String",
  "Number",
  "Boolean",
  "Promise",
  "Error",
]);

const adapter = createHttpAdapter({
  endpoint: "/api/feedback",
});

function tokenize(code: string, language: string): Token[][] {
  const lines = code.split("\n");

  return lines.map((line) => {
    if (language === "bash") {
      return tokenizeBash(line);
    }
    if (language === "env") {
      return tokenizeEnv(line);
    }
    if (language === "json") {
      return tokenizeJson(line);
    }
    return tokenizeTypeScript(line);
  });
}

function tokenizeBash(line: string): Token[] {
  const tokens: Token[] = [];

  // Handle $ prefix
  if (line.trim().startsWith("$")) {
    const dollarMatch = line.match(/^(\s*\$\s*)/);
    if (dollarMatch) {
      tokens.push({ type: "comment", value: dollarMatch[1] });
      line = line.slice(dollarMatch[1].length);
    }
  }

  // Handle comments
  if (line.trim().startsWith("#")) {
    tokens.push({ type: "comment", value: line });
    return tokens;
  }

  // Split by spaces but keep quoted strings together
  const parts = line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

  parts.forEach((part, i) => {
    if (i > 0) tokens.push({ type: "plain", value: " " });

    if (part.startsWith('"') || part.startsWith("'")) {
      tokens.push({ type: "string", value: part });
    } else if (part.includes("=")) {
      const [key, ...rest] = part.split("=");
      tokens.push({ type: "variable", value: key });
      tokens.push({ type: "operator", value: "=" });
      tokens.push({ type: "string", value: rest.join("=") });
    } else if (
      i === 0 ||
      [
        "npm",
        "npx",
        "yarn",
        "pnpm",
        "git",
        "cd",
        "mkdir",
        "touch",
        "echo",
        "curl",
      ].includes(part)
    ) {
      tokens.push({ type: "function", value: part });
    } else if (part.startsWith("-")) {
      tokens.push({ type: "property", value: part });
    } else if (part.startsWith("@")) {
      tokens.push({ type: "string", value: part });
    } else {
      tokens.push({ type: "plain", value: part });
    }
  });

  return tokens;
}

function tokenizeEnv(line: string): Token[] {
  const tokens: Token[] = [];

  if (line.trim().startsWith("#")) {
    tokens.push({ type: "comment", value: line });
    return tokens;
  }

  const match = line.match(/^([A-Z_][A-Z0-9_]*)(\s*=\s*)(.*)$/);
  if (match) {
    tokens.push({ type: "variable", value: match[1] });
    tokens.push({ type: "operator", value: match[2] });
    tokens.push({ type: "string", value: match[3] });
  } else {
    tokens.push({ type: "plain", value: line });
  }

  return tokens;
}

function tokenizeJson(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Whitespace
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      tokens.push({ type: "plain", value: wsMatch[1] });
      remaining = remaining.slice(wsMatch[1].length);
      continue;
    }

    // String (key or value)
    const strMatch = remaining.match(/^("[^"]*")/);
    if (strMatch) {
      // Check if this is a key (followed by :)
      const afterStr = remaining.slice(strMatch[1].length).trim();
      if (afterStr.startsWith(":")) {
        tokens.push({ type: "property", value: strMatch[1] });
      } else {
        tokens.push({ type: "string", value: strMatch[1] });
      }
      remaining = remaining.slice(strMatch[1].length);
      continue;
    }

    // Number
    const numMatch = remaining.match(/^(-?\d+\.?\d*)/);
    if (numMatch) {
      tokens.push({ type: "number", value: numMatch[1] });
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }

    // Booleans and null
    const boolMatch = remaining.match(/^(true|false|null)\b/);
    if (boolMatch) {
      tokens.push({ type: "keyword", value: boolMatch[1] });
      remaining = remaining.slice(boolMatch[1].length);
      continue;
    }

    // Punctuation
    const punctMatch = remaining.match(/^([{}[\]:,])/);
    if (punctMatch) {
      tokens.push({ type: "punctuation", value: punctMatch[1] });
      remaining = remaining.slice(1);
      continue;
    }

    // Anything else
    tokens.push({ type: "plain", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

function tokenizeTypeScript(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Whitespace
    const wsMatch = remaining.match(/^(\s+)/);
    if (wsMatch) {
      tokens.push({ type: "plain", value: wsMatch[1] });
      remaining = remaining.slice(wsMatch[1].length);
      continue;
    }

    // Single-line comment
    if (remaining.startsWith("//")) {
      tokens.push({ type: "comment", value: remaining });
      break;
    }

    // JSX/TSX tags
    const jsxOpenMatch = remaining.match(/^(<\/?)([\w.]+)/);
    if (jsxOpenMatch) {
      tokens.push({ type: "punctuation", value: jsxOpenMatch[1] });
      tokens.push({ type: "tag", value: jsxOpenMatch[2] });
      remaining = remaining.slice(jsxOpenMatch[0].length);
      continue;
    }

    // JSX closing bracket
    if (remaining.startsWith(">") || remaining.startsWith("/>")) {
      const match = remaining.match(/^(\/>|>)/);
      if (match) {
        tokens.push({ type: "punctuation", value: match[1] });
        remaining = remaining.slice(match[1].length);
        continue;
      }
    }

    // Template literal
    const templateMatch = remaining.match(/^(`[^`]*`)/);
    if (templateMatch) {
      tokens.push({ type: "string", value: templateMatch[1] });
      remaining = remaining.slice(templateMatch[1].length);
      continue;
    }

    // String (double quotes)
    const doubleMatch = remaining.match(/^("[^"]*")/);
    if (doubleMatch) {
      tokens.push({ type: "string", value: doubleMatch[1] });
      remaining = remaining.slice(doubleMatch[1].length);
      continue;
    }

    // String (single quotes)
    const singleMatch = remaining.match(/^('[^']*')/);
    if (singleMatch) {
      tokens.push({ type: "string", value: singleMatch[1] });
      remaining = remaining.slice(singleMatch[1].length);
      continue;
    }

    // Number
    const numMatch = remaining.match(/^(\d+\.?\d*)/);
    if (numMatch) {
      tokens.push({ type: "number", value: numMatch[1] });
      remaining = remaining.slice(numMatch[1].length);
      continue;
    }

    // Identifier or keyword
    const identMatch = remaining.match(/^([a-zA-Z_$][\w$]*)/);
    if (identMatch) {
      const word = identMatch[1];

      // Check if it's followed by ( for function call
      const afterWord = remaining.slice(word.length);
      const isFunction = afterWord.match(/^\s*\(/);

      if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (BUILTIN_FUNCTIONS.has(word)) {
        tokens.push({ type: "variable", value: word });
      } else if (isFunction) {
        tokens.push({ type: "function", value: word });
      } else if (
        word[0] === word[0].toUpperCase() &&
        word[0] !== word[0].toLowerCase()
      ) {
        // PascalCase - likely a component or type
        tokens.push({ type: "tag", value: word });
      } else {
        tokens.push({ type: "variable", value: word });
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    // Property access after dot
    if (remaining.startsWith(".")) {
      tokens.push({ type: "punctuation", value: "." });
      remaining = remaining.slice(1);

      const propMatch = remaining.match(/^([a-zA-Z_$][\w$]*)/);
      if (propMatch) {
        const afterProp = remaining.slice(propMatch[1].length);
        const isPropFunction = afterProp.match(/^\s*\(/);
        tokens.push({
          type: isPropFunction ? "function" : "property",
          value: propMatch[1],
        });
        remaining = remaining.slice(propMatch[1].length);
      }
      continue;
    }

    // Arrow function
    if (remaining.startsWith("=>")) {
      tokens.push({ type: "operator", value: "=>" });
      remaining = remaining.slice(2);
      continue;
    }

    // Operators
    const opMatch = remaining.match(/^([=!<>+\-*/%&|^~?:]+)/);
    if (opMatch) {
      tokens.push({ type: "operator", value: opMatch[1] });
      remaining = remaining.slice(opMatch[1].length);
      continue;
    }

    // Punctuation
    const punctMatch = remaining.match(/^([{}[\](),;])/);
    if (punctMatch) {
      tokens.push({ type: "punctuation", value: punctMatch[1] });
      remaining = remaining.slice(1);
      continue;
    }

    // Anything else
    tokens.push({ type: "plain", value: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CodePreview = React.forwardRef<HTMLDivElement, CodePreviewProps>(
  (
    {
      code: codeProp,
      children,
      language = "typescript",
      filename,
      variant = "default",
      showCopy = true,
      showLineNumbers = false,
      terminalLabel = "Terminal",
      className,
      ...props
    },
    ref,
  ) => {
    // Support both code prop and children for backward compatibility
    const code = codeProp ?? (typeof children === "string" ? children : "");
    const [copied, setCopied] = React.useState(false);

    const handleCopy = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, [code]);

    const tokenizedLines = React.useMemo(
      () => tokenize(code.trim(), language),
      [code, language],
    );

    const isTerminal = variant === "terminal" || language === "bash";

    const menuItems = useMemo(
      () =>
        [
          {
            label: "Copy code",
            icon: <Copy className="w-3.5 h-3.5" />,
            type: "copy_code",
            onClick: handleCopy,
          },
        ] as ContextMenuItem[],
      [handleCopy],
    );

    return (
      <AnyclickProvider
        scoped
        adapter={adapter}
        menuItems={menuItems}
        header={<></>}
        highlightConfig={{
          enabled: false,
        }}
        theme={{
          menuStyle: {
            "--anyclick-menu-bg": "rgba(0, 0, 0, 0.9)",
            "--anyclick-menu-text": "#ffffff",
            "--anyclick-menu-border": "rgba(255, 255, 255, 0.1)",
            "--anyclick-menu-hover": "rgba(255, 255, 255, 0.1)",
            "--anyclick-menu-accent": "#f59e0b",
          } as CSSProperties,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "relative rounded-none overflow-hidden",
            variant === "hero" && "shadow-2xl",
            className,
          )}
          {...props}
        >
          {/* Glow effect for hero variant */}
          {variant === "hero" && (
            <div className="absolute -inset-4 bg-linear-to-r from-violet-500/20 via-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50 -z-10" />
          )}

          <div className="relative bg-[#0d1117] border border-white/10 md:rounded-xl rounded-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                {/* Window controls for hero variant */}
                {variant === "hero" && (
                  <>
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </>
                )}

                {/* Filename or terminal label */}
                {(filename || isTerminal) && (
                  <span
                    className={cn(
                      "text-xs text-gray-500 font-mono flex items-center gap-2",
                      variant === "hero" && "ml-4",
                    )}
                  >
                    {isTerminal ? (
                      <>
                        <Terminal className="w-3.5 h-3.5" />
                        {terminalLabel}
                      </>
                    ) : (
                      <>
                        <FileCode className="w-3.5 h-3.5" />
                        {filename}
                      </>
                    )}
                  </span>
                )}

                {/* Window controls for non-hero variants (minimal) */}
                {variant !== "hero" && !filename && !isTerminal && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                )}
              </div>

              {/* Copy button */}
              {showCopy && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    copied
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300",
                  )}
                  aria-label={copied ? "Copied!" : "Copy code"}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Code content */}
            <pre
              className={cn(
                "p-4 text-sm font-mono overflow-x-auto",
                variant === "hero" && "p-6",
              )}
            >
              <code className="block">
                {tokenizedLines.map((lineTokens, lineIdx) => (
                  <div key={lineIdx} className="flex">
                    {showLineNumbers && (
                      <span className="select-none text-gray-600 text-right w-8 pr-4 flex-shrink-0">
                        {lineIdx + 1}
                      </span>
                    )}
                    <span className="flex-1">
                      {lineTokens.length === 0
                        ? "\n"
                        : lineTokens.map((token, tokenIdx) => (
                            <span
                              key={tokenIdx}
                              className={TOKEN_CLASSES[token.type]}
                            >
                              {token.value}
                            </span>
                          ))}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </AnyclickProvider>
    );
  },
);

CodePreview.displayName = "CodePreview";

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export interface TerminalBlockProps
  extends Omit<CodePreviewProps, "language" | "variant"> {
  label?: string;
}

export const TerminalBlock = React.forwardRef<
  HTMLDivElement,
  TerminalBlockProps
>(({ label, children, ...props }, ref) => (
  <CodePreview
    ref={ref}
    language="bash"
    variant="default"
    terminalLabel={label}
    {...props}
  >
    {children}
  </CodePreview>
));

TerminalBlock.displayName = "TerminalBlock";

export interface CodeBlockProps extends Omit<CodePreviewProps, "variant"> {}

export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ children, ...props }, ref) => (
    <CodePreview ref={ref} variant="default" {...props}>
      {children}
    </CodePreview>
  ),
);

CodeBlock.displayName = "CodeBlock";

export interface HeroCodeBlockProps extends Omit<CodePreviewProps, "variant"> {}

export const HeroCodeBlock = React.forwardRef<
  HTMLDivElement,
  HeroCodeBlockProps
>(({ children, ...props }, ref) => (
  <CodePreview ref={ref} variant="hero" {...props}>
    {children}
  </CodePreview>
));

HeroCodeBlock.displayName = "HeroCodeBlock";
