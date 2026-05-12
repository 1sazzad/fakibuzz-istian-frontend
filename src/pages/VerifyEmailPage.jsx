import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import { Button, Card, ErrorMessage } from "../components/ui";
import { getApiErrorMessage } from "../utils/auth";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function submitVerification() {
      setLoading(true);
      setError("");
      setMessage("");

      if (!token) {
        setError("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await verifyEmail(token);
        if (isMounted) {
          setMessage(response.data?.message || "Email verified successfully.");
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Email verification failed. The link may be invalid or expired."));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    submitVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Email Verification</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loading ? "Checking your verification link..." : "Use your verified account to continue."}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {loading && <div className="text-sm text-slate-500">Verifying email...</div>}
          <ErrorMessage>{error}</ErrorMessage>
          <ErrorMessage tone="success">{message}</ErrorMessage>
          {message && (
            <Button as={Link} to="/login" className="w-full">
              Go to login
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}

export default VerifyEmailPage;
