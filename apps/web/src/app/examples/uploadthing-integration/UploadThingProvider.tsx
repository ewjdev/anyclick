"use client";

import type { ReactNode } from "react";
import {
  AnyclickProvider,
  type ContextMenuItem,
  createUploadThingMenuItem,
} from "@ewjdev/anyclick-react";

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

export default function UploadThingProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AnyclickProvider
      menuItems={menuItems}
      screenshotConfig={{ enabled: true }}
    >
      {children}
    </AnyclickProvider>
  );
}
