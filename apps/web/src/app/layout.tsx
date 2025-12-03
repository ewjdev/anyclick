import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Lato } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { FeedbackProviderWrapper } from "@/components/FeedbackProviderWrapper";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "anyclick - UI feedback that codes itself",
    template: "%s | anyclick",
  },
  description:
    "Right-click any element in your app to capture feedback with full DOM context, screenshots, and automatic integration with GitHub Issues or AI coding agents.",
  keywords: ["feedback", "ui", "react", "github", "cursor", "ai", "typescript"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "min-h-dvh w-full overflow-x-hidden bg-background text-foreground antialiased",
          inter.className,
          montserrat.className,
          lato.className,
        )}
      >
        <FeedbackProviderWrapper>{children}</FeedbackProviderWrapper>
      </body>
    </html>
  );
}
