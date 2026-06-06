import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 72 : 240;
  const navbarHeight = 48;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      {/* Navbar */}
      <Navbar sidebarCollapsed={collapsed} />

      {/* Main Content Area */}
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarWidth,
          marginTop: navbarHeight,
          padding: 24,
          minHeight: `calc(100vh - ${navbarHeight}px)`,
        }}
      >
        {children}
      </main>
    </div>
  );
};
