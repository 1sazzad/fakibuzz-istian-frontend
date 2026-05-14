import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { apiEndpoints } from "../api/api";
import MathRenderer from "../components/MathRenderer";
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, QuestionExtras, ResponsiveContainer } from "../components/ui";
import { MISSING_STUDENT_SCOPE_MESSAGE, isMissingStudentScopeError } from "../utils/auth";

const MARK_TO_ANSWER_TYPE = [
  { max: 2, type: "2_mark" },
  { max: 5, type: "5_mark" },
  { max: 10, type: "10_mark" },
];

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

function normalizeSubjects(payload) {
  const rawSubjects = Array.isArray(payload) ? payload : payload?.subjects || payload?.items || payload?.data || [];

  return rawSubjects
    .map((subject) => ({
      subject_code: String(subject?.subject_code ?? subject?.code ?? "").trim(),
      subject_name: String(subject?.subject_name ?? subject?.name ?? "").trim(),
    }))
    .filter((subject) => subject.subject_code);
}

function normalizeSuggestions(payload) {
  const seen = new Set();

  function splitSuggestionText(text) {
    return String(text)
      .split(/\n+/)
      .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter(Boolean)
      .map((question) => ({ question }));
  }

  function collect(value, parentTopic = "") {
    if (!value) {
      return [];
    }

    if (typeof value === "string") {
      return splitSuggestionText(value).map((item) => ({ ...item, topic: parentTopic || item.topic }));
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => collect(item, parentTopic));
    }

    if (typeof value !== "object") {
      return [];
    }

    if (seen.has(value)) {
      return [];
    }
    seen.add(value);

    const topic = value.topic || value.final_topic || value.suggested_topic || parentTopic;
    const questionText =
      value.question ||
      value.question_text ||
      value.text ||
      value.title ||
      value.prompt ||
      value.suggestion;

    const directItems = questionText ? [{ ...value, question: questionText, topic }] : [];
    const nestedItems = [
      value.probable_questions,
      value.suggestions,
      value.suggested_questions,
      value.important_questions,
      value.questions,
      value.items,
      value.results,
      value.data,
    ].flatMap((item) => collect(item, topic));

    return [...directItems, ...nestedItems];
  }

  return collect(payload)
    .filter((item, index, list) => {
      const key = `${getSuggestionText(item)}-${item.topic || ""}`;
      return key.trim() && list.findIndex((candidate) => `${getSuggestionText(candidate)}-${candidate.topic || ""}` === key) === index;
    })
    .sort((first, second) => getNumericScore(second) - getNumericScore(first));
}

