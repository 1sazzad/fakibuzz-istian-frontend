import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function getOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isDiagramRequired(value) {
  return value === true || value === "true";
}

function FormulaDisplay({ latex }) {
  const source = getOptionalText(latex);
  const rendered = useMemo(() => {
    if (!source) {
      return null;
    }

    try {
      return katex.renderToString(source, {
        displayMode: true,
        throwOnError: true,
        strict: "warn",
      });
    } catch {
      return null;
    }
  }, [source]);

  if (!source) {
    return null;
  }

  if (!rendered) {
    return (
      <code className="block overflow-x-auto rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700">
        {source}
      </code>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl bg-white px-3 py-2 text-slate-900"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function QuestionExtras({ item, className = "", formulaLabel = "Formula" }) {
  const formulaLatex = getOptionalText(item?.formula_latex);
  const diagramRequired = isDiagramRequired(item?.diagram_required);
  const diagramReference = getOptionalText(item?.diagram_reference);
  const diagramDescription = getOptionalText(item?.diagram_description);

  if (!formulaLatex && !diagramRequired && !diagramReference && !diagramDescription) {
    return null;
  }

  return (
    <div className={`mt-3 space-y-2 text-sm ${className}`}>
      {formulaLatex && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formulaLabel}</p>
          <FormulaDisplay latex={formulaLatex} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        {diagramRequired && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
            Diagram Required
          </span>
        )}
        {diagramReference && (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Source: {diagramReference}
          </span>
        )}
      </div>

      {diagramDescription && (
        <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
          <span className="font-semibold text-slate-950">Drawing Instruction:</span> {diagramDescription}
        </p>
      )}
    </div>
  );
}

export default QuestionExtras;
