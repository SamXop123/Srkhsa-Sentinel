import React, { useState, useEffect } from "react";
import {
  FileText,
  Bot,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Upload,
  Search,
  Cpu,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Sparkles,
  ClipboardCheck,
  Shield,
  Activity,
  Check,
  ChevronRight,
  Database,
  Building,
  ShieldAlert,
} from "lucide-react";
import { AgentTerminal } from "../components/terminal/AgentTerminal";
import { Link } from "react-router-dom";
import { apiClient } from "../services/api";

/* ───────────────────────── KPI Card ───────────────────────── */
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: string; positive: boolean };
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, iconBg, trend }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
    </div>
    <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
    <div className="flex items-center gap-1.5">
      {trend && (
        <span className={`flex items-center text-xs font-semibold ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
      <span className="text-xs text-slate-400">{subtitle}</span>
    </div>
  </div>
);

/* ───────────────────── Agent Pipeline Stage ─────────────────── */
interface PipelineStageProps {
  title: string;
  agentName: string;
  status: "running" | "completed" | "idle" | "error";
  lastActivity: string;
  successText: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const PipelineStage: React.FC<PipelineStageProps> = ({
  title,
  agentName,
  status,
  lastActivity,
  successText,
  icon,
  isLast = false,
}) => {
  const getStatusConfig = (st: PipelineStageProps["status"]) => {
    switch (st) {
      case "running":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-700",
          dot: "bg-blue-500 animate-pulse",
          label: "Active Reasoning",
        };
      case "completed":
        return {
          bg: "bg-emerald-50 border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-500",
          label: "Idle (Operational)",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-700",
          dot: "bg-red-500",
          label: "Exception Blocked",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200",
          text: "text-slate-500",
          dot: "bg-slate-300",
          label: "Standby",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex-1 flex items-center min-w-[220px]">
      <div className={`flex-1 bg-white rounded-xl border border-slate-200 p-4 relative shadow-sm hover:border-slate-300 transition-colors`}>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#003366] uppercase tracking-wider">{title}</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{config.label}</span>
          </div>
        </div>

        {/* Icon & Agent Title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#003366]">
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 leading-none">{agentName}</h4>
            <p className="text-[10px] text-slate-400 mt-1">Last seen: {lastActivity}</p>
          </div>
        </div>

        {/* Success Metrics Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-600 font-medium truncate">{successText}</span>
        </div>
      </div>

      {!isLast && (
        <div className="mx-2 hidden lg:flex items-center justify-center flex-shrink-0 text-slate-300">
          <ArrowRight className="w-5 h-5 animate-pulse" />
        </div>
      )}
    </div>
  );
};

/* ────────────────── Compliance Status Badge ──────────────── */
const ComplianceBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    Compliant: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    "In Progress": {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <Clock className="w-3 h-3" />,
    },
    Violation: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    Overdue: {
      bg: "bg-red-100 border-red-300",
      text: "text-red-800",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const c = config[status] || config["In Progress"];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text}`}>
      {c.icon} {status}
    </span>
  );
};

/* ────────────────── Escalation Timeline ──────────────────── */
const TIMELINE_STEPS = [
  { step: 1, label: "Assigned" },
  { step: 2, label: "Auditor Review" },
  { step: 3, label: "CISO" },
  { step: 4, label: "CEO Alert" },
];

/* ─────────────────── Compliance Table Data ────────────────── */
const COMPLIANCE_DATA = [
  { id: "RBI/2026-27/14", desc: "Revised KYC Master Direction (Tier-1 Framework)", deadline: "2026-07-01", dept: "Retail Loans & Compliance", deptBg: "bg-blue-50 text-blue-700", status: "In Progress" },
  { id: "SEBI/HO/2026/05", desc: "Intermediary Cyber Resilience Reporting SOP", deadline: "2026-08-15", dept: "IT Security", deptBg: "bg-violet-50 text-violet-700", status: "In Progress" },
  { id: "FIU-IND/2026/08", desc: "Suspicious Transaction crypto pattern guidelines", deadline: "2026-07-10", dept: "Risk Management", deptBg: "bg-orange-50 text-orange-700", status: "In Progress" },
  { id: "RBI/2026-27/11", desc: "Outsourcing Vendor Audit Access mandates", deadline: "2026-09-30", dept: "Legal & Vendor Risk", deptBg: "bg-emerald-50 text-emerald-700", status: "Compliant" },
];

