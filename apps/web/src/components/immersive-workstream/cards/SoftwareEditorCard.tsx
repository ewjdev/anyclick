"use client";

import { useState } from "react";
import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import { DEFAULT_SOFTWARE_CODE } from "../softwareCode";
import { matrixHighlightStyle, matrixTheme } from "../themes/matrixTheme";

export function SoftwareEditorCard() {
  const [code] = useState(DEFAULT_SOFTWARE_CODE);

  return (
    <div className="relative w-full max-w-[780px]">
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
          editable={false}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: false,
            highlightActiveLine: false,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false,
            bracketMatching: true,
            closeBrackets: false,
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
              className="w-2 h-2 rounded-full bg-amber-400"
              style={{
                boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
              }}
            />
            <span className="text-xs font-mono text-amber-300/90">
              Workflow actions fixed for this demo
            </span>
          </div>
          <span className="text-[#00ff41]/40 text-xs font-mono">
            Right-click to run prototype flows
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
