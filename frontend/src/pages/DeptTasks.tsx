import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../services/api";
import {
  ClipboardList,
  Calendar,
  CheckSquare,
  Upload,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  Building,
  TrendingUp,
  User,
  Loader2,
  Bookmark,
  ChevronRight,
  Send,
} from "lucide-react";

interface TaskEvidenceItem {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

interface TaskItem {
  id: string;
  map_id: string;
  department_id: string;
  assigned_to: string;
  title: string;
  description: string;
  priority: string;
  deadline: string;
  status: string;
  assignment_reasoning: {
    why_department_chosen?: string;
    why_task_belongs?: string;
    relevant_regulation_section?: string;
  };
  comments: Array<{
    author: string;
    text: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
  // Joined
  regulation_title?: string;
  regulation_summary?: string;
  regulator?: string;
  regulation_ref?: string;
  regulation_effective_date?: string;
  regulation_penalty?: string;
  map_outcome?: string;
  map_verification?: string;
  department_name?: string;
  evidences: TaskEvidenceItem[];
}

interface DepartmentItem {
  id: string;
  name: string;
  head_name: string;
  email: string;
  active: boolean;
}

interface DashboardMetrics {
  open_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  total_tasks: number;
  compliance_score: number;
  upcoming_deadlines: TaskItem[];
}

export const DeptTasks: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || "Department Head";
  
  // Directory & Selection States
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [activeDeptId, setActiveDeptId] = useState<string>("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  // UI States
  const [isLoadingDir, setIsLoadingDir] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // Action States
  const [commentText, setCommentText] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // Load departments directory
  useEffect(() => {
    const fetchDir = async () => {
      setIsLoadingDir(true);
      try {
        const response = await apiClient.get<DepartmentItem[]>("/departments");
        setDepartments(response.data);
        
        // Auto-select department
        if (response.data.length > 0) {
          // If logged in user is department head, lock/pre-select their department
          if (user?.department_id) {
            const userDept = response.data.find(d => d.id === user.department_id);
            if (userDept) {
              setActiveDeptId(userDept.id);
              return;
            }
          }
          setActiveDeptId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch departments directory:", err);
      } finally {
        setIsLoadingDir(false);
      }
    };
    fetchDir();
  }, [user]);

  // Load tasks & dashboard for the selected department
  const fetchDeptData = async (deptId: string) => {
    if (!deptId) return;
    setIsLoadingData(true);
    try {
      // 1. Fetch dashboard metrics
      const dashRes = await apiClient.get<DashboardMetrics>(`/departments/${deptId}/dashboard`);
      setMetrics(dashRes.data);
      
      // 2. Fetch tasks queue
      const tasksRes = await apiClient.get<TaskItem[]>(`/tasks?department_id=${deptId}`);
      setTasks(tasksRes.data);
      
      // Auto select first task if queue isn't empty and nothing is selected
      if (tasksRes.data.length > 0) {
        setActiveTaskId(tasksRes.data[0].id);
      } else {
        setActiveTaskId(null);
      }
    } catch (err) {
      console.error("Failed to load department task queue:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeDeptId) {
      fetchDeptData(activeDeptId);
    }
  }, [activeDeptId]);

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  // Task Actions
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const formData = new FormData();
      formData.append("status", newStatus);
      const res = await apiClient.put<TaskItem>(`/tasks/${taskId}/status`, formData);
      
      // Update local task state
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
      
      // Refetch dashboard metrics
      const dashRes = await apiClient.get<DashboardMetrics>(`/departments/${activeDeptId}/dashboard`);
      setMetrics(dashRes.data);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update task execution status.");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTaskId) return;
    
    try {
      const authorName = `${user?.first_name || "R."} ${user?.last_name || "Kumar"}`;
      const formData = new FormData();
      formData.append("author", authorName);
      formData.append("text", commentText);
      
      const res = await apiClient.post<TaskItem>(`/tasks/${activeTaskId}/comment`, formData);
      setTasks(prev => prev.map(t => t.id === activeTaskId ? res.data : t));
      setCommentText("");
    } catch (err) {
      console.error("Failed to post progress note:", err);
    }
  };

  const handleUploadEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFile || !activeTaskId) return;
    
    setIsUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("file", evidenceFile);
      if (evidenceNotes) {
        formData.append("notes", evidenceNotes);
      }
      
