import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { apiEndpoints, getApiStatus } from "../api/api";
import MathRenderer from "../components/MathRenderer";
import { Badge, Button, Card, DiagramRenderer, EmptyState, ErrorMessage, LoadingSpinner, PageHeader, PaperTypeSelector, QuestionExtras, ResponsiveContainer } from "../components/ui";
import { MISSING_STUDENT_SCOPE_MESSAGE, getApiErrorMessage, isMissingStudentScopeError } from "../utils/auth";
import { buildSubjectScopeParams, getAcademicProfileSignature, isSecondaryAcademicProfile } from "../utils/academicProfile";
import { getDefaultPaperType, normalizePaperType, normalizeSupportedPaperTypes } from "../utils/paperTypes";
import { formatSubjectLabel, formatSubjectMeta, normalizeSubjectList } from "../utils/subjectLookups";
import {
  MAX_SUGGESTION_QUERY_LENGTH,
  MAX_SUGGESTION_TOP_K,
  formatSuggestionScore,
  normalizeSuggestionQuery,
  normalizeSuggestionResponse,
  normalizeSuggestionTopK,
} from "../utils/suggestionLookups";

const KATEX_OPTIONS = {
  throwOnError: false,
  strict: false,
  trust: false,
};

const markdownComponents = {
  h2: (props) => <h2 className="mt-6 border-b border-slate-200 pb-2 text-lg font-semibold leading-snug text-slate-950 first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900" {...props} />,
  p: (props) => <p className="my-3 text-sm leading-7 text-slate-700 sm:text-base" {...props} />,
  ul: (props) => <ul className="my-3 list-disc space-y-1 pl-6 text-sm leading-7 text-slate-700 sm:text-base" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1 pl-6 text-sm leading-7 text-slate-700 sm:text-base" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  strong: (props) => <strong className="font-semibold text-slate-950" {...props} />,
  table: (props) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full border-collapse bg-white text-left text-sm text-slate-700" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-slate-200 px-3 py-2 font-semibold align-top" {...props} />,
  td: (props) => <td className="border border-slate-200 px-3 py-2 align-top" {...props} />,
  pre: (props) => <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100" {...props} />,
  code: (props) => {
    const { className = "", children, ...rest } = props;
    const isBlock = className.includes("language-") || String(children).includes("\n");
    return isBlock ? (
      <code className={`${className} block min-w-max`} {...rest}>{children}</code>
    ) : (
      <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-medium text-slate-900" {...rest}>{children}</code>
    );
  },
};

function getErrorMessage(error, fallback) {
  if (isMissingStudentScopeError(error)) {
    return MISSING_STUDENT_SCOPE_MESSAGE;
  }

  return getApiErrorMessage(error, fallback);
}

function getSuggestionErrorMessage(error, fallback) {
  if (isMissingStudentScopeError(error)) {
    return MISSING_STUDENT_SCOPE_MESSAGE;
  }

  const status = getApiStatus(error);
  const detail = error.response?.data?.detail || error.response?.data?.message || error.data?.detail || error.data?.message;
  const detailText = Array.isArray(detail)
    ? detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ")
    : detail && typeof detail === "object"
      ? detail.msg || detail.message || JSON.stringify(detail)
      : String(detail || "").trim();

  if (status === 400) {
    if (/paper[_\s-]?type/i.test(detailText)) {
      return detailText || "Please select a valid paper type.";
    }

    if (/inactive|not found|unavailable/i.test(detailText)) {
      return detailText || "That subject is inactive or unavailable.";
    }

    if (/blank|empty|required|validation/i.test(detailText)) {
      return detailText || "Please enter a valid query.";
    }

    return detailText || "The request was rejected by the server.";
  }

  if (status === 401) {
    return detailText || "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return detailText || "You do not have permission to access this subject.";
  }

  if (status === 404) {
    return detailText || "That subject could not be found.";
  }

  if (!error.response) {
    return error.message || fallback || "Network error. Please check your connection and try again.";
  }

  return getApiErrorMessage(error, fallback);
}

