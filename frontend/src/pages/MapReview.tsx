import React, { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import {
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
  Bookmark,
  Check,
  RotateCcw,
  Sparkles,
  Award,
  HelpCircle,
  Loader2,
} from "lucide-react";

interface MAPItem {
  id: string;
  taskName: string;
  department: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  regRef: string;
  originalText: string;
  aiReasoning: string;
  actionPoint: string;
  riskAnalysis: string;
  status: "Pending" | "Approved" | "Rejected";
  // Architect Reasoning Details
  whyGenerated?: string;
  whyDepartment?: string;
  whyRisk?: string;
  whyVerification?: string;
  confidenceScore: number;
  verificationMethod: string;
}

const DEPARTMENTS = [
  "Customer Operations",
  "Retail Loans",
  "Corporate Banking",
  "Risk Management",
  "Treasury",
  "Cyber Security",
  "IT Operations",
  "Compliance",
  "Legal",
  "AML Team",
  "Fraud Monitoring",
  "Vendor Management",
  "Human Resources",
];

export const MapReview: React.FC = () => {
  const [maps, setMaps] = useState<MAPItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Edit Modal State
  const [editingMap, setEditingMap] = useState<MAPItem | null>(null);

  const fetchMaps = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any[]>("/maps");
      const mapped = response.data.map((item) => ({
        id: item.id,
        taskName: item.task_title,
        department: item.department,
        priority: item.priority as any,
        deadline: item.deadline,
        riskLevel: item.risk_level as any,
        regRef: `${item.regulation_ref} · ${item.regulation_title}`,
        originalText: item.task_description,
        aiReasoning: item.reasoning?.why_generated || "Generated based on regulatory mandates.",
        actionPoint: item.required_outcome,
        riskAnalysis: item.reasoning?.why_risk || "Penalties for non-compliance are severe.",
        status: item.status as any,
        whyGenerated: item.reasoning?.why_generated,
        whyDepartment: item.reasoning?.why_department,
        whyRisk: item.reasoning?.why_risk,
        whyVerification: item.reasoning?.why_verification,
        confidenceScore: item.confidence_score,
        verificationMethod: item.verification_method,
      }));
      setMaps(mapped);
    } catch (err) {
      console.error("Failed to fetch MAPs from backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const selectedMap = maps.find((m) => m.id === selectedMapId) || null;

  // Filter items
  const filteredMaps = maps.filter((item) => {
    const matchesSearch =
      item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "All" || item.department === selectedDept;
    const matchesPriority = selectedPriority === "All" || item.priority === selectedPriority;
    return matchesSearch && matchesDept && matchesPriority;
  });

  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.post(`/maps/${id}/approve?status=Approved`);
      setMaps((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "Approved" } : item))
      );
    } catch (err) {
      console.error("Failed to approve MAP:", err);
      alert("Failed to approve MAP action item.");
    }
  };

  const handleReject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.post(`/maps/${id}/approve?status=Rejected`);
      setMaps((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "Rejected" } : item))
      );
    } catch (err) {
      console.error("Failed to reject MAP:", err);
      alert("Failed to reject MAP action item.");
    }
  };

  const handleReopen = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.post(`/maps/${id}/approve?status=Pending`);
      setMaps((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "Pending" } : item))
      );
    } catch (err) {
      console.error("Failed to reopen MAP:", err);
      alert("Failed to re-open MAP action item.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMap) return;
    try {
      await apiClient.put(`/maps/${editingMap.id}`, {
        task_title: editingMap.taskName,
        task_description: editingMap.originalText,
        department: editingMap.department,
        priority: editingMap.priority,
        risk_level: editingMap.riskLevel,
        deadline: editingMap.deadline,
        required_outcome: editingMap.actionPoint,
        verification_method: editingMap.verificationMethod,
      });
      setMaps((prev) =>
        prev.map((item) => (item.id === editingMap.id ? editingMap : item))
      );
      setEditingMap(null);
    } catch (err) {
      console.error("Failed to save MAP edits:", err);
      alert("Failed to save MAP modifications.");
    }
  };

  const startEdit = (item: MAPItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMap({ ...item });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDept("All");
    setSelectedPriority("All");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Low":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-red-200 text-red-950 font-bold border-red-300";
      case "High":
        return "bg-red-50 text-red-700 border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Low":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-12">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-1">Human-In-The-Loop Verification</p>
          <h1 className="text-2xl font-bold text-slate-900">MAP Review Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit and approve AI-generated Measurable Action Points (MAPs) before department dispatching
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1 min-w-[300px]">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by task, ID, regulation..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dept Filter */}
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {(searchQuery || selectedDept !== "All" || selectedPriority !== "All") && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-2 px-3 border border-slate-200 rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredMaps.length}</span> of {maps.length} action items
        </div>
      </div>

      {/* Grid of MAP Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#003366] mb-3" />
          <span className="text-sm font-semibold">Retrieving MAP specifications from active vault...</span>
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No Action Points Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Either no circulars have been processed, or your filters matched no records.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaps.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMapId(item.id)}
              className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group ${
                selectedMapId === item.id ? "ring-2 ring-[#003366] border-transparent" : "border-slate-200"
              }`}
            >
              {/* Top row: ID and Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-400">MAP-{item.id.slice(0, 8)}</span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      item.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.status === "Rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Title & Ref */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 group-hover:text-[#003366] transition-colors">
                  {item.taskName}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate max-w-[220px]">{item.regRef}</span>
                </p>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">Department</span>
                    <span className="font-semibold text-slate-700 truncate block max-w-[130px]">{item.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">Deadline</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.deadline}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">Priority</span>
                    <span className={`px-1.5 py-0.2 rounded font-semibold inline-block border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">Risk Level</span>
                    <span className={`px-1.5 py-0.2 rounded font-semibold inline-block border ${getRiskColor(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100 mt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-[#003366] transition-colors font-medium">
                  Review Details
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>

                {item.status === "Pending" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => startEdit(item, e)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                      title="Edit action item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleReject(item.id, e)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors border border-transparent hover:border-red-200"
                      title="Reject MAP"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleApprove(item.id, e)}
                      className="p-1.5 bg-[#FFD700] hover:bg-[#e6c200] rounded text-[#003366] font-semibold transition-colors"
                      title="Approve & Dispatch"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {item.status !== "Pending" && (
                  <button
                    onClick={(e) => handleReopen(item.id, e)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded"
                  >
                    <RotateCcw className="w-3 h-3" /> Re-open
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side Details Drawer */}
      <div
        className={`fixed top-0 right-0 h-screen w-[520px] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          selectedMap ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedMap && (
          <>
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block mb-0.5">
                  MAP-{selectedMap.id.slice(0, 8)} · AUDITOR WORKSPACE
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">MAP Specifications</h2>
                  <span className="bg-[#003366]/10 text-[#003366] text-[9px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 border border-[#003366]/20">
                    <Sparkles className="w-2.5 h-2.5 fill-[#003366]" />
                    Generated By Architect Agent
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMapId(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Title & Confidence */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated Action Point</h3>
                  <p className="text-base font-bold text-[#003366] leading-snug">{selectedMap.taskName}</p>
                </div>
                <div className="flex-shrink-0 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center min-w-[75px]">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block tracking-wide">Confidence</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">
                    {(selectedMap.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Badges Info */}
              <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium mb-1">Target Department</span>
                  <span className="text-sm font-bold text-slate-800">{selectedMap.department}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium mb-1">Compliance Deadline</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#003366]" />
                    {selectedMap.deadline}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs text-slate-400 block font-medium mb-1">Verification Method</span>
                  <span className="text-xs font-bold bg-[#003366]/5 text-[#003366] border border-[#003366]/10 px-2 py-1 rounded inline-block">
                    {selectedMap.verificationMethod}
                  </span>
                </div>
              </div>

              {/* original Text */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  Original Regulation Reference
                </h4>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                  "{selectedMap.originalText}"
                </div>
                <p className="text-[11px] font-semibold text-[#003366] font-mono">{selectedMap.regRef}</p>
              </div>

              {/* Architect Reasoning Panels (Why Generated, why department, why risk, why verification) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#003366]" />
                  Architect Agent Reasoning
                </h4>
                
                <div className="space-y-3">
                  {/* Why Generated */}
                  <div className="bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Why this MAP was generated</span>
                    <p className="text-slate-600 leading-normal">{selectedMap.whyGenerated || selectedMap.aiReasoning}</p>
                  </div>

                  {/* Why Department */}
                  <div className="bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Why this department was selected</span>
                    <p className="text-slate-600 leading-normal">
                      {selectedMap.whyDepartment || `This action falls directly under ${selectedMap.department}'s active operational framework.`}
                    </p>
                  </div>

                  {/* Why Risk */}
                  <div className="bg-red-50/20 border border-red-100 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-red-950 block uppercase tracking-wider text-[9px]">Why this risk level was assigned</span>
                    <p className="text-red-900/90 leading-normal">{selectedMap.whyRisk || selectedMap.riskAnalysis}</p>
                  </div>

                  {/* Why Verification */}
                  <div className="bg-slate-50/50 border border-slate-200 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">Why this verification method was selected</span>
                    <p className="text-slate-600 leading-normal">
                      {selectedMap.whyVerification || `A formal ${selectedMap.verificationMethod} is required to satisfy independent compliance auditors.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementation Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detailed Action Requirements
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-[#003366]/5 border border-[#003366]/10 p-4 rounded-lg">
                  {selectedMap.actionPoint}
                </p>
              </div>

              {/* Risk & Priority Metrics */}
              <div className="flex gap-2.5 pt-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRiskColor(selectedMap.riskLevel)}`}>
                  Risk Level: {selectedMap.riskLevel}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(selectedMap.priority)}`}>
                  Priority: {selectedMap.priority}
                </span>
              </div>
            </div>

            {/* Drawer Action Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              {selectedMap.status === "Pending" ? (
                <>
                  <button
                    onClick={() => handleReject(selectedMap.id)}
                    className="flex-1 py-2.5 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject MAP
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedMap.id);
                      setSelectedMapId(null);
                    }}
                    className="flex-1 py-2.5 bg-[#FFD700] hover:bg-[#e6c200] text-[#003366] rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve &amp; Dispatch
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">
                    Current Status: <span className="font-bold text-[#003366]">{selectedMap.status}</span>
                  </span>
                  <button
                    onClick={() => handleReopen(selectedMap.id)}
                    className="text-xs text-[#003366] hover:underline font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-open specifications
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit MAP Dialog */}
      {editingMap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">MAP-{editingMap.id.slice(0, 8)}</span>
                <h3 className="text-base font-bold text-slate-800">Edit Action Point</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMap(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Task Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Task Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  value={editingMap.taskName}
                  onChange={(e) => setEditingMap({ ...editingMap, taskName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Department</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    value={editingMap.department}
                    onChange={(e) => setEditingMap({ ...editingMap, department: e.target.value })}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Compliance Deadline</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    value={editingMap.deadline}
                    onChange={(e) => setEditingMap({ ...editingMap, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Priority</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    value={editingMap.priority}
                    onChange={(e) => setEditingMap({ ...editingMap, priority: e.target.value as any })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Risk Level */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Risk Level</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]"
                    value={editingMap.riskLevel}
                    onChange={(e) => setEditingMap({ ...editingMap, riskLevel: e.target.value as any })}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Verification Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Verification Method</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  value={editingMap.verificationMethod}
                  onChange={(e) => setEditingMap({ ...editingMap, verificationMethod: e.target.value })}
                />
              </div>

              {/* Detailed Action Requirement */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Detailed Action Requirement</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  value={editingMap.actionPoint}
                  onChange={(e) => setEditingMap({ ...editingMap, actionPoint: e.target.value })}
                />
              </div>

              {/* Risk Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Risk Analysis Text</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366]"
                  value={editingMap.riskAnalysis}
                  onChange={(e) => setEditingMap({ ...editingMap, riskAnalysis: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMap(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#003366] text-white hover:bg-[#002244] rounded-lg font-bold text-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Specifications
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
