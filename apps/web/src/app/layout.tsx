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
  title: "ESL",
  description:
    "ESL is a platform for friends to engage in social fantasy sports",
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
