import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <main className="min-h-[calc(100vh-88px)] bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Student Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Welcome, {user?.full_name || "Student"}</h1>
          <p className="mt-2 text-sm text-slate-500">Search questions, review predictions, and generate answers from stored exam data.</p>
        </div>

        {location.state?.message && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {location.state.message}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/search" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Search</h2>
            <p className="mt-2 text-sm text-slate-500">Find similar questions from the vector store.</p>
          </Link>
          <Link to="/suggestions" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Suggestions</h2>
            <p className="mt-2 text-sm text-slate-500">Review likely future questions by subject.</p>
          </Link>
          <Link to="/generate-answer" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300">
            <h2 className="text-lg font-semibold text-slate-950">Generate Answer</h2>
            <p className="mt-2 text-sm text-slate-500">Build a simple answer using related stored questions.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default DashboardPage;
