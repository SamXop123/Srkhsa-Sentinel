import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Dashboard } from "./pages/Dashboard";
import { MapReview } from "./pages/MapReview";
import { CircularDetails } from "./pages/CircularDetails";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/useAuthStore";

function AppContent() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes Wrapper */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard is accessible to all authenticated bank roles */}
                <Route path="/" element={<Dashboard />} />

                {/* Circular Details View */}
                <Route path="/circulars/:id" element={<CircularDetails />} />

                {/* Role-restricted Routes */}
                <Route
                  path="/ingestion"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Auditor", "Compliance Officer"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map-review"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Auditor", "Compliance Officer"]}>
                      <MapReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/heatmap"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Auditor", "Compliance Officer", "CEO"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Auditor"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/escalations"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "CEO"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Default Fallback for other paths */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
