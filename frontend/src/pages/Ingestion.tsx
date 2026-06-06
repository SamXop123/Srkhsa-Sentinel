import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../services/api";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  Building,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

interface CircularRegistryItem {
  id: string;
  title: string;
  source_org: string;
  circular_number: string;
  publication_date: string;
  file_path: string;
  status: string;
  uploaded_by: string;
  created_at: string;
}

export const Ingestion: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || "Auditor";

  // Check upload permissions (Admin, Auditor, Compliance Officer can upload)
  const canUpload = ["Admin", "Auditor", "Compliance Officer"].includes(userRole);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [sourceOrg, setSourceOrg] = useState("RBI");
  const [circularNumber, setCircularNumber] = useState("");
  const [pubDate, setPubDate] = useState("");
  const [effDate, setEffDate] = useState("");

  // UI flow states
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationError, setValidationError] = useState("");

  // Registry list
  const [circulars, setCirculars] = useState<CircularRegistryItem[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);

  // Fetch circulars from DB
  const fetchCirculars = async () => {
    setIsLoadingRegistry(true);
    try {
      const response = await apiClient.get<CircularRegistryItem[]>("/circulars");
      setCirculars(response.data);
    } catch (err: any) {
      console.error("Failed to fetch circulars:", err);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError("");
    setErrorMsg("");
    setSuccessMsg("");

    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      // Validate Application PDF mimetype and file extension
      if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setValidationError("Only PDF file formats (.pdf) are allowed.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setErrorMsg("");
    setSuccessMsg("");

    if (!canUpload) {
      setErrorMsg("Your role does not possess permissions to upload documents.");
      return;
    }

    if (!file) {
      setValidationError("Please select a PDF circular document.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_org", sourceOrg);
    formData.append("title", title);
    formData.append("circular_number", circularNumber);
    formData.append("publication_date", pubDate);
    if (effDate) {
      formData.append("effective_date", effDate);
    }

    try {
      await apiClient.post("/circulars/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg("Circular uploaded, structured text extracted, and stored successfully.");
      
      // Clear form
      setFile(null);
      setTitle("");
      setCircularNumber("");
      setPubDate("");
      setEffDate("");
      
      // Refetch table
      fetchCirculars();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "An error occurred during ingestion. Please check details.";
      setErrorMsg(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to permanently delete this circular and its extracted text?")) {
      return;
    }

    try {
      await apiClient.delete(`/circulars/${id}`);
      setCirculars((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Failed to delete circular. Please try again.");
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-[#003366] uppercase tracking-widest mb-1">Document Ingestion</p>
        <h1 className="text-2xl font-bold text-slate-900">Ingestion Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Process circulars from RBI, SEBI, and FIU-IND to initialize the compliance workflow
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Upload New Circular
            </h2>

            {/* Read-only access notice */}
            {!canUpload && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 leading-normal">
                  <span className="font-semibold text-slate-700 block">Read-Only Session</span>
                  Your active role ({userRole}) only allows viewing circulars. Ingestion capability is disabled.
                </div>
              </div>
            )}

            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {validationError}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Regulator Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Regulator Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["RBI", "SEBI", "FIU-IND"].map((org) => (
                    <button
                      key={org}
                      type="button"
                      disabled={!canUpload}
                      onClick={() => setSourceOrg(org)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        sourceOrg === org
                          ? "bg-[#003366] text-white border-transparent"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      } disabled:opacity-50`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Master Direction on KYC"
                  required
                  disabled={!canUpload}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366] text-slate-800 disabled:bg-slate-50 disabled:opacity-50"
                />
              </div>

              {/* Circular number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Circular Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., RBI/2026-27/14"
                  required
                  disabled={!canUpload}
                  value={circularNumber}
                  onChange={(e) => setCircularNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366] text-slate-800 disabled:bg-slate-50 disabled:opacity-50"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!canUpload}
                    value={pubDate}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] text-slate-800 disabled:bg-slate-50 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    disabled={!canUpload}
                    value={effDate}
                    onChange={(e) => setEffDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] text-slate-800 disabled:bg-slate-50 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* File Upload Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select PDF Circular
                </label>
                <div className={`border-2 border-dashed border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-[#003366]/40 transition-colors relative ${!canUpload ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={!canUpload}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Upload className="w-7 h-7 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-600 font-semibold">Click to choose file</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">PDF format only</span>
                </div>
              </div>

              {/* Upload file preview indicator */}
              {file && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 text-left">
                  <FileText className="w-4 h-4 text-[#003366] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Ready for ingestion
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {canUpload && (
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#003366] font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting circular...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload &amp; Extract Text</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Circular Registry Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 flex items-center gap-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                <Building className="w-4 h-4 text-[#003366]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Circular Registry</h2>
                <p className="text-xs text-slate-500">Regulatory documents ingested and parsed into DB</p>
              </div>
            </div>

            {isLoadingRegistry ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">Retrieving registered circulars...</span>
              </div>
            ) : circulars.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                <FileText className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Circulars Registered</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Upload an official RBI or SEBI PDF circular to initiate the regulatory tracking.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Circular ID</th>
                      <th className="px-6 py-3.5">Title</th>
                      <th className="px-6 py-3.5">Regulator</th>
                      <th className="px-6 py-3.5">Issue Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {circulars.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            to={`/circulars/${row.id}`}
                            className="font-mono font-bold text-[#003366] hover:underline"
                          >
                            {row.circular_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium max-w-[200px] truncate">
                          {row.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSourceBadgeColor(row.source_org)}`}>
                            {row.source_org}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {row.publication_date}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/circulars/${row.id}`}
                              className="p-1 hover:bg-slate-100 rounded text-[#003366] transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <a
                              href={`http://localhost:8000/${row.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            {["Admin", "Auditor"].includes(userRole) && (
                              <button
                                onClick={(e) => handleDelete(row.id, e)}
                                className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                                title="Delete circular"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
