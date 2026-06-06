import React, { useState } from "react";
import { AlertOctagon, ShieldAlert, ArrowRight, CheckCircle2, UserCheck } from "lucide-react";

interface MockEscalation {
  id: string;
  taskTitle: string;
  dept: string;
  level: 1 | 2 | 3;
  daysOverdue: number;
  fineNotice: string;
  reason: string;
  status: "Open" | "Resolved";
}

export const Escalations: React.FC = () => {
  const [escalations, setEscalations] = useState<MockEscalation[]>(
    [
      {
        id: "esc-1",
        taskTitle: "Designate Chief Information Security Officer (CISO) and design reporting structures",
        dept: "IT Security",
        level: 3,
        daysOverdue: 14,
        fineNotice: "Potential RBI fine up to ₹1,00,000 per day of non-compliance.",
        reason: "Evidence verification failed three times. Mapped document does not specify clear board-level reporting structures required by Section 3.",
        status: "Open"
      },
      {
        id: "esc-2",
        taskTitle: "Establish half-yearly VAPT audit vendor schedule",
        dept: "Audit & Risk Management",
        level: 1,
        daysOverdue: 3,
        fineNotice: "Classified as structural audit delay. Risk of operational permit suspension.",
        reason: "Task status not updated by department head past deadline checkpoint.",
        status: "Open"
      }
    ]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const activeEsc = escalations[activeIndex];

  const handleResolve = (id: string) => {
    setEscalations((prev) =>
      prev.map((esc) =>
        esc.id === id ? { ...esc, status: "Resolved" } : esc
      )
    );
    alert("Escalation resolved and closed in audit logs.");
  };

  const handleAlertCEO = (id: string) => {
    alert("Alert dispatch initiated. Alert sent to CEO mobile portal via SMS and high-priority Email channels.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: Escalation List */}
      <div className="glass-card rounded-xl p-6 lg:col-span-1 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Breach Escalations</h3>
        
        <div className="space-y-2.5">
          {escalations.filter(e => e.status === "Open").map((esc, idx) => (
            <button
              key={esc.id}
              onClick={() => setActiveIndex(idx)}
              className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                activeIndex === idx
                  ? "bg-slate-900 border-slate-700 shadow-md"
                  : "bg-slate-900/30 border-slate-800 hover:border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  esc.level === 3 ? "bg-red-950/40 text-red-400 border border-red-900/50 animate-pulse" :
                  esc.level === 2 ? "bg-amber-950/40 text-amber-400 border border-amber-900/50" :
                  "bg-blue-950/40 text-blue-400 border border-blue-900/50"
                }`}>
                  Level {esc.level} Escalation
                </span>
                <span className="text-[9px] text-red-400 font-semibold">{esc.daysOverdue} Days Late</span>
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate">{esc.taskTitle}</p>
              <span className="text-[9px] text-slate-500 block mt-1">{esc.dept}</span>
            </button>
          ))}
          {escalations.filter(e => e.status === "Open").length === 0 && (
            <p className="text-xs text-slate-500 py-8 text-center">No active escalations.</p>
          )}
        </div>
      </div>

      {/* Right panel: Details & Management */}
      <div className="lg:col-span-2">
        {!activeEsc || activeEsc.status === "Resolved" ? (
          <div className="glass-card rounded-xl p-12 flex items-center justify-center text-slate-500 text-xs h-full">
            Select an active escalation to perform operational resolution actions.
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-semibold">
                  Critical Violation Details
                </span>
                <h3 className="text-sm font-bold text-slate-200 mt-0.5">{activeEsc.taskTitle}</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                {activeEsc.level === 3 && (
                  <button
                    onClick={() => handleAlertCEO(activeEsc.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded bg-red-650/10 hover:bg-red-500 hover:text-slate-950 border border-red-500 text-red-500 text-[10px] font-bold uppercase transition-colors"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Alert CEO</span>
                  </button>
                )}
                <button
                  onClick={() => handleResolve(activeEsc.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-[10px] font-bold uppercase hover:bg-emerald-950/50 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve & Close</span>
                </button>
              </div>
            </div>

            {/* Department info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Responsible Department</span>
                <p className="text-xs text-slate-300 font-medium mt-0.5">{activeEsc.dept}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-semibold">Tardiness Period</span>
                <p className="text-xs text-red-400 font-bold mt-0.5">{activeEsc.daysOverdue} Days Past Deadline</p>
              </div>
            </div>

            {/* Regulatory Fine Warnings */}
            <div className="p-4 rounded-lg bg-red-950/10 border border-red-900/30 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Regulatory Penalty Risk Notice</span>
              </span>
              <p className="text-xs text-slate-300 leading-normal">{activeEsc.fineNotice}</p>
            </div>

            {/* Root Reason Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Violation Rationale</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded border border-slate-800/40">
                {activeEsc.reason}
              </p>
            </div>

            <div className="text-[9px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-4">
              <strong>Audit Closure Agreement:</strong> Resolving an escalation inserts a signed audit event log into the immutable database ledger and alerts all watching officers.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
