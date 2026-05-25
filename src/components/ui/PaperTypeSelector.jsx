import { getDefaultPaperType, normalizeSupportedPaperTypes } from "../../utils/paperTypes";

function PaperTypeSelector({ supportedPaperTypes, availableTypes, value, onChange, totalCount, disabled = false, className = "" }) {
  const paperTypes = normalizeSupportedPaperTypes(availableTypes ?? supportedPaperTypes);

  if (paperTypes.length === 0) {
    return null;
  }

  const selectedType = paperTypes.includes(value) ? value : getDefaultPaperType(paperTypes);

  const totalLabel = Number.isFinite(Number(totalCount)) ? `${Number(totalCount)} total` : "";

  return (
    <div className={`flex max-w-full flex-wrap items-center gap-3 ${className}`}>
      <div className="inline-flex max-w-full rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm shadow-slate-200/50">
        {paperTypes.map((paperType) => {
          const selected = paperType === selectedType;
          return (
            <button
              key={paperType}
              type="button"
              onClick={() => !disabled && onChange?.(paperType)}
              disabled={disabled}
              className={[
                "min-h-10 rounded-xl px-4 py-2 text-sm font-semibold transition",
                selected
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-violet-700",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
              aria-pressed={selected}
            >
              {paperType}
            </button>
          );
        })}
      </div>

      {totalLabel && (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {totalLabel}
        </span>
      )}
    </div>
  );
}

export default PaperTypeSelector;
