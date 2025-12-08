"use client";

import type { ReactNode } from "react";
import {
  AnyclickPayload,
  AnyclickProvider,
  type ContextMenuItem,
  createUploadThingMenuItem,
} from "@ewjdev/anyclick-react";
import { createUploadThingAdapter } from "@ewjdev/anyclick-uploadthing";

const menuItems: ContextMenuItem[] = [
  { label: "Report Bug", type: "bug", showComment: true },
  { label: "Feature Idea", type: "feature", showComment: true },
  createUploadThingMenuItem({
    endpoint: "/api/uploadthing",
    onUploadComplete: (result) => {
      if (result.url) {
        console.log("Uploaded:", result.url);
        // In a real app, you might copy to clipboard or show a notification
      }
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error);
    },
  }),
];

const adapter = createUploadThingAdapter({
  endpoint: "/api/uploadthing",
  onUploadComplete: (result) => {
    console.log("Uploaded:", result.url);
  },
  onUploadError: (error) => {
    console.error("Upload failed:", error);
  },
});
export default function UploadThingProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AnyclickProvider
      adapter={{
        ...adapter,
        submitAnyclick: async (payload: AnyclickPayload) => {
          console.log("[submitAnyclick()]");
          console.log({ payload });
        },
      }}
      menuItems={menuItems}
      screenshotConfig={{ enabled: true }}
    >
      {children}
    </AnyclickProvider>
  );
}
