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

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    university_name: "",
    department: "",
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

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
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
        university_name: form.university_name.trim() || undefined,
        department: form.department.trim() || undefined,
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
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Student Register</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Use your student details to start using FakiBuzz! ISTian.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Full name
            <input
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
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
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="student@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              value={form.phone_number}
              onChange={(event) => updateField("phone_number", event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="01XXXXXXXXX"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            University name
            <input
              value={form.university_name}
              onChange={(event) => updateField("university_name", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Department
            <input
              value={form.department}
              onChange={(event) => updateField("department", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
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
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
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
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="Repeat password"
            />
          </label>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:col-span-2">{error}</p>}
          {success && <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 sm:col-span-2">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;
