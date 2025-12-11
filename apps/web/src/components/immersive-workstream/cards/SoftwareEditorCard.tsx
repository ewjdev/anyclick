"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { javascript } from "@codemirror/lang-javascript";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";
import CodeMirror from "@uiw/react-codemirror";
import { parseMenuItems } from "../parseMenuItems";
import { DEFAULT_SOFTWARE_CODE } from "../softwareCode";
import { matrixHighlightStyle, matrixTheme } from "../themes/matrixTheme";

interface SoftwareEditorCardProps {
  onMenuItemsChange: (items: ContextMenuItem[]) => void;
}

export function SoftwareEditorCard({
  onMenuItemsChange,
}: SoftwareEditorCardProps) {
  const [code, setCode] = useState(DEFAULT_SOFTWARE_CODE);
  const [parseError, setParseError] = useState(false);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      const parsed = parseMenuItems(value);
      if (parsed) {
        setParseError(false);
        onMenuItemsChange(parsed);
      } else {
        setParseError(true);
      }
    },
    [onMenuItemsChange],
  );

  useEffect(() => {
    const parsed = parseMenuItems(DEFAULT_SOFTWARE_CODE);
    if (parsed) {
      onMenuItemsChange(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-2xl">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: "1px solid #00ff4140",
          boxShadow: `
            0 0 60px rgba(0, 255, 65, 0.15),
            0 0 100px rgba(0, 255, 65, 0.1),
            inset 0 1px 0 rgba(0, 255, 65, 0.1)
          `,
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: "linear-gradient(180deg, #0f0f0f, #0a0a0a)",
            borderBottom: "1px solid #00ff4120",
          }}
        >
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[#00ff41]/60 text-xs font-mono">
              anyclick.config.ts
            </span>
          </div>
          <div className="w-14" />
        </div>

        <CodeMirror
          value={code}
          height="280px"
          theme={matrixTheme}
          extensions={[javascript(), matrixHighlightStyle]}
          onChange={handleCodeChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: false,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false,
            rectangularSelection: false,
            crosshairCursor: false,
            highlightSelectionMatches: false,
            searchKeymap: false,
          }}
          className="[&_.cm-editor]:outline-none [&_.cm-scroller]:bg-black"
        />

        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: "#050505",
            borderTop: "1px solid #00ff4120",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                parseError ? "bg-red-500" : "bg-green-500",
              )}
              style={{
                boxShadow: parseError
                  ? "0 0 8px rgba(239, 68, 68, 0.5)"
                  : "0 0 8px rgba(0, 255, 65, 0.5)",
              }}
            />
            <span
              className={cn(
                "text-xs font-mono",
                parseError ? "text-red-400" : "text-[#00ff41]/70",
              )}
            >
              {parseError ? "Syntax error" : "Config valid"}
            </span>
          </div>
          <span className="text-[#00ff41]/40 text-xs font-mono">
            Live Preview Active
          </span>
        </div>
      </div>

      <div
        className="absolute -inset-8 -z-10 rounded-3xl opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0, 255, 65, 0.3), transparent 70%)",
        }}
      />
    </div>
  );
}
