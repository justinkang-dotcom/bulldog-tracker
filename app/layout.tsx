import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bulldog Tracker — What's popping on campus right now",
  description:
    "Live campus hotspot map for Yale. Drop a pin, upvote what's happening, watch it fade when the night moves on.",
  applicationName: "Bulldog Tracker",
  appleWebApp: {
    capable: true,
    title: "Bulldog Tracker",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/handsome-dan.png?v=8",
    apple: "/handsome-dan.png?v=8",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${syne.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#07080c] font-sans text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
