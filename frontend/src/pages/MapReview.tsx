import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Info,
  X,
  Plus,
  Bookmark,
  Check,
  RotateCcw,
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
}

const INITIAL_MAPS: MAPItem[] = [
  {
    id: "MAP-2026-001",
    taskName: "Appoint Chief Information Security Officer (CISO)",
    department: "IT Security",
    priority: "High",
    deadline: "2026-07-01",
    riskLevel: "Critical",
    regRef: "RBI Master Direction on Cyber Security, Clause 3.2(a)",
    originalText: "Every regulated entity shall designate a senior executive as the Chief Information Security Officer (CISO) who shall be responsible for implementing the cybersecurity policy, monitoring cyber threats, and ensuring compliance with these directives.",
    aiReasoning: "Clause 3.2(a) explicitly mandates the designation of a CISO. Regulated entities have a strict requirement to establish clear executive ownership of the cybersecurity program to avoid compliance violations and security risks.",
    actionPoint: "Formalize CISO role description, present candidate names to the Board, and issue corporate appointment letter by July 1, 2026.",
    riskAnalysis: "Non-compliance carries a penalty of up to ₹50 Lakhs. Failure to appoint a CISO leads to operational oversight gaps in vulnerability management and incident response.",
    status: "Pending",
  },
  {
    id: "MAP-2026-002",
    taskName: "Implement Double-Factor Authentication for Loan Approvals",
    department: "Retail Loans",
    priority: "High",
    deadline: "2026-06-25",
    riskLevel: "High",
    regRef: "RBI Circular on Digital Lending Safety, Clause 4.1",
    originalText: "All disbursement and transaction approval operations within digital lending platforms must employ multi-factor authentication (MFA), where at least one factor is biometric or dynamic OTP.",
    aiReasoning: "The circular requires MFA specifically for digital lending operations. The retail loans department has been identified as the owner since they operate the active online borrower portal.",
    actionPoint: "Integrate dynamic OTP and SMS gateway alerts directly into the retail loan approval system pipeline to satisfy the multi-factor requirement.",
    riskAnalysis: "High likelihood of fraud attempts on unsecured lines of credit. Immediate mitigation required. Delay will trigger a warning from the RBI inspection team.",
    status: "Pending",
  },
  {
    id: "MAP-2026-003",
    taskName: "Conduct Annual IT Security Audits & Penetration Tests",
    department: "IT Security",
    priority: "High",
    deadline: "2026-08-15",
    riskLevel: "High",
    regRef: "SEBI Cybersecurity Resiliency Circular, Clause 6.3",
    originalText: "Regulated intermediaries are mandated to perform a comprehensive vulnerability assessment and penetration testing (VAPT) at least once every calendar year through a CERT-In empanelled auditor.",
    aiReasoning: "The clause requires yearly VAPT by a CERT-In auditor. IT Security must draft the RFP, hire the auditor, and complete the testing cycle prior to August 15.",
    actionPoint: "Acquire quotes from CERT-In empanelled auditors, schedule internal scoping window, execute full network/application VAPT, and compile remediation report.",
    riskAnalysis: "A major audit observation will be recorded if testing is not concluded within 12 months of the prior cycle. High security risk if exploits remain unpatched.",
    status: "Pending",
  },
  {
    id: "MAP-2026-004",
    taskName: "Refresh Suspicious Transaction Reporting (STR) SOP",
    department: "Risk & Compliance",
    priority: "Medium",
    deadline: "2026-07-10",
    riskLevel: "Medium",
    regRef: "FIU-IND Advisory 2026-AML-08, Section 2.4",
    originalText: "Intermediaries must review and refresh their internal standard operating procedures for detecting and reporting suspicious transactions (STR) to align with updated crypto-asset tracking patterns.",
    aiReasoning: "FIU-IND advisory demands updated procedures specifically incorporating new crypto and cross-border digital wallet patterns into monitoring rules.",
    actionPoint: "Revise current STR detection rules in AML software, update operations staff training manual, and obtain compliance head sign-off.",
    riskAnalysis: "Moderate regulatory risk. Can lead to missed filings of STRs, resulting in potential FIU-IND notices or compliance audits.",
    status: "Pending",
  },
  {
    id: "MAP-2026-005",
    taskName: "Implement Interest Rate Reset Customer Notifications",
    department: "Retail Loans",
    priority: "Medium",
    deadline: "2026-09-01",
    riskLevel: "Medium",
    regRef: "RBI Reset of Floating Interest Rate Guidelines, Clause 2.1",
    originalText: "Regulated entities must communicate clearly to floating rate borrowers any reset of interest rates and the resulting impact on EMI duration/amount immediately via SMS/Email.",
    aiReasoning: "Requires automated customer communication on floating interest rate resets. System needs automatic SMS/email generation triggers when benchmark rates adjust.",
    actionPoint: "Modify core banking communication service to pull loan account interest resets and push SMS/email alerts to borrowers showing old/new EMI details.",
    riskAnalysis: "High volume of customer grievances if transparency is lacking. Class action risks if incorrect interest adjustments occur without notification.",
    status: "Approved",
  },
  {
    id: "MAP-2026-006",
    taskName: "Audit Third-Party IT Outsourcing Contracts",
    department: "Legal & Vendor Risk",
    priority: "Low",
    deadline: "2026-09-30",
    riskLevel: "Medium",
    regRef: "RBI Outsourcing Guidelines, Clause 5.2",
    originalText: "Banks must incorporate clauses regarding data confidentiality, business continuity, and audit rights in all agreements signed with service providers handling sensitive customer data.",
    aiReasoning: "Mandates strict legal protections and audit rights in third-party vendor contracts. Vendor Risk and Legal must review existing active SaaS and Cloud agreements.",
    actionPoint: "Run a catalog check on active vendor contracts, identify missing regulatory clauses, and send addendum documents to vendors for signature.",
    riskAnalysis: "Low immediate operational threat, but high structural compliance threat if a vendor experiences a breach and bank has no audit recourse.",
    status: "Pending",
  },
];

