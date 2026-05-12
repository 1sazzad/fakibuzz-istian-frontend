import { useState } from "react";
import { resendVerificationEmail } from "../api/authApi";
import { Button, ErrorMessage } from "./ui";
import { getApiErrorMessage } from "../utils/auth";

function ResendVerificationForm({ initialEmail = "", compact = false }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await resendVerificationEmail(email.trim());
      setMessage(response.data?.message || "If the account exists, a verification email has been sent.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to request a verification email."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-4 space-y-3" : "space-y-4"}>
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          placeholder="student@example.com"
        />
      </label>

      <ErrorMessage>{error}</ErrorMessage>
      <ErrorMessage tone="success">{message}</ErrorMessage>

      <Button type="submit" disabled={loading} className="w-full" variant={compact ? "secondary" : "primary"}>
        {loading ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}

export default ResendVerificationForm;