      const response = await apiClient.post(`/tasks/${activeTaskId}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Refetch task details to refresh evidence lists
      const taskRes = await apiClient.get<TaskItem>(`/tasks/${activeTaskId}`);
      setTasks(prev => prev.map(t => t.id === activeTaskId ? taskRes.data : t));
      
      // Refetch metrics
      const dashRes = await apiClient.get<DashboardMetrics>(`/departments/${activeDeptId}/dashboard`);
      setMetrics(dashRes.data);
      
      setEvidenceFile(null);
      setEvidenceNotes("");
      alert(response.data.message);
    } catch (err: any) {
      console.error("Failed to upload audit artifact:", err);
      alert(err.response?.data?.detail || "Evidence upload failed.");
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusBadgeColor = (statusStr: string) => {
    switch (statusStr) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Awaiting Verification":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Assigned":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Directory Select Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-1">Operational Queue</p>
          <h1 className="text-2xl font-bold text-slate-900">Department Tasks Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resolve assigned Measurable Action Points and submit audit evidence artifacts</p>
        </div>
        
        {/* Division Selector */}
        {!isLoadingDir && departments.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-3.5 py-1.5 rounded-lg">
            <Building className="w-4 h-4 text-[#003366]" />
            <span className="text-xs font-bold text-slate-600 uppercase">Division:</span>
            {user?.department_id ? (
              // Locked for Department Heads
              <span className="text-xs font-bold text-[#003366]">
                {departments.find(d => d.id === activeDeptId)?.name}
              </span>
            ) : (
              // Dropdown for Admins/Auditors
              <select
                className="text-xs font-bold text-[#003366] bg-transparent focus:outline-none cursor-pointer"
                value={activeDeptId}
                onChange={(e) => setActiveDeptId(e.target.value)}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Department Dashboard Panel */}
      {metrics && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#003366]" />
                Division Performance Scorecard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Head of Department: <span className="font-bold text-slate-700">{metrics.head_name}</span> ({metrics.email})
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Compliance Score: {metrics.compliance_score}%</span>
            </div>
          </div>

          {/* Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open Task Load</span>
                <span className="text-2xl font-bold text-slate-800">{metrics.open_tasks}</span>
              </div>
              <Clock className="w-8 h-8 text-blue-500 stroke-[1.5]" />
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Actions</span>
                <span className="text-2xl font-bold text-slate-800">{metrics.completed_tasks}</span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-lg flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Violations</span>
                <span className="text-2xl font-bold text-red-600">{metrics.overdue_tasks}</span>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500 stroke-[1.5]" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Task Queue and Task Details */}
      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#003366] mb-3" />
          <span className="text-sm font-semibold">Retrieving department compliance files...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">Task Queue Empty</h3>
          <p className="text-xs text-slate-500 mt-1">
            This department currently has no assigned compliance actions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Task List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Department Task Queue ({tasks.length})
            </h3>
            
            <div className="space-y-2 h-[550px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    activeTaskId === task.id
                      ? "bg-[#003366]/5 border-[#003366]/30 shadow-sm ring-1 ring-[#003366]/10"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeColor(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-tight ${activeTaskId === task.id ? "text-[#003366]" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-3 font-mono font-bold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due {task.deadline}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Task Details View */}
          <div className="lg:col-span-2">
            {activeTask && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header Title */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                      TASK-{activeTask.id.slice(0, 8)} · ASSIGNED TO {activeTask.assigned_to.toUpperCase()}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">{activeTask.title}</h2>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeColor(activeTask.status)}`}>
                    {activeTask.status.replace("_", " ")}
                  </span>
                </div>

