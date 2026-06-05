import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileUp, 
  CheckSquare, 
  Activity, 
  ClipboardList, 
  AlertOctagon, 
  ShieldAlert,
  LogOut,
  UserCheck
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const role = user?.role_id || "Auditor"; // Fallback for UI skeleton testing

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["Admin", "Auditor", "Compliance Officer", "Department Head", "CEO"] },
    { name: "Ingestion Center", path: "/ingestion", icon: FileUp, roles: ["Admin", "Auditor"] },
    { name: "MAP Review Center", path: "/map-review", icon: UserCheck, roles: ["Admin", "Auditor", "Compliance Officer"] },
    { name: "Compliance Heatmap", path: "/heatmap", icon: Activity, roles: ["Admin", "Auditor", "Compliance Officer", "Department Head", "CEO"] },
    { name: "Department Tasks", path: "/tasks", icon: ClipboardList, roles: ["Admin", "Department Head", "Compliance Officer"] },
    { name: "CEO Escalations", path: "/escalations", icon: AlertOctagon, roles: ["Admin", "Compliance Officer", "CEO"] },
    { name: "Audit Logs", path: "/audit-logs", icon: ShieldAlert, roles: ["Admin", "Auditor", "Compliance Officer"] },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 h-screen flex flex-col justify-between p-4 fixed left-0 top-0 z-30">
      <div>
        <div className="flex items-center space-x-3 px-3 py-4 border-b border-slate-800/80 mb-6">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-900">
            S
          </div>
          <div>
            <h1 className="font-semibold text-lg text-slate-100 tracking-tight leading-none">SuRaksha</h1>
            <span className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">ReguFlow AI</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-950/40 to-teal-900/30 text-emerald-400 border-l-2 border-emerald-400 pl-3 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>
      </div>

      <div className="border-t border-slate-800/80 pt-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">User Role</p>
          <p className="text-sm text-slate-300 font-medium">{role}</p>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