function getErrorMessage(error, fallback) {
  if (isMissingStudentScopeError(error)) {
    return MISSING_STUDENT_SCOPE_MESSAGE;
  }

  const detail = error.response?.data?.detail || error.response?.data?.message;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return typeof detail === "string" ? detail : error.message || fallback;
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

function getSuggestionsMessage(payload, count) {
  if (payload?.message) {
    return payload.message;
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

function getSuggestionText(item) {
  return item.question || item.question_text || item.text || item.title || item.prompt || item.suggestion || "Suggested question";
}

function getSuggestionMarks(item) {
  return item.marks ?? item.total_marks ?? item.expected_marks ?? "-";
}

function getNumericMarks(item) {
  const rawMarks = Number(getSuggestionMarks(item));
  return Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : null;
}

function getAnswerTypeForMarks(marks) {
  if (!marks) {
    return "5_mark";
  }

  const match = MARK_TO_ANSWER_TYPE.find((item) => marks <= item.max);
  return match?.type || "15_mark";
}

function getSuggestionScore(item) {
  return item.importance ?? item.probability_score ?? item.prediction_score ?? item.importance_score ?? item.score ?? item.confidence ?? item.probability ?? item.frequency;
}

function getNumericScore(item) {
  const rawScore = Number(getSuggestionScore(item));
  if (!Number.isFinite(rawScore)) {
    return 0;
  }

  return rawScore <= 1 ? rawScore * 100 : rawScore;
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

function getSuggestionKey(item, index) {
  return String(item.id || item.question_id || `${item.question_no || "suggestion"}-${index}`);
}

function SuggestionsPage() {
  const [subjects, setSubjects] = useState([]);
  const { user } = useAuth();
  const [subjectCode, setSubjectCode] = useState("");
  const [query, setQuery] = useState("important questions for final exam");
  const [topK, setTopK] = useState(10);
  const [suggestions, setSuggestions] = useState([]);
  const [warning, setWarning] = useState("");
  const [modeMessage, setModeMessage] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [predictionLevel, setPredictionLevel] = useState("All");
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [missingScope, setMissingScope] = useState(false);
  const [answerStates, setAnswerStates] = useState({});
  const [expandedAnswers, setExpandedAnswers] = useState({});

  useEffect(() => {
    async function loadSubjects() {
      try {
        const params = { status: "active" };
        if (user?.university_id) params.university_id = user.university_id;
        if (user?.department_id) params.department_id = user.department_id;
        const response = await apiEndpoints.getSubjects(params);
        const subjectList = normalizeSubjects(response.data);
        setSubjects(subjectList);

        if (subjectList.length > 0) {
          setSubjectCode(subjectList[0].subject_code);
        }
        setMissingScope(false);
      } catch (error) {
        console.error(error);
        setMissingScope(isMissingStudentScopeError(error));
        setMessage(getErrorMessage(error, "Unable to load published subjects. Enter a subject code manually."));
      }
    }

    loadSubjects();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!subjectCode.trim()) {
      setMessage("Enter a subject code first.");
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
      const cleanSubjectCode = subjectCode.trim();
      const cleanQuery = query.trim() || "important questions for final exam";
      const cleanTopK = Number(topK) || 10;
      const response = await apiEndpoints.getSuggestions({
        subject_code: cleanSubjectCode,
        query: cleanQuery,
        top_k: cleanTopK,
      });
      const nextSuggestions = normalizeSuggestions(response.data);
      const statusMessage = getSuggestionStatus(response.data);
      setSuggestions(nextSuggestions);
      setMessage(getSuggestionsMessage(response.data, nextSuggestions.length));
      setModeMessage(statusMessage);
      setWarning(response.data?.warning || "");
      setFallbackWarning("");
      setMissingScope(false);
    } catch (error) {
      console.error(error);
      setMissingScope(isMissingStudentScopeError(error));
      setMessage(getErrorMessage(error, "Unable to generate suggestions."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAnswer(item, index) {
    const cleanSubjectCode = subjectCode.trim();
    const questionText = getSuggestionText(item).trim();
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
          error: getQuotaErrorMessage(error) || getErrorMessage(error, "Unable to generate answer for this suggestion."),
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

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Suggestions"
        title="Suggestions"
        description="Important predicted questions for your selected subject."
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Subject
            {subjects.length > 0 ? (
              <select value={subjectCode} onChange={(event) => setSubjectCode(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
                {subjects.map((subject) => (
                  <option key={subject.subject_code} value={subject.subject_code}>
                    {subject.subject_code} - {subject.subject_name}
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
            <select value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-4">
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
            const scoreText = `${scoreMeta.score.toFixed(1)}%`;
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
                    <h2 className="mt-2 text-lg font-bold leading-7 text-slate-950 sm:text-xl">
                      <MathRenderer value={getSuggestionText(item)} className="prose max-w-none" />
                    </h2>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreMeta.className}`}>{scoreMeta.label}</span>
                </div>

                <div className="mt-4 grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                  <span className="rounded-xl bg-slate-100 px-3 py-2">{item.topic || item.final_topic || item.suggested_topic || "No topic"}</span>
                  <span className="rounded-xl bg-slate-100 px-3 py-2">
                    Source years: {Array.isArray(item.source_years) && item.source_years.length > 0 ? item.source_years.join(", ") : item.exam_year || "Unknown"}
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
                            } catch (e) {
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
              title="No suggestions found"
              description="Check that the subject has published questions and approved topics, then try a broader query."
            />
          )}
      </div>
    </ResponsiveContainer>
  );
}

export default SuggestionsPage;
