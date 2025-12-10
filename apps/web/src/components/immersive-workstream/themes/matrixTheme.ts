import { EditorView } from "@codemirror/view";

export const matrixTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#000000",
      color: "#00ff00",
      fontFamily: "ui-monospace, 'Fira Code', monospace",
      fontSize: "14px",
    },
    ".cm-scroller": {
      backgroundColor: "#000000",
    },
    ".cm-content": {
      caretColor: "#00ff00",
      padding: "16px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#00ff00",
      borderLeftWidth: "1px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "#2d2d2d",
      },
    ".cm-gutters": {
      backgroundColor: "#006000",
      color: "#ffffff",
      borderRight: "2px solid #00ff00",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      color: "#ffffff",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#004400",
    },
    ".cm-activeLine": {
      backgroundColor: "#004400",
    },
    ".cm-line": {
      padding: "0 6px",
    },
    ".cm-activeLine .ͼb,.cm-activeLine .ͼg": {
      color: "#00ff00",
    },
    ".ͼb": {
      color: "#00ff00",
    },
    ".ͼg": {
      color: "#004400",
    },
    ".ͼl": {
      color: "#00ff00",
    },
    ".ͼe": {
      color: "#005500",
    },
    ".ͼc": {
      color: "#00gg00",
    },
  },
  { dark: true },
);

export const matrixHighlightStyle = EditorView.baseTheme({
  ".cm-keyword": { color: "#008803", fontWeight: "bold" },
  ".cm-atom": { color: "#33ffff" },
  ".cm-number": { color: "#ffb94f" },
  ".cm-def": { color: "#9999cc" },
  ".cm-variableName": { color: "#f6c" },
  ".cm-typeName": { color: "#96f" },
  ".cm-propertyName": { color: "#62ffa0" },
  ".cm-operator": { color: "#999999" },
  ".cm-comment": { color: "#cccccc" },
  ".cm-string": { color: "#3399cc" },
  ".cm-meta": { color: "#c9f" },
  ".cm-qualifier": { color: "#fff700" },
  ".cm-builtin": { color: "#3300aa" },
  ".cm-bracket": { color: "#cc7" },
  ".cm-tag": { color: "#ffbd40" },
  ".cm-attribute": { color: "#fff700" },
  ".cm-error": { color: "#ff0000" },
});
