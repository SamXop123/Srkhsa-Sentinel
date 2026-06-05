import React, { useState } from "react";
import { ShieldAlert, Search, RefreshCw, Calendar, Terminal } from "lucide-react";

interface MockAuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  ip: string;
  time: string;
  details: string;
}

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs] = useState<MockAuditLog[]>([
    {
      id: "log-1",
      user: "Auditor User (auditor@bank.com)",
      action: "Approve & Dispatch MAP (map-1)",
      module: "Compliance MAPs",
      ip: "10.12.94.108",
      time: "22:15:30 2026-06-05",
      details: '{"action":"APPROVE","map_id":"map-1","target_department":"IT Security","approver_id":"mock-uuid-1234"}'
    },
    {
      id: "log-2",
      user: "Department Head (head.risk@bank.com)",
      action: "Submit Evidence File (task-3)",
      module: "Tasks Engine",
      ip: "10.12.92.51",
      time: "20:42:12 2026-06-05",
      details: '{"action":"UPLOAD_EVIDENCE","task_id":"task-3","file_name":"board_resolution_cyber_template.pdf","size_bytes":185203}'
    },
    {
      id: "log-3",
      user: "Auditor User (auditor@bank.com)",
      action: "Ingest Regulatory Circular PDF",
      module: "Scout Agent",
      ip: "10.12.94.108",
      time: "19:05:01 2026-06-05",
      details: '{"action":"INGEST","file_name":"rbi_tech_governance_controls.pdf","source_org":"RBI","reference_id":"rbi-tech-dir-2026"}'
    },
    {
      id: "log-4",
      user: "System Admin (admin@bank.com)",
      action: "Modify User Role Assignment (user-2)",
      module: "User Accounts",
      ip: "10.12.1.4",
      time: "14:10:44 2026-06-05",
      details: '{"action":"UPDATE_ROLE","user_id":"user-2","new_role":"Compliance Officer","old_role":"Auditor"}'
    }
  ]);

  const [activeLogIdx, setActiveLogIdx] = useState<number | null>(null);

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Filter Header */}
      <div className="glass-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit records by actor, action description, or subsystem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 pl-11 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button 
          onClick={() => alert("Audit log indices refreshed.")}
          className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs px-4 py-2 rounded-lg border border-slate-700/40 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table logs list */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 mb-4">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Audit Security Log</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-3">Timestamp</th>
                  <th className="pb-3">Subsystem</th>
                  <th className="pb-3">Actor</th>
                  <th className="pb-3">Action Completed</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id}
                    onClick={() => setActiveLogIdx(idx)}
                    className={`border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors cursor-pointer ${
                      activeLogIdx === idx ? "bg-slate-900/40" : ""
                    }`}
                  >
                    <td className="py-3.5 pl-3 font-mono text-[10px] text-slate-400">{log.time.split(" ")[0]}</td>
                    <td className="py-3.5 text-slate-400">{log.module}</td>
                    <td className="py-3.5 text-slate-300 max-w-[150px] truncate">{log.user.split(" ")[0]}</td>
                    <td className="py-3.5 text-slate-300 font-medium">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Pane */}
        <div className="lg:col-span-1">
          {activeLogIdx === null ? (
            <div className="glass-card rounded-xl p-12 flex items-center justify-center text-slate-500 text-xs h-full border border-slate-800">
              Select an audit row entry to view detailed payload parameters.
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 space-y-5 text-left h-full flex flex-col">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">Ledger Node Parameters</span>
                <h4 className="text-xs font-bold text-slate-200 mt-1">{filteredLogs[activeLogIdx].action}</h4>
              </div>

              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Trigger Actor</span>
                  <p className="text-slate-300 font-medium">{filteredLogs[activeLogIdx].user}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Client Connection IP</span>
                  <p className="text-slate-400 font-mono">{filteredLogs[activeLogIdx].ip}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Timestamp Detail</span>
                  <p className="text-slate-400 font-mono">{filteredLogs[activeLogIdx].time}</p>
                </div>

                {/* JSON Viewer */}
                <div className="space-y-1.5 pt-2 flex flex-col h-48">
                  <span className="text-[9px] text-slate-500 font-semibold uppercase flex items-center space-x-1">
                    <Terminal className="w-3 h-3" />
                    <span>Metadata Payload (JSON)</span>
                  </span>
                  <pre className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-400/90 overflow-y-auto whitespace-pre-wrap select-all">
                    {JSON.stringify(JSON.parse(filteredLogs[activeLogIdx].details), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
