import { useEffect, useMemo, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { getInstitutionDisplay, hasInstitutionMetadata } from "../../utils/institution";

function getOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function isDiagramRequired(value) {
  return value === true || value === "true";
}

function getReviewFlags(item) {
  const flags = item?.review_flags ?? item?.reviewFlags;

  if (Array.isArray(flags)) {
    return flags.map((flag) => getOptionalText(flag)).filter(Boolean);
  }

  const text = getOptionalText(flags);
  return text ? [text] : [];
}

function FormulaDisplay({ latex }) {
  const source = getOptionalText(latex);
  const containerRef = useRef(null);
  const canRender = useMemo(() => {
    if (!source) {
      return false;
    }

    try {
      katex.renderToString(source, {
        displayMode: true,
        throwOnError: true,
        strict: "warn",
      });
      return true;
    } catch {
      return false;
    }
  }, [source]);

  useEffect(() => {
    if (!containerRef.current || !source || !canRender) {
      return;
    }

    containerRef.current.textContent = "";
    katex.render(source, containerRef.current, {
      displayMode: true,
      throwOnError: true,
      strict: "warn",
    });
  }, [canRender, source]);

  if (!source) {
    return null;
  }

  if (!canRender) {
    return (
      <code className="block overflow-x-auto rounded-xl bg-white px-3 py-2 font-mono text-xs text-slate-700">
        {source}
      </code>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-xl bg-white px-3 py-2 text-slate-900"
    />
  );
}

function QuestionExtras({ item, className = "", formulaLabel = "Formula" }) {
  const formulaLatex = getOptionalText(item?.formula_latex);
  const diagramRequired = isDiagramRequired(item?.diagram_required);
  const diagramReference = getOptionalText(item?.diagram_reference);
  const reviewFlags = getReviewFlags(item);
  const institution = getInstitutionDisplay(item);
  const showInstitution = hasInstitutionMetadata(item);

  if (!formulaLatex && !diagramRequired && !diagramReference && !showInstitution && reviewFlags.length === 0) {
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

      {(diagramRequired || diagramReference) && (
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
      )}

      {reviewFlags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">Review flags:</span>
          {reviewFlags.map((flag, index) => (
            <span key={`${index}-${flag}`} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
              {flag}
            </span>
          ))}
        </div>
      )}

      {showInstitution && (
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {institution.institutionName !== "-" && (
            <span className="rounded-full bg-slate-100 px-3 py-1">Institution: {institution.institutionName}</span>
          )}
          {institution.institutionId !== "-" && (
            <span className="rounded-full bg-slate-100 px-3 py-1">Institution ID: {institution.institutionId}</span>
          )}
          {institution.department !== "-" && (
            <span className="rounded-full bg-slate-100 px-3 py-1">Department: {institution.department}</span>
          )}
          {institution.program !== "-" && (
            <span className="rounded-full bg-slate-100 px-3 py-1">Program: {institution.program}</span>
          )}
          {institution.batchSession !== "-" && (
            <span className="rounded-full bg-slate-100 px-3 py-1">Batch/session: {institution.batchSession}</span>
          )}
        </div>
      )}

    </div>
  );
}

export default QuestionExtras;
