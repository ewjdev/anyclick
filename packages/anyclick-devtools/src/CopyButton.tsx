import { CSSProperties, useState } from "react";
import { Check, Copy } from "lucide-react";
import useCompactMode from "./useCompactMode";

// Local styles for CopyButton
const copyButtonStyles: Record<string, CSSProperties> = {
  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    border: "none",
    backgroundColor: "#333",
    color: "#e0e0e0",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.15s",
  },
  copyButtonSmall: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    border: "none",
    backgroundColor: "transparent",
    color: "#888",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
  },
};

/**
 * Copy button component with feedback
 */
function CopyButton({
  text,
  label,
  size = "small",
}: {
  text: string;
  label?: string;
  size?: "small" | "medium";
}) {
  const [copied, setCopied] = useState(false);
  const { isCompact, compactStyles } = useCompactMode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const buttonStyle =
    size === "small"
      ? copyButtonStyles.copyButtonSmall
      : copyButtonStyles.copyButton;
  const iconSize = isCompact
    ? size === "small"
      ? 10
      : 12
    : size === "small"
      ? 12
      : 14;

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        ...buttonStyle,
        ...(isCompact ? compactStyles.copyButtonSmall : {}),
      }}
      title={`Copy ${label || "to clipboard"}`}
    >
      {copied ? (
        <>
          <Check size={iconSize} />
          {label && size !== "small" && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Copy size={iconSize} />
          {label && size !== "small" && <span>{label}</span>}
        </>
      )}
    </button>
  );
}

export default CopyButton;
