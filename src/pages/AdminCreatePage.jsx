import { useState } from "react";
import { Link } from "react-router-dom";
import { createAdminUser } from "../api/authApi";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || fallback;
}

function AdminCreatePage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    university_name: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await createAdminUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        password: form.password,
        role: "admin",
        university_name: form.university_name.trim() || undefined,
        department: form.department.trim() || undefined,
      });
      setMessage("Admin account created. You can login now.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create admin account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin Setup</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create admin account</h1>
        <p className="mt-2 text-sm text-slate-500">Use this for the first admin, or login as admin and create more from the dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} required placeholder="Full name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required placeholder="Email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          <input value={form.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          <input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={6} placeholder="Password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          <input value={form.university_name} onChange={(event) => updateField("university_name", event.target.value)} placeholder="University name (optional)" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />
          <input value={form.department} onChange={(event) => updateField("department", event.target.value)} placeholder="Department (optional)" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400" />

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">{error}</p>}
          {message && <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 sm:col-span-2">{message}</p>}

          <button type="submit" disabled={loading} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:bg-slate-300 sm:col-span-2">
            {loading ? "Creating..." : "Create admin"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already created? <Link to="/login" className="font-semibold text-cyan-700">Login</Link>
        </p>
      </section>
    </main>
  );
}

export default AdminCreatePage;
