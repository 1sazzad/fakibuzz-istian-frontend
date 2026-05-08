import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail || error.response?.data?.message;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return detail || error.message || fallback;
}

function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });

      const nextRole = user?.role || localStorage.getItem("role");

      if (nextRole !== "admin") {
        setError("You are not authorized to open admin pages.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Wrong email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-cyan-950/30">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Admin Login</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Admin access</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to manage questions and subjects.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="admin@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="Admin password"
            />
          </label>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Signing in..." : "Admin Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Need first admin setup?{" "}
          <Link to="/admin/create" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Create admin
          </Link>
        </p>
      </section>
    </main>
  );
}

export default AdminLoginPage;