function getSuggestionsMessage(payload, count) {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.success && count === 0) {
    return "No suggestions returned for this subject.";
  }

  const retrievalSource = payload?.retrieval_source || payload?.diagnostics?.retrieval_source;
  const fallbackUsed = Boolean(payload?.fallback_used || payload?.diagnostics?.fallback_used);

  if (fallbackUsed) {
    return "Suggestions were generated from published question history.";
  }

  if (retrievalSource === "vector") {
    return "Suggestions were generated from semantic search.";
  }

  return `Found ${count} suggestion(s).`;
}

function getSuggestionStatus(payload) {
  const retrievalSource = payload?.retrieval_source || payload?.diagnostics?.retrieval_source;
  const fallbackUsed = Boolean(payload?.fallback_used || payload?.diagnostics?.fallback_used);
  const contextCount = payload?.diagnostics?.context_questions_count;

  if (fallbackUsed || retrievalSource === "sqlite") {
    return "Suggestions were generated from published question history.";
  }

  if (retrievalSource === "vector") {
    return typeof contextCount === "number"
      ? `Suggestions were generated from semantic search using ${contextCount} context question(s).`
      : "Suggestions were generated from semantic search.";
  }

  return "";
}

function getSuggestionKey(item, index) {
  return String(item.question_id || item.id || `${item.question_text || "suggestion"}-${index}`);
}

function getAnswerTypeForMarks(marks) {
  if (!marks) {
    return "5_mark";
  }

  const numericMarks = Number(marks);
  if (!Number.isFinite(numericMarks)) {
    return "5_mark";
  }

  if (numericMarks <= 2) {
    return "2_mark";
  }

  if (numericMarks <= 5) {
    return "5_mark";
  }

  if (numericMarks <= 10) {
    return "10_mark";
  }

  return "15_mark";
}

function getScoreMeta(item) {
  const score = getNumericScore(item);

  if (score >= 80) {
    return { label: "Very High", className: "bg-green-100 text-green-700", score };
  }

  if (score >= 60) {
    return { label: "High", className: "bg-blue-100 text-blue-700", score };
  }

  if (score >= 40) {
    return { label: "Medium", className: "bg-amber-100 text-amber-700", score };
  }

  return { label: "Low", className: "bg-slate-100 text-slate-600", score };
}

function getQuotaErrorMessage(error) {
  const quota = error.response?.data?.quota || error.data?.quota;
  if (!quota) {
    return "";
  }

  const used = Number(quota.used ?? quota.limit ?? 0);
  const limit = Number(quota.limit ?? used);
  return quota.period === "monthly"
    ? `Monthly AI limit reached. You have used ${used}/${limit} free AI answers this month.`
    : "AI answer quota exceeded.";
}

function normalizeSuggestions(payload) {
  return normalizeSuggestionResponse(payload);
}

function getSuggestionText(item) {
  return getQuestionText(item.question) || item.question_text || item.text || item.title || item.prompt || item.suggestion || "Suggested question";
}

function getRawSuggestionText(item) {
  const fallbackText = "Suggested question";
  const alternateText = getQuestionText(item?.question) || item?.text || item?.title || item?.prompt || item?.suggestion || "";
  if (alternateText) {
    return alternateText;
  }

  return item?.question_text === fallbackText ? "" : item?.question_text || "";
}

function getSuggestionPaperType(item, fallback = "") {
  return normalizePaperType(item?.paper_type) || fallback;
}

function getQuestionText(question) {
  if (!question) return "";

  if (typeof question === "string") {
    return question;
  }

  if (typeof question === "object") {
    return (
      question.question_text ||
      question.text ||
      question.question ||
      question.title ||
      ""
    );
  }

  return String(question);
}

const PAPER_TYPE_OPTIONS = ["CQ", "MCQ", "WRITTEN"];

function isSecondarySubject(subject) {
  const academicLevel = String(subject?.academic_level || "").trim().toUpperCase();
  return academicLevel === "SSC" || academicLevel === "HSC";
}

