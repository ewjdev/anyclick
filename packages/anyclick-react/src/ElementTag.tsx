/**
 * Get basic element info for hierarchy display
 */
function getElementTagInfo(element: Element): {
  tagName: string;
  id: string | null;
  classNames: string[];
} {
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    classNames: Array.from(element.classList),
  };
}

/**
 * ElementTag - renders a single element's tag signature
 * Used for both current element and related elements in hierarchy
 */
function ElementTag({
  element,
  isCurrent = false,
  isCompact = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  element: Element;
  isCurrent?: boolean;
  isCompact?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const info = getElementTagInfo(element);
  const isClickable = !!onClick;

  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "1px",
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    fontSize: isCurrent
      ? isCompact
        ? "12px"
        : "14px"
      : isCompact
        ? "10px"
        : "11px",
    opacity: isCurrent ? 1 : 0.6,
    cursor: isClickable ? "pointer" : "default",
    padding: isClickable ? "2px 4px" : "0",
    borderRadius: isClickable ? "3px" : "0",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  };

  const tagColor = isCurrent ? "#569cd6" : "#6b7280";
  const idColor = isCurrent ? "#9cdcfe" : "#9ca3af";
  const classColor = isCurrent ? "#4ec9b0" : "#9ca3af";

  return (
    <span
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={isClickable ? `Select <${info.tagName}>` : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <span style={{ color: tagColor }}>&lt;{info.tagName}</span>
      {info.id && <span style={{ color: idColor }}>#{info.id}</span>}
      {info.classNames.length > 0 && (
        <span style={{ color: classColor }}>
          .{info.classNames.slice(0, 2).join(".")}
          {info.classNames.length > 2 && "…"}
        </span>
      )}
      <span style={{ color: tagColor }}>&gt;</span>
    </span>
  );
}

export default ElementTag;
