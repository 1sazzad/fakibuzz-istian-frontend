import { useState } from "react";
import { Link } from "react-router-dom";
import { createAdminUser } from "../api/authApi";
import { Button, Card, ErrorMessage } from "../components/ui";

const PHONE_PATTERN = /^[0-9+().\s-]+$/;

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
    setup_token: "",
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

    if (!PHONE_PATTERN.test(form.phone_number.trim())) {
      setError("Phone number can contain only numbers, +, (), dot, spaces, or hyphens.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      await createAdminUser(
        {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          role: "admin",
          university_name: form.university_name.trim() || undefined,
          department: form.department.trim() || undefined,
        },
        form.setup_token,
      );
      setMessage("Admin account created. You can login now.");
      updateField("setup_token", "");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create admin account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 px-4 py-8 sm:py-12">
      <Card className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Admin Setup</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create admin account</h1>
        <p className="mt-2 text-sm text-slate-500">Use this for the first admin, or login as admin and create more from the dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input aria-label="Full name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} required placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required placeholder="Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Phone number" value={form.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Password" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="University name" value={form.university_name} onChange={(event) => updateField("university_name", event.target.value)} placeholder="University name (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Department" value={form.department} onChange={(event) => updateField("department", event.target.value)} placeholder="Department (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Setup token" type="password" value={form.setup_token} onChange={(event) => updateField("setup_token", event.target.value)} placeholder="Setup token (first admin only)" autoComplete="off" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:col-span-2" />

          <div className="sm:col-span-2">
            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage tone="success">{message}</ErrorMessage>
          </div>

          <Button type="submit" disabled={loading} className="sm:col-span-2">
            {loading ? "Creating..." : "Create admin"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already created? <Link to="/login" className="font-semibold text-indigo-700">Login</Link>
        </p>
      </Card>
    </main>
  );
}

export default AdminCreatePage;
