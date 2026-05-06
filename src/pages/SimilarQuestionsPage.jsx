import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";
import { useNavigate } from "react-router-dom";

function normalizeResults(payload) {
  return payload?.results || payload?.matches || payload?.questions || payload?.data || [];
}

function SimilarQuestionsPage() {
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState("Explain SEO");
  const [subjectCode, setSubjectCode] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [message, setMessage] = useState("Run a search to see similar questions from the database.");

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    apiEndpoints.getSubjects()
      .then((response) => {
        if (!active) {
          return;
        }

        const subjectList = response.data?.subjects || [];
        setSubjects(subjectList);
        if (subjectList.length > 0) {
          setSubjectCode(subjectList[0].subject_code);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (active) {
          setBooting(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function fetchSimilarQuestions(event) {
    event.preventDefault();

    if (!query.trim()) {
      setMessage("Enter a query before searching.");
      return;
    }

    try {
      setLoading(true);
      setMessage("Searching semantic matches...");

      const response = await apiEndpoints.searchQuestions({
        query: query.trim(),
        subject_code: subjectCode || undefined,
        top_k: Number(topK),
      });

      const nextResults = normalizeResults(response.data);
      setResults(nextResults);
      setMessage(`Found ${nextResults.length} similar question(s).`);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Search failed. Check the backend and embeddings.");
    } finally {
      setLoading(false);
    }
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading search workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Semantic search</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Find similar questions from the vector store</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Search stored question embeddings with a natural-language query.
              </p>
            </div>

            <button
              onClick={() => navigate("/analysis")}
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              View analysis
            </button>
          </div>
        </section>

        <form onSubmit={fetchSimilarQuestions} className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
            Search query
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              placeholder="Explain SEO"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Subject code
            <select
              value={subjectCode}
              onChange={(event) => setSubjectCode(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.subject_code} value={subject.subject_code}>
                  {subject.subject_code} - {subject.subject_name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Top K
            <input
              type="number"
              min="1"
              max="20"
              value={topK}
              onChange={(event) => setTopK(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Searching..." : "Search similar questions"}
            </button>
            <span className="text-sm text-slate-500">{message}</span>
          </div>
        </form>

        <div className="grid gap-4">
          {results.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              No similar questions yet. Run a search to populate results.
            </div>
          ) : (
            results.map((result, index) => (
              <article key={result.id || index} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Result {index + 1}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      {result.question_text || result.question || result.main_question || "Similar question"}
                    </h2>
                  </div>
                  <div className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                    {result.score ?? result.similarity ?? result.confidence ?? result.distance ?? "Match"}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  {result.subject_code && <span className="rounded-2xl bg-slate-100 px-3 py-2">{result.subject_code}</span>}
                  {result.question_no && <span className="rounded-2xl bg-slate-100 px-3 py-2">{result.question_no}</span>}
                  {result.topic && <span className="rounded-2xl bg-cyan-50 px-3 py-2 text-cyan-800">{result.topic}</span>}
                  {result.exam_year && <span className="rounded-2xl bg-slate-100 px-3 py-2">{result.exam_year}</span>}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SimilarQuestionsPage;
