import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const responseData = error.response.data || {};
      const retryAfter = formatRetryAfter(error.response.headers?.["retry-after"]);
      const message = responseData.quota
        ? responseData.detail || "Monthly AI answer quota exceeded."
        : retryAfter
          ? `${RATE_LIMIT_MESSAGE} Wait ${retryAfter}.`
          : RATE_LIMIT_MESSAGE;
      error.message = message;
      error.response.data = responseData.quota
        ? responseData
        : {
            ...responseData,
            detail: message,
          };
      window.dispatchEvent(new CustomEvent("api:rate-limit", { detail: { message } }));
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    if (
      error.response?.status === 403 &&
      error.response.data?.detail !== "Please verify your email before logging in." &&
      error.response.data?.message !== "Please verify your email before logging in."
    ) {
      window.dispatchEvent(new Event("auth:forbidden"));
    }

    return Promise.reject(error);
  },
);

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth:logout"));
    window.location.assign("/login");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (
    response.status === 403 &&
    data?.detail !== "Please verify your email before logging in." &&
    data?.message !== "Please verify your email before logging in."
  ) {
    window.dispatchEvent(new Event("auth:forbidden"));
  }

  if (!response.ok) {
    const quotaMessage = response.status === 429 && data?.quota ? data.detail || "Monthly AI answer quota exceeded." : "";
    const rateLimitMessage = response.status === 429 && !data?.quota ? getRateLimitMessage(response.headers.get("Retry-After")) : "";
    const error = new Error(rateLimitMessage || data?.detail || data?.message || "Request failed.");
    error.status = response.status;
    error.data = rateLimitMessage ? { ...(data || {}), detail: rateLimitMessage } : data;

    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent("api:rate-limit", { detail: { message: quotaMessage || rateLimitMessage } }));
    }

    throw error;
  }

  return data;
}

function formatRetryAfter(value) {
  if (!value) {
    return "";
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    if (seconds <= 0) {
      return "a moment";
    }

    if (seconds < 60) {
      return `${Math.ceil(seconds)} second${Math.ceil(seconds) === 1 ? "" : "s"}`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const retryDate = Date.parse(value);
  if (Number.isNaN(retryDate)) {
    return "";
  }

  const secondsUntilRetry = Math.ceil((retryDate - Date.now()) / 1000);
  return formatRetryAfter(String(secondsUntilRetry));
}

function getRateLimitMessage(retryAfter) {
  const waitTime = formatRetryAfter(retryAfter);
  return waitTime ? `${RATE_LIMIT_MESSAGE} Wait ${waitTime}.` : RATE_LIMIT_MESSAGE;
}

function encodePath(value) {
  return encodeURIComponent(String(value).trim());
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const apiEndpoints = {
  register: (payload) => API.post("/auth/register", payload),
  login: (payload) => API.post("/auth/login", payload),
  getCurrentUser: () => API.get("/auth/me"),
  verifyEmail: (payload) => API.post("/auth/verify-email", payload),
  resendVerificationEmail: (payload) => API.post("/auth/resend-verification-email", payload),
  forgotPassword: (payload) => API.post("/auth/forgot-password", payload),
  resetPassword: (payload) => API.post("/auth/reset-password", payload),
  getUniversities: () => API.get("/universities"),
  getUniversityDepartments: (universityId) => API.get(`/universities/${encodePath(universityId)}/departments`),
  health: () => API.get("/health"),
  searchSubject: (query) => API.get("/subjects/search", { params: { query } }),
  getSubjectOverview: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/overview`),
  getSubjects: (params) => API.get("/subjects", { params }),
  getSubjectQuestions: (subjectCode, params) =>
    API.get(`/subjects/${encodePath(subjectCode)}/questions`, { params }),
  searchQuestions: (payload) => API.post("/search", payload),
  getSubjectAnalysis: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/analysis`),
  getSubjectPrediction: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/predictions`),
  getSuggestions: ({ subject_code, query, top_k }) =>
    API.get(`/subjects/${encodePath(subject_code)}/suggestions`, { params: { query, top_k } }),
  generateAnswer: (payload) => API.post("/generate-answer", payload),
  submitFeedback: (payload) => API.post("/feedback", payload),
  getPublicFeedback: (params) => API.get("/feedback/public", { params }),
  getDonationInfo: () => API.get("/donation-info"),
  trackVisit: (payload) => API.post("/analytics/visit", payload),
  getAdminFeedback: (params) => API.get("/admin/feedback", { params }),
  updateAdminFeedbackStatus: (feedbackId, status) =>
    API.patch(`/admin/feedback/${encodePath(feedbackId)}/status`, { status }),
  getAdminAnalyticsSummary: () => API.get("/admin/analytics/summary"),
  listAdminUniversities: () => API.get("/admin/universities"),
  createUniversity: (payload) => API.post("/admin/universities", payload),
  updateUniversity: (universityId, payload) => API.patch(`/admin/universities/${encodePath(universityId)}`, payload),
  deleteUniversity: (universityId) => API.delete(`/admin/universities/${encodePath(universityId)}`),
  listAdminDepartments: () => API.get("/admin/departments"),
  createDepartment: (payload) => API.post("/admin/departments", payload),
  updateDepartment: (departmentId, payload) => API.patch(`/admin/departments/${encodePath(departmentId)}`, payload),
  deleteDepartment: (departmentId) => API.delete(`/admin/departments/${encodePath(departmentId)}`),
  importAdminExams: (payload) => API.post("/admin/exams/import", payload, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  }),
  importAdminExamFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post("/admin/exams/import", formData);
  },
  publishSubject: (subjectCode) => API.post(`/admin/subjects/${encodePath(subjectCode)}/publish`),
  deleteSubject: (subjectCode) => API.delete(`/admin/subjects/${encodePath(subjectCode)}`),
  deleteSubjectTopic: (subjectCode, topicName) => API.delete(`/admin/subjects/${encodePath(subjectCode)}/topics/${encodePath(topicName)}`),
  getSystemStatus: () => API.get("/debug/system-status"),
};

export function listAdminUniversities() {
  return API.get("/admin/universities");
}

export function createUniversity(payload) {
  return API.post("/admin/universities", payload);
}

export function updateUniversity(universityId, payload) {
  return API.patch(`/admin/universities/${encodePath(universityId)}`, payload);
}

export function deleteUniversity(universityId) {
  return API.delete(`/admin/universities/${encodePath(universityId)}`);
}

export function listAdminDepartments() {
  return API.get("/admin/departments");
}

export function createDepartment(payload) {
  return API.post("/admin/departments", payload);
}

export function updateDepartment(departmentId, payload) {
  return API.patch(`/admin/departments/${encodePath(departmentId)}`, payload);
}

export function deleteDepartment(departmentId) {
  return API.delete(`/admin/departments/${encodePath(departmentId)}`);
}

export { buildQuery };

export default API;
