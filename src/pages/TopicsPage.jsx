import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { apiEndpoints } from "../api/api";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorMessage, LoadingSpinner, PageHeader, QuestionExtras, ResponsiveContainer } from "../components/ui";

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

function getAnalysisMessage(payload, fallback) {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.pending_review_count > 0) {
    return `No approved topics yet. ${payload.pending_review_count} topic review item(s) are pending approval.`;
  }

  return fallback;
}

function formatAppearedYears(value) {
  const rawValue = Array.isArray(value) ? value.join(", ") : String(value ?? "").trim();

  if (!rawValue) {
    return "N/A";
  }

  const compactDigits = rawValue.replace(/\s+/g, "");
  if (/^\d+$/.test(compactDigits) && compactDigits.length > 4 && compactDigits.length % 4 === 0) {
    return compactDigits.match(/.{1,4}/g).join(", ");
  }

  return rawValue
    .split(/[,|/]+/)
    .map((year) => year.trim())
    .filter(Boolean)
    .join(", ");
}

function TopicsPage() {
  const [subjects, setSubjects] = useState([]);
  const { user } = useAuth();
  const location = useLocation();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const initialSubjectCode = String(location.state?.subject_code || "").trim();

  async function loadAnalysisData(subjectCode) {
    return apiEndpoints.getSubjectAnalysis(subjectCode);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const params = { status: "published" };
        if (user?.university_id) params.university_id = user.university_id;
        if (user?.department_id) params.department_id = user.department_id;
        const response = await apiEndpoints.getSubjects(params);

        if (!active) {
          return;
        }

        const subjectList = normalizeSubjects(response.data);
        setSubjects(subjectList);

        const subjectCode = initialSubjectCode || subjectList[0]?.subject_code || "";

        if (!subjectCode) {
          setMessage("Subject list is unavailable. Enter a subject code manually to load analysis.");
          return;
        }

        setSelectedSubject(subjectCode);

        try {
          const analysisResponse = await loadAnalysisData(subjectCode);
          if (active) {
            setAnalysis(analysisResponse.data);
            setMessage(extractTopics(analysisResponse.data).length === 0 ? getAnalysisMessage(analysisResponse.data, "") : "");
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
      const response = await loadAnalysisData(subjectCode);
      setAnalysis(response.data);
      setMessage(extractTopics(response.data).length === 0 ? getAnalysisMessage(response.data, "") : "");
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
      const response = await loadAnalysisData(selectedSubject.trim());
      setAnalysis(response.data);
      setMessage(extractTopics(response.data).length === 0 ? getAnalysisMessage(response.data, "") : "");
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
    return <LoadingSpinner label="Loading analysis..." />;
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Subject analysis"
        title="Understand repeated topics and exam patterns"
        description="View frequency, marks, appeared years, and sample questions for one subject."
        actions={<Button onClick={() => navigate("/predict", { state: { subject_code: selectedSubject } })}>View predictions</Button>}
      />

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Choose a subject</h2>
              <p className="mt-1 text-sm text-slate-500">Select a subject code to load the analysis response.</p>
            </div>

            <div className="w-full lg:max-w-md">
              <label className="block text-sm font-medium text-slate-700">Subject code</label>
              {subjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              )}
              <Button type="button" onClick={handleLoadAnalysis} className="mt-3 w-full">
                Load analysis
              </Button>
            </div>
          </div>
        </Card>

        <ErrorMessage>{message}</ErrorMessage>

        {analysis ? (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Topic frequency</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Most repeated topics</h2>
                </div>
                <Badge>{selectedSubject}</Badge>
              </div>

              <div className="mt-5 space-y-3">
                {topicEntries.length > 0 ? (
                  topicEntries.map((topic, index) => (
                    <article key={topic.topic || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="break-words font-semibold text-slate-950">{topic.topic || topic.name || `Topic ${index + 1}`}</h3>
                        <Badge tone="indigo">{topic.frequency ?? topic.count ?? topic.score ?? "-"}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Appeared years: {formatAppearedYears(topic.appeared_years ?? topic.years)}
                      </p>
                      <p className="text-sm text-slate-600">Total marks: {topic.total_marks ?? topic.marks ?? "N/A"}</p>
                      {topic.probability && <p className="text-sm text-slate-600">Probability: {topic.probability}</p>}
                      {Array.isArray(topic.important_questions) && topic.important_questions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-semibold text-slate-900">Important questions</p>
                          {topic.important_questions.slice(0, 3).map((question, questionIndex) => (
                            <div key={question.id || questionIndex} className="rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                              <p className="whitespace-pre-line break-words">{question.question_text || question.text || question.question || question}</p>
                              <QuestionExtras item={question} />
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <EmptyState title="No topic summary returned" description="This subject may need approved topic analysis before a frequency summary is available." />
                )}
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Analysis snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Subject summary</h2>
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
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pending review</p>
                  <p className="mt-1 font-semibold text-slate-950">{analysis.pending_review_count ?? 0}</p>
                </div>
              </div>

              {analysis.message && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {analysis.message}
                </p>
              )}

              {Array.isArray(analysis.sample_questions) && analysis.sample_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Sample questions</h3>
                  <div className="mt-3 space-y-2">
                    {analysis.sample_questions.map((question, index) => (
                      <div key={index} className="break-words rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                        {question.question_text || question.text || question}
                        <QuestionExtras item={question} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <EmptyState title="No analysis data available yet" description="Choose a subject and load analysis to review repeated topics." />
        )}
    </ResponsiveContainer>
  );
}

export default TopicsPage;
