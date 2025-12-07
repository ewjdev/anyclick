import React from "react";
import { Bug, FileText, Settings, Sparkles } from "lucide-react";

export const issueTypeIcons: Record<string, React.ReactNode> = {
    bug: <Bug className="w-5 h-5" />,
    story: <FileText className="w-5 h-5" />,
    task: <Settings className="w-5 h-5" />,
    feature: <Sparkles className="w-5 h-5" />,
    epic: <Sparkles className="w-5 h-5" />,
};

export function getIssueTypeIcon(name: string): React.ReactNode {
    const lower = name.toLowerCase();
    return issueTypeIcons[lower] || <FileText className="w-5 h-5" />;
}
