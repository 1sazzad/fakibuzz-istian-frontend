import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUniversities, getUniversityDepartments } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import { Button, Card, ErrorMessage, PasswordInput } from "../components/ui";
import { buildInstitutionMetadata } from "../utils/institution";
import {
  getApiErrorMessage,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
  PHONE_PATTERN,
  PHONE_VALIDATION_MESSAGE,
} from "../utils/auth";

function isActiveDepartment(department) {
  if (department.is_active !== undefined) {
    return Boolean(department.is_active);
  }

  if (department.active !== undefined) {
    return Boolean(department.active);
  }

  if (department.status !== undefined) {
    return String(department.status).toLowerCase() === "active";
  }

  return true;
}

function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    university_id: "",
    college_institute_school: "",
    department_id: "",
    program: "",
    year_semester: "",
    password: "",
    confirm_password: "",
    terms_accepted: false,
  });
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [universitiesError, setUniversitiesError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadUniversities() {
      setUniversitiesLoading(true);
      setUniversitiesError("");

      try {
        const response = await getUniversities();
        const data = response.data?.universities || response.data?.items || response.data || [];
        if (isMounted) {
          setUniversities(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setUniversitiesError(getApiErrorMessage(err, "Unable to load universities."));
        }
      } finally {
        if (isMounted) {
          setUniversitiesLoading(false);
        }
      }
    }

    loadUniversities();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      if (!form.university_id) {
        setDepartments([]);
        setDepartmentsError("");
        setDepartmentsLoading(false);
        return;
      }

      setDepartments([]);
      setDepartmentsError("");
      setDepartmentsLoading(true);

      try {
        const response = await getUniversityDepartments(form.university_id);
        const data = response.data?.departments || response.data?.items || response.data || [];
        const activeDepartments = Array.isArray(data) ? data.filter(isActiveDepartment) : [];

        if (isMounted) {
          setDepartments(activeDepartments);
        }
      } catch {
        if (isMounted) {
          setDepartmentsError("Could not load departments. Please try again.");
          setDepartments([]);
        }
      } finally {
        if (isMounted) {
          setDepartmentsLoading(false);
        }
      }
    }

    loadDepartments();
    return () => {
      isMounted = false;
    };
  }, [form.university_id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleUniversityChange(value) {
    setForm((current) => ({
      ...current,
      university_id: value,
      department_id: "",
    }));
    setDepartments([]);
    setDepartmentsError("");
  }

  function getUniversityLabel(university) {
    const name = university.university_name || university.name || "";
    const shortName = university.short_name || "";
    return shortName ? `${name} (${shortName})` : name;
  }

  function getDepartmentLabel(department) {
    const name = department.department_name || department.name || "";
    const shortName = department.short_name || "";
    return shortName ? `${name} (${shortName})` : name;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.phone_number.trim() ||
      !form.university_id ||
      !form.department_id ||
      !form.password ||
      !form.confirm_password
    ) {
      if (!form.university_id) {
        setError("University is required.");
      } else if (!form.department_id) {
        setError("Department is required.");
      } else {
        setError("All fields are required.");
      }
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!PHONE_PATTERN.test(form.phone_number.trim())) {
      setError(PHONE_VALIDATION_MESSAGE);
      setLoading(false);
      return;
    }

    if (!PASSWORD_PATTERN.test(form.password)) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      setLoading(false);
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Password and confirm password do not match.");
      setLoading(false);
      return;
    }

    if (!form.terms_accepted) {
      setError("You must accept the terms before creating an account.");
      setLoading(false);
      return;
    }

    try {
      const selectedUniversity = universities.find((university) => String(university.id ?? university.university_id) === form.university_id);
      const universityId = Number.isNaN(Number(form.university_id)) ? form.university_id : Number(form.university_id);
      const departmentId = Number.isNaN(Number(form.department_id)) ? form.department_id : Number(form.department_id);
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        university_id: universityId,
        department_id: departmentId,
        college_institute_school: form.college_institute_school.trim() || undefined,
        college: form.college_institute_school.trim() || undefined,
        program: form.program.trim() || undefined,
        batch_session: form.year_semester.trim() || undefined,
        year_semester: form.year_semester.trim() || undefined,
        year: form.year_semester.trim() || undefined,
        semester: form.year_semester.trim() || undefined,
        terms_accepted: true,
        ...buildInstitutionMetadata({
          institution_id: String(form.university_id),
          institution_name: selectedUniversity ? getUniversityLabel(selectedUniversity) : "",
          program: form.program,
          batch_session: form.year_semester,
        }),
        password: form.password,
      });
      setSuccess("Account created successfully. You can now login.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. Email or phone number may already be used."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <Card className="mx-auto max-w-2xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Learner Register</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Use your student details to start using FakiBuzz.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Full name
            <input
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Your full name"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="student@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone number
            <input
              value={form.phone_number}
              onChange={(event) => updateField("phone_number", event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="01XXXXXXXXX"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            University
            <select
              value={form.university_id}
              onChange={(event) => handleUniversityChange(event.target.value)}
              required
              disabled={universitiesLoading}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <option value="">{universitiesLoading ? "Loading universities..." : "Select university"}</option>
              {universities.map((university) => {
                const id = university.id ?? university.university_id;
                return (
                  <option key={id || getUniversityLabel(university)} value={id}>
                    {getUniversityLabel(university)}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            College / institute / school
            <input
              value={form.college_institute_school}
              onChange={(event) => updateField("college_institute_school", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Department
            <select
              value={form.department_id}
              onChange={(event) => updateField("department_id", event.target.value)}
              required
              disabled={!form.university_id || departmentsLoading || departments.length === 0}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <option value="">
                {!form.university_id
                  ? "Select university first"
                  : departmentsLoading
                    ? "Loading departments..."
                    : "Select department"}
              </option>
              {departments.map((department) => {
                const id = department.id ?? department.department_id;
                return (
                  <option key={id || getDepartmentLabel(department)} value={id}>
                    {getDepartmentLabel(department)}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Program / degree
            <input
              value={form.program}
              onChange={(event) => updateField("program", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Year / semester
            <input
              value={form.year_semester}
              onChange={(event) => updateField("year_semester", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="Optional"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <PasswordInput
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              minLength={8}
              placeholder="Choose a password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <PasswordInput
              value={form.confirm_password}
              onChange={(event) => updateField("confirm_password", event.target.value)}
              required
              placeholder="Repeat password"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.terms_accepted}
              onChange={(event) => updateField("terms_accepted", event.target.checked)}
              required
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              I accept the{" "}
              <Link to="/terms-of-service" className="font-semibold text-indigo-700 hover:text-indigo-800">
                terms of service
              </Link>
              .
            </span>
          </label>

          <div className="sm:col-span-2">
            <ErrorMessage tone="warning">{universitiesError}</ErrorMessage>
            <ErrorMessage tone="warning">{departmentsError}</ErrorMessage>
            <ErrorMessage tone="info">
              {form.university_id && !departmentsLoading && !departmentsError && departments.length === 0
                ? "No departments found for this university. Please contact support."
                : ""}
            </ErrorMessage>
            <ErrorMessage>{error}</ErrorMessage>
            <ErrorMessage tone="success">{success}</ErrorMessage>
            {success && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
                  Login
                </Link>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:col-span-2">
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default RegisterPage;
