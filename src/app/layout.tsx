import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OilDerrickIcon } from "@/components/icons/PlatformIcon";
import { NavLinks } from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Industrial Copilot - AI-Powered Equipment Monitoring",
  description: "Real-time monitoring and alert management for industrial equipment with anomaly detection",
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      {/* Industrial stripe accent */}
      <div className="h-0.5 warning-stripes-subtle" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/20 group-hover:shadow-primary/30 transition-shadow border border-slate-500/30">
              <OilDerrickIcon className="h-5 w-5 text-amber-400" />
            </div>
            {/* LED indicator */}
            <div className="absolute -top-1 -right-1 led led-green" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Industrial AI Copilot
            </span>
            <span className="tech-label text-muted-foreground">
              NORTH SEA PLATFORM ALPHA
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <NavLinks />
          <div className="w-px h-8 bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          <Nav />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
