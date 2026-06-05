import React, { useState } from "react";
import { ClipboardList, Calendar, CheckSquare, Upload, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

interface MockTask {
  id: string;
  title: string;
  desc: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In_Progress" | "Under_Review" | "Completed";
  evidenceUploaded: boolean;
  evidenceName: string;
}

export const DeptTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MockTask[]>([
    {
      id: "task-1",
      title: "Establish designated CISO appointment board",
      desc: "Assemble appointment committee board, design clear designated reporting lines, and publish regulatory governance updates.",
      deadline: "2026-06-15",
      priority: "High",
      status: "In_Progress",
      evidenceUploaded: false,
      evidenceName: ""
    },
    {
      id: "task-2",
      title: "VAPT Audit Schedule & Vendor Review",
      desc: "Perform verification checks on vendor qualifications (CERT-In empanelled status), contract half-yearly penetration schedules, and outline target host addresses.",
      deadline: "2026-06-28",
      priority: "High",
      status: "Pending",
      evidenceUploaded: false,
      evidenceName: ""
    },
    {
      id: "task-3",
      title: "Review Board of Directors breach aggregation templates",
      desc: "Ensure breach reporting formats cover timestamp, intrusion vector, target system, and loss estimates, mapped to quarterly board schedule files.",
      deadline: "2026-07-05",
      priority: "Medium",
      status: "Completed",
      evidenceUploaded: true,
      evidenceName: "board_resolution_cyber_template.pdf"
    }
  ]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeTask = tasks[activeIndex];

  const handleUploadClick = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              evidenceUploaded: true,
              evidenceName: "ciso_board_charter_evidence.pdf",
              status: "Under_Review"
            }
          : t
      )
    );
    alert("Compliance evidence document submitted. Sent to Auditor Agent for verification.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: Task List */}
      <div className="glass-card rounded-xl p-6 lg:col-span-1 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Active Task Queue</h3>
        
        <div className="space-y-2.5">
          {tasks.map((task, idx) => (
            <button
              key={task.id}
              onClick={() => setActiveIndex(idx)}
              className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                activeIndex === idx
                  ? "bg-slate-900 border-slate-700 shadow-md"
                  : "bg-slate-900/30 border-slate-800 hover:border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                  task.priority === "High" ? "bg-red-950/40 text-red-400 border border-red-900/50" :
                  "bg-amber-950/40 text-amber-400 border border-amber-900/50"
                }`}>
                  {task.priority} Priority
                </span>
                <span className={`text-[9px] font-semibold uppercase ${
                  task.status === "Completed" ? "text-emerald-400" :
                  task.status === "Under_Review" ? "text-amber-400" :
                  task.status === "In_Progress" ? "text-blue-400" : "text-slate-500"
                }`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate">{task.title}</p>
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 mt-2">
                <Calendar className="w-3 h-3" />
                <span>Due {task.deadline}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel: Task Details & Evidence Upload */}
      <div className="lg:col-span-2">
        {!activeTask ? (
          <div className="glass-card rounded-xl p-12 flex items-center justify-center text-slate-500 text-xs h-full">
            Select an operational task to update compliance records.
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider font-semibold">Active Operational Task</span>
                <h3 className="text-sm font-bold text-slate-200 mt-0.5">{activeTask.title}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase ${
                activeTask.status === "Completed" ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" :
                activeTask.status === "Under_Review" ? "bg-amber-950/40 text-amber-400 border-amber-900/50" :
                activeTask.status === "In_Progress" ? "bg-blue-950/40 text-blue-400 border-blue-900/50" :
                "bg-slate-900 border-slate-800 text-slate-500"
              }`}>
                {activeTask.status.replace("_", " ")}
              </span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Objective Instructions</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded border border-slate-800/40">
                {activeTask.desc}
              </p>
            </div>

            {/* Evidence Block */}
            <div className="space-y-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Compliance Evidence Validation</span>
              
              {activeTask.evidenceUploaded ? (
                <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-950/10 border border-emerald-900/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-emerald-400 stroke-[1.5]" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-200">{activeTask.evidenceName}</p>
                      <span className="text-[9px] text-emerald-500 font-medium">Submitted for Auditor Agent check</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
                </div>
              ) : (
                <div className="border border-dashed border-slate-800 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-900/10 hover:bg-slate-900/30 transition-all">
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-300 font-semibold mb-1">Drag and drop file here</span>
                  <span className="text-[10px] text-slate-500 mb-4">PDF, XLSX, CSV, or PNG allowed (max 5MB)</span>
                  <button
                    onClick={() => handleUploadClick(activeTask.id)}
                    className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs px-4 py-2 rounded font-semibold border border-slate-700/50 transition-colors"
                  >
                    Upload Audit Artifact
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-slate-500 border-t border-slate-800/80 pt-4">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <span>Evidence artifacts are verified automatically by the Auditor Agent using RAG cross-references.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
