import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import type { RoleName } from "../../../shared/types/database";
import {
  LayoutDashboard,
  Upload,
  ClipboardCheck,
  BarChart3,
  ClipboardList,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
  allowedRoles: RoleName[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    allowedRoles: ["Admin", "Auditor", "Compliance Officer", "Department Head", "CEO"],
  },
  {
    name: "Ingestion Center",
    path: "/ingestion",
    icon: Upload,
    allowedRoles: ["Admin", "Auditor", "Compliance Officer"],
  },
  {
    name: "MAP Review Center",
    path: "/map-review",
    icon: ClipboardCheck,
    allowedRoles: ["Admin", "Auditor", "Compliance Officer"],
  },
  {
    name: "Compliance Heatmap",
    path: "/heatmap",
    icon: BarChart3,
    allowedRoles: ["Admin", "Auditor", "Compliance Officer", "CEO"],
  },
  {
    name: "Department Tasks",
    path: "/tasks",
    icon: ClipboardList,
    allowedRoles: ["Admin", "Department Head"],
  },
  {
    name: "Audit Logs",
    path: "/audit-logs",
    icon: FileText,
    allowedRoles: ["Admin", "Auditor"],
  },
  {
    name: "CEO Escalations",
    path: "/escalations",
    icon: AlertTriangle,
    allowedRoles: ["Admin", "CEO"],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const userRole = user?.role || "Auditor"; // Default fallback

  // Filter navigation items by role access permissions
  const visibleNavItems = navItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 72 : 240,
        backgroundColor: "#003366",
      }}
    >
      {/* ── Brand Logo Area ── */}
      <div
        className={`flex items-center border-b border-white/10 ${
          collapsed ? "justify-center px-2 py-5" : "px-5 py-5"
        }`}
      >
        {/* Gold 'S' Circle */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[#003366]"
          style={{
            width: collapsed ? 40 : 36,
            height: collapsed ? 40 : 36,
            backgroundColor: "#FFD700",
            fontSize: collapsed ? 18 : 16,
          }}
        >
          S
        </div>

        {/* Brand Text — hidden when collapsed */}
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-white font-semibold text-base leading-tight tracking-tight whitespace-nowrap">
              SuRaksha Sentinel
            </h1>
            <span
              className="text-[10px] text-slate-300 font-medium tracking-[0.15em] whitespace-nowrap"
              style={{ fontVariant: "small-caps" }}
            >
              CANARA BANK · REGOPS
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation Items ── */}
      <nav className="flex-1 mt-4 flex flex-col gap-1 px-2 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`group relative flex items-center rounded-md transition-all duration-200 ${
                collapsed ? "justify-center px-0 py-3" : "px-4 py-2.5"
              } ${
                isActive
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
              }`}
              style={{
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.08)"
                  : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }
              }}
            >
              {/* Gold left border for active state */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-sm"
                  style={{
                    width: 3,
                    height: "60%",
                    backgroundColor: "#FFD700",
                  }}
                />
              )}

              <Icon
                className="flex-shrink-0"
                style={{
                  width: 18,
                  height: 18,
                  color: isActive ? "#FFD700" : undefined,
                }}
              />

              {!collapsed && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}

        {/* ── Collapse / Expand Toggle ── */}
        <button
          onClick={onToggle}
          className="mt-4 flex items-center rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          style={{
            justifyContent: collapsed ? "center" : undefined,
            padding: collapsed ? "10px 0" : "10px 16px",
          }}
        >
          {collapsed ? (
            <ChevronRight style={{ width: 18, height: 18 }} />
          ) : (
            <>
              <ChevronLeft style={{ width: 18, height: 18 }} />
              <span className="ml-3 text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </nav>

      {/* ── Bottom Security Badge ── */}
      {!collapsed && (
        <div className="px-4 pb-5 pt-3 border-t border-white/10">
          <div className="flex items-start gap-2">
            <Shield
              className="flex-shrink-0 mt-0.5"
              style={{ width: 14, height: 14, color: "#FFD700" }}
            />
            <div>
              <p className="text-[11px] font-semibold text-slate-200 leading-tight">
                SOC 2 · ISO 27001
              </p>
              <p className="text-[9px] text-slate-400 leading-snug mt-0.5">
                End-to-end encrypted, audit-grade lineage on every action
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
