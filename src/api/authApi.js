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

export function verifyEmail(token) {
  return API.post("/auth/verify-email", { token });
}

export function resendVerificationEmail(email) {
  return API.post("/auth/resend-verification-email", { email });
}

export function forgotPassword(email) {
  return API.post("/auth/forgot-password", { email });
}

export function resetPassword(data) {
  return API.post("/auth/reset-password", data);
}

export function getUniversities() {
  return API.get("/universities");
}

export function getUniversityDepartments(universityId) {
  return API.get(`/universities/${encodeURIComponent(String(universityId))}/departments`);
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}

export function createAdminUser(data) {
  return API.post("/auth/create-admin", { ...data, role: "sub_admin" });
}

export function createSuperAdminUser(data, setupToken = "") {
  const headers = setupToken.trim() ? { "X-Setup-Token": setupToken.trim() } : undefined;
  return API.post("/auth/create-super-admin", { ...data, role: "super_admin" }, { headers });
}
