import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { createAdminUser } from "../../api/authApi";
import { apiEndpoints } from "../../api/api";
import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/useAuth";
import { Badge, Button, Card, ErrorMessage, PageHeader, PasswordInput, ResponsiveContainer } from "../../components/ui";
import { buildInstitutionMetadata } from "../../utils/institution";
import {
  getApiErrorMessage,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
  PHONE_PATTERN,
  PHONE_VALIDATION_MESSAGE,
} from "../../utils/auth";

const adminWorkflows = [
  { to: "/admin/upload", title: "Upload Questions", description: "Import admin exam JSON and create embeddings.", badge: "Ingest" },
  { to: "/admin/questions", title: "Manage Questions", description: "Review and maintain stored question data.", badge: "Data" },
  { to: "/admin/subjects", title: "Manage Subjects", description: "Publish subjects for student access.", badge: "Publish" },
];

const feedbackStatuses = ["new", "reviewed", "approved", "resolved", "ignored"];
const FEEDBACK_ROWS_PER_PAGE = 5;

function normalizeFeedback(payload) {
  const items = payload?.feedback || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : [];
}

function getFeedbackId(item) {
  return item.id ?? item.feedback_id;
}

function AdminDashboardPage() {
  const { isSuperAdmin, user } = useAuth();
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    institution_id: "",
    institution_name: "",
    department: "",
    program: "",
    batch_session: "",
  });
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("new");
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);

  useEffect(() => {
    let active = true;

    async function loadAnalyticsSummary() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const response = await apiEndpoints.getAdminAnalyticsSummary();

        if (active) {
          setAnalyticsSummary(response.data || null);
        }
      } catch (error) {
        if (active) {
          setAnalyticsError(getApiErrorMessage(error, "Unable to load analytics summary."));
        }
      } finally {
        if (active) {
          setAnalyticsLoading(false);
        }
      }
    }

    loadAnalyticsSummary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFeedback() {
      setFeedbackLoading(true);
      setFeedbackError("");

      try {
        const response = await apiEndpoints.getAdminFeedback({ status: feedbackStatus, limit: 50 });

        if (active) {
          setFeedbackItems(normalizeFeedback(response.data));
        }
      } catch (error) {
        if (active) {
          setFeedbackError(getApiErrorMessage(error, "Unable to load feedback."));
        }
      } finally {
        if (active) {
          setFeedbackLoading(false);
        }
      }
    }

    loadFeedback();

    return () => {
      active = false;
    };
  }, [feedbackStatus]);

  function updateAdminField(field, value) {
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setCreatingAdmin(true);
    setAdminError("");
    setAdminMessage("");

    if (!PHONE_PATTERN.test(adminForm.phone_number.trim())) {
      setAdminError(PHONE_VALIDATION_MESSAGE);
      setCreatingAdmin(false);
      return;
    }

    if (!PASSWORD_PATTERN.test(adminForm.password)) {
      setAdminError(PASSWORD_VALIDATION_MESSAGE);
      setCreatingAdmin(false);
      return;
    }

    try {
      await createAdminUser({
        full_name: adminForm.full_name.trim(),
        email: adminForm.email.trim(),
        phone_number: adminForm.phone_number.trim(),
        password: adminForm.password,
        role: "sub_admin",
        ...buildInstitutionMetadata(adminForm),
      });
      setAdminMessage("Sub admin account created.");
      setAdminForm({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        institution_id: "",
        institution_name: "",
        department: "",
        program: "",
        batch_session: "",
      });
    } catch (error) {
      setAdminError(getApiErrorMessage(error, "Unable to create admin account."));
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleFeedbackStatusChange(feedbackId, status) {
    setUpdatingFeedbackId(String(feedbackId));
    setFeedbackError("");

    try {
      await apiEndpoints.updateAdminFeedbackStatus(feedbackId, status);
      setFeedbackItems((items) =>
        status === feedbackStatus
          ? items.map((item) => (getFeedbackId(item) === feedbackId ? { ...item, status } : item))
          : items.filter((item) => getFeedbackId(item) !== feedbackId),
      );
    } catch (error) {
      setFeedbackError(getApiErrorMessage(error, "Unable to update feedback status."));
    } finally {
      setUpdatingFeedbackId("");
    }
  }

  const topPages = Array.isArray(analyticsSummary?.top_pages) ? analyticsSummary.top_pages : [];
  const feedbackPageCount = Math.max(1, Math.ceil(feedbackItems.length / FEEDBACK_ROWS_PER_PAGE));
  const currentFeedbackPage = Math.min(feedbackPage, feedbackPageCount);
  const feedbackStartIndex = (currentFeedbackPage - 1) * FEEDBACK_ROWS_PER_PAGE;
  const paginatedFeedbackItems = feedbackItems.slice(feedbackStartIndex, feedbackStartIndex + FEEDBACK_ROWS_PER_PAGE);

  return (
    <ResponsiveContainer>
      <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-200/60">
        <BrandLogo imageClassName="h-8 w-8" textClassName="text-sm font-semibold tracking-tight text-slate-950" />
      </div>
      <PageHeader
        eyebrow="Admin Dashboard"
        title={`Welcome, ${user?.full_name || "Admin"}`}
        description="Manage uploaded exams, question records, and published subjects."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminWorkflows.map((item) => (
          <Link key={item.to} to={item.to} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <Badge tone="indigo">{item.badge}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Analytics</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Analytics Summary</h2>
          </div>
          {analyticsLoading && <Badge>Loading...</Badge>}
        </div>

        <ErrorMessage>{analyticsError}</ErrorMessage>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total visits</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{analyticsSummary?.total_visits ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Unique sessions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{analyticsSummary?.unique_sessions ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Today visits</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{analyticsSummary?.today_visits ?? 0}</p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Top pages</h3>
          {topPages.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No page analytics returned yet.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {topPages.map((page) => (
                <div key={page.path} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="min-w-0 break-words text-sm font-medium text-slate-700">{page.path}</span>
                  <Badge>{page.visits ?? 0} visits</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Feedback</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">User Feedback</h2>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Status
            <select
              value={feedbackStatus}
              onChange={(event) => {
                setFeedbackStatus(event.target.value);
                setFeedbackPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-48"
            >
              {feedbackStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <ErrorMessage>{feedbackError}</ErrorMessage>
        </div>

        {feedbackLoading ? (
          <p className="mt-5 text-sm text-slate-500">Loading feedback...</p>
        ) : feedbackItems.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No {feedbackStatus} feedback found.</p>
        ) : (
          <>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">ID</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Message</th>
                  <th className="py-3 pr-4">Rating</th>
                  <th className="py-3 pr-4">Page</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFeedbackItems.map((item) => {
                  const feedbackId = getFeedbackId(item);

                  return (
                    <tr key={feedbackId} className="align-top">
                      <td className="py-4 pr-4 font-medium text-slate-950">{feedbackId}</td>
                      <td className="py-4 pr-4 text-slate-700">{item.name || "Anonymous"}</td>
                      <td className="py-4 pr-4 text-slate-700">{item.email || "-"}</td>
                      <td className="max-w-xs py-4 pr-4 text-slate-700">
                        <p className="line-clamp-4 whitespace-pre-line break-words">{item.message || "-"}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{item.rating ?? "-"}</td>
                      <td className="max-w-[12rem] py-4 pr-4 break-words text-slate-700">{item.page_url || "-"}</td>
                      <td className="py-4 pr-4">
                        <Badge tone="indigo">{item.status || "-"}</Badge>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{item.created_at || "-"}</td>
                      <td className="py-4">
                        <select
                          value={item.status || feedbackStatus}
                          disabled={updatingFeedbackId === String(feedbackId)}
                          onChange={(event) => handleFeedbackStatusChange(feedbackId, event.target.value)}
                          className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {feedbackStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing {feedbackStartIndex + 1}-{Math.min(feedbackStartIndex + FEEDBACK_ROWS_PER_PAGE, feedbackItems.length)} of {feedbackItems.length}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentFeedbackPage === 1}
                  onClick={() => setFeedbackPage(Math.max(1, currentFeedbackPage - 1))}
                >
                  Previous
                </Button>
                {Array.from({ length: feedbackPageCount }, (_, index) => {
                  const pageNumber = index + 1;

                  return (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === currentFeedbackPage ? "primary" : "secondary"}
                      size="sm"
                      aria-current={pageNumber === currentFeedbackPage ? "page" : undefined}
                      onClick={() => setFeedbackPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentFeedbackPage === feedbackPageCount}
                  onClick={() => setFeedbackPage(Math.min(feedbackPageCount, currentFeedbackPage + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

        {isSuperAdmin && (
        <Card as="form" onSubmit={handleCreateAdmin}>
          <h2 className="text-2xl font-semibold text-slate-950">Create sub admin</h2>
          <p className="mt-1 text-sm text-slate-500">Create a sub admin account. This action is available only to super admins.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input aria-label="Full name" value={adminForm.full_name} onChange={(event) => updateAdminField("full_name", event.target.value)} required placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Email" type="email" value={adminForm.email} onChange={(event) => updateAdminField("email", event.target.value)} required placeholder="Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Phone number" value={adminForm.phone_number} onChange={(event) => updateAdminField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <PasswordInput ariaLabel="Password" value={adminForm.password} onChange={(event) => updateAdminField("password", event.target.value)} required minLength={8} placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Institution ID" value={adminForm.institution_id} onChange={(event) => updateAdminField("institution_id", event.target.value)} placeholder="Institution ID (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Institution name" value={adminForm.institution_name} onChange={(event) => updateAdminField("institution_name", event.target.value)} placeholder="Institution name (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Department" value={adminForm.department} onChange={(event) => updateAdminField("department", event.target.value)} placeholder="Department (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Program" value={adminForm.program} onChange={(event) => updateAdminField("program", event.target.value)} placeholder="Program (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Batch/session" value={adminForm.batch_session} onChange={(event) => updateAdminField("batch_session", event.target.value)} placeholder="Batch/session (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </div>

          <div className="mt-4">
            <ErrorMessage>{adminError}</ErrorMessage>
            <ErrorMessage tone="success">{adminMessage}</ErrorMessage>
          </div>

          <Button type="submit" disabled={creatingAdmin} className="mt-5 w-full sm:w-auto">
            {creatingAdmin ? "Creating..." : "Create sub admin account"}
          </Button>
        </Card>
        )}
    </ResponsiveContainer>
  );
}

export default AdminDashboardPage;
