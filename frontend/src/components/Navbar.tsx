import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, LogOut, Shield, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface NavbarProps {
  sidebarCollapsed: boolean;
}

const tickerItems: string[] = [
  "📋 RBI Circular RBI/2026-27/14 — Revised KYC Master Direction released",
  "📋 SEBI Notification SEBI/HO/MIRSD/2026/05 — Updated margin requirements",
  "📋 FIU-IND Advisory 2026-AML-08 — Enhanced STR filing guidelines",
];

export const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed }) => {
  const sidebarWidth = sidebarCollapsed ? 72 : 240;
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = () => {
    if (!user) return "RK";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || "US";
  };

  const getDisplayName = () => {
    if (!user) return "R. Kumar";
    return `${user.first_name?.[0]}. ${user.last_name}`;
  };

  const getDisplayRole = () => {
    if (!user) return "CCO";
    return user.role || "Auditor";
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-5 transition-all duration-300 ease-in-out"
      style={{
        height: 48,
        left: sidebarWidth,
      }}
    >
      {/* ── Left Section: Regulatory Pulse Ticker ── */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-6">
        {/* Pulsing live dot + label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">
            <span className="text-red-600">LIVE</span>{" "}
            <span className="text-gray-700">REGULATORY PULSE · RBI</span>
          </span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="ticker-scroll whitespace-nowrap text-[12px] text-gray-600 font-medium">
            {tickerItems.map((item, idx) => (
              <span key={idx} className="mr-16 inline-block">
                {item}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {tickerItems.map((item, idx) => (
              <span key={`dup-${idx}`} className="mr-16 inline-block">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Section ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search button */}
        <button
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          aria-label="Search"
        >
          <Search style={{ width: 16, height: 16 }} />
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          aria-label="Notifications"
        >
          <Bell style={{ width: 16, height: 16 }} />
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* User profile dropdown pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1 py-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[11px] shadow-sm border border-[#003366]/10"
              style={{
                width: 30,
                height: 30,
                backgroundColor: "#FFD700",
                color: "#003366",
              }}
            >
              {getInitials()}
            </div>
            <div className="text-left leading-none hidden sm:block">
              <p className="text-[12px] font-semibold text-gray-800">{getDisplayName()}</p>
              <span className="text-[10px] text-gray-500 font-medium">{getDisplayRole()}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
              {/* Header profile info */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">REGULATORY IDENTITY</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>

              {/* Action buttons */}
              <div className="py-1">
                <div className="px-4 py-2 text-xs flex items-center justify-between text-slate-600 font-medium">
                  <span>Assigned Role</span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#003366]/5 text-[#003366] border border-[#003366]/10">
                    {getDisplayRole()}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
