import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ResendVerificationForm from "../components/ResendVerificationForm";
import { Button, Card, ErrorMessage } from "../components/ui";
import { getApiErrorMessage, isAdminRole, isUnverifiedEmailError, UNVERIFIED_EMAIL_MESSAGE } from "../utils/auth";

function LoginPage() {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setShowResendVerification(false);

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
      const fallbackPath = isAdminRole(nextRole) ? "/admin/dashboard" : "/dashboard";
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (err) {
      if (isUnverifiedEmailError(err)) {
        setError(UNVERIFIED_EMAIL_MESSAGE);
        setShowResendVerification(true);
      } else {
        setError(getApiErrorMessage(err, "Wrong email or password."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Student Login</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Access your dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in with your student account.</p>
        </div>

        <div className="mt-5">
          <ErrorMessage tone="warning">{location.state?.message}</ErrorMessage>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Your password"
            />
          </label>

          <ErrorMessage>{error}</ErrorMessage>
          {showResendVerification && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Need a new verification email?</p>
              <ResendVerificationForm initialEmail={form.email} compact />
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/forgot-password" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Forgot password?
          </Link>
        </p>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Create an account
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default LoginPage;
