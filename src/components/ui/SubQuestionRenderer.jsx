import MathRenderer from "../MathRenderer";

function getOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getSubQuestionLabel(subQuestion, index) {
  if (!subQuestion || typeof subQuestion === "string") {
    return `${index + 1}.`;
  }

  const displayLabel = getOptionalText(subQuestion.display_label);
  if (displayLabel) {
    return displayLabel;
  }

  const questionNo = getOptionalText(subQuestion.question_no);
  if (questionNo) {
    const match = questionNo.match(/\(([^()]+)\)/);
    if (match?.[1]) {
      return `(${match[1].trim()})`;
    }

    return questionNo;
  }

  const label = getOptionalText(subQuestion.label);
  if (label) {
    return label;
  }

  return `${index + 1}.`;
}

function getSubQuestionText(subQuestion) {
  if (typeof subQuestion === "string") {
    return subQuestion;
  }

  return subQuestion?.question_text || subQuestion?.text || subQuestion?.question || "";
}

function getSubQuestionMarks(subQuestion) {
  if (!subQuestion || typeof subQuestion === "string") {
    return null;
  }

  return subQuestion.marks ?? subQuestion.question_marks ?? subQuestion.total_marks ?? null;
}

function SubQuestionRenderer({ subQuestion, index }) {
  const label = getSubQuestionLabel(subQuestion, index);
  const text = getSubQuestionText(subQuestion);
  const marks = getSubQuestionMarks(subQuestion);
  const options = Array.isArray(subQuestion?.options) ? subQuestion.options : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
        <span className="font-semibold text-slate-950">{label}</span>
        <div className="min-w-0 flex-1 break-words">
          <MathRenderer value={text || "No sub-question text provided."} className="prose max-w-none" />
        </div>
        {marks !== null && marks !== undefined && marks !== "" && (
          <span className="text-xs font-semibold text-slate-500">{marks} marks</span>
        )}
      </div>

      {options.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((option, optionIndex) => (
            <div key={`${optionIndex}-${String(option)}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {String(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubQuestionRenderer;