import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Habit Tracker - Build Better Habits",
  description: "Modern habit tracker optimized for personal growth. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Habit Tracker", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "React", "Productivity"],
  authors: [{ name: "Habit Tracker Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Habit Tracker",
    description: "Track your habits and achieve your goals",
    url: "https://habit-tracker.app",
    siteName: "Habit Tracker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Habit Tracker",
    description: "Track your habits and achieve your goals",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
