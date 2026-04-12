"use client";

interface IndustrialGaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
  size?: "sm" | "md" | "lg";
}

export function IndustrialGauge({
  value,
  min = 0,
  max = 100,
  label,
  unit = "",
  thresholds,
  size = "md",
}: IndustrialGaugeProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const angle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  
  const getStatus = () => {
    if (thresholds?.critical && value >= thresholds.critical) return "critical";
    if (thresholds?.warning && value >= thresholds.warning) return "warning";
    return "normal";
  };
  
  const status = getStatus();
  
  const sizeClasses = {
    sm: { container: "w-20 h-12", text: "text-xs", label: "text-[8px]" },
    md: { container: "w-28 h-16", text: "text-sm", label: "text-[10px]" },
    lg: { container: "w-36 h-20", text: "text-base", label: "text-xs" },
  };
  
  const colors = {
    normal: { stroke: "#22c55e", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    warning: { stroke: "#f59e0b", bg: "bg-amber-500/10", text: "text-amber-400" },
    critical: { stroke: "#ef4444", bg: "bg-red-500/10", text: "text-red-400" },
  };

  return (
    <div className={`relative ${sizeClasses[size].container} industrial-panel rounded-lg p-2`}>
      {/* Background arc */}
      <svg viewBox="0 0 100 60" className="w-full h-full">
        {/* Outer ring - uses CSS variable for theme support */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          className="stroke-muted"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={colors[status].stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          className="transition-all duration-500"
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickAngle = ((tick / 100) * 180 - 90) * (Math.PI / 180);
          const x1 = 50 + Math.cos(tickAngle) * 32;
          const y1 = 55 + Math.sin(tickAngle) * 32;
          const x2 = 50 + Math.cos(tickAngle) * 38;
          const y2 = 55 + Math.sin(tickAngle) * 38;
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className="stroke-muted-foreground"
              strokeWidth="1"
            />
          );
        })}
        {/* Needle */}
        <line
          x1="50"
          y1="55"
          x2={50 + Math.cos(angle * (Math.PI / 180)) * 28}
          y2={55 + Math.sin(angle * (Math.PI / 180)) * 28}
          stroke={colors[status].stroke}
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
        {/* Center dot */}
        <circle cx="50" cy="55" r="4" fill={colors[status].stroke} />
      </svg>
      
      {/* Value display */}
      <div className="absolute bottom-1 left-0 right-0 text-center">
        <span className={`${sizeClasses[size].text} font-mono font-bold ${colors[status].text}`}>
          {value.toFixed(1)}
        </span>
        <span className={`${sizeClasses[size].label} text-muted-foreground ml-0.5`}>{unit}</span>
      </div>
      
      {/* Label */}
      <div className={`absolute -bottom-4 left-0 right-0 text-center ${sizeClasses[size].label} text-muted-foreground font-mono uppercase tracking-wider`}>
        {label}
      </div>
    </div>
  );
}

// Status LED indicator
export function StatusLED({ 
  status, 
  label,
  size = "md" 
}: { 
  status: "online" | "warning" | "critical" | "offline";
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const ledClass = {
    online: "led-green",
    warning: "led-amber",
    critical: "led-red",
    offline: "led-off",
  }[status];
  
  const sizeClass = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }[size];

  return (
    <div className="flex items-center gap-2">
      <div className={`led ${ledClass} ${sizeClass}`} />
      {label && (
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}

// Warning stripe banner
export function WarningBanner({ 
  children, 
  variant = "warning" 
}: { 
  children: React.ReactNode;
  variant?: "warning" | "caution" | "danger";
}) {
  const styles = {
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    caution: "bg-yellow-500/10 border-yellow-500/30 text-yellow-200",
    danger: "bg-red-500/10 border-red-500/30 text-red-200",
  }[variant];

  return (
    <div className={`relative overflow-hidden rounded-lg border ${styles}`}>
      <div className="absolute top-0 left-0 right-0 h-1 warning-stripes" />
      <div className="px-4 py-3 pt-4">
        {children}
      </div>
    </div>
  );
}

// Industrial panel wrapper
export function IndustrialPanel({ 
  children,
  title,
  status,
}: { 
  children: React.ReactNode;
  title?: string;
  status?: "online" | "warning" | "critical" | "offline";
}) {
  return (
    <div className="industrial-panel rounded-lg overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/30">
          <span className="tech-label text-muted-foreground">{title}</span>
          {status && <StatusLED status={status} size="sm" />}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
