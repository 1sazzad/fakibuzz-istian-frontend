function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4">
      <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export default LoadingSpinner;
