import { Link } from "react-router-dom";
import { useState } from "react";
import { createAdminUser } from "../../api/authApi";
import { useAuth } from "../../context/useAuth";
import { Badge, Button, Card, ErrorMessage, PageHeader, ResponsiveContainer } from "../../components/ui";

const adminWorkflows = [
  { to: "/admin/upload", title: "Upload Questions", description: "Import admin exam JSON and create embeddings.", badge: "Ingest" },
  { to: "/admin/questions", title: "Manage Questions", description: "Review and maintain stored question data.", badge: "Data" },
  { to: "/admin/subjects", title: "Manage Subjects", description: "Publish subjects for student access.", badge: "Publish" },
];

function getErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail || error.response?.data?.message;
  return typeof detail === "string" ? detail : error.message || fallback;
}

function AdminDashboardPage() {
  const { user } = useAuth();
  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    university_name: "",
    department: "",
  });
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  function updateAdminField(field, value) {
    setAdminForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateAdmin(event) {
    event.preventDefault();
    setCreatingAdmin(true);
    setAdminError("");
    setAdminMessage("");

    try {
      await createAdminUser({
        full_name: adminForm.full_name.trim(),
        email: adminForm.email.trim(),
        phone_number: adminForm.phone_number.trim(),
        password: adminForm.password,
        role: "admin",
        university_name: adminForm.university_name.trim() || undefined,
        department: adminForm.department.trim() || undefined,
      });
      setAdminMessage("Admin account created.");
      setAdminForm({ full_name: "", email: "", phone_number: "", password: "", university_name: "", department: "" });
    } catch (error) {
      setAdminError(getErrorMessage(error, "Unable to create admin account."));
    } finally {
      setCreatingAdmin(false);
    }
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Admin Dashboard"
        title={`Welcome, ${user?.full_name || "Admin"}`}
        description="Manage uploaded exams, question records, and published subjects."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminWorkflows.map((item) => (
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
      </div>

        <Card as="form" onSubmit={handleCreateAdmin}>
          <h2 className="text-2xl font-semibold text-slate-950">Create admin</h2>
          <p className="mt-1 text-sm text-slate-500">Create the first admin or add another admin when you are already authenticated as admin.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input aria-label="Full name" value={adminForm.full_name} onChange={(event) => updateAdminField("full_name", event.target.value)} required placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Email" type="email" value={adminForm.email} onChange={(event) => updateAdminField("email", event.target.value)} required placeholder="Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Phone number" value={adminForm.phone_number} onChange={(event) => updateAdminField("phone_number", event.target.value)} required placeholder="Phone number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Password" type="password" value={adminForm.password} onChange={(event) => updateAdminField("password", event.target.value)} required minLength={6} placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="University name" value={adminForm.university_name} onChange={(event) => updateAdminField("university_name", event.target.value)} placeholder="University name (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
            <input aria-label="Department" value={adminForm.department} onChange={(event) => updateAdminField("department", event.target.value)} placeholder="Department (optional)" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </div>

          <div className="mt-4">
            <ErrorMessage>{adminError}</ErrorMessage>
            <ErrorMessage tone="success">{adminMessage}</ErrorMessage>
          </div>

          <Button type="submit" disabled={creatingAdmin} className="mt-5">
            {creatingAdmin ? "Creating..." : "Create admin account"}
          </Button>
        </Card>
    </ResponsiveContainer>
  );
}

export default AdminDashboardPage;
