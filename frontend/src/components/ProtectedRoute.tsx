import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import type { RoleName } from "../../../shared/types/database";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the Login view
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const userRole = user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User is authenticated but lacks required role permission
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Your profile role (<span className="font-semibold text-slate-700">{userRole}</span>) does not possess authorization to view this section of the regulatory pipeline.
          </p>
          <Navigate to="/" replace={false} />
        </div>
      );
    }
  }

  return <>{children}</>;
};
