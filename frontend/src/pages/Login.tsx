import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { RoleName } from "../../../shared/types/database";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simulate login for hackathon testing
    let role: RoleName = "Auditor";
    if (email.includes("admin")) role = "Admin";
    else if (email.includes("compliance")) role = "Compliance Officer";
    else if (email.includes("head")) role = "Department Head";
    else if (email.includes("ceo")) role = "CEO";

    login(
      {
        id: "mock-uuid-1234",
        email: email,
        first_name: role.split(" ")[0],
        last_name: "Sentinel",
        role_id: role as unknown as string,
        is_active: true
      },
      "mock-jwt-token-abcdef"
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">SuRaksha Sentinel</h2>
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-1">Regulatory Intelligence Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="e.g., auditor@bank.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-100 hover:bg-emerald-400 hover:text-slate-950 text-slate-950 font-semibold py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/10 text-sm"
          >
            <span>Access Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold text-center">Quick Login Profiles</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <button 
              onClick={() => { setEmail("auditor@bank.com"); setPassword("password"); }}
              className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 py-1.5 px-2.5 rounded text-left transition-colors"
            >
              Auditor Portal
            </button>
            <button 
              onClick={() => { setEmail("compliance@bank.com"); setPassword("password"); }}
              className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 py-1.5 px-2.5 rounded text-left transition-colors"
            >
              Compliance Officer
            </button>
            <button 
              onClick={() => { setEmail("head.risk@bank.com"); setPassword("password"); }}
              className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 py-1.5 px-2.5 rounded text-left transition-colors"
            >
              Department Head
            </button>
            <button 
              onClick={() => { setEmail("ceo@bank.com"); setPassword("password"); }}
              className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 py-1.5 px-2.5 rounded text-left transition-colors"
            >
              CEO Escalations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
