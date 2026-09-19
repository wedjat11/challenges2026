import type { Metadata } from "next";
import "./globals.css";

import { instrumentSans, jetbrainsMono, spaceGrotesk } from "@/app/fonts";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "Create League of Legends challenges, share them, and have progress tracked automatically from match history.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${instrumentSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
