import { useState } from "react";
import { Link } from "react-router-dom";
import { createSuperAdminUser } from "../api/authApi";
import { Button, Card, ErrorMessage, PasswordInput } from "../components/ui";
import {
  getApiErrorMessage,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
  PHONE_PATTERN,
  PHONE_VALIDATION_MESSAGE,
} from "../utils/auth";

function AdminCreatePage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
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
      setError(PHONE_VALIDATION_MESSAGE);
      setLoading(false);
      return;
    }

    if (!PASSWORD_PATTERN.test(form.password)) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      setLoading(false);
      return;
    }

    try {
      await createSuperAdminUser(
        {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          password: form.password,
        },
        form.setup_token,
      );
      setMessage("Super admin account created. You can login now.");
      updateField("setup_token", "");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create super admin account."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Super Admin Setup</p>
        <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Create super admin account</h1>
        <p className="mt-2 text-sm text-slate-500">Use this setup-token flow only for local bootstrap of the first super admin.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input aria-label="Full name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} required placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required placeholder="Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Phone number" value={form.phone_number} onChange={(event) => updateField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <PasswordInput ariaLabel="Password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <PasswordInput ariaLabel="Setup token" value={form.setup_token} onChange={(event) => updateField("setup_token", event.target.value)} placeholder="Setup token" autoComplete="off" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:col-span-2" />

          <div className="sm:col-span-2">
            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage tone="success">{message}</ErrorMessage>
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:col-span-2">
            {loading ? "Creating..." : "Create super admin"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already created? <Link to="/admin/login" className="font-semibold text-indigo-700">Admin login</Link>
        </p>
      </Card>
    </main>
  );
}

export default AdminCreatePage;
