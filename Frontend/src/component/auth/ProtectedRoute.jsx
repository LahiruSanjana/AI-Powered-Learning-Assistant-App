import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import { useAuth } from "../../context/Authcontext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center max-w-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
            <h2 className="text-lg font-semibold text-slate-800">Getting things ready</h2>
            <p className="mt-2 text-sm text-slate-600">Please wait a moment while we load your learning dashboard.</p>
        </div>
      </div>
    );
  }
    return isAuthenticated ? (
        <AppLayout>
            <Outlet />
        </AppLayout>
    ) : (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
    }
export default ProtectedRoute;