function getPaperTypeOptions(subject, user) {
  if (!isSecondaryAcademicProfile(user) && !isSecondarySubject(subject)) {
    return [];
  }

  const supportedTypes = normalizeSupportedPaperTypes(subject?.supported_paper_types);
  return supportedTypes.length > 0 ? supportedTypes : PAPER_TYPE_OPTIONS;
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

function getSubQuestionLabel(subQuestion, index) {
  if (!subQuestion || typeof subQuestion === "string") {
    return `${index + 1}.`;
  }

  const displayLabel = getOptionalText(subQuestion.display_label);
  if (displayLabel) {
    return displayLabel;
  }

  const questionNo = getOptionalText(subQuestion.question_no);
  const match = questionNo.match(/\(([^()]+)\)/);
  if (match?.[1]) {
    return `(${match[1].trim()})`;
  }

  const label = getOptionalText(subQuestion.label);
  if (label) {
    return `${label}.`;
  }

  return `${index + 1}.`;
}

function getOptionalText(value) {
  return String(value ?? "").trim();
}

function formatStructuredValue(value) {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => Array.isArray(item) ? item.join(" | ") : typeof item === "object" ? JSON.stringify(item) : String(item)).join("\n");
  }

  if (typeof value === "object") {
    const headers = Array.isArray(value.headers) ? value.headers.join(" | ") : "";
    const rows = Array.isArray(value.rows)
      ? value.rows.map((row) => Array.isArray(row) ? row.join(" | ") : typeof row === "object" ? JSON.stringify(row) : String(row)).join("\n")
      : "";
    return [headers, rows].filter(Boolean).join("\n") || JSON.stringify(value, null, 2);
  }

  return String(value);
}

