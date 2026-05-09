import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";
import { useNavigate } from "react-router-dom";
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

function normalizePredictions(payload) {
  const items = payload?.predictions || payload?.questions || payload?.items || payload?.suggestions || payload?.data || [];
  return Array.isArray(items) ? items : [];
}

function getPredictionMessage(payload, fallback) {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.pending_review_count > 0) {
    return `No approved topics yet. ${payload.pending_review_count} topic review item(s) are pending approval.`;
  }

  return fallback;
}

function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function loadPredictionData(subjectCode) {
    return apiEndpoints.getSubjectPrediction(subjectCode);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await apiEndpoints.getSubjects({ status: "published" });

        if (!active) {
          return;
        }

        const subjectList = normalizeSubjects(response.data);
        setSubjects(subjectList);

        if (subjectList.length === 0) {
          setMessage("Subject list is unavailable. Enter a subject code manually to load predictions.");
          return;
        }

        const subjectCode = subjectList[0].subject_code;
        setSelectedSubject(subjectCode);

        try {
          const predictionResponse = await loadPredictionData(subjectCode);
          if (active) {
            const nextPredictions = normalizePredictions(predictionResponse.data);
            setPredictions(nextPredictions);
            setMessage(nextPredictions.length === 0 ? getPredictionMessage(predictionResponse.data, "No predictions returned for this subject.") : "");
          }
        } catch (error) {
          console.error(error);
          if (active) {
            setPredictions([]);
            setMessage(error.response?.data?.detail || "Subjects loaded, but prediction data could not be loaded for the selected subject.");
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
      setPredictions([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await loadPredictionData(subjectCode);
      const nextPredictions = normalizePredictions(response.data);
      setPredictions(nextPredictions);
      setMessage(nextPredictions.length === 0 ? getPredictionMessage(response.data, "No predictions returned for this subject.") : "");
    } catch (error) {
      console.error(error);
      setPredictions([]);
      setMessage(error.response?.data?.detail || "Prediction lookup failed for this subject.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubjectInputChange(event) {
    setSelectedSubject(event.target.value);
    setMessage("");
  }

  async function handleLoadPredictions() {
    if (!selectedSubject.trim()) {
      setMessage("Enter a subject code first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await loadPredictionData(selectedSubject.trim());
      const nextPredictions = normalizePredictions(response.data);
      setPredictions(nextPredictions);
      setMessage(nextPredictions.length === 0 ? getPredictionMessage(response.data, "No predictions returned for this subject.") : "");
    } catch (error) {
      console.error(error);
      setPredictions([]);
      setMessage(error.response?.data?.detail || "Prediction lookup failed for this subject.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeScore(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return numericValue <= 1 ? numericValue * 100 : numericValue;
  }

  function getImportanceLabel(score) {
    if (score === null) return "Low Priority";
    if (score >= 80) return "Very Important";
    if (score >= 60) return "Important";
    if (score >= 40) return "Medium";
    return "Low Priority";
  }

  if (loading) {
    return <LoadingSpinner label="Loading predictions..." />;
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Prediction engine"
        title="Rank likely future questions by confidence"
        description="View dynamic confidence scores from approved analysis and jump straight into answer practice."
        actions={<Button onClick={() => navigate("/answers")}>Open answer builder</Button>}
      />

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Select a subject</h2>
              <p className="mt-1 text-sm text-slate-500">Pick a subject to load predicted questions and confidence scores.</p>
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
              <Button type="button" onClick={handleLoadPredictions} className="mt-3 w-full">
                Load predictions
              </Button>
            </div>
          </div>
        </Card>

        <ErrorMessage>{message}</ErrorMessage>

        <div className="grid gap-4">
          {predictions.length === 0 ? (
            <EmptyState title="No predictions found" description="The selected subject may need published questions and approved topic analysis before predictions are available." />
          ) : (
            predictions.map((item, index) => {
              const normalizedScore = normalizeScore(item.confidence_score ?? item.confidence ?? item.score);
              const scoreText = normalizedScore === null ? "N/A" : `${normalizedScore.toFixed(1)}%`;
              const importanceLabel = getImportanceLabel(normalizedScore);

              return (
                <Card as="article" key={item.id || index} className="transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Prediction {index + 1}</p>
                      <h2 className="mt-2 whitespace-pre-line break-words text-lg font-semibold leading-7 text-slate-950 sm:text-xl">
                        {item.predicted_topic || item.topic || item.question || item.question_text || "Predicted topic"}
                      </h2>
                    </div>
                    <Badge tone="indigo">{scoreText}</Badge>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.min(Math.max(normalizedScore || 0, 0), 100)}%` }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Importance</p>
                      <p className="font-semibold text-slate-950">{importanceLabel}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Topic</p>
                      <p className="font-semibold text-slate-950">{item.predicted_topic || item.topic || "N/A"}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Subject</p>
                      <p className="font-semibold text-slate-950">{item.subject_code || selectedSubject}</p>
                    </div>
                  </div>

                  {item.reason && (
                    <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      <span className="font-semibold text-slate-950">Reason:</span> {item.reason}
                    </p>
                  )}
                  <QuestionExtras item={item} />

                  {Array.isArray(item.related_questions) && item.related_questions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold text-slate-950">Related Previous Questions</p>
                      {item.related_questions.slice(0, 4).map((question, questionIndex) => (
                        <div key={question.id || questionIndex} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="whitespace-pre-line break-words leading-6">{question.question_text || question.text || question.question || question}</p>
                          <QuestionExtras item={question} />
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {question.exam_year && <span>{question.exam_year}</span>}
                            {question.question_no && <span>{question.question_no}</span>}
                            {question.marks && <span>{question.marks} marks</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={() => navigate("/answers", { state: {
                      question: item.predicted_topic || item.question || item.question_text || "",
                      subject_code: item.subject_code || selectedSubject,
                      formula_latex: item.formula_latex || "",
                      diagram_required: Boolean(item.diagram_required),
                      diagram_reference: item.diagram_reference || "",
                      diagram_description: item.diagram_description || "",
                    } })}
                    className="mt-5"
                  >
                    Generate answer
                  </Button>
                </Card>
              );
            })
          )}
        </div>
    </ResponsiveContainer>
  );
}

export default PredictionsPage;
