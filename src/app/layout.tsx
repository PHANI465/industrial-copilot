import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Gauge, Sliders, ClipboardList, FileText, Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Industrial AI Copilot",
  description: "Proactive AI Copilot for Industrial Operations",
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Industrial AI Copilot
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
              NORTH SEA PLATFORM ALPHA
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all border border-transparent hover:border-border"
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            href="/simulator"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all border border-transparent hover:border-border"
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Simulator</span>
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all border border-transparent hover:border-border"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all border border-transparent hover:border-border"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">About</span>
          </Link>
        </nav>
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
      className="h-full antialiased dark"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
