import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiEndpoints } from "../api/api";
import { Badge, Button, Card, ErrorMessage, PageHeader, ResponsiveContainer } from "../components/ui";

const MESSAGE_MAX_LENGTH = 2000;

function getErrorMessage(error) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || "Unable to submit feedback right now.";
}

function normalizeFeedback(payload) {
  const items = payload?.feedback || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : [];
}

function FeedbackPage() {
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", message: "", rating: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publicFeedback, setPublicFeedback] = useState([]);
  const [publicFeedbackLoading, setPublicFeedbackLoading] = useState(true);
  const [publicFeedbackError, setPublicFeedbackError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPublicFeedback() {
      setPublicFeedbackLoading(true);
      setPublicFeedbackError("");

      try {
        const response = await apiEndpoints.getPublicFeedback({ limit: 20 });

        if (active) {
          const approvedFeedback = normalizeFeedback(response.data).filter((item) => item.status === "approved");
          setPublicFeedback(approvedFeedback);
        }
      } catch (loadError) {
        if (active) {
          setPublicFeedbackError(getErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setPublicFeedbackLoading(false);
        }
      }
    }

    loadPublicFeedback();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const message = form.message.trim();

    setError("");
    setSuccess("");

    if (!message) {
      setError("Message is required.");
      return;
    }

    if (message.length > MESSAGE_MAX_LENGTH) {
      setError("Message must be 2000 characters or less.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiEndpoints.submitFeedback({
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        message,
        rating: form.rating ? Number(form.rating) : undefined,
        page_url: location.pathname,
      });

      setSuccess(response.data?.message || "Thank you for your feedback.");
      setForm({ name: "", email: "", message: "", rating: "" });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Feedback"
        title="Share feedback"
        description="Send a review, suggestion, bug report, or future improvement idea."
      />

      <Card as="form" onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Name
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Rating
          <select
            value={form.rating}
            onChange={(event) => updateField("rating", event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
          >
            <option value="">Optional</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Message
          <textarea
            required
            maxLength={MESSAGE_MAX_LENGTH}
            rows={7}
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Your feedback here"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-slate-500">{form.message.length}/{MESSAGE_MAX_LENGTH}</span>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </div>

        <ErrorMessage>{error}</ErrorMessage>
        <ErrorMessage tone="success">{success}</ErrorMessage>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Approved feedback</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">What students are saying</h2>
          </div>
          {publicFeedbackLoading && <Badge>Loading...</Badge>}
        </div>

        <div className="mt-4">
          <ErrorMessage>{publicFeedbackError}</ErrorMessage>
        </div>

        {!publicFeedbackLoading && publicFeedback.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No approved feedback is available yet.</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {publicFeedback.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{item.name || "Anonymous student"}</h3>
                    {item.page_url && <p className="mt-1 break-words text-xs text-slate-500">{item.page_url}</p>}
                  </div>
                  {item.rating ? <Badge tone="indigo">{item.rating}/5</Badge> : null}
                </div>
                <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{item.message}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </ResponsiveContainer>
  );
}

export default FeedbackPage;
