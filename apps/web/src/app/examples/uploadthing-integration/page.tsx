import { CodeBlock } from "@/components/CodePreview";
import {
  ArrowRight,
  Check,
  Image,
  MousePointerClick,
  Upload,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import UploadThingProvider from "./UploadThingProvider";

export const metadata: Metadata = {
  title: "UploadThing Integration Example",
  description:
    "Upload screenshots and images to UploadThing with Anyclick context menus.",
};

export default function UploadThingIntegrationPage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/examples" className="hover:text-white transition-colors">
            Examples
          </Link>
          <span>/</span>
          <span className="text-white">UploadThing Integration</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <Upload className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            UploadThing Integration
          </h1>
        </div>
        <p className="text-lg text-gray-400 leading-relaxed">
          Right-click on images to upload them directly to{" "}
          <a
            href="https://uploadthing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300"
          >
            UploadThing
          </a>
          . Perfect for capturing and sharing screenshots, diagrams, and UI
          elements.
        </p>
      </div>

      {/* Demo Area */}
      <UploadThingProvider>
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-red-400" />
            Try It
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Right-click on any image below to see the upload option:
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white/80 text-sm">Sample Gradient 1</span>
            </div>
            <div className="aspect-video rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
              <span className="text-white/80 text-sm">Sample Gradient 2</span>
            </div>
            <div className="aspect-video rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-500" />
            </div>
            <div className="aspect-video rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero.png"
                alt="Sample image"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Note: Actual uploads require UploadThing configuration. This demo
            shows the menu integration.
          </p>
        </div>
      </UploadThingProvider>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Features</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Image Detection</strong> -
              Automatically detects img, picture, canvas, and background images
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Server-Side Upload</strong> -
              Secure uploads through your Next.js API route
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Client-Side Option</strong> -
              Direct uploads with localStorage API key for quick setup
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">
              <strong className="text-white">Screenshot Integration</strong> -
              Upload captured screenshots directly (coming soon)
            </span>
          </li>
        </ul>
      </div>

      {/* Setup Guide */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Setup</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              1. Install the Package
            </h3>
            <CodeBlock
              filename="Terminal"
              language="bash"
              code="npm install @ewjdev/anyclick-uploadthing uploadthing"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              2. Create the API Route (Recommended)
            </h3>
            <CodeBlock
              filename="app/api/uploadthing/route.ts"
              language="typescript"
              code={`import { createUploadThingServerAdapter } from "@ewjdev/anyclick-uploadthing/server";

const adapter = createUploadThingServerAdapter({
  token: process.env.UPLOADTHING_TOKEN!,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const result = await adapter.uploadFile(file);

  if (!result.success) {
    return Response.json(
      { error: result.error },
      { status: 500 }
    );
  }

  return Response.json({
    url: result.url,
    key: result.key,
    name: result.name,
  });
}`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              3. Add Upload Menu Item
            </h3>
            <CodeBlock
              filename="app/layout.tsx"
              language="tsx"
              code={`import {
  AnyclickProvider,
  createUploadThingMenuItem,
} from "@ewjdev/anyclick-react";

const menuItems = [
  { label: "Report Bug", type: "bug", showComment: true },
  createUploadThingMenuItem({
    endpoint: "/api/uploadthing",
    onUploadComplete: (result) => {
      if (result.url) {
        navigator.clipboard.writeText(result.url);
        console.log("Uploaded:", result.url);
      }
    },
  }),
];

export default function Layout({ children }) {
  return (
    <AnyclickProvider adapter={adapter} menuItems={menuItems}>
      {children}
    </AnyclickProvider>
  );
}`}
            />
          </div>
        </div>
      </div>

      {/* Client-Side Setup */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          Client-Side Upload (Quick Setup)
        </h2>
        <p className="text-gray-400 mb-6">
          For development or simple use cases, you can use direct client-side
          uploads. Note: This exposes your API key to the browser.
        </p>

        <CodeBlock
          filename="your-component.tsx"
          language="tsx"
          code={`import { createUploadThingAdapter } from "@ewjdev/anyclick-uploadthing";

// Create adapter with API key (for dev/testing only)
const adapter = createUploadThingAdapter({
  apiKey: "your-uploadthing-api-key",
  persistApiKey: true, // Store in localStorage
});

// Upload an image
const imageElement = document.querySelector("img");
const result = await adapter.uploadFromElement(imageElement);

if (result.success) {
  console.log("Uploaded to:", result.url);
}`}
        />
      </div>

      {/* Image Detection */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Image Detection</h2>
        <p className="text-gray-400 mb-6">
          The adapter automatically detects various image types:
        </p>

        <CodeBlock
          filename="detection-example.tsx"
          language="tsx"
          code={`import { detectImageElement } from "@ewjdev/anyclick-react";

// Detects: img, picture, canvas, svg, background-image
const result = detectImageElement(element);

if (result.isImage) {
  console.log("Image type:", result.type);
  console.log("Source:", result.src);
}`}
        />

        <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <h4 className="font-medium mb-2">Supported Image Types</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>
              <code className="text-cyan-400">img</code> - Standard image
              elements
            </li>
            <li>
              <code className="text-cyan-400">picture</code> - Responsive image
              elements
            </li>
            <li>
              <code className="text-cyan-400">canvas</code> - Canvas elements
              (converted to PNG)
            </li>
            <li>
              <code className="text-cyan-400">svg</code> - SVG graphics
            </li>
            <li>
              <code className="text-cyan-400">background</code> - CSS background
              images
            </li>
          </ul>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Environment Variables</h2>
        <CodeBlock
          filename=".env.local"
          language="bash"
          code={`# Get your token from https://uploadthing.com/dashboard
UPLOADTHING_TOKEN=your-token-here`}
        />
      </div>

      {/* Next Steps */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
        <h2 className="text-xl font-bold mb-3">Next Steps</h2>
        <p className="text-gray-400 mb-4">
          Explore more integrations and features:
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/examples/t3chat-integration"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            t3.chat Integration
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/examples/github-integration"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
          >
            GitHub Integration
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://uploadthing.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
          >
            UploadThing Docs
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
