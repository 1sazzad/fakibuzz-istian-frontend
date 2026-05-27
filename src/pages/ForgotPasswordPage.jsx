import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import BrandLogo from "../components/BrandLogo";
import { Button, Card, ErrorMessage, FormInput } from "../components/ui";
import { getApiErrorMessage } from "../utils/auth";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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
      await forgotPassword(email.trim());
      setMessage("If the account exists, password reset instructions have been sent.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to request password reset instructions."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <BrandLogo className="mb-4 justify-center" imageClassName="h-12 w-12" textClassName="text-center text-xl font-semibold tracking-tight text-slate-950" showTagline />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Password Recovery</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Forgot password</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your account email to receive reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="student@example.com"
          />

          <ErrorMessage>{error}</ErrorMessage>
          <ErrorMessage tone="success">{message}</ErrorMessage>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset instructions"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default ForgotPasswordPage;
