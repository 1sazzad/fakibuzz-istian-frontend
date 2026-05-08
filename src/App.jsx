import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { useAuth } from "./context/useAuth";

import UploadPage from "./pages/UploadPage";
import QuestionsPage from "./pages/QuestionsPage";
import SimilarQuestionsPage from "./pages/SimilarQuestionsPage";
import TopicsPage from "./pages/TopicsPage";
import PredictionsPage from "./pages/PredictionsPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import GenerateAnswerPage from "./pages/GenerateAnswerPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminCreatePage from "./pages/AdminCreatePage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUploadPage from "./pages/admin/AdminUploadPage";
import ManageQuestionsPage from "./pages/admin/ManageQuestionsPage";
import ManageSubjectsPage from "./pages/admin/ManageSubjectsPage";

function App() {
  const { isAuthenticated } = useAuth();
  const [permissionMessage, setPermissionMessage] = useState("");

  useEffect(() => {
    function handleForbidden() {
      setPermissionMessage("You do not have permission.");
    }

    window.addEventListener("auth:forbidden", handleForbidden);
    return () => window.removeEventListener("auth:forbidden", handleForbidden);
  }, []);

  return (
    <>
      <Navbar />

      {permissionMessage && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
          {permissionMessage}
          <button type="button" onClick={() => setPermissionMessage("")} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className={isAuthenticated ? "lg:pl-72" : ""}>
        <Routes>
          <Route path="/" element={<QuestionsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/create" element={<AdminCreatePage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/subjects" element={<QuestionsPage />} />
            <Route path="/search" element={<SimilarQuestionsPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/generate-answer" element={<GenerateAnswerPage />} />
            <Route path="/analysis" element={<TopicsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/predict" element={<PredictionsPage />} />
            <Route path="/answers" element={<GenerateAnswerPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/upload" element={<AdminUploadPage />} />
            <Route path="/admin/questions" element={<ManageQuestionsPage />} />
            <Route path="/admin/subjects" element={<ManageSubjectsPage />} />

            <Route path="/admin/exams" element={<UploadPage />} />
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
