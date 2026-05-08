import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

function LoginPage() {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      const nextRole = user?.role || role || localStorage.getItem("role");
      const fallbackPath = nextRole === "admin" ? "/admin/dashboard" : "/dashboard";
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Wrong email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Student Login</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Access your dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your student account.</p>
        </div>

        {location.state?.message && (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {location.state.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="student@example.com"
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
              placeholder="Your password"
            />
          </label>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
