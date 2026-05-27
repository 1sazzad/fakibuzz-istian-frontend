import Card from "./Card";

function StatCard({ label, value, helper, icon, tone = "indigo", className = "" }) {
  const toneClasses = {
    indigo: "bg-indigo-50 text-indigo-700",
    cyan: "bg-cyan-50 text-cyan-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className={`flex h-full flex-col justify-between gap-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone] || toneClasses.indigo}`}>{icon || "•"}</div>
        {helper && <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{helper}</span>}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
    </Card>
  );
}

export default StatCard;