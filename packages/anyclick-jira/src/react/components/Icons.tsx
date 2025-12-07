"use client";

import type { ReactNode } from "react";
import { Bug, FileText, Settings, Sparkles } from "lucide-react";

const iconStyle = { width: "20px", height: "20px" };

export const issueTypeIcons: Record<string, ReactNode> = {
  bug: <Bug style={iconStyle} />,
  story: <FileText style={iconStyle} />,
  task: <Settings style={iconStyle} />,
  feature: <Sparkles style={iconStyle} />,
  epic: <Sparkles style={iconStyle} />,
};

export function getIssueTypeIcon(name: string): ReactNode {
  const lower = name.toLowerCase();
  return issueTypeIcons[lower] || <FileText style={iconStyle} />;
}
