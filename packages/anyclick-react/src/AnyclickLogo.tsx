"use client";

import React from "react";

export interface AnyclickLogoProps {
  /** Size of the logo in pixels. Defaults to 64 */
  size?: number;
  /** Border width in pixels. Defaults to 2 (same as default cursor stroke) */
  borderWidth?: number;
  /** Primary color for the circle border and cursor. Defaults to #3b82f6 (blue-500) */
  primaryColor?: string;
  /** Background color of the circle. Defaults to rgba(59, 130, 246, 0.1) */
  backgroundColor?: string;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Anyclick Logo - A circle with a cursor pointer in the center
 * The cursor is styled similarly to the default system cursor
 */
export function AnyclickLogo({
  size = 64,
  borderWidth = 2,
  primaryColor = "#3b82f6",
  backgroundColor = "rgba(59, 130, 246, 0.1)",
  className,
  style,
  onClick,
}: AnyclickLogoProps) {
  // Cursor size is proportional to the circle size
  const cursorSize = size * 0.45;
  const cursorStroke = borderWidth;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ cursor: onClick ? "pointer" : undefined, ...style }}
      onClick={onClick}
      role={onClick ? "button" : "img"}
      aria-label="Anyclick Logo"
    >
      {/* Circle background */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - borderWidth / 2}
        fill={backgroundColor}
        stroke={primaryColor}
        strokeWidth={borderWidth}
      />

      {/* Cursor pointer - centered in the circle */}
      <g
        transform={`translate(${(size - cursorSize) / 2}, ${(size - cursorSize) / 2})`}
      >
        {/* Cursor shape - classic pointer arrow */}
        <path
          d={`
            M ${cursorSize * 0.15} ${cursorSize * 0.08}
            L ${cursorSize * 0.15} ${cursorSize * 0.85}
            L ${cursorSize * 0.35} ${cursorSize * 0.65}
            L ${cursorSize * 0.55} ${cursorSize * 0.85}
            L ${cursorSize * 0.65} ${cursorSize * 0.75}
            L ${cursorSize * 0.45} ${cursorSize * 0.55}
            L ${cursorSize * 0.7} ${cursorSize * 0.55}
            Z
          `}
          fill="white"
          stroke={primaryColor}
          strokeWidth={cursorStroke}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default AnyclickLogo;
