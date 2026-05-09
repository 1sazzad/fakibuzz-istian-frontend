import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Badge, Card, ErrorMessage, PageHeader, ResponsiveContainer } from "../components/ui";

const workflows = [
  {
    to: "/subjects",
    title: "Subject Library",
    description: "Search published subjects and browse previous-year questions.",
    badge: "Start here",
  },
  {
    to: "/search",
    title: "Semantic Search",
    description: "Find similar questions with natural-language queries.",
    badge: "Vector search",
  },
  {
    to: "/analysis",
    title: "Topic Analysis",
    description: "Review repeated topics, years, marks, and sample questions.",
    badge: "Patterns",
  },
  {
    to: "/predict",
    title: "Predictions",
    description: "See likely important topics ranked by confidence.",
    badge: "Exam prep",
  },
  {
    to: "/suggestions",
    title: "Suggestions",
    description: "Generate focused study suggestions and export them.",
    badge: "Exportable",
  },
  {
    to: "/generate-answer",
    title: "Answer Builder",
    description: "Draft exam-style answers from stored question context.",
    badge: "Practice",
  },
];

function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Learner Dashboard"
        title={`Welcome, ${user?.full_name || "Learner"}`}
        description="Search questions, review predictions, generate answers, and export focused study material from published exam data."
        stats={
          <>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Workflows</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{workflows.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">Role</p>
              <p className="mt-1 text-2xl font-semibold capitalize text-slate-950">{user?.role || "student"}</p>
            </Card>
            <Card className="p-4 sm:col-span-2">
              <p className="text-sm text-slate-500">Account</p>
              <p className="mt-1 truncate text-lg font-semibold text-slate-950">{user?.email || "Signed in"}</p>
            </Card>
          </>
        }
      />

      <ErrorMessage tone="warning">{location.state?.message}</ErrorMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workflows.map((item) => (
          <Link key={item.to} to={item.to} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <Badge tone="indigo">{item.badge}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </Card>
          </Link>
        ))}
      </section>
    </ResponsiveContainer>
  );
}

export default DashboardPage;
