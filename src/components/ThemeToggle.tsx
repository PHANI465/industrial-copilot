"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent transition-all flex items-center justify-center group"
      title={`Theme: ${theme} (click to cycle)`}
    >
      {theme === "dark" && (
        <Moon className="h-4 w-4 text-amber-400" />
      )}
      {theme === "light" && (
        <Sun className="h-4 w-4 text-amber-500" />
      )}
      {theme === "system" && (
        <Monitor className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
