import Card from "./Card";
import QuestionRenderer from "./QuestionRenderer";

function getOptionalText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function PaperRenderer({ paper, className = "" }) {
  const examName = getOptionalText(paper?.exam_name) || "Board Paper";
  const boardName = getOptionalText(paper?.board_name);
  const examYear = getOptionalText(paper?.exam_year);
  const subjectName = getOptionalText(paper?.subject_name);
  const subjectCode = getOptionalText(paper?.subject_code);
  const paperType = getOptionalText(paper?.paper_type);
  const time = getOptionalText(paper?.time);
  const totalMarks = getOptionalText(paper?.total_marks);
  const group = getOptionalText(paper?.group);
  const questions = Array.isArray(paper?.questions) ? paper.questions : [];

  return (
    <Card className={`space-y-5 ${className}`}>
      <div className="space-y-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Board Paper</p>
            <h2 className="break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{examName}</h2>
          </div>
          {paperType && <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{paperType}</span>}
        </div>

        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          {boardName && <span className="rounded-xl bg-slate-50 px-3 py-2">Board: {boardName}</span>}
          {examYear && <span className="rounded-xl bg-slate-50 px-3 py-2">Year: {examYear}</span>}
          {(subjectName || subjectCode) && <span className="rounded-xl bg-slate-50 px-3 py-2">Subject: {subjectName || subjectCode}{subjectName && subjectCode ? ` (${subjectCode})` : ""}</span>}
          {time && <span className="rounded-xl bg-slate-50 px-3 py-2">Time: {time}</span>}
          {totalMarks && <span className="rounded-xl bg-slate-50 px-3 py-2">Total marks: {totalMarks}</span>}
          {group && <span className="rounded-xl bg-slate-50 px-3 py-2">Group: {group}</span>}
        </div>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionRenderer key={question?.exam_question_id || question?.id || `${question?.question_no || index}-${index}`} question={question} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No questions found in this paper.
        </div>
      )}
    </Card>
  );
}

export default PaperRenderer;