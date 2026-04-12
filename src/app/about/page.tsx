import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, Droplets, Gauge, Thermometer, Wind, Waves, Wrench,
  Database, Brain, Code, Clock, Building, AlertTriangle, Cpu,
  MessageSquare, FileText, BarChart3, Shield, Settings, Download,
  Layers, Eye, Search, ClipboardList, TrendingUp, Lightbulb,
  ArrowRight, FlaskConical,
} from "lucide-react";

const SYSTEMS = [
  {
    tag: "V-101",
    name: "HP Production Separator",
    icon: Droplets,
    color: "text-blue-400",
    dataSource: "Real time-series data",
    description:
      "Three-phase High-Pressure Production Separator. The primary separation vessel that receives raw well fluid from the wellhead and separates it into crude oil, natural gas, and produced water using gravity and controlled pressure/temperature conditions.",
    sensors: ["Pressure (bar)", "Level (%)", "Temperature (\u00B0C)", "Gas Flow (MMscfd)", "Oil Flow (m\u00B3/h)"],
    criticality: "Safety-critical \u2014 overpressure or high level can lead to gas carry-over, liquid slugging downstream, or vessel rupture.",
  },
  {
    tag: "P-101",
    name: "HP Separator Drain Pump",
    icon: Gauge,
    color: "text-green-400",
    dataSource: "Real time-series data",
    description:
      "Centrifugal drain pump that removes accumulated liquid from the bottom of V-101. Must maintain stable flow to prevent the separator from flooding and keep the downstream water treatment process running.",
    sensors: ["Flow (m\u00B3/h)", "Discharge Pressure (bar)", "Vibration DE/NDE (mm/s)", "Motor Current (A)", "Bearing Temp (\u00B0C)"],
    criticality: "High \u2014 pump failure causes separator liquid level to rise, eventually triggering a shutdown.",
  },
  {
    tag: "E-301",
    name: "Produced Water Cooler",
    icon: Thermometer,
    color: "text-orange-400",
    dataSource: "Real time-series data",
    description:
      "Shell-and-tube heat exchanger that cools produced water before discharge or re-injection. Over time, scale buildup reduces heat transfer efficiency (fouling), causing outlet temperatures to rise progressively.",
    sensors: ["Tube Inlet Temp (\u00B0C)", "Tube Outlet Temp (\u00B0C)", "Shell Pressure (bar)", "Flow (m\u00B3/h)"],
    criticality: "Medium \u2014 fouling causes slow degradation that leads to environmental discharge limit violations if untreated.",
  },
  {
    tag: "K-201",
    name: "LP Compressor",
    icon: Wind,
    color: "text-purple-400",
    dataSource: "Randomized simulation",
    description:
      "Low-Pressure gas compressor that boosts separated gas pressure for export. Compressor surge (reversal of gas flow) is a critical and destructive condition that must be avoided through active control.",
    sensors: ["Discharge Pressure (bar)", "Discharge Temp (\u00B0C)", "Vibration (mm/s)", "Flow (MMscfd)", "Surge Margin (%)"],
    criticality: "Safety-critical \u2014 compressor surge or bearing failure can cause catastrophic mechanical damage.",
  },
  {
    tag: "P-303",
    name: "Cooling Water Pump",
    icon: Waves,
    color: "text-cyan-400",
    dataSource: "Randomized simulation",
    description:
      "Circulates seawater through the platform cooling system serving all heat exchangers. Loss of cooling water causes multiple systems to overheat, forcing a platform-wide shutdown.",
    sensors: ["Flow (m\u00B3/h)", "Discharge Pressure (bar)", "Temperature (\u00B0C)", "Vibration (mm/s)", "Motor Current (A)"],
    criticality: "High \u2014 loss of cooling water affects the entire platform thermal management system.",
  },
];

