import { EditorView } from "@codemirror/view";

const greens = {
  light: "#00ff00",
  medium: "#00aa00",
  dark: "#004400",
  darker: "#003200",
  muted: "#006000",
  error: "#ff4400",
};

const themeColors = {
  background: "#000000",
  text: greens.light,
  caret: greens.light,
  selection: greens.darker,
  gutter: greens.muted,
  gutterText: "#ffffff",
  gutterBorder: greens.light,
  activeLine: greens.dark,
  activeLineText: greens.light,
  activeLineGutter: greens.dark,
  activeLineGutterText: greens.light,
  activeLineGutterBorder: greens.dark,
};

export const matrixTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: themeColors.background,
      color: themeColors.text,
      fontFamily: "ui-monospace, 'Fira Code', monospace",
      fontSize: "14px",
    },
    ".cm-scroller": {
      backgroundColor: themeColors.background,
    },
    ".cm-content": {
      caretColor: themeColors.caret,
      padding: "16px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: themeColors.caret,
      borderLeftWidth: "1px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        border: `1px dashed ${greens.muted}`,
        borderRadius: "4px",
        padding: "2px",
        backgroundColor: themeColors.selection,
      },
    ".cm-gutters": {
      backgroundColor: themeColors.gutter,
      color: themeColors.gutterText,
      borderRight: `2px solid ${themeColors.gutterBorder}`,
    },
    ".cm-lineNumbers .cm-gutterElement": {
      color: "#ffffff",
    },
    ".cm-activeLineGutter": {
      backgroundColor: greens.darker,
    },
    ".cm-activeLine": {
      backgroundColor: greens.darker,
    },
    ".cm-line": {
      padding: "0 6px",
    },
    ".cm-activeLine .ͼm": {
      color: themeColors.background,
    },
    ".ͼm": {
      color: greens.light,
    },
    ".cm-activeLine .ͼb": {
      color: greens.medium,
    },
    ".ͼb": {
      color: greens.darker,
    },
    ".cm-activeLine .ͼg": {
      color: themeColors.background,
    },
    ".ͼg": {
      color: greens.medium,
    },
    ".cm-activeLine .ͼl": {
      color: themeColors.background,
    },
    ".ͼl": {
      color: greens.light,
    },
    ".cm-activeLine .ͼe": {
      color: greens.light,
    },
    ".ͼe": {
      color: greens.darker,
    },
    ".cm-activeLine .ͼc": {
      color: greens.medium,
    },
    ".ͼc": {
      color: greens.muted,
    },
    ".ͼc:contains('false')": {
      color: "#ff0000",
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
