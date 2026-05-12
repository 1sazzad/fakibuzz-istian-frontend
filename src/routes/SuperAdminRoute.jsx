import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { PERMISSION_DENIED_MESSAGE } from "../utils/auth";

function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <div className="px-4 py-10 text-center text-sm text-slate-500">Checking super admin access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: "Please login before opening super admin pages." }} />;
  }

  if (!isSuperAdmin) {
    return <div className="px-4 py-10 text-center text-sm font-medium text-rose-700">{PERMISSION_DENIED_MESSAGE}</div>;
  }

  return children || <Outlet />;
}

export default SuperAdminRoute;
