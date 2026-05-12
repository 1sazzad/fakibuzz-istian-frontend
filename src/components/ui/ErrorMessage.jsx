function ErrorMessage({ children, tone = "error" }) {
  if (!children) {
    return null;
  }

  const classes =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : tone === "info"
          ? "border-indigo-200 bg-indigo-50 text-indigo-800"
          : "border-rose-200 bg-rose-50 text-rose-700";

  return <div className={`whitespace-pre-line rounded-2xl border px-4 py-3 text-sm leading-6 ${classes}`}>{children}</div>;
}

export default ErrorMessage;