                {/* Objective details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Directive Description</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-lg font-medium">
                    {activeTask.description}
                  </p>
                </div>

                {/* Tabular details */}
                <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Required Outcome</span>
                    <span className="font-bold text-slate-700">{activeTask.map_outcome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Verification Method</span>
                    <span className="font-bold text-slate-700">{activeTask.map_verification}</span>
                  </div>
                </div>

                {/* Original Regulation summary info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    Source Regulation Information
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs space-y-2">
                    <p className="font-bold text-[#003366] leading-tight">
                      {activeTask.regulator} Directive · {activeTask.regulation_ref}
                    </p>
                    <p className="font-bold text-slate-700">{activeTask.regulation_title}</p>
                    <p className="text-slate-500 leading-relaxed italic">"{activeTask.regulation_summary}"</p>
                    {activeTask.regulation_penalty && (
                      <div className="bg-red-50 border border-red-100 text-[11px] text-red-800 p-3 rounded-lg flex items-start gap-2 mt-1">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{activeTask.regulation_penalty}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transparency Assignment Reasoning */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#003366]" />
                    Dispatcher Assignment Reasoning (Auditor Audit Trail)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#003366]/5 border border-[#003366]/10 p-3 rounded-lg text-xs">
                      <span className="font-bold text-[#003366] block uppercase tracking-wider text-[9px] mb-1">Why this department</span>
                      <p className="text-slate-600 leading-normal">{activeTask.assignment_reasoning?.why_department_chosen}</p>
                    </div>
                    <div className="bg-[#003366]/5 border border-[#003366]/10 p-3 rounded-lg text-xs">
                      <span className="font-bold text-[#003366] block uppercase tracking-wider text-[9px] mb-1">Task Alignment</span>
                      <p className="text-slate-600 leading-normal">{activeTask.assignment_reasoning?.why_task_belongs}</p>
                    </div>
                    <div className="bg-[#003366]/5 border border-[#003366]/10 p-3 rounded-lg text-xs">
                      <span className="font-bold text-[#003366] block uppercase tracking-wider text-[9px] mb-1">Regulation Section</span>
                      <p className="text-slate-600 leading-normal font-mono font-bold">{activeTask.assignment_reasoning?.relevant_regulation_section}</p>
                    </div>
                  </div>
                </div>

                {/* Evidence Artifact Uploader */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-400" />
                    Compliance Evidence Validation Artifacts
                  </h4>

                  {activeTask.evidences.length > 0 ? (
                    <div className="space-y-2">
                      {activeTask.evidences.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <a
                                href={`http://localhost:8000/${ev.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1"
                              >
                                {ev.file_name}
                              </a>
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                Submitted on {new Date(ev.uploaded_at).toLocaleString()}
                              </span>
                              {ev.notes && <p className="text-[10px] text-slate-500 mt-1 italic">Notes: {ev.notes}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Submitted
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <form onSubmit={handleUploadEvidenceSubmit} className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-50/70 transition-all relative">
                      <input
                        type="file"
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setEvidenceFile(e.target.files[0]);
                          }
                        }}
                      />
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-800 mb-0.5">
                        {evidenceFile ? evidenceFile.name : "Select evidence file artifact"}
                      </span>
                      <span className="text-[10px] text-slate-400 mb-4">PDF, DOCX, CSV, or PNG allowed (max 5MB)</span>
                      
                      {evidenceFile && (
                        <div className="w-full max-w-sm space-y-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Add implementation notes for the auditor..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
                            value={evidenceNotes}
                            onChange={(e) => setEvidenceNotes(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={isUploadingEvidence}
                            className="w-full bg-[#003366] hover:bg-[#002244] text-white text-xs py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {isUploadingEvidence ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Submit Artifact to Auditor Agent
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Progress Comments / Notes logs */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    Operational Comments &amp; Logs Ledger ({activeTask.comments.length})
                  </h4>

                  {/* Comment Thread */}
                  {activeTask.comments.length > 0 && (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {activeTask.comments.map((c, i) => (
                        <div key={i} className="text-xs space-y-0.5 text-left border-b border-slate-150 last:border-0 pb-2 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#003366]" />
                              {c.author}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{new Date(c.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 leading-normal pl-4.5">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an operational update or notes..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Send className="w-3 h-3" /> Note
                    </button>
                  </form>
                </div>

                {/* Workflow Status Actions */}
                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-3">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    Evidence will automatically be indexed and checked by Auditor Agents.
                  </div>
                  <div className="flex gap-2">
                    {activeTask.status === "Assigned" && (
                      <button
                        onClick={() => handleUpdateStatus(activeTask.id, "In Progress")}
                        className="bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                      >
                        Start Task
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {activeTask.status === "In Progress" && (
                      <button
                        onClick={() => handleUpdateStatus(activeTask.id, "Completed")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Mark as Complete
                      </button>
                    )}
                    {activeTask.status === "Completed" && (
                      <button
                        onClick={() => handleUpdateStatus(activeTask.id, "In Progress")}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Re-open Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
