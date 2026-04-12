"use client";

import { SVGProps } from "react";

export function PlatformIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Oil derrick tower */}
      <path d="M12 2L8 10h8L12 2z" />
      <path d="M12 2v8" />
      
      {/* Platform base */}
      <path d="M4 14h16" />
      <path d="M6 14v4" />
      <path d="M18 14v4" />
      
      {/* Platform deck */}
      <path d="M3 18h18" />
      
      {/* Support legs going into water */}
      <path d="M5 18l-1 4" />
      <path d="M19 18l1 4" />
      <path d="M9 18v4" />
      <path d="M15 18v4" />
      
      {/* Derrick cross beams */}
      <path d="M9 6l6 0" />
      <path d="M8.5 8l7 0" />
      
      {/* Small equipment on deck */}
      <rect x="10" y="11" width="4" height="3" rx="0.5" />
    </svg>
  );
}

export function FactoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Main building */}
      <path d="M4 21V11l4-4v4l4-4v4l4-4v14" />
      
      {/* Chimney */}
      <path d="M18 21V8h2v13" />
      
      {/* Smoke */}
      <path d="M19 5c0-1.5 1-2 1-3" />
      <path d="M19 6c1 0 2-1 2-2" />
      
      {/* Windows */}
      <rect x="6" y="14" width="2" height="2" />
      <rect x="10" y="14" width="2" height="2" />
      <rect x="6" y="17" width="2" height="2" />
      <rect x="10" y="17" width="2" height="2" />
      
      {/* Ground */}
      <path d="M2 21h20" />
    </svg>
  );
}

export function OilDerrickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Derrick frame */}
      <path d="M12 2L6 20" />
      <path d="M12 2L18 20" />
      
      {/* Cross beams */}
      <path d="M7.5 8h9" />
      <path d="M7 12h10" />
      <path d="M6.5 16h11" />
      
      {/* Base */}
      <path d="M4 20h16" />
      
      {/* Pump jack arm */}
      <path d="M12 6v2" />
      <circle cx="12" cy="5" r="1" />
      
      {/* Ground detail */}
      <path d="M2 22h20" />
      <path d="M8 20v2" />
      <path d="M16 20v2" />
    </svg>
  );
}
