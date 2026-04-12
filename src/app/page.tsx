import Link from "next/link";
import Image from "next/image";
import { 
  Gauge, Activity, Brain, Shield, AlertTriangle, Wrench,
  ChevronRight, Zap, Clock, BarChart3, FileText
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative -mx-4 sm:-mx-6 -mt-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/platform-hero.jpg"
            alt="Offshore oil platform"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        
        <div className="relative px-4 sm:px-6 py-20 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Monitoring Active
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
              Proactive AI Copilot for{" "}
              <span className="text-primary">Industrial Operations</span>
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Real-time anomaly detection and AI-powered advisory system for offshore 
              oil &amp; gas production. Monitor equipment health, predict failures, and 
              receive actionable recommendations before incidents occur.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                <Gauge className="h-5 w-5" />
                Open Dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card/50 backdrop-blur-sm font-medium hover:bg-accent transition-colors"
              >
                <FileText className="h-5 w-5" />
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Equipment Monitored", value: "95+", icon: Gauge, color: "text-cyan-400" },
          { label: "Active Sensors", value: "175", icon: Activity, color: "text-emerald-400" },
          { label: "Historical Failures", value: "7", icon: AlertTriangle, color: "text-amber-400" },
          { label: "Work Orders", value: "84", icon: Wrench, color: "text-primary" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-4 rounded-xl bg-card border border-border">
              <Icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Intelligent Platform Monitoring</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Advanced AI capabilities designed for industrial operations safety and efficiency
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Activity,
              title: "Real-Time Monitoring",
              description: "Live sensor data streaming with configurable refresh rates. Track pressure, temperature, flow, vibration, and more across all equipment.",
              color: "from-cyan-500/20 to-cyan-500/5",
              iconColor: "text-cyan-400",
            },
            {
              icon: AlertTriangle,
              title: "Anomaly Detection",
              description: "Rule-based threshold monitoring with four severity levels: Normal, Advisory, Warning, and Critical. Instant alerts when values exceed limits.",
              color: "from-amber-500/20 to-amber-500/5",
              iconColor: "text-amber-400",
            },
            {
              icon: Brain,
              title: "AI-Powered Insights",
              description: "GPT-4o chat assistant with access to operational documents and live data. Ask questions about procedures, equipment, or current conditions.",
              color: "from-emerald-500/20 to-emerald-500/5",
              iconColor: "text-emerald-400",
            },
            {
              icon: Clock,
              title: "Pattern Matching",
              description: "Automatically matches current anomalies against historical failure events. Learn from past incidents to predict future problems.",
              color: "from-purple-500/20 to-purple-500/5",
              iconColor: "text-purple-400",
            },
            {
              icon: FileText,
              title: "SOP Recommendations",
              description: "Contextual recommendations from 11 operational documents including startup procedures, maintenance guides, and safety protocols.",
              color: "from-blue-500/20 to-blue-500/5",
              iconColor: "text-blue-400",
            },
            {
              icon: BarChart3,
              title: "Trend Analysis",
              description: "Interactive charts showing sensor history over time. Identify gradual degradation before it becomes critical failure.",
              color: "from-primary/20 to-primary/5",
              iconColor: "text-primary",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title} 
                className={`p-6 rounded-xl border border-border bg-gradient-to-br ${feature.color}`}
              >
                <div className="p-2.5 rounded-lg bg-card/80 w-fit mb-4 border border-border/50">
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipment Showcase */}
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border">
          <Image
            src="/images/control-room.jpg"
            alt="Industrial control room"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs text-muted-foreground mb-1 font-mono">NORTH SEA PLATFORM ALPHA</p>
            <p className="font-medium">Operations Control Center</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Comprehensive Equipment Coverage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Monitor critical equipment across all operational areas of the platform. 
            From high-pressure separators to export pumps, every system is tracked 
            with calibrated thresholds and real-time analysis.
          </p>
          
          <div className="space-y-3">
            {[
              { area: "HP Separation Train", count: "15 assets", status: "Active" },
              { area: "LP Compression", count: "12 assets", status: "Active" },
              { area: "Water Treatment", count: "18 assets", status: "Active" },
              { area: "Utilities", count: "22 assets", status: "Active" },
              { area: "Metering & Export", count: "14 assets", status: "Active" },
            ].map((area) => (
              <div 
                key={area.area}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-sm">{area.area}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{area.count}</span>
              </div>
            ))}
          </div>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
          >
            View all systems
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/separator-vessel.jpg"
            alt="Industrial separator vessel"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        </div>
        
        <div className="relative p-8 lg:p-12">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Ready to explore?</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Start Monitoring Platform Operations
            </h2>
            <p className="text-muted-foreground mb-6">
              Access the live dashboard to see real-time sensor data, anomaly alerts, 
              and AI-powered recommendations in action.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Gauge className="h-4 w-4" />
                Open Dashboard
              </Link>
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm font-medium hover:bg-accent transition-colors"
              >
                <Shield className="h-4 w-4" />
                Try Simulator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
