import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));

      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    if (error.response?.status === 403) {
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

  if (response.status === 403) {
    window.dispatchEvent(new Event("auth:forbidden"));
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.detail || data?.message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
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
  health: () => API.get("/health"),
  searchSubject: (query) => API.get("/subjects/search", { params: { query } }),
  getSubjectOverview: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/overview`),
  getSubjects: (params) => API.get("/subjects", { params }),
  getSubjectQuestions: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/questions`),
  searchQuestions: (payload) => API.post("/search", payload),
  getSubjectAnalysis: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/analysis`),
  getSubjectPrediction: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/predictions`),
  getSuggestions: ({ subject_code, query, top_k }) =>
    API.get(`/subjects/${encodePath(subject_code)}/suggestions`, { params: { query, top_k } }),
  exportSuggestionsJson: ({ subject_code, query, top_k }) =>
    API.get(`/subjects/${encodePath(subject_code)}/suggestions/export/json`, {
      params: { query, top_k },
      responseType: "blob",
    }),
  exportSuggestionsPdf: ({ subject_code, query, top_k }) =>
    API.get(`/subjects/${encodePath(subject_code)}/suggestions/export/pdf`, {
      params: { query, top_k },
      responseType: "blob",
    }),
  generateAnswer: (payload) => API.post("/generate-answer", payload),
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

export { buildQuery };

export default API;
