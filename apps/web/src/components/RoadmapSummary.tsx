import roadmapRawData from "@/data/roadmap-items.json";
import { memo } from "react";
import { ArrowRight, Clock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

type RoadmapData = {
  items: RoadmapItem[];
  lastSynced: string;
  version: string;
};

type RoadmapItem = {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string;
  era: string;
  status: string;
  url: string;
  labels: string[];
  tags: string[];
  assignees: string[];
};

// Safely normalize tags to a string array
const getTags = (item: { tags?: unknown }): string[] => {
  if (!item.tags) return [];
  if (Array.isArray(item.tags)) {
    return item.tags.filter((t): t is string => typeof t === "string");
  }
  return [];
};

const RoadmapSummary = ({ roadmapData }: { roadmapData?: RoadmapData }) => {
  const data = roadmapData ?? (roadmapRawData as RoadmapData);
  const upcomingItems = data.items.filter(
    (item) =>
      item.status !== "completed" &&
      item.status !== "closed" &&
      getTags(item).some((t) => t.startsWith("homepage:")),
  );
  const upcomingTitles = upcomingItems
    .slice(0, 5)
    .map((item) => item.title)
    .join(", ");

  return (
    <div className="p-6 rounded-2xl bg-linear-to-br from-amber-500/5 to-transparent border border-amber-500/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Coming Soon
          </h3>
          <p className="text-sm text-gray-400 max-w-2xl">
            {upcomingTitles}
            {upcomingItems.length > 5 ? ", and more" : ""}. See what&apos;s next
            on our{" "}
            <Link href="/roadmap" className="text-amber-300 underline">
              roadmap
            </Link>
          </p>
        </div>
        <a
          href="https://github.com/ewjdev/anyclick/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-sm font-medium transition-colors flex items-center gap-2"
        >
          Request a feature
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default memo(RoadmapSummary);
