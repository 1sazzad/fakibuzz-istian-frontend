import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiEndpoints } from "../api/api";
import { Badge, Button, Card, EmptyState, LoadingSpinner, PageHeader, QuestionExtras, ResponsiveContainer } from "../components/ui";

function normalizeQuestions(payload) {
  const items = payload?.questions || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : [];
}

function normalizeTopics(payload) {
  return payload?.top_topics || payload?.topics || [];
}

function QuestionsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [overview, setOverview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [booting, setBooting] = useState(true);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("Search for a subject code or pick one from the list to load published data.");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await apiEndpoints.getSubjects({ status: "published" });

        if (!active) {
          return;
        }

        const subjectList = response.data?.subjects || [];
        setSubjects(subjectList);

        if (subjectList.length > 0) {
          const firstSubjectCode = subjectList[0].subject_code;
          setSelectedSubject(firstSubjectCode);
          await loadSubjectData(firstSubjectCode);
        } else {
          setMessage("No published subjects are available yet.");
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setMessage("Unable to load published subjects right now.");
        }
      } finally {
        if (active) {
          setBooting(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  async function loadSubjectData(subjectCode) {
    if (!subjectCode) {
      setOverview(null);
      setQuestions([]);
      return;
    }

    setLoadingSubject(true);

    try {
      const [overviewResponse, questionsResponse] = await Promise.all([
        apiEndpoints.getSubjectOverview(subjectCode),
        apiEndpoints.getSubjectQuestions(subjectCode),
      ]);

      setOverview(overviewResponse.data || null);
      setQuestions(normalizeQuestions(questionsResponse.data));
      setMessage(`Loaded published data for ${subjectCode}.`);
    } catch (error) {
      console.error(error);
      setOverview(null);
      setQuestions([]);
      setMessage(error.response?.data?.detail || "Unable to load subject data right now.");
    } finally {
      setLoadingSubject(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (!searchQuery.trim()) {
      setMessage("Enter a subject code or subject name to search.");
      return;
    }

    setSearching(true);

    try {
      const response = await apiEndpoints.searchSubject(searchQuery.trim());
      const data = response.data || {};
      setSearchResult(data);

      if (data.found && data.subject_code) {
        setSelectedSubject(data.subject_code);
        await loadSubjectData(data.subject_code);
      } else {
        setOverview(null);
        setQuestions([]);
        setMessage(data.message || `No published subject found for "${searchQuery.trim()}".`);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Subject search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubjectChange(event) {
    const subjectCode = event.target.value;
    setSelectedSubject(subjectCode);

    if (!subjectCode) {
      setSearchResult(null);
      setOverview(null);
      setQuestions([]);
      setMessage("Pick a subject to view its overview and published questions.");
      return;
    }

    setSearchResult(null);
    await loadSubjectData(subjectCode);
  }

  const topicEntries = normalizeTopics(overview);
  const availableYears = overview?.available_years || [];

  if (booting) {
    return <LoadingSpinner label="Loading subjects..." />;
  }

  return (
    <ResponsiveContainer>
        <PageHeader
          eyebrow="Subject discovery"
          title="Find published data by subject code or name"
          description="Search subjects first, then browse previous-year questions, topic summaries, and prediction availability."
          actions={
            <>
              <Button type="button" onClick={() => navigate("/search")}>Semantic search</Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/analysis")}>View analysis</Button>
            </>
          }
        />

        <Card as="form" onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
            Search subject
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="CSE-421 or E-Commerce and Web Engineering"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Browse published subjects
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.subject_code} value={subject.subject_code}>
                  {subject.subject_code} - {subject.subject_name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Button type="submit" disabled={searching}>
              {searching ? "Searching..." : "Search subject"}
            </Button>
            <span className="text-sm text-slate-500">{message}</span>
          </div>
        </Card>

        {searchResult && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Search result</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {searchResult.subject_code || "Subject lookup"}
                </h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${searchResult.found ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
                {searchResult.found ? "Published" : "Not found"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subject name</p>
                <p className="mt-1 font-semibold text-slate-950">{searchResult.subject_name || "N/A"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total questions</p>
                <p className="mt-1 font-semibold text-slate-950">{searchResult.total_questions ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Can upload</p>
                <p className="mt-1 font-semibold text-slate-950">{searchResult.can_upload ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Available years</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {Array.isArray(searchResult.available_years) && searchResult.available_years.length > 0
                    ? searchResult.available_years.join(", ")
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {overview ? (
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Overview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {overview.subject_code || selectedSubject}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {overview.subject_name || subjects.find((subject) => subject.subject_code === selectedSubject)?.subject_name || "Published subject"}
                  </p>
                </div>
                <Badge>
                  Prediction {overview.prediction_available ? "available" : "not ready"}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Questions</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{overview.total_questions ?? questions.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Years</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {availableYears.length > 0 ? availableYears.join(", ") : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Topics</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{topicEntries.length}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {topicEntries.length > 0 ? (
                  topicEntries.slice(0, 6).map((topic, index) => (
                    <Badge key={topic.topic || topic.name || index} tone="indigo">
                      {topic.topic || topic.name || topic}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No topic summary returned.</span>
                )}
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Next steps</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Use the subject in other workflows</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/search")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <p className="text-sm font-semibold text-slate-950">Semantic search</p>
                  <p className="mt-1 text-sm text-slate-500">Find similar published questions.</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/analysis")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <p className="text-sm font-semibold text-slate-950">Topic analysis</p>
                  <p className="mt-1 text-sm text-slate-500">Review repeated topics and marks.</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/predict")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <p className="text-sm font-semibold text-slate-950">Predictions</p>
                  <p className="mt-1 text-sm text-slate-500">See likely exam topics.</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/answers")}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <p className="text-sm font-semibold text-slate-950">Answer help</p>
                  <p className="mt-1 text-sm text-slate-500">Draft an exam-style answer.</p>
                </button>
              </div>
            </Card>
          </div>
        ) : (
          <EmptyState title="No published subject data loaded yet" description="Search for a subject code or choose one from the list to load details." />
        )}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Published questions</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Questions for the selected subject</h2>
            </div>
            <Badge>
              {loadingSubject ? "Refreshing..." : `${questions.length} loaded`}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4">
            {questions.length === 0 ? (
              <EmptyState title="No published questions" description="This subject is published, but no question records were returned." />
            ) : (
              questions.map((question, index) => (
                <article key={question.id || `${question.question_no || index}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                        {question.subject_code || selectedSubject || "Published subject"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">
                        {question.question_no ? `Question ${question.question_no}` : `Question ${index + 1}`}
                      </h3>
                    </div>
                    <Badge>
                      {question.marks ?? "-"} marks
                    </Badge>
                  </div>

                  <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-slate-700 sm:text-base">
                    {question.question_text || question.text || "No question text provided."}
                  </p>
                  <QuestionExtras item={question} />

                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                    {question.exam_name && <span className="rounded-full bg-white px-3 py-1">{question.exam_name}</span>}
                    {question.exam_year && <span className="rounded-full bg-white px-3 py-1">{question.exam_year}</span>}
                    {question.topic && <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{question.topic}</span>}
                  </div>
                </article>
              ))
            )}
          </div>
        </Card>
    </ResponsiveContainer>
  );
}

export default QuestionsPage;
