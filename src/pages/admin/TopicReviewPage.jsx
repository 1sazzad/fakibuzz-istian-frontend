import { useState } from "react";
import { apiEndpoints } from "../../api/api";

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

function normalizeClusters(data) {
  return data?.clusters || data?.items || data?.data || data?.results || (Array.isArray(data) ? data : []);
}

function TopicReviewPage() {
  const [subjectCode, setSubjectCode] = useState("");
  const [status, setStatus] = useState("pending");
  const [clusters, setClusters] = useState([]);
  const [topicDrafts, setTopicDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadClusters(event) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiEndpoints.getTopicReview({
        subject_code: subjectCode.trim() || undefined,
        status,
      });
      const nextClusters = normalizeClusters(response.data);
      setClusters(nextClusters);
      setTopicDrafts(
        nextClusters.reduce((drafts, cluster) => {
          const id = cluster.id || cluster.cluster_id;
          drafts[id] = cluster.suggested_topic || cluster.topic || "";
          return drafts;
        }, {}),
      );
      setMessage(`Loaded ${nextClusters.length} topic review item(s).`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load topic review items."));
    } finally {
      setLoading(false);
    }
  }

  async function generateReview() {
    if (!subjectCode.trim()) {
      setError("Enter a subject code before generating topic review.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiEndpoints.generateTopicReview({ subject_code: subjectCode.trim() });
      setMessage(response.data?.message || "Topic review generation started.");
      await loadClusters();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to generate topic review clusters."));
    } finally {
      setLoading(false);
    }
  }

  async function approveCluster(clusterId) {
    const finalTopic = String(topicDrafts[clusterId] || "").trim();

    if (!finalTopic) {
      setError("Enter a final topic before approving.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiEndpoints.approveTopicCluster(clusterId, { final_topic: finalTopic });
      setMessage("Topic cluster approved.");
      setClusters((current) => current.filter((cluster) => (cluster.id || cluster.cluster_id) !== clusterId));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to approve topic cluster."));
    } finally {
      setLoading(false);
    }
  }

  async function rejectCluster(clusterId) {
    setLoading(true);
    setError("");

    try {
      await apiEndpoints.rejectTopicCluster(clusterId);
      setMessage("Topic cluster rejected.");
      setClusters((current) => current.filter((cluster) => (cluster.id || cluster.cluster_id) !== clusterId));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to reject topic cluster."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Topic Review</h1>
          <p className="mt-2 text-sm text-slate-500">Review pending topic clusters and approve the final topic names.</p>

          <form onSubmit={loadClusters} className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
            <input
              value={subjectCode}
              onChange={(event) => setSubjectCode(event.target.value)}
              placeholder="Subject code, e.g. 540203"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="submit" disabled={loading} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
              {loading ? "Loading..." : "Fetch"}
            </button>
            <button type="button" onClick={generateReview} disabled={loading} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:bg-slate-300">
              Generate
            </button>
          </form>

          {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {message && <p className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">{message}</p>}
        </div>

        <div className="space-y-4">
          {clusters.map((cluster, index) => {
            const clusterId = cluster.id || cluster.cluster_id || index;
            const questions = cluster.questions || cluster.sample_questions || cluster.important_questions || [];

            return (
              <article key={clusterId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Cluster {clusterId}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{cluster.suggested_topic || cluster.topic || "Untitled topic"}</h2>
                    <p className="mt-1 text-sm text-slate-500">{cluster.subject_code || subjectCode || "No subject code"} · {cluster.status || status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => approveCluster(clusterId)} disabled={loading} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-300">
                      Approve
                    </button>
                    <button type="button" onClick={() => rejectCluster(clusterId)} disabled={loading} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:bg-slate-100">
                      Reject
                    </button>
                  </div>
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Final topic
                  <input
                    value={topicDrafts[clusterId] || ""}
                    onChange={(event) => setTopicDrafts((current) => ({ ...current, [clusterId]: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                    placeholder="Compiler Phases"
                  />
                </label>

                {questions.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {questions.slice(0, 5).map((question, questionIndex) => (
                      <li key={`${clusterId}-${questionIndex}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                        {question.question_text || question.text || question}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}

          {clusters.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No topic review items loaded.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default TopicReviewPage;
