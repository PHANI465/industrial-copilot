"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Sliders, ClipboardList, FileText } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/simulator", label: "Simulator", icon: Sliders },
  { href: "/history", label: "History", icon: ClipboardList },
  { href: "/about", label: "About", icon: FileText },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center p-1 rounded-xl bg-muted/50 dark:bg-slate-800/50 border border-border/50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? "bg-card dark:bg-slate-700 text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }
            `}
          >
            {/* Active indicator LED */}
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary" />
            )}
            <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
