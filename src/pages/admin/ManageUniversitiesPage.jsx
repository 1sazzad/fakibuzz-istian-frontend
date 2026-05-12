import { useEffect, useState } from "react";
import {
  createUniversity,
  deleteUniversity,
  listAdminUniversities,
  updateUniversity,
} from "../../api/api";
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, ResponsiveContainer } from "../../components/ui";
import { getApiErrorMessage } from "../../utils/auth";

const emptyForm = {
  university_name: "",
  short_name: "",
  location: "",
  logo_url: "",
  status: "active",
};

const statusOptions = ["active", "inactive"];

function normalizeUniversities(payload) {
  const items = payload?.universities || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : [];
}

function getUniversityId(university) {
  return university.id ?? university.university_id;
}

function buildPayload(form) {
  return {
    university_name: form.university_name.trim(),
    short_name: form.short_name.trim() || undefined,
    location: form.location.trim() || undefined,
    logo_url: form.logo_url.trim() || undefined,
    status: form.status,
  };
}

function ManageUniversitiesPage() {
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUniversities() {
    setLoading(true);
    setError("");

    try {
      const response = await listAdminUniversities();
      setUniversities(normalizeUniversities(response.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load universities."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadUniversities();
    }, 0);

    return () => {
      clearTimeout(loadTimer);
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function startEdit(university) {
    setEditingId(String(getUniversityId(university)));
    setForm({
      university_name: university.university_name || "",
      short_name: university.short_name || "",
      location: university.location || "",
      logo_url: university.logo_url || "",
      status: university.status || (university.is_active === false ? "inactive" : "active"),
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!form.university_name.trim()) {
      setError("University name is required.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await updateUniversity(editingId, buildPayload(form));
        setMessage("University updated.");
      } else {
        await createUniversity(buildPayload(form));
        setMessage("University added.");
      }

      resetForm();
      await loadUniversities();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save university."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(university) {
    const universityId = getUniversityId(university);

    if (!window.confirm(`Deactivate ${university.university_name || "this university"}?`)) {
      return;
    }

    setDeletingId(String(universityId));
    setError("");
    setMessage("");

    try {
      await deleteUniversity(universityId);
      setMessage("University deactivated.");
      await loadUniversities();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to deactivate university."));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Super Admin"
        title="Universities"
        description="Create, update, and deactivate universities available to registration and academic data."
      />

      <Card as="form" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{editingId ? "Edit university" : "Add university"}</h2>
            <p className="mt-1 text-sm text-slate-500">Status controls whether a university remains available.</p>
          </div>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input aria-label="University name" value={form.university_name} onChange={(event) => updateField("university_name", event.target.value)} required placeholder="University name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Short name" value={form.short_name} onChange={(event) => updateField("short_name", event.target.value)} placeholder="Short name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Location" value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Logo URL" value={form.logo_url} onChange={(event) => updateField("logo_url", event.target.value)} placeholder="Logo URL" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <select aria-label="Status" value={form.status} onChange={(event) => updateField("status", event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 space-y-3">
          <ErrorMessage>{error}</ErrorMessage>
          <ErrorMessage tone="success">{message}</ErrorMessage>
        </div>

        <Button type="submit" disabled={saving} className="mt-5 w-full sm:w-auto">
          {saving ? "Saving..." : editingId ? "Update university" : "Add university"}
        </Button>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">University list</h2>
          {loading && <Badge>Loading...</Badge>}
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-slate-500">Loading universities...</p>
        ) : universities.length === 0 ? (
          <EmptyState title="No universities found" description="Add the first university to make it available for academic setup." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Short</th>
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 pr-4">Logo</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {universities.map((university) => {
                  const universityId = getUniversityId(university);
                  const status = university.status || (university.is_active === false ? "inactive" : "active");

                  return (
                    <tr key={universityId} className="align-top">
                      <td className="py-4 pr-4 font-medium text-slate-950">{university.university_name || "-"}</td>
                      <td className="py-4 pr-4 text-slate-700">{university.short_name || "-"}</td>
                      <td className="py-4 pr-4 text-slate-700">{university.location || "-"}</td>
                      <td className="max-w-xs py-4 pr-4 break-words text-slate-700">{university.logo_url || "-"}</td>
                      <td className="py-4 pr-4"><Badge tone={status === "active" ? "green" : "amber"}>{status}</Badge></td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(university)}>Edit</Button>
                          <Button type="button" size="sm" variant="danger" disabled={deletingId === String(universityId)} onClick={() => handleDelete(university)}>
                            {deletingId === String(universityId) ? "Deactivating..." : "Deactivate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </ResponsiveContainer>
  );
}

export default ManageUniversitiesPage;
