import { useEffect, useMemo, useState } from "react";
import { apiEndpoints } from "../api/api";

function UploadPage() {
  const [exam, setExam] = useState(() => ({
    exam_name: "Final Examination",
    exam_year: new Date().getFullYear(),
    subject_name: "",
    subject_code: "",
    time: "3 hours",
    total_marks: 60,
    questions: [createQuestion()],
  }));
  const [subjects, setSubjects] = useState([]);
  const [healthStatus, setHealthStatus] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadBootData();
  }, []);

  async function loadBootData() {
    try {
      const [healthResponse, subjectsResponse] = await Promise.all([
        apiEndpoints.health(),
        apiEndpoints.getSubjects(),
      ]);

      setHealthStatus(healthResponse.data?.status === "ok" ? "online" : "degraded");
      setSubjects(subjectsResponse.data?.subjects || []);
    } catch (error) {
      console.error(error);
      setHealthStatus("offline");
    }
  }

  function createQuestion() {
    return {
      question_no: "",
      question_text: "",
      marks: "",
      topic: "",
    };
  }

  const questionProgress = useMemo(() => {
    const completeQuestions = exam.questions.filter(
      (question) => question.question_no && question.question_text && question.marks && question.topic,
    ).length;

    return {
      total: exam.questions.length,
      complete: completeQuestions,
    };
  }, [exam.questions]);

  function updateExam(field, value) {
    setExam((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestion(index, field, value) {
    setExam((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [field]: value } : question,
      ),
    }));
  }

  function addQuestion() {
    setExam((current) => ({
      ...current,
      questions: [...current.questions, createQuestion()],
    }));
  }

  function removeQuestion(index) {
    setExam((current) => ({
      ...current,
      questions: current.questions.length === 1
        ? [createQuestion()]
        : current.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!exam.exam_name.trim() || !exam.subject_name.trim() || !exam.subject_code.trim()) {
      setMessage("Please fill the exam name, subject name, and subject code.");
      return;
    }

    const questions = exam.questions
      .map((question) => ({
        question_no: question.question_no.trim(),
        question_text: question.question_text.trim(),
        marks: Number(question.marks),
        topic: question.topic.trim(),
      }))
      .filter((question) => question.question_no && question.question_text && question.topic && Number.isFinite(question.marks));

    if (questions.length === 0) {
      setMessage("Add at least one complete question before submitting.");
      return;
    }

    setLoading(true);
    setMessage("Submitting exam and generating embeddings...");

    try {
      await apiEndpoints.submitExam({
        exam_name: exam.exam_name.trim(),
        exam_year: Number(exam.exam_year),
        subject_name: exam.subject_name.trim(),
        subject_code: exam.subject_code.trim(),
        time: exam.time.trim(),
        total_marks: Number(exam.total_marks),
        questions,
      });

      setMessage("Exam saved successfully. You can now search, analyze, predict, and generate answers from it.");
      setExam({
        exam_name: "Final Examination",
        exam_year: new Date().getFullYear(),
        subject_name: "",
        subject_code: "",
        time: "3 hours",
        total_marks: 60,
        questions: [createQuestion()],
      });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Submission failed. Check the backend and payload format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#e2e8f0_45%,_#f8fafc_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl shadow-slate-950/30 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              API ready exam ingestion
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Submit one exam, index it once, reuse it everywhere.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Add the exam metadata and questions here. The backend stores the data in SQLite, creates embeddings, and pushes vectors into ChromaDB for search, analysis, prediction, and answer generation.
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">API status</p>
                <p className="mt-1 font-medium text-white">
                  {healthStatus === "online" ? "Online" : healthStatus === "offline" ? "Offline" : "Checking..."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Known subjects</p>
                <p className="mt-1 font-medium text-white">{subjects.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Questions in form</p>
                <p className="mt-1 font-medium text-white">{questionProgress.total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Quick workflow</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">1. Add a complete exam and question list.</li>
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">2. Search the vector store with the semantic search page.</li>
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">3. Review analysis and predicted questions by subject.</li>
            </ol>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Exam details</h2>
                <p className="text-sm text-slate-500">These fields are sent directly to POST /exams.</p>
              </div>
              <div className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-medium text-cyan-700">
                {questionProgress.complete}/{questionProgress.total} questions complete
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Exam name
                <input
                  value={exam.exam_name}
                  onChange={(event) => updateExam("exam_name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                  placeholder="Final Examination"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Exam year
                <input
                  type="number"
                  value={exam.exam_year}
                  onChange={(event) => updateExam("exam_year", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Time
                <input
                  value={exam.time}
                  onChange={(event) => updateExam("time", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                  placeholder="3 hours"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Subject code
                <input
                  value={exam.subject_code}
                  onChange={(event) => updateExam("subject_code", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                  placeholder="CSE-421"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Subject name
                <input
                  value={exam.subject_name}
                  onChange={(event) => updateExam("subject_name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                  placeholder="E-Commerce and Web Engineering"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Total marks
                <input
                  type="number"
                  value={exam.total_marks}
                  onChange={(event) => updateExam("total_marks", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Questions</h3>
                  <p className="text-sm text-slate-500">Each question needs a number, text, marks, and topic.</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Add question
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {exam.questions.map((question, index) => (
                  <div key={index} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-slate-900">Question {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={question.question_no}
                        onChange={(event) => updateQuestion(index, "question_no", event.target.value)}
                        placeholder="1(a)"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                      />
                      <input
                        type="number"
                        value={question.marks}
                        onChange={(event) => updateQuestion(index, "marks", event.target.value)}
                        placeholder="5"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                      />
                      <input
                        value={question.topic}
                        onChange={(event) => updateQuestion(index, "topic", event.target.value)}
                        placeholder="SEO"
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white sm:col-span-2"
                      />
                      <textarea
                        value={question.question_text}
                        onChange={(event) => updateQuestion(index, "question_text", event.target.value)}
                        placeholder="What is SEO? Explain its importance in E-Commerce."
                        className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white sm:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Submit exam</h2>
              <p className="mt-1 text-sm text-slate-500">The backend will store data, embed each question, and upsert vectors to ChromaDB.</p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Questions ready</span>
                <span className="font-semibold text-white">{questionProgress.complete}/{questionProgress.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all"
                  style={{ width: `${Math.max(12, (questionProgress.complete / Math.max(questionProgress.total, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-300">
                Use the analysis, predictions, and answer pages after submission to explore the stored exam.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Submitting exam..." : "Save exam to API"}
            </button>

            {message && (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {message}
              </div>
            )}

            <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5 text-sm text-cyan-900">
              <p className="font-semibold">Example subjects loaded</p>
              <div className="mt-3 space-y-2">
                {subjects.slice(0, 4).map((subject) => (
                  <div key={subject.subject_code} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <span className="font-medium text-slate-900">{subject.subject_code}</span>
                    <span className="text-right text-slate-500">{subject.subject_name}</span>
                  </div>
                ))}
                {subjects.length === 0 && <p className="text-cyan-800/80">No subjects loaded yet.</p>}
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default UploadPage;