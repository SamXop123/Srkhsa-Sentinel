import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../services/api";
import {
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  Bookmark,
  CheckCircle,
  ExternalLink,
  Shield,
  Activity,
  AlertTriangle,
  Tag,
  Building,
  Zap,
} from "lucide-react";
import type { Regulation } from "../../../shared/types/database";

interface CircularDetailsItem {
  id: string;
  title: string;
  source_org: string;
  circular_number: string;
  publication_date: string;
  file_path: string;
  status: string;
  raw_metadata: {
    page_count?: number;
    effective_date?: string;
    file_size_bytes?: number;
    extracted_text?: string;
  };
  uploaded_by: string;
  created_at: string;
}

const TIMELINE_STAGES = [
  { name: "Uploaded", key: "Ingested" },
  { name: "Parsed", key: "Parsed" },
  { name: "Scout Analysis", key: "Scout_Complete" },
  { name: "MAP Translation", key: "MAP_Generated" },
  { name: "Auditor Check", key: "Pending_Review" },
  { name: "Verification", key: "Verified" },
];

export const CircularDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [circular, setCircular] = useState<CircularDetailsItem | null>(null);
  const [regulation, setRegulation] = useState<Regulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReg, setIsLoadingReg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await apiClient.get<CircularDetailsItem>(`/circulars/${id}`);
      setCircular(response.data);
      
      // If status is Scout_Complete or MAP_Generated, retrieve the extracted regulation details
      if (response.data.status === "Scout_Complete" || response.data.status === "MAP_Generated") {
        fetchRegulation(response.data.id);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to retrieve circular specifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegulation = async (circularId: string) => {
    setIsLoadingReg(true);
    try {
      const response = await apiClient.get<Regulation>(`/circulars/${circularId}/regulation`);
      setRegulation(response.data);
    } catch (err) {
      console.warn("No regulation record found yet:", err);
    } finally {
      setIsLoadingReg(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "RBI":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SEBI":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "FIU-IND":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getActiveStageIndex = (statusStr: string) => {
    if (statusStr === "Ingested" || statusStr === "Uploaded") return 0;
    if (statusStr === "Parsed") return 1;
    if (statusStr === "Scout_Complete") return 2;
    if (statusStr === "MAP_Generated") return 3;
    if (statusStr === "Pending_Review") return 4;
    if (statusStr === "Verified") return 5;
    return 2; // Default fallback
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-red-200 text-red-950 border-red-300 font-bold";
      case "High":
        return "bg-red-50 text-red-700 border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#003366]" />
        <span className="text-sm font-semibold">Retrieving circular specifications...</span>
      </div>
    );
  }

  if (errorMsg || !circular) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Circular Specifications Failed</h2>
        <p className="text-sm text-slate-500 mt-2">{errorMsg || "The requested circular could not be found."}</p>
        <Link
          to="/ingestion"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Ingestion Center
        </Link>
      </div>
    );
  }

  const activeStageIdx = getActiveStageIndex(circular.status);

  return (
    <div className="space-y-6">
      {/* Back navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/ingestion"
          className="flex items-center gap-1.5 text-xs font-bold text-[#003366] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Ingestion Registry
        </Link>
        <span className="text-xs font-semibold text-slate-400 font-mono">
          System ID: {circular.id}
        </span>
      </div>

      {/* Header title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getSourceBadgeColor(circular.source_org)}`}>
            {circular.source_org} DIRECTIVE
          </span>
          <span className="font-mono text-xs font-bold text-slate-400">{circular.circular_number}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{circular.title}</h1>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-[#003366]" />
          Loop Closure Status Timeline
        </h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          {TIMELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStageIdx;
            const isActive = idx === activeStageIdx;

            return (
              <React.Fragment key={stage.name}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${
                      isActive
                        ? "bg-[#FFD700] border-transparent text-[#003366] ring-2 ring-[#003366]/20 font-bold"
                        : isCompleted
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isActive ? "text-[#003366]" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                      {stage.name}
                    </p>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      {isActive ? "Active" : isCompleted ? "Verified" : "Standby"}
                    </span>
                  </div>
                </div>

                {idx < TIMELINE_STAGES.length - 1 && (
                  <div className="flex-1 hidden md:block mx-4 border-t-2 border-dashed border-slate-200"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Scout Agent Analysis Section (Part 4) */}
      {(circular.status === "Scout_Complete" || circular.status === "MAP_Generated") && regulation ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#003366]"></div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center text-[#003366]">
                  <Zap className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">Scout Agent Intelligence Analysis</h2>
                  <p className="text-xs text-slate-500">Autonomous metadata discovery &amp; compliance screening</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getRiskBadgeColor(regulation.risk_level)}`}>
                Risk Level: {regulation.risk_level}
              </span>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Summary</h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-lg border border-slate-100">
                {regulation.summary}
              </p>
            </div>

            {/* Subgrid: Penalty & Affected Domains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Penalty Clause */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Penalty &amp; Enforcement Clauses
                </h3>
                {regulation.penalty_clause ? (
                  <div className="text-xs text-red-950 bg-red-50/50 border border-red-100 p-4 rounded-lg leading-relaxed">
                    {regulation.penalty_clause}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                    No explicit penalty clauses extracted by the agent.
                  </div>
                )}
              </div>

              {/* Right: Affected Departments & Dates */}
              <div className="space-y-4">
                {/* Domains */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#003366]" />
                    Affected Compliance Domains
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {regulation.affected_domains.map((domain, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-[#003366]/5 text-[#003366] border border-[#003366]/10 rounded-lg text-xs font-semibold"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Publication Date</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                      {circular.publication_date}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Effective Date</span>
                    <span className="text-xs font-bold text-[#003366] font-mono mt-0.5 block">
                      {regulation.effective_date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (circular.status === "Scout_Complete" || circular.status === "MAP_Generated") && isLoadingReg ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#003366]" />
          <span className="text-xs font-semibold">Loading agent analysis details...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Scout Agent Analysis Pending</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This circular is currently in <span className="font-semibold text-slate-700">"{circular.status}"</span> state.
              The Scout Agent parsing pipeline must execute to extract structured metadata. Reload the page once complete.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Ingestion Metadata & PDF Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
              Circular Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Regulator Source</span>
                <span className="font-bold text-slate-800">{circular.source_org}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Circular Number</span>
                <span className="font-mono font-bold text-slate-800">{circular.circular_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Audit Status</span>
                <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                  {circular.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Publication Date</span>
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {circular.publication_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Effective Date</span>
                <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {circular.raw_metadata?.effective_date || circular.publication_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Page Count</span>
                <span className="font-bold text-slate-800">{circular.raw_metadata?.page_count || 1} Pages</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">File Weight</span>
                <span className="font-bold text-slate-800">
                  {circular.raw_metadata?.file_size_bytes
                    ? `${(circular.raw_metadata.file_size_bytes / 1024).toFixed(1)} KB`
                    : "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Uploaded Timestamp</span>
                <span className="font-mono font-bold text-slate-800">
                  {new Date(circular.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5 uppercase">Ingested By</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  R. Kumar (Auditor)
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Text Area */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Extracted Text Preview (PyMuPDF Service)
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Character Limit: 50,000</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 font-mono text-[11px] leading-relaxed text-slate-700 h-[360px] overflow-y-auto whitespace-pre-wrap select-text">
              {circular.raw_metadata?.extracted_text || "No text extracted. Circular parsing might have failed."}
            </div>
          </div>
        </div>

        {/* Right Column: PDF Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Official PDF Document
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-red-600 shadow-sm">
                  <FileText className="w-9 h-9" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 truncate w-full max-w-[200px]" title={circular.circular_number}>
                  {circular.circular_number}.pdf
                </h4>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  Secure PDF Vault File
                </p>
              </div>
            </div>

            <a
              href={`http://localhost:8000/${circular.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-2.5 rounded-lg transition-colors text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Secure PDF File
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
