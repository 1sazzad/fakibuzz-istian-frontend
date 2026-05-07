import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";
import { useNavigate } from "react-router-dom";

function normalizeSubjects(payload) {
  const rawSubjects = Array.isArray(payload) ? payload : payload?.subjects || payload?.items || payload?.data || [];

  return rawSubjects
    .map((subject) => ({
      subject_code: String(subject?.subject_code ?? subject?.code ?? subject?.subjectCode ?? "").trim(),
      subject_name: String(subject?.subject_name ?? subject?.name ?? subject?.subjectName ?? "").trim(),
    }))
    .filter((subject) => Boolean(subject.subject_code));
}

function extractTopics(analysis) {
  return analysis?.topics || analysis?.analysis || analysis?.repeated_topics || [];
}

function TopicsPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await apiEndpoints.getSubjects();

        if (!active) {
          return;
        }

        const subjectList = normalizeSubjects(response.data);
        setSubjects(subjectList);

        if (subjectList.length === 0) {
          setMessage("Subject list is unavailable. Enter a subject code manually to load analysis.");
          return;
        }

        const subjectCode = subjectList[0].subject_code;
        setSelectedSubject(subjectCode);

        try {
          const analysisResponse = await apiEndpoints.getSubjectAnalysis(subjectCode);
          if (active) {
            setAnalysis(analysisResponse.data);
          }
        } catch (error) {
          console.error(error);
          if (active) {
            setAnalysis(null);
            setMessage(error.response?.data?.detail || "Subjects loaded, but analysis data could not be loaded for the selected subject.");
          }
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setSubjects([]);
          setMessage("Subject list could not be loaded. Enter a subject code manually.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubjectChange(event) {
    const subjectCode = event.target.value;
    setSelectedSubject(subjectCode);

    if (!subjectCode) {
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await apiEndpoints.getSubjectAnalysis(subjectCode);
      setAnalysis(response.data);
    } catch (error) {
      console.error(error);
      setAnalysis(null);
      setMessage(error.response?.data?.detail || "Unable to load analysis for this subject.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubjectInputChange(event) {
    setSelectedSubject(event.target.value);
    setMessage("");
  }

  async function handleLoadAnalysis() {
    if (!selectedSubject.trim()) {
      setMessage("Enter a subject code first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await apiEndpoints.getSubjectAnalysis(selectedSubject.trim());
      setAnalysis(response.data);
    } catch (error) {
      console.error(error);
      setAnalysis(null);
      setMessage(error.response?.data?.detail || "Unable to load analysis for this subject.");
    } finally {
      setLoading(false);
    }
  }

  const topicEntries = extractTopics(analysis);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading analysis...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Subject analysis</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Understand repeated topics and exam patterns</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                View frequency, marks, appeared years, and sample questions for one subject.
              </p>
            </div>

            <button
              onClick={() => navigate("/predict")}
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              View predictions
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Choose a subject</h2>
              <p className="mt-1 text-sm text-slate-500">Select a subject code to load the analysis response.</p>
            </div>

            <div className="min-w-72">
              <label className="block text-sm font-medium text-slate-700">Subject code</label>
              {subjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_code} value={subject.subject_code}>
                      {subject.subject_code} - {subject.subject_name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={selectedSubject}
                  onChange={handleSubjectInputChange}
                  placeholder="Enter subject code, e.g. CSE-421"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                />
              )}
              <button
                type="button"
                onClick={handleLoadAnalysis}
                className="mt-3 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Load analysis
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </div>
        )}

        {analysis ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Topic frequency</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Most repeated topics</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{selectedSubject}</div>
              </div>

              <div className="mt-5 space-y-3">
                {topicEntries.length > 0 ? (
                  topicEntries.map((topic, index) => (
                    <article key={topic.topic || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-slate-950">{topic.topic || topic.name || `Topic ${index + 1}`}</h3>
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800">
                          {topic.frequency ?? topic.count ?? topic.score ?? "-"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Appeared years: {Array.isArray(topic.appeared_years) ? topic.appeared_years.join(", ") : topic.appeared_years || topic.years || "N/A"}
                      </p>
                      <p className="text-sm text-slate-600">Total marks: {topic.total_marks ?? topic.marks ?? "N/A"}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
                    No topic summary returned for this subject.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Analysis snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">What the backend returned</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subject code</p>
                  <p className="mt-1 font-semibold text-slate-950">{analysis.subject_code || selectedSubject}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subject name</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {analysis.subject_name || subjects.find((subject) => subject.subject_code === selectedSubject)?.subject_name || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total questions</p>
                  <p className="mt-1 font-semibold text-slate-950">{analysis.total_questions ?? analysis.question_count ?? "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Repeated topics</p>
                  <p className="mt-1 font-semibold text-slate-950">{topicEntries.length}</p>
                </div>
              </div>

              {Array.isArray(analysis.sample_questions) && analysis.sample_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Sample questions</h3>
                  <div className="mt-3 space-y-2">
                    {analysis.sample_questions.map((question, index) => (
                      <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {question.question_text || question.text || question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            No analysis data available yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicsPage;
