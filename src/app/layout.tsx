import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Activity, Gauge, Sliders, Info, ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Industrial AI Copilot",
  description: "Proactive AI Copilot for Industrial Operations",
};

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <span className="font-bold text-sm tracking-tight">
            Industrial AI Copilot
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Gauge className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Sliders className="h-4 w-4" />
            Simulator
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            History
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Info className="h-4 w-4" />
            About
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
