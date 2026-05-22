import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";
import { isAdminRole, isSuperAdminRole } from "../utils/auth";
import { AuthContext } from "./auth-context";

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getRoleFromData(data, fallback = "") {
  return data?.role || data?.user?.role || data?.profile?.role || fallback || "";
}

function getUserFromData(data) {
  return data?.user || data?.profile || data || null;
}

function saveAuthSession(data) {
  const accessToken = data?.access_token || "";
  const nextRole = getRoleFromData(data);

  if (!accessToken) {
    throw new Error("Authentication response is missing access_token.");
  }

  localStorage.setItem("access_token", accessToken);

  if (nextRole) {
    localStorage.setItem("role", nextRole);
  }

  if (data?.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return { token: accessToken, role: nextRole, user: data?.user || null };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    logoutUser();
    setToken("");
    setRole("");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      logout();
      setLoading(false);
      return null;
    }

    try {
      const response = await getCurrentUser();
      const currentUser = getUserFromData(response.data);
      const nextRole = getRoleFromData(response.data, currentUser?.role || localStorage.getItem("role") || "");

      setToken(storedToken);
      setRole(nextRole);
      setUser(currentUser);
      localStorage.setItem("role", nextRole);

      if (currentUser) {
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      return currentUser;
    } catch {
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const login = useCallback(
    async (credentials) => {
      const response = await loginUser(credentials);
      const session = saveAuthSession(response.data || {});

      setToken(session.token);
      setRole(session.role);
      setUser(session.user);

      const refreshedUser = await refreshUser();
      return refreshedUser || session.user || { role: session.role };
    },
    [refreshUser],
  );

  const register = useCallback(
    async (payload) => {
      const response = await registerUser(payload);
      return response.data || {};
    },
    [],
  );

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      refreshUser();
    }, 0);

    function handleForcedLogout() {
      logout();
      setLoading(false);
    }

    window.addEventListener("auth:logout", handleForcedLogout);
    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener("auth:logout", handleForcedLogout);
    };
  }, [logout, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      loading,
      isAuthenticated: Boolean(token),
      isAdmin: isAdminRole(role),
      isSuperAdmin: isSuperAdminRole(role),
      login,
      register,
      logout,
      refreshUser,
    }),
    [token, user, role, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
