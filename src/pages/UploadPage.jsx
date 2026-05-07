import { useEffect, useMemo, useState } from "react";
import { apiEndpoints } from "../api/api";

function createQuestion() {
  return {
    question_no: "",
    question_text: "",
    marks: "",
    topic: "",
  };
}

function normalizeQuestion(question = {}) {
  return {
    question_no: String(question.question_no ?? "").trim(),
    question_text: String(question.question_text ?? question.text ?? "").trim(),
    marks: question.marks ?? "",
    topic: String(question.topic ?? "").trim(),
  };
}

function normalizeImportedExam(rawPayload) {
  const payload = rawPayload?.exam ?? rawPayload;
  const questions = Array.isArray(payload?.questions) ? payload.questions.map(normalizeQuestion) : [createQuestion()];

  return {
    exam_name: String(payload?.exam_name ?? "Final Examination").trim(),
    exam_year: payload?.exam_year ?? new Date().getFullYear(),
    subject_name: String(payload?.subject_name ?? "").trim(),
    subject_code: String(payload?.subject_code ?? "").trim(),
    time: String(payload?.time ?? "3 hours").trim(),
    total_marks: payload?.total_marks ?? 60,
    questions: questions.length > 0 ? questions : [createQuestion()],
  };
}

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
  const [jsonImport, setJsonImport] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSubjectCode, setPublishSubjectCode] = useState("");
  const [publishMessage, setPublishMessage] = useState("");
  const [uploadResponse, setUploadResponse] = useState(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  useEffect(() => {
    async function loadBootData() {
      try {
        const [healthResponse, subjectsResponse] = await Promise.all([apiEndpoints.health(), apiEndpoints.getSubjects()]);
        const rawSubjects = Array.isArray(subjectsResponse.data)
          ? subjectsResponse.data
          : subjectsResponse.data?.subjects || subjectsResponse.data?.items || subjectsResponse.data?.data || [];
        setHealthStatus(healthResponse.data?.status === "ok" ? "online" : "degraded");
        setSubjects(rawSubjects);
      } catch (error) {
        console.error(error);
        setSubjects([]);
        setHealthStatus("offline");
      }
    }

    loadBootData();
  }, []);

  function updateExam(field, value) {
    setExam((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "subject_code") {
        setPublishSubjectCode(String(value).trim());
      }

      return next;
    });
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
      questions: current.questions.length === 1 ? [createQuestion()] : current.questions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  function applyImportedExam(rawPayload) {
    // Detect if this is a batch upload (array) or single exam
    if (Array.isArray(rawPayload)) {
      setIsBatchMode(true);
      setMessage(`Batch mode detected: ${rawPayload.length} exam(s) ready to upload.`);
      setJsonError("");
    } else {
      setIsBatchMode(false);
      const importedExam = normalizeImportedExam(rawPayload);
      setExam(importedExam);
      setPublishSubjectCode(importedExam.subject_code);
      setMessage("JSON loaded into the form. Review the fields, then submit to the admin API.");
      setJsonError("");
    }
  }

  async function handleJsonFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const fileText = await file.text();
      setJsonImport(fileText);
      applyImportedExam(JSON.parse(fileText));
    } catch (error) {
      console.error(error);
      setJsonError("Invalid JSON file. Make sure it contains exam metadata and questions.");
    }

    event.target.value = "";
  }

  function handleLoadJsonText() {
    try {
      applyImportedExam(JSON.parse(jsonImport));
    } catch (error) {
      console.error(error);
      setJsonError("Invalid JSON. Paste a valid exam payload before loading it.");
    }
  }

  const questionProgress = useMemo(() => {
    const completeQuestions = exam.questions.filter(
      (question) => question.question_no && question.question_text && question.marks !== "" && question.topic,
    ).length;

    return {
      total: exam.questions.length,
      complete: completeQuestions,
    };
  }, [exam.questions]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isBatchMode) {
      // Single exam validation
      if (!exam.exam_name.trim() || !exam.subject_name.trim() || !exam.subject_code.trim()) {
        setMessage("Please fill the exam name, subject name, and subject code.");
        return;
      }

      const questions = exam.questions
        .map((question) => ({
          question_no: String(question.question_no).trim(),
          question_text: String(question.question_text).trim(),
          marks: Number(question.marks),
          topic: String(question.topic).trim(),
        }))
        .filter((question) => question.question_no && question.question_text && question.topic && Number.isFinite(question.marks));

      if (questions.length === 0) {
        setMessage("Add at least one complete question before submitting.");
        return;
      }

      setLoading(true);
      setMessage("Submitting exam and generating embeddings...");
      setUploadResponse(null);

      try {
        const response = await apiEndpoints.createAdminExam({
          exam_name: exam.exam_name.trim(),
          exam_year: Number(exam.exam_year),
          subject_name: exam.subject_name.trim(),
          subject_code: exam.subject_code.trim(),
          time: exam.time.trim(),
          total_marks: Number(exam.total_marks),
          questions,
        });

        const result = response.data || {};
        setUploadResponse({
          mode: "single",
          ...result,
        });
        setMessage("Exam saved successfully. Use the publish section below when the subject is ready for students.");
        setExam({
          exam_name: "Final Examination",
          exam_year: new Date().getFullYear(),
          subject_name: "",
          subject_code: "",
          time: "3 hours",
          total_marks: 60,
          questions: [createQuestion()],
        });
        setPublishSubjectCode("");
      } catch (error) {
        console.error(error);
        const errorData = error.response?.data || {};
        setUploadResponse({
          mode: "single",
          error: true,
          message: errorData.detail || "Submission failed. Check the backend and payload format.",
        });
        setMessage(errorData.detail || "Submission failed. Check the backend and payload format.");
      } finally {
        setLoading(false);
      }
    } else {
      // Batch mode: POST array of exams
      setLoading(true);
      setMessage("Submitting batch of exams and generating embeddings...");
      setUploadResponse(null);

      try {
        const response = await apiEndpoints.createAdminExam(JSON.parse(jsonImport));
        const result = response.data || {};
        setUploadResponse({
          mode: "batch",
          ...result,
        });
        setMessage(result.message || "Batch upload completed.");
        setJsonImport("");
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
        const errorData = error.response?.data || {};
        setUploadResponse({
          mode: "batch",
          error: true,
          message: errorData.detail || "Batch submission failed.",
        });
        setMessage(errorData.detail || "Batch submission failed. Check JSON format and backend response.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function handlePublishSubject() {
    if (!publishSubjectCode.trim()) {
      setPublishMessage("Enter a subject code to publish.");
      return;
    }

    setPublishing(true);
    setPublishMessage("Publishing subject data...");

    try {
      const response = await apiEndpoints.publishSubject(publishSubjectCode.trim());
      const data = response.data || {};
      setPublishMessage(data.message || `Subject ${publishSubjectCode.trim()} published successfully.`);
    } catch (error) {
      console.error(error);
      setPublishMessage(error.response?.data?.detail || "Publish failed. Check the subject code and backend response.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#e2e8f0_45%,_#f8fafc_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl shadow-slate-950/30 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              Admin JSON ingest
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Import a JSON exam, index it once, publish it when ready.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Paste or upload the admin exam JSON, review the generated form, submit it to the backend, then publish the subject for student access.
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
            <h2 className="text-lg font-semibold text-white">Workflow</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">1. Import a JSON payload or edit the form manually.</li>
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">2. Submit the exam to create embeddings and store the data.</li>
              <li className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">3. Publish the subject when student access should be enabled.</li>
            </ol>
          </div>
        </section>

        {uploadResponse && (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            {uploadResponse.error ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
                <h3 className="text-lg font-semibold text-rose-900">Upload failed</h3>
                <p className="mt-2 text-sm text-rose-800">{uploadResponse.message}</p>
              </div>
            ) : uploadResponse.mode === "single" ? (
              <div className="space-y-4">
                <div className="rounded-[1.25rem] border border-green-200 bg-green-50 p-4">
                  <h3 className="text-lg font-semibold text-green-900">Exam saved successfully</h3>
                  <p className="mt-1 text-sm text-green-800">{uploadResponse.message}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Exam ID</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.exam_id}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Questions stored</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.question_count}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Embeddings created</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.embedded_count}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{uploadResponse.status}</p>
                  </div>
                </div>
                {uploadResponse.auto_filled_fields && uploadResponse.auto_filled_fields.length > 0 && (
                  <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">Backend auto-filled fields:</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {uploadResponse.auto_filled_fields.map((field) => (
                        <li key={field} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.25rem] border border-green-200 bg-green-50 p-4">
                  <h3 className="text-lg font-semibold text-green-900">Batch upload completed</h3>
                  <p className="mt-1 text-sm text-green-800">{uploadResponse.message}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Received</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.received}</p>
                  </div>
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-green-700">Saved</p>
                    <p className="mt-2 text-2xl font-semibold text-green-900">{uploadResponse.saved}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${uploadResponse.failed > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
                    <p className={`text-xs uppercase tracking-[0.24em] ${uploadResponse.failed > 0 ? "text-rose-700" : "text-slate-500"}`}>Failed</p>
                    <p className={`mt-2 text-2xl font-semibold ${uploadResponse.failed > 0 ? "text-rose-900" : "text-slate-900"}`}>{uploadResponse.failed}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total questions</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.total_question_count}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Embeddings</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{uploadResponse.total_embedded_count}</p>
                  </div>
                </div>

                {uploadResponse.saved_items && uploadResponse.saved_items.length > 0 && (
                  <div className="rounded-[1.25rem] border border-green-100 bg-green-50 p-5">
                    <h4 className="text-lg font-semibold text-green-900">Successfully uploaded ({uploadResponse.saved})</h4>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="border-b border-green-200">
                          <tr>
                            <th className="py-2 px-3 font-semibold text-green-800">Index</th>
                            <th className="py-2 px-3 font-semibold text-green-800">Exam ID</th>
                            <th className="py-2 px-3 font-semibold text-green-800">Subject Code</th>
                            <th className="py-2 px-3 font-semibold text-green-800">Questions</th>
                            <th className="py-2 px-3 font-semibold text-green-800">Status</th>
                            <th className="py-2 px-3 font-semibold text-green-800">Auto-filled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-100">
                          {uploadResponse.saved_items.map((item) => (
                            <tr key={item.index} className="hover:bg-green-100/50">
                              <td className="py-3 px-3">{item.index}</td>
                              <td className="py-3 px-3 font-mono text-xs">{item.exam_id}</td>
                              <td className="py-3 px-3 font-medium">{item.subject_code}</td>
                              <td className="py-3 px-3">{item.question_count}</td>
                              <td className="py-3 px-3">
                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {item.auto_filled_fields && item.auto_filled_fields.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {item.auto_filled_fields.map((field) => (
                                      <span key={field} className="inline-block rounded bg-green-200/70 px-2 py-0.5 text-xs text-green-800">
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {uploadResponse.failed_items && uploadResponse.failed_items.length > 0 && (
                  <div className="rounded-[1.25rem] border border-rose-100 bg-rose-50 p-5">
                    <h4 className="text-lg font-semibold text-rose-900">Failed uploads ({uploadResponse.failed})</h4>
                    <div className="mt-4 space-y-3">
                      {uploadResponse.failed_items.map((item) => (
                        <div key={item.index} className="rounded-2xl border border-rose-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-rose-900">Exam #{item.index}</p>
                              <p className="mt-1 text-sm text-rose-800">{item.error}</p>
                              {item.details && item.details.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {item.details.map((detail, idx) => (
                                    <li key={idx} className="text-xs text-rose-700">
                                      • {detail}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  {isBatchMode ? "Batch upload" : "Exam details"}
                </h2>
                <p className="text-sm text-slate-500">
                  {isBatchMode ? "Submit multiple exams at once from JSON." : "These fields are sent directly to POST /admin/exams."}
                </p>
              </div>
              {!isBatchMode && (
                <div className="rounded-full bg-cyan-50 px-4 py-2 text-xs font-medium text-cyan-700">
                  {questionProgress.complete}/{questionProgress.total} questions complete
                </div>
              )}
            </div>

            {isBatchMode ? (
              <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
                <p className="text-sm font-semibold text-cyan-900">Batch mode active</p>
                <p className="mt-2 text-sm text-cyan-800">The JSON import textarea contains a batch of exams. Click "Submit" below to upload all exams at once.</p>
              </div>
            ) : (
              <>
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
              </>
            )}

            <button
              type="submit"
              disabled={loading || (isBatchMode && !jsonImport.trim())}
              className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? (isBatchMode ? "Submitting batch..." : "Submitting exam...") : isBatchMode ? "Submit batch upload" : "Save exam to admin API"}
            </button>

            {message && (
              <div className={`rounded-[1.25rem] border p-4 text-sm ${
                uploadResponse?.error 
                  ? "border-rose-200 bg-rose-50 text-rose-700" 
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}>
                {message}
              </div>
            )}
          </form>

          <aside className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Import JSON</h2>
              <p className="mt-1 text-sm text-slate-500">Paste the admin exam JSON (single or batch) or upload a .json file.</p>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <input type="file" accept="application/json,.json" onChange={handleJsonFileChange} className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800" />
              <textarea
                value={jsonImport}
                onChange={(event) => setJsonImport(event.target.value)}
                placeholder='{"exam_name":"Final Examination","subject_code":"CSE-421",...} or [{"exam_name":"..."},{"exam_name":"..."}]'
                className="min-h-48 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleLoadJsonText}
                className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                {isBatchMode ? "✓ Batch detected" : "Load JSON"}
              </button>
              {jsonError && <p className="text-sm text-rose-600">{jsonError}</p>}
              {isBatchMode && (
                <p className="text-xs text-cyan-700 bg-cyan-100 rounded-lg px-3 py-2">
                  ✓ Array of exams detected. Click "Submit batch upload" on the left to send all exams at once.
                </p>
              )}
            </div>

            {!isBatchMode && (
              <div className="grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Questions ready</span>
                  <span className="font-semibold text-white">
                    {questionProgress.complete}/{questionProgress.total}
                  </span>
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
            )}

            <div className="space-y-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5 text-sm text-cyan-900">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Publish subject</h3>
                <p className="mt-1 text-sm text-slate-600">After review, publish the subject so students can access it.</p>
              </div>
              <input
                value={publishSubjectCode}
                onChange={(event) => setPublishSubjectCode(event.target.value)}
                placeholder="CSE-421"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handlePublishSubject}
                disabled={publishing}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {publishing ? "Publishing..." : "Publish subject"}
              </button>
              {publishMessage && <p>{publishMessage}</p>}
            </div>

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
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
