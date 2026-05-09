import API from "./api";

export function registerUser(data) {
  return API.post("/auth/register", data);
}

export function loginUser(data) {
  return API.post("/auth/login", data);
}

export function getCurrentUser() {
  return API.get("/auth/me");
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

export function createAdminUser(data, setupToken = "") {
  const headers = setupToken.trim() ? { "X-Setup-Token": setupToken.trim() } : undefined;
  return API.post("/auth/create-admin", data, { headers });
}