/* ─────────────────── Mock Discoveries Data ─────────────────── */
const MOCK_DISCOVERIES = [
  {
    id: "mock-disc-1",
    circular_id: "mock-1",
    circular_number: "RBI/2026-27/14",
    title: "Appointment of CISO Mandate",
    regulator: "RBI",
    effective_date: "2026-07-01",
    risk_level: "Critical"
  },
  {
    id: "mock-disc-2",
    circular_id: "mock-2",
    circular_number: "SEBI/HO/2026/05",
    title: "Annual IT VAPT Audit Scoping",
    regulator: "SEBI",
    effective_date: "2026-08-15",
    risk_level: "High"
  },
  {
    id: "mock-disc-3",
    circular_id: "mock-3",
    circular_number: "FIU-IND/2026/08",
    title: "Suspicious Transaction crypto reporting SOP",
    regulator: "FIU-IND",
    effective_date: "2026-07-10",
    risk_level: "Medium"
  }
];

/* ═══════════════════════ DASHBOARD PAGE ══════════════════════ */
export const Dashboard: React.FC = () => {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total_maps: 0,
    high_risk_maps: 0,
    pending_approval: 0,
    approved_maps: 0
  });

  useEffect(() => {
    const fetchRecentScoutDiscoveries = async () => {
      try {
        const response = await apiClient.get("/circulars/regulations/recent");
        setDiscoveries(response.data);
      } catch (err) {
        console.warn("Failed to fetch live Scout discoveries, defaulting to mock data:", err);
      }
    };
    
    const fetchMetrics = async () => {
      try {
        const response = await apiClient.get("/maps/metrics");
        setMetrics(response.data);
      } catch (err) {
        console.warn("Failed to fetch live MAP metrics:", err);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await apiClient.get("/tasks");
        setTasks(response.data);
      } catch (err) {
        console.warn("Failed to fetch live tasks list:", err);
      }
    };

    fetchRecentScoutDiscoveries();
    fetchMetrics();
    fetchTasks();
  }, []);

  const displayedDiscoveries = discoveries.length > 0 ? discoveries : MOCK_DISCOVERIES;

  // Group tasks by department for the snapshot
  const deptStats: Record<string, { completed: number; total: number }> = {};
  tasks.forEach((t) => {
    const dName = t.department_name || "General Compliance";
    if (!deptStats[dName]) {
      deptStats[dName] = { completed: 0, total: 0 };
    }
    deptStats[dName].total += 1;
    if (t.status === "Completed") {
      deptStats[dName].completed += 1;
    }
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "High":
        return "bg-red-50 text-red-700 border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Executive Overview Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-1">Executive Overview</p>
          <h1 className="text-2xl font-bold text-slate-900">Regulatory Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Autonomous oversight across RBI, SEBI &amp; FIU-IND directives</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <ClipboardCheck className="w-4 h-4 text-[#003366]" />
            Export Board Report
          </button>
          <Link
            to="/map-review"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#003366] bg-[#FFD700] rounded-lg hover:bg-[#f0c800] transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Human-in-the-Loop Review
          </Link>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Pending Regulations"
          value="12"
          subtitle="+3 this week"
          icon={<FileText className="w-5 h-5 text-[#003366]" />}
          iconBg="bg-blue-50"
          trend={{ value: "+3", positive: false }}
        />
        <KPICard
          title="Active Agents"
          value="4"
          subtitle="All operational"
          icon={<Bot className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <KPICard
          title="Global Compliance Score"
          value="98.4%"
          subtitle="+1.2% MoM"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          trend={{ value: "1.2% MoM", positive: true }}
        />
        <KPICard
          title="Critical Escalations"
          value="2"
          subtitle="2 awaiting CCO action"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          iconBg="bg-red-50"
          trend={{ value: "2", positive: false }}
        />
      </div>

      {/* ─── MAP Generation Metrics ─── */}
      <div>
        <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-3">MAP Generation Metrics (Architect Agent)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Total MAPs"
            value={metrics.total_maps.toString()}
            subtitle="Extracted Action Points"
            icon={<Cpu className="w-5 h-5 text-[#003366]" />}
            iconBg="bg-blue-50"
          />
          <KPICard
            title="High &amp; Critical Risk"
            value={metrics.high_risk_maps.toString()}
            subtitle="Requires rapid remediation"
            icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
            iconBg="bg-red-50"
          />
          <KPICard
            title="Pending Approval"
            value={metrics.pending_approval.toString()}
            subtitle="Awaiting human reviewer sign-off"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
          />
          <KPICard
            title="Approved MAPs"
            value={metrics.approved_maps.toString()}
            subtitle="Dispatched and active"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
          />
        </div>
      </div>

      {/* ─── Agentic Regulatory Pipeline ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#003366]" />
              Agentic Regulatory Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Regulatory Loop Closure from Circular Ingestion to Compliance Verification
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Live Pipeline Processing Active</span>
          </div>
        </div>

        {/* Horizontal Workflow Cards */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 overflow-x-auto pb-2">
          <PipelineStage
            title="Stage 1: Ingest & Parse"
            agentName="Scout Agent"
            status="completed"
            lastActivity="2m ago"
            successText="100% Ingested (6/6 clauses)"
            icon={<Search className="w-4 h-4" />}
          />
          <PipelineStage
            title="Stage 2: MAP Translation"
            agentName="Architect Agent"
            status="running"
            lastActivity="Just now"
            successText="4 MAPs generated (98% conf)"
            icon={<Cpu className="w-4 h-4" />}
          />
          <PipelineStage
            title="Stage 3: Dept Dispatch"
            agentName="Dispatcher Agent"
            status="completed"
            lastActivity="10m ago"
            successText="Dispatched to 3 departments"
            icon={<Send className="w-4 h-4" />}
          />
          <PipelineStage
            title="Stage 4: Verification"
            agentName="Auditor Agent"
            status="running"
            lastActivity="Just now"
            successText="0 violations detected (100% check)"
            icon={<Shield className="w-4 h-4" />}
            isLast={true}
          />
        </div>
      </div>

      {/* ─── Compliance Tasks Overview ─── */}
      <div>
        <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-3">Compliance Tasks Overview (Dispatcher Agent)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Tasks Assigned"
            value={tasks.filter(t => t.status === "Assigned" || t.status === "Pending").length.toString()}
            subtitle="Routed to Department Queue"
            icon={<Building className="w-5 h-5 text-violet-600" />}
            iconBg="bg-violet-50"
          />
          <KPICard
            title="Tasks In Progress"
            value={tasks.filter(t => t.status === "In Progress").length.toString()}
            subtitle="Under active HOD resolution"
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <KPICard
            title="Awaiting Verification"
            value={tasks.filter(t => t.status === "Awaiting Verification").length.toString()}
            subtitle="Evidence pending audit checks"
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
          />
          <KPICard
            title="Tasks Completed"
            value={tasks.filter(t => t.status === "Completed").length.toString()}
            subtitle="Compliance loop verified closed"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
          />
        </div>
      </div>

      {/* ─── Core Operations Zone ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Ingestion, Department Snapshot, Recent Regulations */}
        <div className="space-y-6">
          {/* Ingestion Hub */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-[#003366]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Ingestion Hub</h3>
                  <p className="text-xs text-slate-500">Drop RBI / SEBI / FIU directives</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center hover:border-[#003366]/40 hover:bg-[#003366]/[0.02] transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center mb-2.5 group-hover:bg-[#FFD700]/30 transition-colors">
                  <Upload className="w-5 h-5 text-[#003366]" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">Drop PDF document here</p>
                <p className="text-xs text-slate-400">or click to browse · PDF format only · max 50MB</p>
              </div>
            </div>
          </div>

          {/* Department Compliance Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                <Building className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Department Compliance Snapshot</h3>
                <p className="text-xs text-slate-500">Task completion and loop closure tracking by division</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(deptStats).length > 0 ? (
                Object.entries(deptStats).map(([deptName, stats]: any) => {
                  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100;
                  const getProgressColor = (percent: number) => {
                    if (percent >= 80) return "bg-emerald-500";
                    if (percent >= 50) return "bg-amber-500";
                    return "bg-blue-500";
                  };
                  return (
                    <div key={deptName} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{deptName}</span>
                        <span className="text-[#003366]">
                          {pct}% Compliant ({stats.completed}/{stats.total} tasks)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${getProgressColor(pct)} h-full rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {/* IT Security */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">IT Security</span>
                      <span className="text-[#003366]">85% Compliant (17/20 tasks)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>

                  {/* Retail Loans */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Retail Loans &amp; Operations</span>
                      <span className="text-[#003366]">60% Compliant (12/20 tasks)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Risk &amp; Compliance</span>
                      <span className="text-[#003366]">95% Compliant (19/20 tasks)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "95%" }} />
                    </div>
                  </div>

                  {/* Legal & Vendor Risk */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Legal &amp; Vendor Risk</span>
                      <span className="text-[#003366]">75% Compliant (15/20 tasks)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recent Scout Discoveries Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Recent Scout Discoveries</h3>
                <p className="text-xs text-slate-500">Structured compliance metadata extracted by active Scout agents</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {displayedDiscoveries.map((disc, idx) => (
                <div key={disc.id || idx} className="py-2.5 flex items-start justify-between gap-3 group">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold text-[#003366] flex items-center gap-1.5">
                      {disc.circular_number}
                      <span className={`px-1.5 py-0.2 rounded text-[9px] border font-bold uppercase ${getRiskBadgeColor(disc.risk_level)}`}>
                        {disc.risk_level}
                      </span>
                    </p>
                    {disc.circular_id && disc.circular_id !== "mock-1" && disc.circular_id !== "mock-2" && disc.circular_id !== "mock-3" ? (
                      <Link
                        to={`/circulars/${disc.circular_id}`}
                        className="text-xs font-medium text-slate-700 truncate mt-0.5 block hover:underline hover:text-[#003366]"
                      >
                        {disc.title}
                      </Link>
                    ) : (
                      <p className="text-xs font-medium text-slate-700 truncate mt-0.5">
                        {disc.title}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded">
                    {disc.effective_date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Console Terminal & Recent Agent Activity */}
        <div className="space-y-6">
          {/* Agent Terminal */}
          <div>
            <AgentTerminal />
          </div>

          {/* Recent Agent Activity Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Recent Agent Activity</h3>
                <p className="text-xs text-slate-500">Live operational ledger of the Agentic execution framework</p>
              </div>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-100 space-y-4 text-xs">
              {/* Activity 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 bg-emerald-500 border border-white w-2 h-2 rounded-full" />
                <p className="font-semibold text-slate-800">Scout Agent analysis completed</p>
                <p className="text-slate-500 mt-0.5">Extracted structured regulation specifications, risk factors, and deadlines.</p>
                <span className="text-[10px] text-slate-400 block mt-1">2 minutes ago</span>
              </div>

              {/* Activity 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 bg-blue-500 border border-white w-2 h-2 rounded-full" />
                <p className="font-semibold text-slate-800">Scout Agent parsing pipeline scheduled</p>
                <p className="text-slate-500 mt-0.5">PDF circular metadata ingested. Initiating LangGraph node execution...</p>
                <span className="text-[10px] text-slate-400 block mt-1">10 minutes ago</span>
              </div>

              {/* Activity 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-0.5 bg-emerald-500 border border-white w-2 h-2 rounded-full" />
                <p className="font-semibold text-slate-800">Scout Agent initialized circular parsing</p>
                <p className="text-slate-500 mt-0.5">Identified 6 regulatory clauses from RBI KYC Direction. Extracted 2 deadlines.</p>
                <span className="text-[10px] text-slate-400 block mt-1">15 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Compliance Status Table ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#003366]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Compliance Status</h3>
            <p className="text-xs text-slate-500">4 active regulations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regulation ID</th>
                <th className="text-left px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="text-left px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline</th>
                <th className="text-left px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_DATA.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-semibold text-[#003366]">{row.id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{row.desc}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{row.deadline}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${row.deptBg}`}>{row.dept}</span>
                  </td>
                  <td className="px-6 py-4">
                    <ComplianceBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Escalation Timeline ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#003366]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Escalation Timeline</h3>
            <p className="text-xs text-slate-500">Assigned → CEO Alert pathway</p>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="flex items-center mb-5">
          {TIMELINE_STEPS.map((step, idx) => (
            <React.Fragment key={step.step}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
                  {step.step}
                </div>
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{step.label}</span>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className="flex-1 mx-4 border-t-2 border-dashed border-slate-200"></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-slate-50 rounded-lg px-5 py-3.5 border border-slate-100">
          <p className="text-sm text-slate-500">No active escalations. Run the Autonomous Audit to simulate the full pathway.</p>
        </div>
      </div>
    </div>
  );
};
