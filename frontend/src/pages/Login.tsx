import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Shield, Lock, User as UserIcon, ArrowRight, Check } from "lucide-react";
import type { RoleName } from "../../../shared/types/database";

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    // Determine role based on username/email
    let role: RoleName = "Auditor";
    let name = "R. Kumar";
    let dept: string | null = null;

    if (username.toLowerCase() === "admin@sentinel.com") {
      role = "Admin";
      name = "S. Sharma";
    } else if (username.toLowerCase() === "auditor@sentinel.com") {
      role = "Auditor";
      name = "R. Kumar";
    } else if (username.toLowerCase() === "compliance@sentinel.com") {
      role = "Compliance Officer";
      name = "M. Mehta";
    } else if (username.toLowerCase() === "depthead@sentinel.com") {
      role = "Department Head";
      name = "A. Rao";
      dept = "Retail Loans";
    } else if (username.toLowerCase() === "ceo@sentinel.com") {
      role = "CEO";
      name = "V. Iyer";
    } else {
      // General fallbacks
      if (username.includes("admin")) {
        role = "Admin";
        name = "S. Sharma";
      } else if (username.includes("compliance")) {
        role = "Compliance Officer";
        name = "M. Mehta";
      } else if (username.includes("head") || username.includes("dept")) {
        role = "Department Head";
        name = "A. Rao";
        dept = "Retail Loans";
      } else if (username.includes("ceo")) {
        role = "CEO";
        name = "V. Iyer";
      }
    }

    // Perform state login
    login(
      {
        id: `usr-${role.toLowerCase().replace(/\s+/g, "-")}`,
        email: username,
        first_name: name.split(" ")[0],
        last_name: name.split(" ")[1] || "Officer",
        role_id: `role-${role.toLowerCase().replace(/\s+/g, "-")}`,
        role: role,
        department_id: dept,
        is_active: true,
      },
      "mock-jwt-token-sentinel-2026"
    );
  };

  const selectMockUser = (email: string) => {
    setUsername(email);
    setPassword("password123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner header with Canara navy & gold accent line */}
        <div className="bg-[#003366] px-8 py-6 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#FFD700]"></div>
          <div className="mx-auto w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center font-bold text-[#003366] mb-3 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">SuRaksha Sentinel</h1>
          <p className="text-xs text-slate-300 font-medium tracking-[0.1em] mt-1 uppercase">
            Canara Bank RegOps Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g., auditor@sentinel.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366] text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#003366] focus:border-[#003366] text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#003366] focus:ring-[#003366]"
                />
                Remember Session
              </label>
              <a href="#forgot" className="text-[#003366] hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-[#003366] font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Profiles */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-3">
              DEMO PROFILES (CLICK TO SELECT)
            </h2>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => selectMockUser("admin@sentinel.com")}
                className="border border-slate-200 hover:border-[#003366]/40 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg text-left transition-colors font-medium"
              >
                Admin (All rights)
              </button>
              <button
                type="button"
                onClick={() => selectMockUser("auditor@sentinel.com")}
                className="border border-slate-200 hover:border-[#003366]/40 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg text-left transition-colors font-medium"
              >
                Auditor
              </button>
              <button
                type="button"
                onClick={() => selectMockUser("compliance@sentinel.com")}
                className="border border-slate-200 hover:border-[#003366]/40 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg text-left transition-colors font-medium"
              >
                Compliance Officer
              </button>
              <button
                type="button"
                onClick={() => selectMockUser("depthead@sentinel.com")}
                className="border border-slate-200 hover:border-[#003366]/40 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg text-left transition-colors font-medium"
              >
                Department Head
              </button>
              <button
                type="button"
                onClick={() => selectMockUser("ceo@sentinel.com")}
                className="col-span-2 border border-slate-200 hover:border-[#003366]/40 hover:bg-slate-50 text-slate-700 py-1.5 px-3 rounded-lg text-center transition-colors font-medium"
              >
                CEO (Read-only Escalations)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
