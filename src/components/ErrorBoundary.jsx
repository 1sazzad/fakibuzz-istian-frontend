import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("React render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
          <section className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">Frontend error</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">The page crashed while rendering</h1>
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {this.state.error.message || "Unknown rendering error."}
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                window.location.assign("/login");
              }}
              className="mt-5 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Clear session and go to login
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
