import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiEndpoints } from "../api/api";

function GenerateAnswerPage() {
  const location = useLocation();
  const [question, setQuestion] = useState(() => location.state?.question || "");
  const [subjectCode, setSubjectCode] = useState(() => location.state?.subject_code || "");
  const [answerType, setAnswerType] = useState("5_mark");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("Ask a question and generate a simple answer.");

  useEffect(() => {
    let active = true;

    apiEndpoints.getSubjects()
      .then((response) => {
        if (!active) {
          return;
        }

        const subjectList = response.data?.subjects || [];
        setSubjects(subjectList);

        if (!subjectCode && subjectList.length > 0) {
          setSubjectCode(subjectList[0].subject_code);
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setMessage("Could not load subjects. You can still type a subject code manually.");
        }
      });

    return () => {
      active = false;
    };
  }, [subjectCode]);

  async function handleGenerateAnswer(event) {
    event.preventDefault();

    if (!question.trim() || !subjectCode.trim()) {
      setAnswer("Please enter both a question and a subject code.");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setMessage("Generating answer using related stored questions...");

      const response = await apiEndpoints.generateAnswer({
        question: question.trim(),
        subject_code: subjectCode.trim(),
        answer_type: answerType,
      });

      setAnswer(response.data?.answer || response.data?.generated_answer || JSON.stringify(response.data, null, 2));
      setMessage("Answer generated successfully.");
    } catch (error) {
      console.error(error);
      setAnswer("Answer generation failed. Please check the backend response.");
      setMessage(error.response?.data?.detail || "The backend could not generate an answer for this request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Answer generator</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Generate exam-style answers with context</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">Generate a simple answer from related stored questions.</p>
        </section>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <form onSubmit={handleGenerateAnswer} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                Question
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What is SEO?"
                  className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Subject code
                <input
                  value={subjectCode}
                  onChange={(event) => setSubjectCode(event.target.value)}
                  placeholder="CSE-421"
                  list="subject-list"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Answer type
                <select
                  value={answerType}
                  onChange={(event) => setAnswerType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
                >
                  <option value="5_mark">5 Mark Answer</option>
                  <option value="10_mark">10 Mark Answer</option>
                  <option value="short_note">Short Note</option>
                  <option value="definition">Definition</option>
                  <option value="difference_table">Difference Table</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Generating..." : "Generate answer"}
            </button>
          </form>

          <datalist id="subject-list">
            {subjects.map((subject) => (
              <option key={subject.subject_code} value={subject.subject_code}>
                {subject.subject_name}
              </option>
            ))}
          </datalist>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {message}
          </div>

          {answer && (
            <div className="mt-6 rounded-[1.5rem] border border-cyan-100 bg-cyan-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-950">Generated answer</h2>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-cyan-700">
                  {answerType.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-line text-slate-700">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateAnswerPage;