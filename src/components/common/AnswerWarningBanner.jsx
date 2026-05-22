const DEFAULT_WARNING_MESSAGE = "⚠️ AI-generated answers may occasionally contain mistakes, incomplete steps, or calculation errors—especially for mathematical, engineering, and numerical problems. Please verify important answers manually before relying on them.";

function AnswerWarningBanner({ message = DEFAULT_WARNING_MESSAGE, className = "" }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm sm:px-5 ${className}`}
    >
      <p className="text-sm font-medium leading-6 sm:text-[15px]">{message}</p>
    </div>
  );
}

export default AnswerWarningBanner;