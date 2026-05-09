import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Button, Card, ErrorMessage } from "../components/ui";
import { buildInstitutionMetadata } from "../utils/institution";

const PHONE_PATTERN = /^[0-9+().\s-]+$/;

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

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    institution_id: "",
    institution_name: "",
    department: "",
    program: "",
    batch_session: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim() || !form.phone_number.trim() || !form.password || !form.confirm_password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

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

    if (form.password !== form.confirm_password) {
      setError("Password and confirm password do not match.");
      setLoading(false);
      return;
    }

    try {
      const user = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        ...buildInstitutionMetadata(form),
        password: form.password,
      });
      setSuccess("Registration successful.");
      setTimeout(() => {
        if (user?.role) {
          navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true, state: { message: "Registration successful. Please login." } });
        }
      }, 700);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Email or phone number may already be used."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-2xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Learner Register</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Use your student details to start using FakiBuzz.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Full name
            <input
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Your full name"
            />
          </label>

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
            Phone number
            <input
              value={form.phone_number}
              onChange={(event) => updateField("phone_number", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="01XXXXXXXXX"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Institution ID
            <input
              value={form.institution_id}
              onChange={(event) => updateField("institution_id", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Institution name
            <input
              value={form.institution_name}
              onChange={(event) => updateField("institution_name", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Department
            <input
              value={form.department}
              onChange={(event) => updateField("department", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Program
            <input
              value={form.program}
              onChange={(event) => updateField("program", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Batch/session
            <input
              value={form.batch_session}
              onChange={(event) => updateField("batch_session", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Choose a password"
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
              placeholder="Repeat password"
            />
          </label>

          <div className="sm:col-span-2">
            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage tone="success">{success}</ErrorMessage>
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:col-span-2">
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default RegisterPage;
