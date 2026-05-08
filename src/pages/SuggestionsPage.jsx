import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, ResponsiveContainer } from "../components/ui";

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
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || fallback;
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

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

async function getBlobErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed.detail || parsed.message || fallback;
    } catch {
      return fallback;
    }
  }

  return getErrorMessage(error, fallback);
}

function SuggestionsPage() {
  const [subjects, setSubjects] = useState([]);
  const [subjectCode, setSubjectCode] = useState("");
  const [query, setQuery] = useState("important questions for final exam");
  const [topK, setTopK] = useState(10);
  const [suggestions, setSuggestions] = useState([]);
  const [warning, setWarning] = useState("");
  const [modeMessage, setModeMessage] = useState("");
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      try {
        const response = await apiEndpoints.getSubjects({ status: "published" });
        const subjectList = normalizeSubjects(response.data);
        setSubjects(subjectList);

        if (subjectList.length > 0) {
          setSubjectCode(subjectList[0].subject_code);
        }
      } catch (error) {
        console.error(error);
        setMessage("Unable to load published subjects. Enter a subject code manually.");
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

    try {
      const response = await apiEndpoints.getSuggestions({
        subject_code: subjectCode.trim(),
        query: query.trim() || "important questions for final exam",
        top_k: Number(topK) || 10,
      });
      const nextSuggestions = normalizeSuggestions(response.data);
      const statusMessage = getSuggestionStatus(response.data);
      setSuggestions(nextSuggestions);
      setMessage(getSuggestionsMessage(response.data, nextSuggestions.length));
      setModeMessage(statusMessage);
      setWarning(response.data?.warning || "");
      setFallbackWarning("");
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error, "Unable to generate suggestions."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(format) {
    if (!subjectCode.trim()) {
      setMessage("Select a subject before downloading an export.");
      return;
    }

    setExportLoading(format);
    setMessage("");

    try {
      const cleanSubjectCode = subjectCode.trim();
      const payload = {
        subject_code: cleanSubjectCode,
        query: query.trim() || "important questions for final exam",
        top_k: Number(topK) || 10,
      };
      const response =
        format === "json"
          ? await apiEndpoints.exportSuggestionsJson(payload)
          : await apiEndpoints.exportSuggestionsPdf(payload);

      downloadBlob(response.data, `fakibuzz_suggestions_${cleanSubjectCode}.${format}`);
      setMessage(`${format.toUpperCase()} download started.`);
    } catch (error) {
      console.error(error);
      setMessage(await getBlobErrorMessage(error, `Failed to export suggestions ${format.toUpperCase()}.`));
    } finally {
      setExportLoading("");
    }
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Suggestions"
        title="Generate exam question suggestions"
        description="Create focused suggestions with Bangla, English, or mixed-language queries, then export the result."
      />

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_1.25fr_120px]">
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
            Query
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="important questions for final exam" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Count
            <input type="number" min="1" max="50" value={topK} onChange={(event) => setTopK(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row lg:col-span-3">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Loading..." : "Get Suggestions"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleDownload("json")} disabled={loading || Boolean(exportLoading) || !subjectCode.trim()} className="w-full sm:w-auto">
              {exportLoading === "json" ? "Preparing..." : "Download JSON"}
            </Button>
            <Button type="button" variant="dark" onClick={() => handleDownload("pdf")} disabled={loading || Boolean(exportLoading) || !subjectCode.trim()} className="w-full sm:w-auto">
              {exportLoading === "pdf" ? "Preparing..." : "Download PDF"}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <ErrorMessage tone="info">{message}</ErrorMessage>
        </div>
      </Card>

      <div className="grid gap-4">
          <ErrorMessage tone="warning">{warning}</ErrorMessage>
          <ErrorMessage tone="warning">{fallbackWarning}</ErrorMessage>
          {modeMessage && suggestions.length > 0 && <ErrorMessage tone="info">{modeMessage}</ErrorMessage>}

          {suggestions.map((item, index) => {
            const scoreMeta = getScoreMeta(item);
            const scoreText = `${scoreMeta.score.toFixed(1)}%`;

            return (
              <Card as="article" key={item.id || `${item.question_no || "suggestion"}-${index}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">Suggestion {item.suggestion_no || index + 1}</p>
                    <h2 className="mt-2 whitespace-pre-line break-words text-lg font-bold leading-7 text-slate-950 sm:text-xl">{getSuggestionText(item)}</h2>
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
