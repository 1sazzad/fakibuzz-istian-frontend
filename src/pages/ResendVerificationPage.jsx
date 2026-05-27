import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import ResendVerificationForm from "../components/ResendVerificationForm";
import { Card } from "../components/ui";

function ResendVerificationPage() {
  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-md">
        <div>
          <BrandLogo className="mb-4 justify-center" imageClassName="h-12 w-12" textClassName="text-center text-xl font-semibold tracking-tight text-slate-950" showTagline />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Email Verification</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Resend verification</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your account email to request a new verification link.</p>
        </div>

        <div className="mt-6">
          <ResendVerificationForm />
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already verified?{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default ResendVerificationPage;
