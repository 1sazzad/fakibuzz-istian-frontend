import { getDefaultPaperType, normalizeSupportedPaperTypes } from "../../utils/paperTypes";

function PaperTypeSelector({ supportedPaperTypes, value, onChange, className = "" }) {
  const paperTypes = normalizeSupportedPaperTypes(supportedPaperTypes);

  if (paperTypes.length === 0) {
    return null;
  }

  const selectedType = paperTypes.includes(value) ? value : getDefaultPaperType(paperTypes);

  return (
    <div className={`inline-flex max-w-full rounded-xl border border-slate-200 bg-slate-50 p-1 ${className}`}>
      {paperTypes.map((paperType) => {
        const selected = paperType === selectedType;
        return (
          <button
            key={paperType}
            type="button"
            onClick={() => onChange?.(paperType)}
            className={[
              "min-h-9 rounded-lg px-4 py-2 text-sm font-semibold transition",
              selected
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                : "text-slate-600 hover:bg-white hover:text-indigo-700",
            ].join(" ")}
            aria-pressed={selected}
          >
            {paperType}
          </button>
        );
      })}
    </div>
  );
}

export default PaperTypeSelector;
