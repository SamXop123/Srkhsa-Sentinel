import React, { useState } from "react";
import { TerminalComponent } from "../components/terminal/TerminalComponent";
import { useAgentLogs } from "../hooks/useAgentLogs";
import { Upload, FileText, CheckCircle2, Circle, Loader2, Play } from "lucide-react";

export const Ingestion: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState("RBI");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [circularId, setCircularId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook connecting to the WebSocket logs broadcast
  const { logs, isConnected, clearLogs } = useAgentLogs(circularId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setFileUploaded(true);
    }
  };

  const handleIngestTrigger = () => {
    if (!fileUploaded) return;
    
    clearLogs();
    setIsProcessing(true);
    // Assign a temporary circular ID to kick off WebSocket monitoring simulation
    const mockCircularId = "rbi-tech-dir-2026";
    setCircularId(mockCircularId);
  };

  // Mock WebSocket broadcast data pushes for the hackathon demo
  React.useEffect(() => {
    if (circularId && isProcessing) {
      const socket = new WebSocket(`ws://localhost:8000/ws/agents/logs?circular_id=${circularId}`);
      
      const simulateAgentSteps = async () => {
        // Direct event dispatch simulating WebSocket stream
        const sendSimulatedLog = (agent: string, msg: string, lvl: string = "INFO") => {
          const evt = new MessageEvent("message", {
            data: JSON.stringify({
              timestamp: new Date().toISOString(),
              agent,
              message: msg,
              level: lvl
            })
          });
          socket.dispatchEvent(evt);
        };

        await new Promise((r) => setTimeout(r, 1000));
        sendSimulatedLog("Scout", "Parsing uploaded PDF document content...");
        await new Promise((r) => setTimeout(r, 1500));
        sendSimulatedLog("Scout", "Extracting metadata properties. Authority identified: RBI.");
        await new Promise((r) => setTimeout(r, 1200));
        sendSimulatedLog("Scout", "Identified 4 compliance clauses and 1 penalty notice.");
        
        await new Promise((r) => setTimeout(r, 1800));
        sendSimulatedLog("Architect", "Beginning compliance translation algorithms. Invoking legal model...");
        await new Promise((r) => setTimeout(r, 1500));
        sendSimulatedLog("Architect", "Clause 1 mapped to Measurable Action Point (MAP). Classification: HIGH.");
        await new Promise((r) => setTimeout(r, 1200));
        sendSimulatedLog("Architect", "Executing semantic search over operational departments index...");
        await new Promise((r) => setTimeout(r, 1000));
        sendSimulatedLog("Architect", "Matched task to IT Security department. Weight: 0.94.");
        
        await new Promise((r) => setTimeout(r, 1500));
        sendSimulatedLog("Architect", "MAP extraction completed. 4 draft items created in db. Awaiting review.");
        setIsProcessing(false);
      };

      socket.onopen = () => {
        simulateAgentSteps();
      };

      return () => {
        socket.close();
      };
    }
  }, [circularId, isProcessing]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="glass-card rounded-xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Upload Circular</h3>
            
            <div className="space-y-4">
              {/* Org Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Authority</label>
                <div className="grid grid-cols-3 gap-2">
                  {["RBI", "SEBI", "FIU-IND"].map((org) => (
                    <button
                      key={org}
                      onClick={() => setSelectedOrg(org)}
                      className={`py-1.5 rounded text-xs font-semibold border ${
                        selectedOrg === org
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                          : "bg-slate-900/40 text-slate-400 border-slate-800"
                      } transition-colors`}
                    >
                      {org}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Drag Box */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">PDF Document</label>
                <div className="border border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-700/80 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-400 font-medium">Click to browse file</span>
                  <span className="text-[9px] text-slate-600 mt-1">PDF max limit 10MB</span>
                </div>
              </div>

              {/* Upload info file name */}
              {fileUploaded && (
                <div className="flex items-center space-x-3 p-3 rounded bg-slate-900 border border-slate-800 text-left">
                  <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="truncate flex-1">
                    <p className="text-xs font-medium text-slate-300 truncate">{fileName}</p>
                    <span className="text-[10px] text-slate-500">Ready for processing</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleIngestTrigger}
            disabled={!fileUploaded || isProcessing}
            className={`w-full mt-6 flex items-center justify-center space-x-2 py-2.5 rounded-lg font-semibold text-xs transition-all ${
              !fileUploaded || isProcessing
                ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-slate-100 hover:bg-emerald-400 text-slate-950 shadow-lg"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Trigger Agent Ingestion</span>
              </>
            )}
          </button>
        </div>

        {/* Process Checklist */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Pipeline Steps</h3>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-start space-x-3">
                  {fileUploaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 mt-0.5" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-300">Ingest Document</p>
                    <span className="text-[10px] text-slate-500">Upload and cache PDF locally inside encrypted storage.</span>
                  </div>
                </div>
                {fileUploaded && <span className="text-[10px] text-emerald-400 font-bold uppercase">Cached</span>}
              </div>

              <div className="flex items-start justify-between p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-start space-x-3">
                  {circularId ? (
                    isProcessing ? (
                      <Loader2 className="w-4 h-4 text-teal-400 animate-spin mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    )
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 mt-0.5" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-300">Scout parsing agent</p>
                    <span className="text-[10px] text-slate-500">Run structural layout parsing to identify clauses, and penalties.</span>
                  </div>
                </div>
                {circularId && !isProcessing && <span className="text-[10px] text-emerald-400 font-bold uppercase">Parsed</span>}
              </div>

              <div className="flex items-start justify-between p-3.5 rounded-lg bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-start space-x-3">
                  {logs.some((l) => l.agent === "Architect") ? (
                    isProcessing ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    )
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 mt-0.5" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-300">Architect translation agent</p>
                    <span className="text-[10px] text-slate-500">Translate legal requirements into MAPs and map to target departments.</span>
                  </div>
                </div>
                {logs.some((l) => l.agent === "Architect") && !isProcessing && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Completed</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left p-3.5 rounded bg-slate-900/20 border border-slate-800/40 text-[11px] text-slate-500 leading-normal">
            <strong>System Node:</strong> LangGraph workflow checkpointer uses PostgreSQL connection base. Auditor action will be required once MAP list enters review state.
          </div>
        </div>
      </div>

      {/* Terminal logs component */}
      <TerminalComponent logs={logs} isConnected={isConnected} />
    </div>
  );
};
