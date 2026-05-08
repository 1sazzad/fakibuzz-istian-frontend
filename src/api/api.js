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

export const apiEndpoints = {
  register: (payload) => API.post("/auth/register", payload),
  login: (payload) => API.post("/auth/login", payload),
  getCurrentUser: () => API.get("/auth/me"),
  health: () => API.get("/health"),
  searchSubject: (query) => API.get("/subjects/search", { params: { query } }),
  getSubjectOverview: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/overview`),
  getSubjects: () => API.get("/subjects"),
  getSubjectQuestions: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/questions`),
  searchQuestions: (payload) => API.post("/search", payload),
  getSubjectAnalysis: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/analysis`),
  getSubjectPrediction: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/prediction`),
  getSubjectTopics: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/topics`),
  generateAnswer: (payload) => API.post("/answers/generate", payload),
  generateAnswerV2: (payload) => API.post("/generate-answer", payload),
  importAdminExams: (payload) => API.post("/admin/exams/import", payload),
  importAdminExamFile: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post("/admin/exams/import-file", formData);
  },
  publishSubject: (subjectCode) => API.post(`/admin/subjects/${encodePath(subjectCode)}/publish`),
  getTopicReview: (params) => API.get("/admin/topic-review", { params }),
  generateTopicReview: (payload) => API.post("/admin/topic-review/generate", payload),
  approveTopicCluster: (clusterId, payload) => API.post(`/admin/topic-review/${encodePath(clusterId)}/approve`, payload),
  rejectTopicCluster: (clusterId) => API.post(`/admin/topic-review/${encodePath(clusterId)}/reject`),
};

export default API;
