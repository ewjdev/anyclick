import { AnyclickProviderWrapper } from "@/components/AnyclickProviderWrapper";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Lato, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "anyclick - UX/DevX done right",
    template: "%s | anyclick",
  },
  description:
    "Right-click any element in your app to capture feedback with full DOM context, screenshots, and automagically integrate with ticket systems,workflows, agents and more with adapters.",
  keywords: [
    "feedback",
    "devx",
    "ui",
    "react",
    "github",
    "cursor",
    "ai",
    "typescript",
  ],
  icons: {
    icon: [
      { url: "/logo.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
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
        <AnyclickProviderWrapper>{children}</AnyclickProviderWrapper>
      </body>
    </html>
  );
}
