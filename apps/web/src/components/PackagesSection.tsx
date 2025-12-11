import {
  Bot,
  Box,
  GitBranch,
  Layers,
  MessageSquare,
  MousePointer2,
  Plug,
  Puzzle,
  Terminal,
  UploadCloud,
  Wrench,
} from "lucide-react";

type PackageItem = {
  name: string;
  description: string;
  features: string[];
  icon: any;
  color: string;
  tags?: string[];
};

const corePackages: PackageItem[] = [
  {
    name: "@ewjdev/anyclick-core",
    description:
      "Framework-agnostic core library. DOM capture, payload building, screenshot utilities, and adapter interface.",
    features: ["TypeScript", "ESM + CJS", "Zero Dependencies"],
    icon: Box,
    color: "violet",
  },
  {
    name: "@ewjdev/anyclick-react",
    description:
      "React provider and context menu UI. Drop-in component that handles all UI and event management.",
    features: ["React 19+", "Context Menu", "Highlights"],
    icon: Layers,
    color: "cyan",
  },
  {
    name: "@ewjdev/anyclick-pointer",
    description:
      "Pointer adapter for custom cursor effects and tracking. Adds visual flair to interactions.",
    features: ["Pointer Adapter", "Pointer Events", "Tracking"],
    icon: MousePointer2,
    color: "pink",
  },
  {
    name: "@ewjdev/anyclick-devtools",
    description:
      "Advanced inspector and devtools UI with deep linking capabilities.",
    features: ["InspectDialog", "Accessibility", "Box Model"],
    icon: Wrench,
    color: "orange",
  },
  {
    name: "@ewjdev/anyclick-extension",
    description:
      "Browser extension for Anyclick. Adds context menu integrations for t3.chat and UploadThing.",
    features: ["Context Menu", "Browser Action", "Integrations"],
    icon: Puzzle,
    color: "indigo",
  },
];

const extensionPackages: PackageItem[] = [
  {
    name: "@ewjdev/anyclick-github",
    description:
      "GitHub Issues integration. HTTP adapter for browser + server-side GitHub API client.",
    features: ["GitHub API", "Image Upload", "Markdown"],
    icon: GitBranch,
    color: "emerald",
  },
  {
    name: "@ewjdev/anyclick-jira",
    description:
      "Jira adapter for submitting UI feedback directly to Jira issues.",
    features: ["Jira API", "Issue Creation", "Direct Feedback"],
    icon: Bot, // Using Bot as a placeholder for Jira robot/automation feel
    color: "blue",
  },
  {
    name: "@ewjdev/anyclick-t3chat",
    description:
      "T3.chat adapter for sending text and queries to t3.chat AI context.",
    features: ["AI Chat", "Context Sharing", "Integration"],
    icon: MessageSquare,
    color: "teal",
  },
  {
    name: "@ewjdev/anyclick-uploadthing",
    description: "UploadThing adapter for uploading screenshots and images.",
    features: ["Image Hosting", "Secure Uploads", "Fast CDN"],
    icon: UploadCloud,
    color: "red",
  },
  {
    name: "@ewjdev/anyclick-cursor-*",
    description:
      "Cursor AI integrations. Local adapter runs cursor-agent on your machine; cloud adapter uses Cursor's API.",
    features: ["cursor-agent", "Cloud Agent", "Auto-fix"],
    icon: Terminal,
    color: "amber",
  },
  {
    name: "@ewjdev/anyclick-adapters",
    description: "Experimental and niche adapters for custom use cases.",
    features: ["Experimental", "Custom Logic", "Extensions"],
    icon: Plug,
    color: "fuchsia",
  },
];

const PackageCard = ({ item }: { item: PackageItem }) => {
  // Direct mapping for tailwind classes
  const getColors = (color: string) => {
    switch (color) {
      case "violet":
        return {
          bg: "from-violet-500/10 to-transparent border-violet-500/20",
          icon: "text-violet-400",
          title: "text-violet-300",
        };
      case "cyan":
        return {
          bg: "from-cyan-500/10 to-transparent border-cyan-500/20",
          icon: "text-cyan-400",
          title: "text-cyan-300",
        };
      case "emerald":
        return {
          bg: "from-emerald-500/10 to-transparent border-emerald-500/20",
          icon: "text-emerald-400",
          title: "text-emerald-300",
        };
      case "amber":
        return {
          bg: "from-amber-500/10 to-transparent border-amber-500/20",
          icon: "text-amber-400",
          title: "text-amber-300",
        };
      case "pink":
        return {
          bg: "from-pink-500/10 to-transparent border-pink-500/20",
          icon: "text-pink-400",
          title: "text-pink-300",
        };
      case "orange":
        return {
          bg: "from-orange-500/10 to-transparent border-orange-500/20",
          icon: "text-orange-400",
          title: "text-orange-300",
        };
      case "indigo":
        return {
          bg: "from-indigo-500/10 to-transparent border-indigo-500/20",
          icon: "text-indigo-400",
          title: "text-indigo-300",
        };
      case "blue":
        return {
          bg: "from-blue-500/10 to-transparent border-blue-500/20",
          icon: "text-blue-400",
          title: "text-blue-300",
        };
      case "teal":
        return {
          bg: "from-teal-500/10 to-transparent border-teal-500/20",
          icon: "text-teal-400",
          title: "text-teal-300",
        };
      case "red":
        return {
          bg: "from-red-500/10 to-transparent border-red-500/20",
          icon: "text-red-400",
          title: "text-red-300",
        };
      case "fuchsia":
        return {
          bg: "from-fuchsia-500/10 to-transparent border-fuchsia-500/20",
          icon: "text-fuchsia-400",
          title: "text-fuchsia-300",
        };
      default:
        return {
          bg: "from-gray-500/10 to-transparent border-gray-500/20",
          icon: "text-gray-400",
          title: "text-gray-300",
        };
    }
  };

  const colors = getColors(item.color);

  return (
    <div className={`p-6 rounded-2xl bg-linear-to-br border ${colors.bg}`}>
      <div className="flex items-center gap-3 mb-4">
        <item.icon className={`w-6 h-6 ${colors.icon}`} />
        <code className={`${colors.title} font-mono`}>{item.name}</code>
      </div>
      <p className="text-gray-400 text-sm mb-4">{item.description}</p>
      <div className="flex flex-wrap gap-2">
        {item.features.map((feature) => (
          <span
            key={feature}
            className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
};

const PackagesSection = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Modular Architecture
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto">
          Pick only the packages you need. All packages are published under the{" "}
          <code className="text-cyan-400">@anyclick</code> scope.
        </p>
      </div>

      <div className="mb-12">
        <h3 className="text-2xl font-semibold mb-6 text-gray-200 border-b border-white/10 pb-2">
          Core Packages
        </h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {corePackages.map((pkg) => (
            <PackageCard key={pkg.name} item={pkg} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-6 text-gray-200 border-b border-white/10 pb-2">
          Extensions & Adapters
        </h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {extensionPackages.map((pkg) => (
            <PackageCard key={pkg.name} item={pkg} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PackagesSection;
