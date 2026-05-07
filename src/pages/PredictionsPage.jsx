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

function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
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
          setMessage("Subject list is unavailable. Enter a subject code manually to load predictions.");
          return;
        }

        const subjectCode = subjectList[0].subject_code;
        setSelectedSubject(subjectCode);

        try {
          const predictionResponse = await apiEndpoints.getSubjectPrediction(subjectCode);
          if (active) {
            setPredictions(predictionResponse.data?.predictions || predictionResponse.data?.questions || predictionResponse.data?.items || []);
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
      const response = await apiEndpoints.getSubjectPrediction(subjectCode);
      setPredictions(response.data?.predictions || response.data?.questions || response.data?.items || []);
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
      const response = await apiEndpoints.getSubjectPrediction(selectedSubject.trim());
      setPredictions(response.data?.predictions || response.data?.questions || response.data?.items || []);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading predictions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Prediction engine</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Rank likely future questions by confidence</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Uses GET /subjects/{"{subject_code}"}/prediction and turns the confidence score into a friendly importance label.
              </p>
            </div>

            <button
              onClick={() => navigate("/answers")}
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open answer builder
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Select a subject</h2>
              <p className="mt-1 text-sm text-slate-500">Pick a subject to load predicted questions and confidence scores.</p>
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
                onClick={handleLoadPredictions}
                className="mt-3 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Load predictions
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          {predictions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              No predictions found for the selected subject.
            </div>
          ) : (
            predictions.map((item, index) => {
              const normalizedScore = normalizeScore(item.confidence_score ?? item.confidence ?? item.score);
              const scoreText = normalizedScore === null ? "N/A" : `${normalizedScore.toFixed(1)}%`;
              const importanceLabel = getImportanceLabel(normalizedScore);

              return (
                <article key={item.id || index} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">Predicted question {index + 1}</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.question || item.question_text || "Predicted question"}</h2>
                    </div>
                    <div className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">{scoreText}</div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Importance</p>
                      <p className="font-semibold text-slate-950">{importanceLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Topic</p>
                      <p className="font-semibold text-slate-950">{item.topic || "N/A"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-slate-400">Subject</p>
                      <p className="font-semibold text-slate-950">{item.subject_code || selectedSubject}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/answers", { state: { question: item.question || item.question_text || "", subject_code: item.subject_code || selectedSubject } })}
                    className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Generate answer
                  </button>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictionsPage;