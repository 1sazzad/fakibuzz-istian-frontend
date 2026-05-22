import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/useAuth";
import ResendVerificationForm from "../components/ResendVerificationForm";
import { Button, Card, ErrorMessage, PasswordInput } from "../components/ui";
import { getApiErrorField, getApiErrorMessage, isAdminRole, isUnverifiedEmailError, UNVERIFIED_EMAIL_MESSAGE } from "../utils/auth";

function LoginPage() {
  const { login, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showResendVerification, setShowResendVerification] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});
    setShowResendVerification(false);

    const email = form.email.trim();
    const nextFieldErrors = {};

    if (!email) {
      nextFieldErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextFieldErrors.password = "Password is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0]);
      setLoading(false);
      return;
    }

    try {
      const user = await login({
        email,
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
        const message = getApiErrorMessage(err, "Invalid email or password.");
        const field = getApiErrorField(err);
        if (field) {
          setFieldErrors({ [field]: message });
        }
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <BrandLogo className="mb-4 justify-center" imageClassName="h-12 w-12" textClassName="text-center text-xl font-semibold tracking-tight text-slate-950" />
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
              aria-invalid={Boolean(fieldErrors.email)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="student@example.com"
            />
            <ErrorMessage>{fieldErrors.email}</ErrorMessage>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <PasswordInput
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              aria-invalid={Boolean(fieldErrors.password)}
              placeholder="Your password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <ErrorMessage>{fieldErrors.password}</ErrorMessage>
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
