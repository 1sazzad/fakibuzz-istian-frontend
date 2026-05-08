import { Link } from "react-router-dom";
import { useState } from "react";
import { createAdminUser } from "../../api/authApi";
import { useAuth } from "../../context/useAuth";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || fallback;
}

function AdminDashboardPage() {
  const { user } = useAuth();
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    university_name: "",
    department: "",
  });
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  function updateAdminField(field, value) {
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setCreatingAdmin(true);
    setAdminError("");
    setAdminMessage("");

    try {
      await createAdminUser({
        full_name: adminForm.full_name.trim(),
        email: adminForm.email.trim(),
        phone_number: adminForm.phone_number.trim(),
        password: adminForm.password,
        role: "admin",
        university_name: adminForm.university_name.trim() || undefined,
        department: adminForm.department.trim() || undefined,
      });
      setAdminMessage("Admin account created.");
      setAdminForm({ full_name: "", email: "", phone_number: "", password: "", university_name: "", department: "" });
    } catch (error) {
      setAdminError(getErrorMessage(error, "Unable to create admin account."));
    } finally {
      setCreatingAdmin(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Welcome, {user?.full_name || "Admin"}</h1>
          <p className="mt-2 text-sm text-slate-500">Manage uploaded exams, questions, and published subjects.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/admin/upload" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Upload Questions</h2>
            <p className="mt-2 text-sm text-slate-500">Import admin exam JSON and create embeddings.</p>
          </Link>
          <Link to="/admin/topic-review" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Topic Review</h2>
            <p className="mt-2 text-sm text-slate-500">Check missing or generated topics before publishing.</p>
          </Link>
          <Link to="/admin/questions" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Manage Questions</h2>
            <p className="mt-2 text-sm text-slate-500">Review and maintain stored question data.</p>
          </Link>
          <Link to="/admin/subjects" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Manage Subjects</h2>
            <p className="mt-2 text-sm text-slate-500">Publish subjects for student access.</p>
          </Link>
        </div>

        <form onSubmit={handleCreateAdmin} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <h2 className="text-2xl font-semibold text-slate-950">Create admin</h2>
          <p className="mt-1 text-sm text-slate-500">Create the first admin or add another admin when you are already authenticated as admin.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input value={adminForm.full_name} onChange={(event) => updateAdminField("full_name", event.target.value)} required placeholder="Full name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="email" value={adminForm.email} onChange={(event) => updateAdminField("email", event.target.value)} required placeholder="Email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
            <input value={adminForm.phone_number} onChange={(event) => updateAdminField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
            <input type="password" value={adminForm.password} onChange={(event) => updateAdminField("password", event.target.value)} required minLength={6} placeholder="Password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
            <input value={adminForm.university_name} onChange={(event) => updateAdminField("university_name", event.target.value)} placeholder="University name (optional)" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
            <input value={adminForm.department} onChange={(event) => updateAdminField("department", event.target.value)} placeholder="Department (optional)" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          </div>

          {adminError && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{adminError}</p>}
          {adminMessage && <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{adminMessage}</p>}

          <button type="submit" disabled={creatingAdmin} className="mt-5 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:bg-slate-300">
            {creatingAdmin ? "Creating..." : "Create admin account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