export const MapReview: React.FC = () => {
  const [maps, setMaps] = useState<MAPItem[]>(INITIAL_MAPS);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Edit Modal State
  const [editingMap, setEditingMap] = useState<MAPItem | null>(null);

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

  const handleApprove = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMaps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Approved" } : item))
    );
  };

  const handleReject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMaps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Rejected" } : item))
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMap) return;
    setMaps((prev) =>
      prev.map((item) => (item.id === editingMap.id ? editingMap : item))
    );
    setEditingMap(null);
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
        return "bg-amber-100 text-amber-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-slate-100 text-slate-800";
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
            <option value="IT Security">IT Security</option>
            <option value="Retail Loans">Retail Loans</option>
            <option value="Risk & Compliance">Risk & Compliance</option>
            <option value="Legal & Vendor Risk">Legal & Vendor Risk</option>
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
                <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
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
                  <span className="font-semibold text-slate-700">{item.department}</span>
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
                  <span className={`px-1.5 py-0.2 rounded font-semibold inline-block ${getPriorityColor(item.priority)}`}>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setMaps((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, status: "Pending" } : m))
                    );
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded"
                >
                  <RotateCcw className="w-3 h-3" /> Re-open
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Side Details Drawer (Part 3) */}
      <div
        className={`fixed top-0 right-0 h-screen w-[480px] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          selectedMap ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedMap && (
          <>
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block mb-0.5">
                  {selectedMap.id} · AUDITOR WORKSPACE
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-snug">MAP Specifications</h2>
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
              {/* Task Title */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Generated Action Point</h3>
                <p className="text-base font-bold text-[#003366] leading-snug">{selectedMap.taskName}</p>
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

              {/* AI Reasoning */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Architect Agent Reasoning
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/40 border border-emerald-100 p-4 rounded-lg">
                  {selectedMap.aiReasoning}
                </p>
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

              {/* Risk Analysis */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Risk &amp; Impact Analysis
                </h4>
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-200 bg-red-100 text-red-800">
                      Risk Level: {selectedMap.riskLevel}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-200 bg-amber-100 text-amber-800">
                      Priority: {selectedMap.priority}
                    </span>
                  </div>
                  <p className="text-xs text-red-950 leading-relaxed font-medium">
                    {selectedMap.riskAnalysis}
                  </p>
                </div>
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
                    onClick={() => {
                      setMaps((prev) =>
                        prev.map((m) => (m.id === selectedMap.id ? { ...m, status: "Pending" } : m))
                      );
                    }}
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

      {/* Edit MAP Dialog / Overlay */}
      {editingMap && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{editingMap.id}</span>
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
                    <option value="IT Security">IT Security</option>
                    <option value="Retail Loans">Retail Loans</option>
                    <option value="Risk & Compliance">Risk & Compliance</option>
                    <option value="Legal & Vendor Risk">Legal & Vendor Risk</option>
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
