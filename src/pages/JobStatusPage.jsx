import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiEndpoints } from "../api/api";
import { Button, LoadingSpinner, StatCard, StatusBadge } from "../components/ui";

const POLLING_STATUSES = new Set(["queued", "running", "processing"]);

function formatValue(value, fallback = "-") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return String(value);
}

function getApiErrorMessage(error) {
  const data = error?.response?.data || error?.data || {};
  return formatValue(data.detail || data.message || data.error || error?.message, "Unable to load job status.");
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value === "succeeded" || value === "success" || value === "done" || value === "completed") {
    return "completed";
  }

  if (value === "running" || value === "in_progress" || value === "processing") {
    return "processing";
  }

  if (value === "failed" || value === "error" || value === "failed_with_errors") {
    return "failed";
  }

  return value || "queued";
}

function getNestedResult(job) {
  return job?.result && typeof job.result === "object" ? job.result : {};
}

function getCount(job, keys, fallback = 0) {
  const result = getNestedResult(job);
  const sources = [result, result.embedding_update || {}, job || {}];

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }

  return fallback;
}

function getFailureDetail(job) {
  const result = getNestedResult(job);
  return job?.error || result.error || result.detail || result.message || result.warning || "";
}

function JobStatusPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedStatus = useMemo(() => normalizeStatus(job?.status), [job?.status]);
  const shouldPoll = POLLING_STATUSES.has(normalizedStatus);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId = null;

    async function loadJobStatus(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await apiEndpoints.getJobStatus(jobId);
        const data = response.data || {};
        if (cancelled) {
          return;
        }

        setJob(data);
        setError("");
        const status = normalizeStatus(data.status);
        if (POLLING_STATUSES.has(status)) {
          timeoutId = window.setTimeout(() => loadJobStatus(false), 2500);
        }
      } catch (requestError) {
        console.error("Job status request failed:", requestError);
        if (!cancelled) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadJobStatus(true);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [jobId]);

  const counts = [
    ["Received", getCount(job, ["received", "exams_received", "exams_imported"])],
    ["Saved", getCount(job, ["saved", "exams_saved", "exams_imported"])],
    ["Failed", getCount(job, ["failed", "failed_count"])],
    ["Questions", getCount(job, ["question_count", "questions_imported", "questions_indexed"])],
    ["Embedded", getCount(job, ["embedded_count"])],
    ["Duplicates", getCount(job, ["duplicate_count", "duplicates"])],
    ["Topic Reviews", getCount(job, ["topic_review_count", "total_topic_review_count"])],
  ];

  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-xl shadow-slate-200/60 sm:p-6">
          <p className="text-sm font-semibold">Job ID is missing from the URL.</p>
          <Button as={Link} to="/admin/upload" variant="secondary" className="mt-4 w-full sm:w-auto">
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !job) {
    return <LoadingSpinner label="Loading job status..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Import job</p>
              <h1 className="mt-2 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">
                Job Status
              </h1>
              <p className="mt-2 break-all font-mono text-xs text-slate-500">{formatValue(jobId, "Missing job ID")}</p>
            </div>
            <Button as={Link} to="/admin/upload" variant="secondary" className="w-full sm:w-auto">
              Back to Upload
            </Button>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {!error && job && (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={normalizedStatus} className="capitalize">{normalizedStatus}</StatusBadge>
                {typeof job.progress === "number" && (
                  <span className="text-sm text-slate-500">{Math.max(0, Math.min(100, job.progress))}% complete</span>
                )}
                {shouldPoll && <span className="text-sm text-slate-500">Refreshing every 2.5 seconds</span>}
              </div>

              {typeof job.progress === "number" && (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }}
                  />
                </div>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {counts.map(([label, value], index) => (
                  <StatCard
                    key={label}
                    label={label}
                    value={formatValue(value, "0")}
                    tone={index % 3 === 0 ? "indigo" : index % 3 === 1 ? "cyan" : "slate"}
                  />
                ))}
              </div>

              {normalizedStatus === "failed" && getFailureDetail(job) && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-900">Backend error</p>
                  <p className="mt-2 break-words text-sm text-rose-800">{formatValue(getFailureDetail(job))}</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default JobStatusPage;
