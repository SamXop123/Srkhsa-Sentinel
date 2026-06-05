import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { DashboardLayout } from "../layouts/DashboardLayout";

// Page imports
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Ingestion } from "../pages/Ingestion";
import { MapReview } from "../pages/MapReview";
import { Heatmap } from "../pages/Heatmap";
import { DeptTasks } from "../pages/DeptTasks";
import { Escalations } from "../pages/Escalations";
import { AuditLogs } from "../pages/AuditLogs";

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      {isAuthenticated ? (
        <Route
          path="*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ingestion" element={<Ingestion />} />
                <Route path="/map-review" element={<MapReview />} />
                <Route path="/heatmap" element={<Heatmap />} />
                <Route path="/tasks" element={<DeptTasks />} />
                <Route path="/escalations" element={<Escalations />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          }
        />
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
};