function renderStructuredData(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    const headers = Array.isArray(value.headers) ? value.headers : [];
    const rows = Array.isArray(value.rows) ? value.rows : Array.isArray(value) ? value : [];

    if (headers.length > 0 || rows.length > 0) {
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
          <table className="min-w-full border-collapse text-left text-sm text-slate-700">
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} className="border border-slate-200 px-3 py-2 font-semibold align-top">{String(header)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {(Array.isArray(row) ? row : [row]).map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-slate-200 px-3 py-2 align-top">
                      {typeof cell === "object" ? JSON.stringify(cell) : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{formatStructuredValue(value)}</pre>;
}

function buildQuestionTextForAnswer(item) {
  const parts = [];
  const section = getOptionalText(item?.section);
  const instruction = getOptionalText(item?.instruction);
  const stem = String(item?.stem || "").trim();
  const questionText = String(getRawSuggestionText(item) || "").trim();
  const wordBox = Array.isArray(item?.word_box) ? item.word_box : [];
  const subQuestions = Array.isArray(item?.sub_questions) ? item.sub_questions : [];
  const tableData = formatStructuredValue(item?.table_data).trim();

  if (section) {
    parts.push(`Section: ${section}`);
  }

  if (instruction) {
    parts.push(`Instruction:\n${instruction}`);
  }

  if (stem) {
    parts.push(`Stem:\n${stem}`);
  }

  if (questionText && questionText !== stem) {
    parts.push(questionText);
  }

  if (wordBox.length > 0) {
    parts.push(`Word box: ${wordBox.map(String).join(", ")}`);
  }

  if (subQuestions.length > 0) {
    parts.push(
      subQuestions
        .map((subQuestion, index) => {
          const text = getSubQuestionText(subQuestion);
          const options = Array.isArray(subQuestion?.options) && subQuestion.options.length > 0
            ? `\nOptions: ${subQuestion.options.map(String).join(", ")}`
            : "";
          return `${getSubQuestionLabel(subQuestion, index)} ${text}${options}`;
        })
        .join("\n"),
    );
  }

  if (tableData) {
    parts.push(`Table data:\n${tableData}`);
  }

  return parts.filter(Boolean).join("\n\n").trim();
}

function SuggestionPrompt({ item, paperType }) {
  const resolvedPaperType = getSuggestionPaperType(item, paperType);
  const stem = String(item?.stem || "").trim();
  const questionText = resolvedPaperType === "WRITTEN" ? getRawSuggestionText(item) : getSuggestionText(item);
  const subQuestions = Array.isArray(item?.sub_questions) ? item.sub_questions : [];
  const options = Array.isArray(item?.options) ? item.options : [];
  const wordBox = Array.isArray(item?.word_box) ? item.word_box : [];
  const section = getOptionalText(item?.section);
  const questionType = getOptionalText(item?.question_type);
  const instruction = getOptionalText(item?.instruction);

  return (
    <div className="mt-2 space-y-3">
      {resolvedPaperType === "WRITTEN" && (section || questionType) && (
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          {section && <span className="rounded-full bg-slate-50 px-3 py-1">Section: {section}</span>}
          {questionType && <span className="rounded-full bg-slate-50 px-3 py-1">Type: {questionType}</span>}
        </div>
      )}
      {resolvedPaperType === "WRITTEN" && instruction && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
          <span className="font-semibold text-slate-950">Instruction:</span> {instruction}
        </p>
      )}
      {stem && (
        <div className="text-sm leading-7 text-slate-700 sm:text-base">
          <MathRenderer value={stem} className="prose max-w-none" />
        </div>
      )}
      {questionText && questionText !== stem && (
        <h2 className="text-lg font-bold leading-7 text-slate-950 sm:text-xl">
          <MathRenderer value={questionText} className="prose max-w-none" />
        </h2>
      )}

      <DiagramRenderer question={item} />

      {resolvedPaperType === "WRITTEN" && wordBox.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Word Box</p>
          <div className="flex flex-wrap gap-2">
            {wordBox.map((word, index) => (
              <span key={`${index}-${String(word)}`} className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                {String(word)}
              </span>
            ))}
          </div>
        </div>
      )}
      {(resolvedPaperType === "CQ" || resolvedPaperType === "WRITTEN") && subQuestions.length > 0 && (
        <div className="space-y-2">
          {subQuestions.map((subQuestion, subIndex) => {
            const subQuestionText = getSubQuestionText(subQuestion);
            const marks = getSubQuestionMarks(subQuestion);
            const subOptions = Array.isArray(subQuestion?.options) ? subQuestion.options : [];
            return (
              <div key={`${subIndex}-${subQuestionText}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
                <span className="font-semibold text-slate-950">{getSubQuestionLabel(subQuestion, subIndex)}</span>{" "}
                <MathRenderer value={subQuestionText || "No sub-question text provided."} className="prose max-w-none" />
                {marks !== null && marks !== undefined && marks !== "" && (
                  <span className="text-xs font-semibold text-slate-500">{marks} marks</span>
                )}
                {resolvedPaperType === "WRITTEN" && subOptions.length > 0 && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {subOptions.map((option, optionIndex) => (
                      <div key={`${optionIndex}-${String(option)}`} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700">
                        {String(option)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {resolvedPaperType === "MCQ" && options.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, optionIndex) => (
            <div key={`${optionIndex}-${String(option)}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {String(option)}
            </div>
          ))}
        </div>
      )}
      {resolvedPaperType === "WRITTEN" && item?.table_data && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Table Data</p>
          {renderStructuredData(item.table_data)}
        </div>
      )}
    </div>
  );
}

function getSuggestionMarks(item) {
  return item.marks ?? item.total_marks ?? item.expected_marks ?? "-";
}

function getNumericMarks(item) {
  const rawMarks = Number(getSuggestionMarks(item));
  return Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : null;
}

function getSuggestionScore(item) {
  return item.prediction_score ?? item.importance ?? item.probability_score ?? item.importance_score ?? item.score ?? item.confidence ?? item.probability ?? item.frequency;
}

function getNumericScore(item) {
  const rawScore = Number(getSuggestionScore(item));
  if (!Number.isFinite(rawScore)) {
    return 0;
  }

  return rawScore <= 1 ? rawScore * 100 : rawScore;
}

function SuggestionsPage() {
  const [subjects, setSubjects] = useState([]);
  const { user } = useAuth();
  const location = useLocation();
  const initialSubjectCode = String(location.state?.subject_code || "").trim();
  const [subjectCode, setSubjectCode] = useState("");
  const [selectedPaperType, setSelectedPaperType] = useState("CQ");
  const [query, setQuery] = useState("important questions for final exam");
  const [topK, setTopK] = useState(10);
  const [suggestions, setSuggestions] = useState([]);
  const [warning, setWarning] = useState("");
  const [modeMessage, setModeMessage] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [predictionLevel, setPredictionLevel] = useState("All");
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [missingScope, setMissingScope] = useState(false);
  const [answerStates, setAnswerStates] = useState({});
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const academicProfileSignature = getAcademicProfileSignature(user);

  useEffect(() => {
    async function loadSubjects() {
      setSubjectsLoading(true);

      try {
        const params = buildSubjectScopeParams(user, { status: "active" });
        const response = await apiEndpoints.getSubjects(params);
        const subjectList = normalizeSubjectList(response.data);
        setSubjects(subjectList);

        const nextSubjectCode = initialSubjectCode || subjectList[0]?.subject_code || "";
        if (nextSubjectCode) {
          const nextSubject = subjectList.find((subject) => subject.subject_code === nextSubjectCode) || subjectList[0];
          setSubjectCode(nextSubjectCode);
          setSelectedPaperType(getDefaultPaperType(getPaperTypeOptions(nextSubject, user)) || "CQ");
        }
        setMissingScope(false);
      } catch (error) {
        console.error(error);
        setMissingScope(isMissingStudentScopeError(error));
        setMessage(getErrorMessage(error, "Unable to load published subjects. Enter a subject code manually."));
      } finally {
        setSubjectsLoading(false);
      }
    }

    loadSubjects();
  }, [academicProfileSignature, initialSubjectCode, user]);

  async function loadSuggestionsForPaperType(paperType = selectedPaperType) {
    const cleanSubjectCode = subjectCode.trim();
    const cleanQuery = normalizeSuggestionQuery(query);
    const cleanTopK = normalizeSuggestionTopK(topK, MAX_SUGGESTION_TOP_K, 10);
    const currentSubject = subjects.find((subject) => subject.subject_code === cleanSubjectCode) || null;
    const paperTypeOptions = getPaperTypeOptions(currentSubject, user);
    const resolvedPaperType = paperTypeOptions.length > 0
      ? (paperTypeOptions.includes(paperType) ? paperType : getDefaultPaperType(paperTypeOptions))
      : "";

    if (!cleanSubjectCode) {
      setMessage("Enter a subject code first.");
      return;
    }

    if (!cleanQuery) {
      setMessage("Enter a search query first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setWarning("");
    setModeMessage("");
    setFallbackWarning("");
    setSuggestions([]);
    setAnswerStates({});
    setExpandedAnswers({});

    try {
      const response = await apiEndpoints.getSuggestions({
        subject_code: cleanSubjectCode,
        query: cleanQuery,
        top_k: cleanTopK,
        ...(paperTypeOptions.length > 0 && resolvedPaperType ? { paper_type: resolvedPaperType } : {}),
      });
      const nextSuggestions = normalizeSuggestions(response.data);
      const statusMessage = getSuggestionStatus(response.data);
      setSuggestions(nextSuggestions);
      setMessage(getSuggestionsMessage(response.data, nextSuggestions.length));
      setModeMessage(statusMessage);
      setWarning(response.data?.warning || "");
      setFallbackWarning(response.data?.fallback_warning || "");
      setMissingScope(false);
    } catch (error) {
      console.error(error);
      setMissingScope(isMissingStudentScopeError(error));
      setMessage(getSuggestionErrorMessage(error, "Unable to generate suggestions."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await loadSuggestionsForPaperType(selectedPaperType);
  }

  async function handleGetAnswer(item, index) {
    const cleanSubjectCode = subjectCode.trim();
    const questionText = buildQuestionTextForAnswer(item);
    const suggestionKey = getSuggestionKey(item, index);
    const numericMarks = getNumericMarks(item);

    if (!cleanSubjectCode || !questionText) {
      setAnswerStates((current) => ({
        ...current,
        [suggestionKey]: {
          loading: false,
          error: "Subject code and question text are required.",
          result: null,
        },
      }));
      return;
    }

    setAnswerStates((current) => ({
      ...current,
      [suggestionKey]: {
        ...(current[suggestionKey] || {}),
        loading: true,
        missingScope: false,
        error: "",
      },
    }));

    try {
      const response = await apiEndpoints.generateAnswer({
        question: questionText,
        subject_code: cleanSubjectCode,
        answer_type: getAnswerTypeForMarks(numericMarks),
        marks: numericMarks,
        formula_latex: item.formula_latex || null,
        formula_display: item.formula_display || null,
        math_blocks: Array.isArray(item.math_blocks) ? item.math_blocks : [],
        diagram_required: Boolean(item.diagram_required),
        diagram_reference: item.diagram_reference || null,
        diagram_description: item.diagram_description || null,
      });

      setAnswerStates((current) => ({
        ...current,
        [suggestionKey]: {
          loading: false,
          missingScope: false,
          error: "",
          result: response.data || {},
        },
      }));
    } catch (error) {
      console.error(error);
      const answerMissingScope = isMissingStudentScopeError(error);
      setAnswerStates((current) => ({
        ...current,
        [suggestionKey]: {
          loading: false,
          missingScope: answerMissingScope,
          error: getQuotaErrorMessage(error) || getSuggestionErrorMessage(error, "Unable to generate answer for this suggestion."),
          result: null,
        },
      }));
    }
  }

  const filteredSuggestions = suggestions.filter((item) => {
    if (topicFilter && String(item.topic || item.final_topic || item.suggested_topic || "").toLowerCase().indexOf(topicFilter.toLowerCase()) === -1) {
      return false;
    }

    if (predictionLevel && predictionLevel !== "All") {
      const meta = getScoreMeta(item);
      if ((meta.label || "") !== predictionLevel) {
        return false;
      }
    }

    return true;
  });
  const currentSubject = subjects.find((subject) => subject.subject_code === subjectCode) || null;
  const paperTypeOptions = getPaperTypeOptions(currentSubject, user);
  const showPaperSelector = paperTypeOptions.length > 0;

  function handleSubjectChange(event) {
    const nextSubjectCode = event.target.value;
    const nextSubject = subjects.find((subject) => subject.subject_code === nextSubjectCode);
    setSubjectCode(nextSubjectCode);
    setSelectedPaperType(getDefaultPaperType(getPaperTypeOptions(nextSubject, user)) || "CQ");
    setSuggestions([]);
    setAnswerStates({});
    setExpandedAnswers({});
    setMessage("");
  }

  async function handlePaperTypeChange(nextPaperType) {
    setSelectedPaperType(nextPaperType);
    setMessage("");
  }

  if (subjectsLoading) {
    return <LoadingSpinner label="Loading suggestions..." />;
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Suggestions"
        title="Suggestions"
        description="Important predicted questions for your selected subject."
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-4">
            Query
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={MAX_SUGGESTION_QUERY_LENGTH}
              placeholder="important questions for final exam"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <p className="text-xs text-slate-500">{normalizeSuggestionQuery(query).length}/{MAX_SUGGESTION_QUERY_LENGTH} characters</p>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Subject
            {subjects.length > 0 ? (
              <select value={subjectCode} onChange={handleSubjectChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                {subjects.map((subject) => (
                  <option key={subject.id || subject.subject_code} value={subject.subject_code}>
                    {formatSubjectLabel(subject)}{formatSubjectMeta(subject) ? ` (${formatSubjectMeta(subject)})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} placeholder="Subject code" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            )}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Topic (filter)
            <input value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} placeholder="Filter by topic" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Prediction level
            <select value={predictionLevel} onChange={(e) => setPredictionLevel(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
              <option>All</option>
              <option>Very High</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Number of Suggestions
            <select value={topK} onChange={(e) => setTopK(normalizeSuggestionTopK(Number(e.target.value), MAX_SUGGESTION_TOP_K, 10))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-4">
            {showPaperSelector && (
              <PaperTypeSelector
                availableTypes={paperTypeOptions}
                value={selectedPaperType}
                onChange={handlePaperTypeChange}
                disabled={loading}
                className="w-full sm:w-auto"
              />
            )}
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Loading..." : "Get Suggestions"}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <ErrorMessage tone="info">{message}</ErrorMessage>
          {missingScope && (
            <div className="mt-3">
              <Button as={Link} to="/profile" variant="secondary">
                Go to profile
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="screen-suggestions grid gap-4">
          <ErrorMessage tone="warning">{warning}</ErrorMessage>
          <ErrorMessage tone="warning">{fallbackWarning}</ErrorMessage>
          {modeMessage && suggestions.length > 0 && <ErrorMessage tone="info">{modeMessage}</ErrorMessage>}
          
          {filteredSuggestions.map((item, index) => {
            const scoreMeta = getScoreMeta(item);
            const scoreText = formatSuggestionScore(item.prediction_score);
            const suggestionKey = getSuggestionKey(item, index);
            const answerState = answerStates[suggestionKey] || {};
            const answerResult = answerState.result;
            const answerText = answerResult?.generated_answer || answerResult?.answer || "";
            const cacheStatus = answerResult?.cache_status;

            return (
              <Card as="article" key={suggestionKey}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">Suggestion {item.suggestion_no || index + 1}</p>
                    <SuggestionPrompt item={item} paperType={selectedPaperType} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {getSuggestionPaperType(item, selectedPaperType) && (
                      <Badge tone={getSuggestionPaperType(item, selectedPaperType) === "MCQ" ? "cyan" : getSuggestionPaperType(item, selectedPaperType) === "WRITTEN" ? "green" : "indigo"}>
                        {getSuggestionPaperType(item, selectedPaperType)}
                      </Badge>
                    )}
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreMeta.className}`}>{scoreMeta.label}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                  <span className="rounded-xl bg-slate-100 px-3 py-2">{item.topic || "No topic"}</span>
                  <span className="rounded-xl bg-slate-100 px-3 py-2">
                    Source years: {item.year || item.exam_year || "Unknown"}
                  </span>
                  <span className="rounded-xl bg-slate-100 px-3 py-2">Marks: {getSuggestionMarks(item)}</span>
                  <Badge tone="indigo" className="justify-center rounded-xl py-2">Importance: {scoreText}</Badge>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Based on previous-year question patterns, topic frequency, marks, recency, and semantic relevance.
                </p>
                <QuestionExtras item={item} />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="dark"
                    onClick={() => handleGetAnswer(item, index)}
                    disabled={answerState.loading}
                  >
                    {answerState.loading ? "Loading answer..." : "Get Answer"}
                  </Button>
                  {cacheStatus && (
                    <Badge tone={cacheStatus === "hit" ? "green" : "indigo"}>
                      Cache {cacheStatus === "hit" ? "hit" : "miss"}
                    </Badge>
                  )}
                </div>

                {answerState.error && (
                  <div className="mt-3">
                    <ErrorMessage tone="error">{answerState.error}</ErrorMessage>
                    {answerState.missingScope && (
                      <div className="mt-3">
                        <Button as={Link} to="/profile" variant="secondary" size="sm">
                          Go to profile
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {answerText && (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-950">Generated answer</h3>
                      <div className="flex items-center gap-2">
                        {answerResult?.answer_type && <Badge tone="indigo">{String(answerResult.answer_type).replace("_", " ")}</Badge>}
                      </div>
                    </div>

                    <div className="mt-3 overflow-x-auto break-words rounded-2xl bg-white/80 px-4 py-3 text-slate-700 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2 [&_.katex]:text-[1.04em]">
                      <div className="flex items-start justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(answerText);
                              setAnswerStates((current) => ({
                                ...current,
                                [suggestionKey]: { ...(current[suggestionKey] || {}), copied: true },
                              }));
                              setTimeout(() => {
                                setAnswerStates((current) => ({
                                  ...current,
                                  [suggestionKey]: { ...(current[suggestionKey] || {}), copied: false },
                                }));
                              }, 1500);
                            } catch {
                              // ignore
                            }
                          }}
                        >
                          {answerState.copied ? "Copied" : "Copy Answer"}
                        </Button>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setExpandedAnswers((current) => ({
                              ...current,
                              [suggestionKey]: !current[suggestionKey],
                            }));
                          }}
                        >
                          {expandedAnswers[suggestionKey] ? "Collapse Answer" : "View Full Answer"}
                        </Button>
                      </div>

                      <div className="rounded-2xl bg-white/80 px-4 py-3 text-slate-700 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2 [&_.katex]:text-[1.04em]">
                        <div
                          className={expandedAnswers[suggestionKey] ? "" : "[&>*:nth-child(n+5)]:hidden"}
                          style={expandedAnswers[suggestionKey] ? undefined : { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden" }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
                            components={markdownComponents}
                          >
                            {answerText}
                          </ReactMarkdown>
                        </div>
                        {!expandedAnswers[suggestionKey] && (
                          <p className="mt-3 text-xs font-medium text-slate-500">Preview only. Tap View Full Answer to expand.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {item.reason && (
                  <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">Reason:</span> {item.reason}
                  </p>
                )}
              </Card>
            );
          })}

          {suggestions.length === 0 && !loading && (
            <EmptyState
              title={selectedPaperType ? `No ${selectedPaperType} suggestions found for this subject.` : "No suggestions found"}
              description="Try changing the subject, topic, prediction level, or query."
            />
          )}
      </div>
    </ResponsiveContainer>
  );
}

export default SuggestionsPage;

// suggestions page