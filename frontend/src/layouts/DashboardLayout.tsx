import React from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case "/": return "Compliance Intelligence Dashboard";
      case "/ingestion": return "Ingestion Center";
      case "/map-review": return "MAP Review Center (HITL)";
      case "/heatmap": return "Regulatory Risk Heatmap";
      case "/tasks": return "Department Compliance Tasks";
      case "/escalations": return "CEO Escalation Center";
      case "/audit-logs": return "Immutable Security Audit Ledger";
      default: return "Regulatory Compliance Portal";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none z-0"></div>

      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
