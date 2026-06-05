import React from "react";
import { AlertCircle, CheckCircle2, ShieldX, Info } from "lucide-react";

interface HeatmapGridItem {
  id: string;
  status: "verified" | "under_review" | "in_progress" | "overdue" | "pending";
  ref: string;
}

interface DeptMetrics {
  name: string;
  score: number;
  total: number;
  items: HeatmapGridItem[];
}

export const Heatmap: React.FC = () => {
  const departments: DeptMetrics[] = [
    {
      name: "IT Security",
      score: 83.3,
      total: 6,
      items: [
        { id: "1", status: "verified", ref: "RBI-IT-1.1" },
        { id: "2", status: "verified", ref: "RBI-IT-1.2" },
        { id: "3", status: "verified", ref: "SEBI-CY-2" },
        { id: "4", status: "under_review", ref: "SEBI-CY-4" },
        { id: "5", status: "in_progress", ref: "RBI-API-3" },
        { id: "6", status: "overdue", ref: "FIU-IT-7" }
      ]
    },
    {
      name: "Audit & Risk Management",
      score: 100,
      total: 4,
      items: [
        { id: "7", status: "verified", ref: "RBI-RM-2.1" },
        { id: "8", status: "verified", ref: "RBI-RM-2.2" },
        { id: "9", status: "verified", ref: "SEBI-RM-1" },
        { id: "10", status: "verified", ref: "FIU-AML-2" }
      ]
    },
    {
      name: "Operations",
      score: 75,
      total: 4,
      items: [
        { id: "11", status: "verified", ref: "RBI-OPS-1" },
        { id: "12", status: "verified", ref: "RBI-OPS-2" },
        { id: "13", status: "in_progress", ref: "SEBI-OPS-3" },
        { id: "14", status: "overdue", ref: "RBI-OPS-4" }
      ]
    },
    {
      name: "Corporate Governance",
      score: 100,
      total: 3,
      items: [
        { id: "15", status: "verified", ref: "RBI-GOV-1" },
        { id: "16", status: "verified", ref: "RBI-GOV-2" },
        { id: "17", status: "verified", ref: "SEBI-GOV-3" }
      ]
    }
  ];

  const getStatusColor = (status: HeatmapGridItem["status"]) => {
    switch (status) {
      case "verified": return "bg-emerald-500/80 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
      case "under_review": return "bg-amber-500/80 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
      case "in_progress": return "bg-blue-500/80 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]";
      case "overdue": return "bg-red-500/80 border-red-400/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse";
      default: return "bg-slate-800 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend & Banner */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="text-left">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Departmental Compliance Matrix</h3>
          <p className="text-xs text-slate-500 mt-1">Reflects real-time action item checkpoints derived from active circulars.</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] uppercase font-semibold text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400/30"></span>
            <span>Verified</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400/30"></span>
            <span>Under Review</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/80 border border-blue-400/30"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-red-500/80 border border-red-400/30"></span>
            <span>Overdue Task</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept, index) => (
          <div key={index} className="glass-card rounded-xl p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider text-left">{dept.name}</h4>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-medium block">Rating Score</span>
                  <span className={`text-sm font-bold ${dept.score >= 90 ? "text-emerald-400" : dept.score >= 80 ? "text-amber-400" : "text-red-400"}`}>
                    {dept.score}%
                  </span>
                </div>
              </div>

              {/* Grid Block */}
              <div className="flex flex-wrap gap-2.5">
                {dept.items.map((item) => (
                  <div
                    key={item.id}
                    title={`${item.ref} - ${item.status.replace("_", " ")}`}
                    className={`w-9 h-9 rounded-md border flex items-center justify-center font-mono text-[9px] text-slate-900 font-bold transition-all cursor-pointer hover:scale-105 ${getStatusColor(item.status)}`}
                  >
                    {item.ref.split("-")[1] || "M"}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-2 text-[10px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Hover over node cells to view compliance record reference.</span>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Analytics Banner */}
      <div className="glass-card rounded-xl p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center space-x-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0 stroke-[1.5]" />
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliant Items</h4>
            <p className="text-lg font-bold text-slate-200 mt-0.5">13 Mapped Points</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
          <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0 stroke-[1.5]" />
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under Evaluation</h4>
            <p className="text-lg font-bold text-slate-200 mt-0.5">2 Mapped Points</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
          <ShieldX className="w-8 h-8 text-red-400 flex-shrink-0 stroke-[1.5]" />
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unresolved Violations</h4>
            <p className="text-lg font-bold text-slate-200 mt-0.5">2 Mapped Points</p>
          </div>
        </div>
      </div>
    </div>
  );
};
