import React, { useEffect, useRef } from "react";
import { Circle } from "lucide-react";

interface TerminalLine {
  timestamp: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "system";
}

const MOCK_LOGS: TerminalLine[] = [
  { timestamp: "11:42:01", agent: "System", message: "SuRaksha Sentinel online · 4 agents standing by", type: "system" },
  { timestamp: "11:42:03", agent: "Scout", message: "Parsing Circular RBI/2026-27/14 ... document structure identified", type: "info" },
  { timestamp: "11:42:05", agent: "Scout", message: "Extracted 6 regulatory clauses · 2 penalty notices flagged", type: "success" },
  { timestamp: "11:42:07", agent: "Scout", message: "Metadata: Authority=RBI, Effective=2026-07-01, Classification=Master Direction", type: "info" },
  { timestamp: "11:42:09", agent: "Architect", message: "Analyzing extracted clauses with legal reasoning model ...", type: "info" },
  { timestamp: "11:42:12", agent: "Architect", message: "Generating MAPs · Clause 3(a) → CISO Designation [HIGH RISK]", type: "warning" },
  { timestamp: "11:42:14", agent: "Architect", message: "Generating MAPs · Clause 4(b) → VAPT Audit Schedule [HIGH RISK]", type: "warning" },
  { timestamp: "11:42:16", agent: "Architect", message: "MAP generation complete · 4 action points created", type: "success" },
  { timestamp: "11:42:18", agent: "Dispatcher", message: "Routing tasks across departments · IT Security, Risk, Governance", type: "info" },
  { timestamp: "11:42:20", agent: "Dispatcher", message: "3 tasks dispatched · Notifications sent to department heads", type: "success" },
  { timestamp: "11:42:22", agent: "Auditor", message: "Compliance check scheduled · Evidence verification queue updated", type: "info" },
  { timestamp: "11:42:24", agent: "System", message: "Pipeline complete · Awaiting human review for MAP approval", type: "system" },
];

const getAgentColor = (agent: string): string => {
  switch (agent) {
    case "Scout": return "text-cyan-400";
    case "Architect": return "text-amber-400";
    case "Dispatcher": return "text-violet-400";
    case "Auditor": return "text-emerald-400";
    case "System": return "text-rose-400";
    default: return "text-slate-400";
  }
};

const getMessageColor = (type: TerminalLine["type"]): string => {
  switch (type) {
    case "success": return "text-emerald-300";
    case "warning": return "text-amber-300";
    case "error": return "text-red-400";
    case "system": return "text-rose-300 font-semibold";
    default: return "text-slate-300";
  }
};

export const AgentTerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      {/* Title Bar */}
      <div className="bg-[#1a1a2e] px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-xs text-slate-400 ml-3 font-mono">sentinel@canara:~/agents/live</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">THINKING</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={terminalRef}
        className="bg-[#0d1117] p-4 font-mono text-xs leading-6 h-[280px] overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
      >
        {MOCK_LOGS.map((log, idx) => (
          <div key={idx} className="flex gap-0">
            <span className="text-slate-600 select-none w-[70px] flex-shrink-0">{log.timestamp}</span>
            <span className={`${getAgentColor(log.agent)} font-bold w-[100px] flex-shrink-0`}>
              [{log.agent}]
            </span>
            <span className={getMessageColor(log.type)}>{log.message}</span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="flex gap-0 mt-1">
          <span className="text-slate-600 select-none w-[70px] flex-shrink-0">11:42:26</span>
          <span className="text-emerald-400 font-bold w-[100px] flex-shrink-0">[Ready]</span>
          <span className="text-slate-500">
            Awaiting next instruction
            <span className="inline-block w-2 h-4 bg-emerald-500 ml-1 terminal-blink align-middle"></span>
          </span>
        </div>
      </div>
    </div>
  );
};
