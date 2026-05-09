import { useCallback, useEffect, useState } from "react";
import { apiEndpoints } from "../../api/api";

const DEBUG_ENDPOINTS_ENABLED = import.meta.env.DEV;

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail || error.response?.data?.message || error.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return detail || error.message || fallback;
}

function normalizeSubjects(payload) {
  const rawSubjects = Array.isArray(payload) ? payload : payload?.subjects || payload?.items || payload?.data || [];

  return rawSubjects
    .map((subject) => ({
      subject_code: String(subject?.subject_code ?? subject?.code ?? subject?.subjectCode ?? "").trim(),
      subject_name: String(subject?.subject_name ?? subject?.name ?? subject?.subjectName ?? "").trim(),
      status: String(subject?.status ?? "").trim(),
      total_questions: subject?.total_questions ?? subject?.question_count ?? 0,
      pending_review_count: subject?.pending_review_count ?? 0,
    }))
    .filter((subject) => subject.subject_code);
}

function normalizeTopics(payload) {
  const rawTopics = Array.isArray(payload) ? payload : payload?.topics || payload?.analysis || payload?.items || payload?.data || [];
  return rawTopics.map((topic) => (typeof topic === "string" ? { topic } : topic));
}

function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState("draft");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [debugResult, setDebugResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSubjects = useCallback(async (nextStatus = "") => {
    setLoading(true);
    setError("");

    try {
      const response = await apiEndpoints.getSubjects(nextStatus ? { status: nextStatus } : undefined);
      const nextSubjects = normalizeSubjects(response.data);
      setSubjects(nextSubjects);

      setSelectedSubject((current) => current || nextSubjects[0]?.subject_code || "");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load subjects."));
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadSubjects(status);
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [status, loadSubjects]);

  async function loadTopics(subjectCode = selectedSubject) {
    if (!subjectCode) {
      setError("Select a subject first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiEndpoints.getSubjectAnalysis(subjectCode);
      const nextTopics = normalizeTopics(response.data);
      setTopics(nextTopics);

      if (nextTopics.length === 0) {
        setMessage("No analysis topics are available for this subject yet.");
      } else {
        setMessage(`Loaded analysis topics for ${subjectCode}.`);
      }
    } catch (err) {
      setTopics([]);
      setError(getErrorMessage(err, "Unable to load analysis topics."));
    } finally {
      setLoading(false);
    }
  }

  async function loadSystemStatus() {
    if (!DEBUG_ENDPOINTS_ENABLED) {
      setError("System status is available only in local development.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiEndpoints.getSystemStatus();
      setDebugResult({ data: response.data });
      setMessage("Loaded system status.");
    } catch (err) {
      setDebugResult(null);
      setError(getErrorMessage(err, "Unable to load system status."));
    } finally {
      setLoading(false);
    }
  }

  async function publishSubject(subjectCode) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiEndpoints.publishSubject(subjectCode);
      setMessage(response.data?.message || `Subject ${subjectCode} published.`);
      await loadSubjects(status);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to publish subject."));
    } finally {
      setLoading(false);
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (confirmAction.type === "subject") {
        await apiEndpoints.deleteSubject(confirmAction.subjectCode);
        setMessage(`Deleted subject ${confirmAction.subjectCode}.`);
        setTopics([]);
        setSubjects((current) => {
          const nextSubjects = current.filter((subject) => subject.subject_code !== confirmAction.subjectCode);
          setSelectedSubject((currentSubject) => (currentSubject === confirmAction.subjectCode ? nextSubjects[0]?.subject_code || "" : currentSubject));
          return nextSubjects;
        });
        await loadSubjects(status);
      }

      if (confirmAction.type === "topic") {
        await apiEndpoints.deleteSubjectTopic(confirmAction.subjectCode, confirmAction.topicName);
        setMessage(`Deleted topic "${confirmAction.topicName}" from ${confirmAction.subjectCode}.`);
        await loadTopics(confirmAction.subjectCode);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Delete failed."));
    } finally {
      setConfirmAction(null);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Manage Subjects</h1>
          <p className="mt-2 text-sm text-slate-500">Publish, inspect, or delete subject data and analysis topics.</p>

            <div className="mt-6 flex flex-wrap gap-3">
            {["draft", "published", ""].map((item) => (
              <button
                key={item || "all"}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  status === item ? "bg-cyan-400 text-slate-950" : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {item ? item[0].toUpperCase() + item.slice(1) : "All"}
              </button>
            ))}
            <button type="button" onClick={() => loadSubjects(status)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Refresh
            </button>
            {DEBUG_ENDPOINTS_ENABLED && (
              <button type="button" onClick={loadSystemStatus} disabled={loading} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                System status
              </button>
            )}
          </div>

          {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {message && <p className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">{message}</p>}

          {debugResult && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  System status
                </p>
                <button type="button" onClick={() => setDebugResult(null)} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200">
                  Hide
                </button>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5">{JSON.stringify(debugResult.data, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Subjects</h2>
            <div className="mt-4 space-y-3">
              {subjects.map((subject) => (
                <article key={subject.subject_code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{subject.subject_code}</h3>
                      <p className="text-sm text-slate-600">{subject.subject_name || "Unnamed subject"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {subject.status || status || "unknown"} · {subject.total_questions} questions · {subject.pending_review_count} pending reviews
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setSelectedSubject(subject.subject_code); loadTopics(subject.subject_code); }} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        Topics
                      </button>
                      <button type="button" onClick={() => publishSubject(subject.subject_code)} disabled={loading} className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:bg-slate-300">
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "subject", subjectCode: subject.subject_code })}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {subjects.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{loading ? "Loading subjects..." : "No subjects found."}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Topics</h2>
                <p className="mt-1 text-sm text-slate-500">Selected subject: {selectedSubject || "none"}</p>
              </div>
              <button type="button" onClick={() => loadTopics()} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Load analysis topics
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {topics.map((topic, index) => {
                const topicName = topic.topic || topic.name || topic.title || `Topic ${index + 1}`;

                return (
                  <article key={`${topicName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{topicName}</h3>
                        <p className="text-sm text-slate-600">
                          {topic.frequency ?? topic.count ?? 0} questions · {topic.total_marks ?? topic.marks ?? 0} marks
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: "topic", subjectCode: selectedSubject, topicName })}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        Delete topic
                      </button>
                    </div>
                  </article>
                );
              })}

              {topics.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No analysis topics loaded.</p>}
            </div>
          </section>
        </div>
      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4">
          <section className="max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Destructive action</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {confirmAction.type === "subject" ? `Delete subject ${confirmAction.subjectCode}?` : `Delete topic "${confirmAction.topicName}"?`}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {confirmAction.type === "subject"
                ? "This removes all exams, questions, taxonomy topics, and vectors for this subject."
                : "This removes or unassigns the topic from analysis for this subject."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={runConfirmedAction} disabled={loading} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                {loading ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default ManageSubjectsPage;
