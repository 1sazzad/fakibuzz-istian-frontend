import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { PERMISSION_DENIED_MESSAGE } from "../utils/auth";

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="px-4 py-10 text-center text-sm text-slate-500">Checking admin access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: "Please login before opening admin pages." }} />;
  }

  if (!isAdmin) {
    return <div className="px-4 py-10 text-center text-sm font-medium text-rose-700">{PERMISSION_DENIED_MESSAGE}</div>;
  }

  return children || <Outlet />;
}

export default AdminRoute;
