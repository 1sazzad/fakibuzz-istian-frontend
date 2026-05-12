import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import { Button, Card, ErrorMessage } from "../components/ui";
import { getApiErrorMessage, PASSWORD_PATTERN, PASSWORD_VALIDATION_MESSAGE } from "../utils/auth";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing.");
      setLoading(false);
      return;
    }

    if (!PASSWORD_PATTERN.test(form.new_password)) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      setLoading(false);
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("New password and confirm password do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword({ token, new_password: form.new_password });
      setMessage(response.data?.message || "Password reset successfully.");
      setForm({ new_password: "", confirm_password: "" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset password. The link may be invalid or expired."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Password Recovery</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Reset password</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              value={form.new_password}
              onChange={(event) => updateField("new_password", event.target.value)}
              required
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="New password"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input
              type="password"
              value={form.confirm_password}
              onChange={(event) => updateField("confirm_password", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Repeat new password"
            />
          </label>

          <ErrorMessage>{error}</ErrorMessage>
          <ErrorMessage tone="success">{message}</ErrorMessage>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        {message && (
          <Button as={Link} to="/login" variant="secondary" className="mt-4 w-full">
            Go to login
          </Button>
        )}
      </Card>
    </main>
  );
}

export default ResetPasswordPage;
