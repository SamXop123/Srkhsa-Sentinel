import React, { useEffect, useRef } from "react";
import { AgentExecutionLog } from "../../../../shared/types/agents";
import { Terminal, Shield, Play } from "lucide-react";

interface TerminalComponentProps {
  logs: AgentExecutionLog[];
  isConnected: boolean;
}

export const TerminalComponent: React.FC<TerminalComponentProps> = ({ logs, isConnected }) => {
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll to bottom when new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "Scout": return "text-teal-400";
      case "Architect": return "text-blue-400";
      case "Dispatcher": return "text-purple-400";
      case "Auditor": return "text-emerald-400";
      default: return "text-slate-400";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "text-red-500 font-semibold";
      case "WARNING": return "text-amber-500 font-semibold";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="w-full bg-slate-950 rounded-lg border border-slate-800 shadow-2xl flex flex-col h-80 font-mono text-xs overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold uppercase tracking-wider text-[10px]">Agent Execution Console</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
          <span className="text-[10px] text-slate-500 font-medium">
            {isConnected ? "Connected to Graph Broker" : "Socket Offline"}
          </span>
        </div>
      </div>

      {/* Terminal log logs container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Play className="w-8 h-8 mb-2 stroke-[1.5]" />
            <span>Awaiting document upload or agent trigger...</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-slate-600">[{log.timestamp.split("T")[1].substring(0, 8)}]</span>
              <span className={`${getAgentColor(log.agent)} font-semibold`}>[{log.agent}]</span>
              <span className="text-slate-300 flex-1">{log.message}</span>
              {log.level !== "INFO" && (
                <span className={`text-[10px] uppercase border px-1 rounded ${getLogLevelColor(log.level)}`}>
                  {log.level}
                </span>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal footer bar */}
      <div className="bg-slate-900/40 px-4 py-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-600">
        <div className="flex items-center space-x-1">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <span>Integrity Verification Active</span>
        </div>
        <span>Sentinel v1.0.0</span>
      </div>
    </div>
  );
};
