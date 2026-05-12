import { useEffect, useMemo, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  listAdminDepartments,
  listAdminUniversities,
  updateDepartment,
} from "../../api/api";
import { Badge, Button, Card, EmptyState, ErrorMessage, PageHeader, ResponsiveContainer } from "../../components/ui";
import { getApiErrorMessage } from "../../utils/auth";

const emptyForm = {
  university_id: "",
  department_name: "",
  short_name: "",
  status: "active",
};

const statusOptions = ["active", "inactive"];

function normalizeItems(payload, key) {
  const items = payload?.[key] || payload?.items || payload?.data || payload || [];
  return Array.isArray(items) ? items : [];
}

function getUniversityId(university) {
  return university.id ?? university.university_id;
}

function getDepartmentId(department) {
  return department.id ?? department.department_id;
}

function getUniversityLabel(university) {
  const name = university.university_name || university.name || "";
  const shortName = university.short_name || "";
  return shortName ? `${name} (${shortName})` : name;
}

function buildPayload(form) {
  const universityId = Number.isNaN(Number(form.university_id)) ? form.university_id : Number(form.university_id);

  return {
    university_id: universityId,
    department_name: form.department_name.trim(),
    short_name: form.short_name.trim() || undefined,
    status: form.status,
  };
}

function ManageDepartmentsPage() {
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const universityNames = useMemo(() => {
    return universities.reduce((lookup, university) => {
      lookup[String(getUniversityId(university))] = getUniversityLabel(university);
      return lookup;
    }, {});
  }, [universities]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [universitiesResponse, departmentsResponse] = await Promise.all([
        listAdminUniversities(),
        listAdminDepartments(),
      ]);
      setUniversities(normalizeItems(universitiesResponse.data, "universities"));
      setDepartments(normalizeItems(departmentsResponse.data, "departments"));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load department management data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadData();
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

  function startEdit(department) {
    setEditingId(String(getDepartmentId(department)));
    setForm({
      university_id: String(department.university_id || department.university?.id || department.university?.university_id || ""),
      department_name: department.department_name || department.name || "",
      short_name: department.short_name || "",
      status: department.status || (department.is_active === false ? "inactive" : "active"),
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (!form.university_id || !form.department_name.trim()) {
      setError(!form.university_id ? "University is required." : "Department name is required.");
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        await updateDepartment(editingId, buildPayload(form));
        setMessage("Department updated.");
      } else {
        await createDepartment(buildPayload(form));
        setMessage("Department added.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save department."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(department) {
    const departmentId = getDepartmentId(department);
    const departmentName = department.department_name || department.name || "this department";

    if (!window.confirm(`Deactivate ${departmentName}?`)) {
      return;
    }

    setDeletingId(String(departmentId));
    setError("");
    setMessage("");

    try {
      await deleteDepartment(departmentId);
      setMessage("Department deactivated.");
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to deactivate department."));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        eyebrow="Super Admin"
        title="Departments"
        description="Create, update, and deactivate university departments used during registration."
      />

      <Card as="form" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{editingId ? "Edit department" : "Add department"}</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the owning university before saving a department.</p>
          </div>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <select aria-label="University" value={form.university_id} onChange={(event) => updateField("university_id", event.target.value)} required className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100">
            <option value="">Select university</option>
            {universities.map((university) => {
              const universityId = getUniversityId(university);
              return (
                <option key={universityId} value={universityId}>{getUniversityLabel(university)}</option>
              );
            })}
          </select>
          <input aria-label="Department name" value={form.department_name} onChange={(event) => updateField("department_name", event.target.value)} required placeholder="Department name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          <input aria-label="Short name" value={form.short_name} onChange={(event) => updateField("short_name", event.target.value)} placeholder="Short name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
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
          {saving ? "Saving..." : editingId ? "Update department" : "Add department"}
        </Button>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">Department list</h2>
          {loading && <Badge>Loading...</Badge>}
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-slate-500">Loading departments...</p>
        ) : departments.length === 0 ? (
          <EmptyState title="No departments found" description="Add departments so students can choose the correct academic unit during registration." />
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Short</th>
                  <th className="py-3 pr-4">University</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((department) => {
                  const departmentId = getDepartmentId(department);
                  const universityId = department.university_id || department.university?.id || department.university?.university_id;
                  const status = department.status || (department.is_active === false ? "inactive" : "active");

                  return (
                    <tr key={departmentId} className="align-top">
                      <td className="py-4 pr-4 font-medium text-slate-950">{department.department_name || department.name || "-"}</td>
                      <td className="py-4 pr-4 text-slate-700">{department.short_name || "-"}</td>
                      <td className="py-4 pr-4 text-slate-700">{universityNames[String(universityId)] || department.university?.university_name || "-"}</td>
                      <td className="py-4 pr-4"><Badge tone={status === "active" ? "green" : "amber"}>{status}</Badge></td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => startEdit(department)}>Edit</Button>
                          <Button type="button" size="sm" variant="danger" disabled={deletingId === String(departmentId)} onClick={() => handleDelete(department)}>
                            {deletingId === String(departmentId) ? "Deactivating..." : "Deactivate"}
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

export default ManageDepartmentsPage;
