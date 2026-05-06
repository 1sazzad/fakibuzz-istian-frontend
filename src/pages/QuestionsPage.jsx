import { useEffect, useState } from "react";
import { apiEndpoints } from "../api/api";

function normalizeQuestions(payload) {
  return payload?.questions || payload?.items || payload || [];
}

function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([apiEndpoints.getSubjects(), apiEndpoints.getQuestions()])
      .then(([subjectsResponse, questionsResponse]) => {
        if (!active) {
          return;
        }

        const subjectList = subjectsResponse.data?.subjects || [];
        setSubjects(subjectList);
        setQuestions(normalizeQuestions(questionsResponse.data));

        if (subjectList.length > 0) {
          setSelectedSubject(subjectList[0].subject_code);
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setMessage("Unable to load questions right now.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubjectChange(event) {
    const subjectCode = event.target.value;
    setSelectedSubject(subjectCode);
    setLoading(true);
    setMessage("");

    try {
      const response = subjectCode
        ? await apiEndpoints.getQuestionsBySubject(subjectCode)
        : await apiEndpoints.getQuestions();

      setQuestions(normalizeQuestions(response.data));
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh questions for that subject.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading questions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Stored questions</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">Browse every saved question</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">Use the subject filter to inspect questions saved in the backend.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:flex">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-slate-400">Questions</p>
                <p className="mt-1 text-xl font-semibold">{questions.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-slate-400">Subjects</p>
                <p className="mt-1 text-xl font-semibold">{subjects.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Filter by subject</h2>
              <p className="mt-1 text-sm text-slate-500">Fetch all questions or filter by a subject code.</p>
            </div>

            <div className="min-w-72">
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-400 focus:bg-white"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_code} value={subject.subject_code}>
                    {subject.subject_code} - {subject.subject_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}

        <div className="grid gap-4">
          {questions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
              No questions found for the selected subject.
            </div>
          ) : (
            questions.map((question, index) => (
              <article key={question.id || `${question.question_no || index}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700">{question.subject_code || selectedSubject || "All subjects"}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {question.question_no ? `Question ${question.question_no}` : `Question ${index + 1}`}
                    </h3>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {question.marks ?? "-"} marks
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-slate-700">
                  {question.question_text || question.text || "No question text provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                  {question.exam_name && <span className="rounded-full bg-slate-100 px-3 py-1">{question.exam_name}</span>}
                  {question.exam_year && <span className="rounded-full bg-slate-100 px-3 py-1">{question.exam_year}</span>}
                  {question.topic && <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700">{question.topic}</span>}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionsPage;