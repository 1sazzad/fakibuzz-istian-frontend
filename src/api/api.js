import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});

export const apiEndpoints = {
  health: () => API.get("/health"),
  submitExam: (payload) => API.post("/exams", payload),
  getSubjects: () => API.get("/subjects"),
  getQuestions: () => API.get("/questions"),
  getQuestionsBySubject: (subjectCode) => API.get(`/questions/${subjectCode}`),
  searchQuestions: (payload) => API.post("/search", payload),
  getAnalysis: (subjectCode) => API.get(`/analysis/${subjectCode}`),
  getPredictions: (subjectCode) => API.get(`/predict/${subjectCode}`),
  generateAnswer: (payload) => API.post("/answers/generate", payload),
};

export default API;