import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import UploadPage from "./pages/UploadPage";
import QuestionsPage from "./pages/QuestionsPage";
import SimilarQuestionsPage from "./pages/SimilarQuestionsPage";
import TopicsPage from "./pages/TopicsPage";
import PredictionsPage from "./pages/PredictionsPage";
import GenerateAnswerPage from "./pages/GenerateAnswerPage";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/subjects" element={<UploadPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/search" element={<SimilarQuestionsPage />} />
        <Route path="/similar-questions" element={<Navigate to="/search" replace />} />
        <Route path="/analysis" element={<TopicsPage />} />
        <Route path="/topics" element={<Navigate to="/analysis" replace />} />
        <Route path="/predict" element={<PredictionsPage />} />
        <Route path="/predictions" element={<Navigate to="/predict" replace />} />
        <Route path="/answers" element={<GenerateAnswerPage />} />
        <Route path="/generate-answer" element={<Navigate to="/answers" replace />} />
      </Routes>
    </>
  );
}

export default App;