import LoadingSpinner from "./LoadingSpinner";

function LoadingState({ label = "Loading...", hint }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
      <LoadingSpinner label={label} />
      {hint && <p className="-mt-6 text-center text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export default LoadingState;