import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { isStudentRouteRole, PERMISSION_DENIED_MESSAGE } from "../utils/auth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="px-4 py-10 text-center text-sm text-slate-500">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location, message: "Please login to continue." }} />;
  }

  if (role && !isStudentRouteRole(role)) {
    return <div className="px-4 py-10 text-center text-sm font-medium text-rose-700">{PERMISSION_DENIED_MESSAGE}</div>;
  }

  return children || <Outlet />;
}

export default ProtectedRoute;