const OTHER_SYSTEMS = [
  { area: "HP Separation Train (Deck A)", items: [
    "V-102 \u2014 Test Separator", "E-101 \u2014 Wellstream Heater",
    "E-102 \u2014 HP Glycol Reboiler", "P-102 \u2014 HP Separator Drain Pump B",
    "FT-101/102 \u2014 Gas & Oil Flow Meters",
    "PT/LT/TT \u2014 Pressure, Level & Temperature Transmitters",
    "PSV-101, SDV-101, LCV-101, PCV-101 \u2014 Safety & Control Valves",
  ]},
  { area: "LP Compression Train (Deck B)", items: [
    "K-202 \u2014 LP Compressor B",
    "V-201/V-202 \u2014 LP Suction Scrubbers A/B",
    "E-201/E-202 \u2014 LP Compressor Aftercoolers A/B",
    "PT/FT/VT/TT \u2014 Various Transmitters",
    "SDV-201/202, PCV-201 \u2014 Shutdown & Anti-Surge Valves",
  ]},
  { area: "Water Treatment (Deck C)", items: [
    "V-301 \u2014 Produced Water Vessel", "V-302 \u2014 Deoiling Hydrocyclone Package",
    "P-301/P-302 \u2014 PW Transfer Pumps A/B", "P-304 \u2014 Cooling Water Pump B",
    "FT/PT/LT/TT/VT/AT \u2014 Various Transmitters & Analysers",
  ]},
  { area: "Utilities (Deck D)", items: [
    "K-401/K-402 \u2014 Instrument Air Compressors A/B",
    "V-401 \u2014 Instrument Air Receiver", "V-402 \u2014 Fuel Gas Scrubber",
    "P-401/P-402 \u2014 Fire Water Pumps A/B",
    "G-401/G-402 \u2014 Main Generators A/B (Diesel)",
    "G-403 \u2014 Emergency Generator", "ESD-001 \u2014 Platform ESD System",
  ]},
  { area: "Metering & Export (Deck E)", items: [
    "V-501/V-502 \u2014 Export Buffer Tanks A/B",
    "P-501/P-502 \u2014 Export Crude Pumps A/B", "E-501 \u2014 Export Crude Heater",
    "FT/PT/TT/LT \u2014 Export Line Transmitters",
    "SDV-501, PCV-501 \u2014 Export Line Valves",
  ]},
];

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-20">{children}</section>;
}

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-12">
      {/* ─── Hero ─── */}
      <Section>
        <div className="relative -mx-4 sm:-mx-6 -mt-6 overflow-hidden rounded-b-3xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/control-room.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <div className="relative px-4 sm:px-6 py-12 lg:py-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-mono text-primary tracking-wider uppercase">Documentation</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Proactive AI Copilot for<br />
              <span className="text-primary">Industrial Operations</span>
            </h1>
            <p className="text-muted-foreground max-w-xl leading-relaxed">
              A real-time monitoring and AI-powered advisory system for offshore oil &amp; gas
              production platforms. Simulating <strong className="text-foreground">North Sea Platform Alpha</strong> — 
              a realistic offshore production facility demonstrating AI-driven anomaly detection,
              historical pattern matching, and proactive recommendations.
            </p>
          </div>
        </div>
      </Section>

      {/* ─── Quick links ─── */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { href: "#data", label: "Data & Sources", icon: Database },
          { href: "#dashboard", label: "Dashboard Guide", icon: BarChart3 },
          { href: "#detection", label: "Anomaly Detection", icon: AlertTriangle },
          { href: "#methodology", label: "Data Generation", icon: FlaskConical },
          { href: "#ai", label: "AI & Chat", icon: Brain },
          { href: "#systems", label: "Equipment", icon: Wrench },
          { href: "#roadmap", label: "Future Roadmap", icon: Lightbulb },
          { href: "#tech", label: "Tech Stack", icon: Code },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all group"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> 
              {link.label}
            </a>
          );
        })}
      </div>

      {/* ─── The Data ─── */}
      <Section id="data">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              The Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              This project uses a comprehensive synthetic dataset that models a realistic
              offshore oil &amp; gas production facility. All data was designed to be internally
              consistent \u2014 assets reference each other, sensors belong to specific equipment,
              failure events tie to work orders, and documents reference the correct equipment tags.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  icon: BarChart3, title: "Time Series", color: "text-blue-400",
                  stat: "3M+ readings",
                  desc: "Sensor readings recorded at 15-minute intervals across 3 assets (V-101, P-101, E-301), covering normal operations, gradual degradation, and failure events.",
                },
                {
                  icon: Layers, title: "Assets", color: "text-emerald-400",
                  stat: "~95 equipment items",
                  desc: "Vessels, pumps, compressors, heat exchangers, generators, instruments, and valves across 5 operational areas of the platform.",
                },
                {
                  icon: Gauge, title: "Sensor Metadata", color: "text-amber-400",
                  stat: "175 sensors",
                  desc: "Each sensor has calibrated thresholds: normal range, alarm limits (low/high), and trip limits (low/high) that trigger different severity levels.",
                },
                {
                  icon: AlertTriangle, title: "Failure Events", color: "text-red-400",
                  stat: "7 incidents",
                  desc: "Historical failure records with root cause analysis, failure mechanism, immediate/corrective actions, downtime hours, and production loss in barrels.",
                },
                {
                  icon: Wrench, title: "Maintenance History", color: "text-purple-400",
                  stat: "84 work orders",
                  desc: "Corrective, preventive, predictive, and emergency work orders with findings, parts replaced, labor hours, and personnel details.",
                },
                {
                  icon: FileText, title: "Documents", color: "text-cyan-400",
                  stat: "11 documents",
                  desc: "SOPs for startup, shutdown, and maintenance; equipment manuals; P&ID references; inspection reports; and safety/environmental procedures.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                      <span className="font-medium text-foreground text-xs">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto font-mono">{item.stat}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Data timing callout */}
            <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">How the Live Data Works</p>
                <p className="text-muted-foreground leading-relaxed">
                  The source time-series data is recorded at <strong className="text-foreground">15-minute intervals</strong>.
                  In this demo, each 15-minute data point is replayed as a single tick every
                  <strong className="text-foreground"> 1\u20132 seconds</strong> on screen (configurable via the
                  speed selector on the dashboard). This creates a <strong className="text-foreground">fast-forward time-lapse</strong> effect
                  \u2014 you can watch hours of real operational history, including slow degradation and
                  sudden failures, unfold in minutes. For assets without real time-series data (like K-201
                  and P-303), randomized simulated readings are generated on each tick using realistic
                  parameters from the sensor metadata thresholds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Dashboard Guide ─── */}
      <Section id="dashboard">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Dashboard Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The dashboard is the main interface for monitoring platform operations.
              Here is what each section does:
            </p>

            <div className="space-y-4">
              {/* Controls */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-400" />
                  <p className="font-medium text-foreground">Header Controls</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1.5 ml-6">
                  <li><strong className="text-foreground">Systems filter</strong> \u2014 Opens a panel to choose which of the ~95 assets to monitor. Default shows 5 key systems. Assets with real time-series data are marked with a green dot.</li>
                  <li><strong className="text-foreground">Scenario selector</strong> \u2014 Pick a specific scenario to replay: Normal Operation, Degrading (HX Fouling), Failure (Pump Bearing), or Random Chaos. &quot;Live (Full Data)&quot; replays the entire dataset sequentially.</li>
                  <li><strong className="text-foreground">LIVE / PAUSED toggle</strong> \u2014 Pause or resume data streaming at any time.</li>
                  <li><strong className="text-foreground">Speed selector</strong> \u2014 How often new readings arrive: 0.5s to 3s per tick. Each tick represents one 15-minute data point from the original dataset.</li>
                </ul>
              </div>

              {/* Summary bar */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <p className="font-medium text-foreground">Summary Bar</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">
                  Three cards at the top show: (1) how many systems are being monitored, (2)
                  the total count of active alerts across all systems, and (3) the worst status
                  level (NORMAL / ADVISORY / WARNING / CRITICAL) across all systems. When any system
                  reaches CRITICAL, a red flashing banner appears at the top of every page.
                </p>
              </div>

              {/* System cards */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <p className="font-medium text-foreground">System Cards</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">
                  Each active asset gets a card showing its tag, name, current status badge,
                  live sensor values (color-coded by status), and alert messages with recommended
                  actions. Click a card to select it for the trend chart below. Each card has
                  a &quot;Details&quot; link that opens the full asset detail page with sensor metadata,
                  documents, maintenance history, and failure events.
                </p>
              </div>

              {/* Trend chart */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  <p className="font-medium text-foreground">Sensor Trend Chart</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">
                  Shows the last 60 readings for the selected system as a live line chart.
                  Use the <strong className="text-foreground">sensor picker dropdown</strong> with search to select
                  which specific sensors to display. You can show all sensors at once, pick
                  individual ones, or search by name. Each sensor has a consistent color across
                  the chart and legend.
                </p>
              </div>

              {/* Chat */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <p className="font-medium text-foreground">AI Chat Assistant</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">
                  A conversational AI assistant powered by GPT-4o-mini. It has access to all
                  11 operational documents and live sensor data from monitored systems. Ask it
                  general questions (&quot;what does this app do?&quot;), operational questions
                  (&quot;what&apos;s happening with V-101?&quot;), or technical questions
                  (&quot;how do I start up the separator?&quot;). The chat maintains conversation
                  history so you can have follow-up discussions. Uses TF-IDF document search
                  to find the most relevant documents for each question.
                </p>
              </div>

              {/* Alert log */}
              <div className="p-4 rounded-lg bg-accent/20 border border-border/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <p className="font-medium text-foreground">Recent Alerts Log</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed ml-6">
                  A table at the bottom of the dashboard capturing the last 50 non-NORMAL sensor
                  readings across all monitored systems. Each entry shows the timestamp, system tag,
                  sensor type, severity status, value, and reason. You can export the alert log as
                  a CSV file for offline analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Anomaly Detection ─── */}
      <Section id="detection">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-emerald-400" />
              How Anomaly Detection Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The system uses a <strong className="text-foreground">rule-based, multi-tier threshold model</strong> to
              classify sensor readings into four severity levels. This mimics how real industrial
              control systems (DCS/SCADA) work in production environments.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium">Level</th>
                    <th className="py-2 pr-4 font-medium">Condition</th>
                    <th className="py-2 pr-4 font-medium">Meaning</th>
                    <th className="py-2 font-medium">Typical Response</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/30">
                    <td className="py-2 pr-4"><span className="text-emerald-400 font-medium">NORMAL</span></td>
                    <td className="py-2 pr-4">Within normal_min \u2013 normal_max</td>
                    <td className="py-2 pr-4">Operating as designed</td>
                    <td className="py-2">No action needed</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 pr-4"><span className="text-yellow-400 font-medium">ADVISORY</span></td>
                    <td className="py-2 pr-4">Between normal and alarm limits</td>
                    <td className="py-2 pr-4">Slight deviation from optimal</td>
                    <td className="py-2">Monitor closely, plan investigation</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 pr-4"><span className="text-amber-400 font-medium">WARNING</span></td>
                    <td className="py-2 pr-4">Between alarm and trip limits</td>
                    <td className="py-2 pr-4">Abnormal \u2014 approaching trip point</td>
                    <td className="py-2">Immediate investigation, prepare corrective action</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4"><span className="text-red-400 font-medium">CRITICAL</span></td>
                    <td className="py-2 pr-4">Beyond trip limits</td>
                    <td className="py-2 pr-4">Safety-critical \u2014 equipment trip expected</td>
                    <td className="py-2">Emergency shutdown, execute SOP</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              When anomalies are detected, two additional engines activate:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-amber-400" />
                  Failure Pattern Matching
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compares current anomaly patterns against the 7 historical failure events.
                  Matches are scored by sensor type overlap and asset relevance, providing a
                  confidence percentage along with the known root cause and corrective actions
                  from that past incident.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  SOP Recommendation Engine
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Searches the 11 operational documents for procedures relevant to the current
                  anomaly. Uses keyword matching based on sensor types and equipment IDs to
                  surface the most applicable SOPs, manuals, or inspection guidance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Data Generation Methodology ─── */}
      <Section id="methodology">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-400" />
              Data Generation Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The platform uses two distinct data sources depending on the equipment.
              Understanding the difference is key to interpreting the dashboard.
            </p>

            {/* Two methods side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <p className="font-medium text-foreground">Real Time-Series Data</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ml-auto">V-101, P-101, E-301</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  3 systems have <strong className="text-foreground">pre-recorded synthetic data</strong> designed
                  by domain experts with realistic operational scenarios: normal steady-state, gradual
                  degradation (heat exchanger fouling), and sudden failure (pump bearing collapse).
                  This data has natural autocorrelation, sensor cross-correlation, and operationally
                  accurate progression patterns.
                </p>
                <p className="text-[10px] text-muted-foreground">3M+ readings at 15-min intervals \u2022 replayed as live feed</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <p className="font-medium text-foreground">AR Model Simulation</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 ml-auto">All other systems</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For the remaining ~74 systems, data is generated using an <strong className="text-foreground">Autoregressive
                  (AR) model with momentum</strong>. Each sensor maintains state across ticks \u2014
                  the current value depends on its previous value, a mean-reversion pull, correlated
                  group noise (sensors that should move together do), and day/night seasonal cycles.
                </p>
                <p className="text-[10px] text-muted-foreground">Momentum-based \u2022 sensor correlation \u2022 24h cycles</p>
              </div>
            </div>

            {/* Current model details */}
            <div className="space-y-3">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-blue-400" />
                Current Model: AR with Seasonal Decomposition
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-medium">Feature</th>
                      <th className="py-2 font-medium">Implementation</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-medium text-foreground">Autoregression</td>
                      <td className="py-2">Each value = f(previous value) with momentum decay (0.9) and mean-reversion pull (0.03\u2013 0.04 strength)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-medium text-foreground">Seasonality</td>
                      <td className="py-2">24-hour sinusoidal cycle peaking at 14:00 UTC (simulating operational load patterns) + weekly factor (weekday 100%, weekend 85%)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-medium text-foreground">Sensor Correlation</td>
                      <td className="py-2">Shared Gaussian noise within equipment-type groups (e.g. pump: flow + current + pressure move together; compressor: discharge pressure + temp)</td>
                    </tr>
                    <tr className="border-b border-border/30">
                      <td className="py-2 pr-4 font-medium text-foreground">Anomaly Injection</td>
                      <td className="py-2">Bell-curve anomaly events (ramp up \u2192 peak \u2192 ramp down) rather than instant spikes, with configurable intensity</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-foreground">Threshold Calibration</td>
                      <td className="py-2">All generated values respect the sensor metadata thresholds (normal, alarm, trip) from the 175-sensor configuration</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                The model formula can be expressed as:
              </p>
              <div className="p-3 rounded-lg bg-accent/30 border border-border/30 font-mono text-xs text-center">
                x(t) = momentum(t-1) \u00D7 0.9 + (target \u2212 x(t-1)) \u00D7 \u03B1 + corr_noise + \u03B5(t)
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                where \u03B1 = pull strength, corr_noise = shared group factor, \u03B5(t) ~ N(0, \u03C3\u00B2)
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── AI & Chat ─── */}
      <Section id="ai">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400" />
              AI Chat &amp; RAG System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The AI chat assistant uses <strong className="text-foreground">Retrieval-Augmented Generation (RAG)</strong> to
              answer questions with grounded, document-backed responses.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
                <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Query Analysis</p>
                  <p className="text-xs text-muted-foreground">Your question is tokenized and analyzed. The system detects whether you are asking a general question, requesting live status, or seeking procedural information.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
                <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">TF-IDF Document Search</p>
                  <p className="text-xs text-muted-foreground">All 11 documents are scored using TF-IDF (Term Frequency \u2013 Inverse Document Frequency) against your query. Title matches are boosted 1.5\u00D7. Documents matching the current asset context are boosted 1.8\u00D7. The top 4 most relevant documents are selected.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
                <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Context Assembly</p>
                  <p className="text-xs text-muted-foreground">The retrieved document excerpts, live sensor data from all monitored systems, and the last 10 messages of conversation history are assembled into a context window for GPT.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
                <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">4</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">GPT-4o-mini Response</p>
                  <p className="text-xs text-muted-foreground">OpenAI&apos;s GPT-4o-mini generates a context-aware response. For general questions it responds conversationally. For operational questions it references live data and cites specific document IDs. A fallback keyword search mode is available if no API key is configured.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Other Pages ─── */}
      <Section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" />
              Other Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" /> Simulator
                </p>
                <p className="text-xs text-muted-foreground">Manually adjust sensor values for any asset using sliders and see real-time anomaly detection, failure pattern matching, and SOP recommendations. Useful for testing &quot;what if&quot; scenarios.</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> History
                </p>
                <p className="text-xs text-muted-foreground">Browse all 84 maintenance work orders (filterable by system and type) and 7 historical failure events shown in a visual timeline. Both tabs support CSV export.</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Asset Detail
                </p>
                <p className="text-xs text-muted-foreground">Click any asset tag to see its dedicated page with live sensors, trend chart, full sensor metadata table, linked documents, failure events, and maintenance work orders.</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> CSV Export
                </p>
                <p className="text-xs text-muted-foreground">Export alert logs from the dashboard, maintenance records, failure events, sensor metadata, or asset lists as CSV files for offline analysis or reporting.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Monitored Systems ─── */}
      <Section id="systems">
        <h2 className="text-xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Key Monitored Systems
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The platform has approximately 95 assets across 5 operational areas. The dashboard
          defaults to monitoring these 5 critical systems, but you can add any of the ~95 assets
          using the Systems filter.
        </p>
        <div className="space-y-3">
          {SYSTEMS.map((sys) => {
            const Icon = sys.icon;
            return (
              <Card key={sys.tag}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg bg-accent/50 ${sys.color} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm bg-accent px-1.5 py-0.5 rounded font-bold">
                          {sys.tag}
                        </span>
                        <span className="font-medium">{sys.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          sys.dataSource === "Real time-series data"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        }`}>
                          {sys.dataSource}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {sys.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sys.sensors.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] bg-accent/50 border border-border/50 px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-400/80">
                        {sys.criticality}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* ─── Other Platform Systems ─── */}
      <Section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Full Platform Equipment List
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-4 leading-relaxed">
              All ~95 assets are available in the system. You can add any of them to the dashboard
              using the Systems filter, view their details via the asset detail page, or browse
              their maintenance and failure history on the History page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OTHER_SYSTEMS.map((group) => (
                <div key={group.area} className="p-3 rounded-lg bg-accent/20 border border-border/30">
                  <p className="font-medium text-foreground text-xs mb-2">{group.area}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <li key={item} className="text-[11px] text-muted-foreground">
                        \u2022 {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Future Roadmap ─── */}
      <Section id="roadmap">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-400" />
              Future Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              This prototype demonstrates the core concept. Below are planned enhancements
              for production readiness, organized by priority.
            </p>

            {/* Data Generation Upgrades */}
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-3">
              <p className="font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                Data Generation: AR \u2192 SARIMAX \u2192 Deep Learning
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0 mt-px">\u2713</span>
                  <div>
                    <strong className="text-foreground">Current: AR with Seasonal Decomposition</strong>
                    <span className="text-muted-foreground"> \u2014 Autoregressive model with momentum, 24h seasonality, sensor group correlation, and equipment-type-aware parameters. Fast, deterministic, and configurable.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <strong className="text-foreground">Next: SARIMAX (Seasonal ARIMA with eXogenous variables)</strong>
                    <span className="text-muted-foreground"> \u2014 Fit SARIMAX models on the 3 real time-series assets (V-101, P-101, E-301) to learn their autocorrelation structure, seasonal patterns (p,d,q)\u00D7(P,D,Q,s), then transfer learned parameters to generate data for other systems of the same equipment type. Validate with Time-Series K-Fold Cross-Validation (rolling window splits).</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 text-purple-400 shrink-0 mt-1" />
                  <div>
                    <strong className="text-foreground">Future: VAR + Deep Learning</strong>
                    <span className="text-muted-foreground"> \u2014 Vector Autoregression (VAR) for multi-sensor joint modeling with proper cross-correlation. LSTM or Transformer-based models (TimeGAN) for capturing non-linear degradation patterns and generating highly realistic failure progressions.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Anomaly Detection
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade from static thresholds to ML-based anomaly detection: Isolation Forest
                  for multivariate outliers, LSTM autoencoders for sequence anomalies, or
                  Gaussian Process regression for predictive confidence intervals.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-purple-400" />
                  RAG &amp; Chat
                </p>
                <p className="text-xs text-muted-foreground">
                  Replace TF-IDF with vector embeddings (OpenAI ada-002 or local Sentence
                  Transformers) for semantic document search. Add function calling so GPT can
                  query the database directly instead of receiving pre-formatted data.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
                  Predictive Maintenance
                </p>
                <p className="text-xs text-muted-foreground">
                  Remaining Useful Life (RUL) estimation using survival analysis or degradation
                  modeling. Predict when a sensor will cross alarm/trip thresholds based on its
                  current trajectory and historical failure data.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-cyan-400" />
                  Production Infrastructure
                </p>
                <p className="text-xs text-muted-foreground">
                  Replace JSON files with a time-series database (TimescaleDB or InfluxDB).
                  Add WebSocket streaming instead of polling. Role-based access control.
                  Mobile-responsive PWA for field technicians.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ─── Tech Stack ─── */}
      <Section id="tech">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-400" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Frontend:</strong> Next.js 16 (App Router, Turbopack), React 19, TypeScript</p>
              <p><strong className="text-foreground">UI:</strong> Tailwind CSS, shadcn/ui components, Recharts for charts</p>
              <p><strong className="text-foreground">Backend:</strong> Next.js API Routes (serverless), pre-processed JSON data</p>
              <p><strong className="text-foreground">AI:</strong> OpenAI GPT-4o-mini with RAG (TF-IDF document retrieval + conversation history)</p>
              <p><strong className="text-foreground">Deployment:</strong> Vercel (serverless, edge-optimized)</p>
              <p><strong className="text-foreground">Data Pipeline:</strong> Custom Node.js script converting CSV \u2192 optimized JSON at build time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400" />
                Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Simulation:</strong> Stateless API serves data by index; client manages position via useRef</p>
              <p><strong className="text-foreground">Detection:</strong> Rule-based threshold checking per sensor against metadata calibrations</p>
              <p><strong className="text-foreground">Pattern Matching:</strong> Heuristic scoring of current anomalies against historical failure events</p>
              <p><strong className="text-foreground">Recommendations:</strong> Keyword-based document search scoped to relevant asset</p>
              <p><strong className="text-foreground">Chat RAG:</strong> TF-IDF scoring \u2192 top-4 document retrieval \u2192 GPT with full history</p>
              <p><strong className="text-foreground">Export:</strong> Server-side CSV generation + client-side Blob downloads</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <div className="text-center py-6 space-y-1">
        <p className="text-xs text-muted-foreground">
          Built as a demonstration of AI-augmented industrial monitoring systems.
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          North Sea Platform Alpha is a fictional facility. All data is synthetic.
        </p>
      </div>
    </div>
  );
}
