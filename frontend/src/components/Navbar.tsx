import React from "react";
import { Bell, ShieldCheck, Database } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-semibold text-slate-100 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-[11px] font-semibold text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-900/50 uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" />
          <span>Core System Secure</span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-semibold text-teal-400 bg-teal-950/30 px-2.5 py-1 rounded-full border border-teal-900/50 uppercase tracking-wider">
          <Database className="w-3 h-3" />
          <span>DB Active</span>
        </div>

        <button className="relative p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors duration-150">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        <div className="h-8 w-[1px] bg-slate-800"></div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
            {user?.first_name?.charAt(0) || "A"}{user?.last_name?.charAt(0) || "U"}
          </div>
          <div className="text-left leading-none">
            <p className="text-xs font-semibold text-slate-200">{user?.first_name || "Auditor"} {user?.last_name || "User"}</p>
            <span className="text-[10px] text-slate-500">{user?.email || "auditor@bank.com"}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
