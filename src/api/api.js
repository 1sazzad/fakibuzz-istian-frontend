import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

function encodePath(value) {
  return encodeURIComponent(String(value).trim());
}

export const apiEndpoints = {
  health: () => API.get("/health"),
  searchSubject: (query) => API.get("/subjects/search", { params: { query } }),
  getSubjectOverview: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/overview`),
  getSubjects: () => API.get("/subjects"),
  getSubjectQuestions: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/questions`),
  searchQuestions: (payload) => API.post("/search", payload),
  getSubjectAnalysis: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/analysis`),
  getSubjectPrediction: (subjectCode) => API.get(`/subjects/${encodePath(subjectCode)}/prediction`),
  generateAnswer: (payload) => API.post("/answers/generate", payload),
  createAdminExam: (payload) => API.post("/admin/exams", payload),
  publishSubject: (subjectCode) => API.post(`/admin/subjects/${encodePath(subjectCode)}/publish`),
};

export default API;