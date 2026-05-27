const toneClasses = {
  slate: "border-slate-200 bg-slate-100 text-slate-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
};

function Badge({ tone = "slate", className = "", children }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${toneClasses[tone] || toneClasses.slate} ${className}`}>
      <span className="truncate">{children}</span>
    </span>
  );
}

export default Badge;
