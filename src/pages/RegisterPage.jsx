import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUniversities, getUniversityDepartments } from "../api/authApi";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/useAuth";
import { Button, Card, ErrorMessage, PasswordInput } from "../components/ui";
import {
  getLookupId,
  getLookupLabel,
  normalizeDepartments,
  normalizeUniversities,
} from "../utils/academicLookups";
import {
  buildAcademicProfilePayload,
  CLASS_LEVEL_OPTIONS,
  CURRICULUM_OPTIONS,
  normalizeAcademicLevel,
  STREAM_GROUP_OPTIONS,
  VISIBLE_ACADEMIC_LEVEL_OPTIONS,
} from "../utils/academicProfile";
import {
  getApiErrorMessage,
  PASSWORD_PATTERN,
  PASSWORD_VALIDATION_MESSAGE,
  PHONE_PATTERN,
  PHONE_VALIDATION_MESSAGE,
} from "../utils/auth";

function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    academic_level: "university",
    institution_type: "university",
    curriculum: "university_specific",
    stream_group: "",
    class_level: "",
    university_id: "",
    department_id: "",
    program: "",
    batch_session: "",
    institution_name: "",
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

  const academicLevel = normalizeAcademicLevel(form.academic_level) || "university";

  const isUniversityLevel = academicLevel === "university";
  const isSecondaryLevel = academicLevel === "ssc" || academicLevel === "hsc";
  const isAcademicScopeReady =
    (isUniversityLevel && Boolean(form.university_id && form.department_id)) ||
    (isSecondaryLevel && Boolean(form.curriculum && form.stream_group && form.class_level));

  const academicLevelOptions = VISIBLE_ACADEMIC_LEVEL_OPTIONS;

  useEffect(() => {
    let isMounted = true;

    async function loadUniversities() {
      if (!isUniversityLevel) {
        setUniversities([]);
        setUniversitiesError("");
        setUniversitiesLoading(false);
        return;
      }

      setUniversitiesLoading(true);
      setUniversitiesError("");

      try {
        const response = await getUniversities();
        if (isMounted) {
          setUniversities(normalizeUniversities(response.data));
        }
      } catch (err) {
        if (isMounted) {
          setUniversitiesError(getApiErrorMessage(err, "Unable to load universities."));
          setUniversities([]);
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
  }, [isUniversityLevel]);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      if (!isUniversityLevel || !form.university_id) {
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

        if (isMounted) {
          setDepartments(normalizeDepartments(response.data));
        }
      } catch (err) {
        if (isMounted) {
          setDepartmentsError(getApiErrorMessage(err, "Could not load departments. Please try again."));
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
  }, [form.university_id, isUniversityLevel]);

  function updateField(field, value) {
    if (field === "academic_level") {
      const nextLevel = normalizeAcademicLevel(value) || "university";

      setForm((current) => ({
        ...current,
        academic_level: nextLevel,
        institution_type: nextLevel === "university" ? "university" : nextLevel === "ssc" ? "school" : "college",
        curriculum: nextLevel === "university" ? "university_specific" : "national",
        stream_group: "",
        class_level: "",
        university_id: "",
        department_id: "",
        program: "",
        batch_session: "",
        institution_name: "",
      }));
      setDepartments([]);
      setDepartmentsError("");
      return;
    }

    if (field === "university_id") {
      setForm((current) => ({
        ...current,
        university_id: value,
        department_id: "",
      }));
      setDepartments([]);
      setDepartmentsError("");
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleUniversityChange(value) {
    updateField("university_id", value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.phone_number.trim() ||
      !academicLevel ||
      !form.password ||
      !form.confirm_password
    ) {
      if (!academicLevel) {
        setError("Academic level is required.");
      } else if (isUniversityLevel && !form.university_id) {
        setError("University is required.");
      } else if (isUniversityLevel && !form.department_id) {
        setError("Department is required.");
      } else if (isSecondaryLevel && !form.curriculum) {
        setError("Curriculum is required.");
      } else if (isSecondaryLevel && !form.stream_group) {
        setError("Group is required.");
      } else if (isSecondaryLevel && !form.class_level) {
        setError("Class level is required.");
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
      const academicPayload = buildAcademicProfilePayload({
        academic_level: academicLevel,
        institution_type: form.institution_type,
        curriculum: form.curriculum,
        stream_group: form.stream_group,
        class_level: form.class_level,
        university_id: form.university_id,
        department_id: form.department_id,
        program: form.program,
        batch_session: form.batch_session,
      });

      if (isUniversityLevel && (!form.university_id || !form.department_id)) {
        setError(!form.university_id ? "University is required." : "Department is required.");
        setLoading(false);
        return;
      }

      if (isSecondaryLevel && (!form.curriculum || !form.stream_group || !form.class_level)) {
        if (!form.curriculum) {
          setError("Curriculum is required.");
        } else if (!form.stream_group) {
          setError("Group is required.");
        } else {
          setError("Class level is required.");
        }
        setLoading(false);
        return;
      }

      const data = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        password: form.password,
        terms_accepted: true,
        ...academicPayload,
      });
      setSuccess(data?.message || "Account created successfully. Please verify your email.");
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
          <BrandLogo className="mb-4 justify-center" imageClassName="h-12 w-12" textClassName="text-center text-xl font-semibold tracking-tight text-slate-950" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Learner Register</p>
          <h1 className="mt-3 break-words text-2xl font-semibold text-slate-950 sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Use your student details to start using Q Arena.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Academic level
              <select
                value={form.academic_level}
                onChange={(event) => updateField("academic_level", event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                {academicLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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

            {isUniversityLevel ? (
              <>
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
                      const id = getLookupId(university);
                      return (
                        <option key={id || getLookupLabel(university)} value={id}>
                          {getLookupLabel(university)}
                        </option>
                      );
                    })}
                  </select>
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
                      const id = getLookupId(department);
                      return (
                        <option key={id || getLookupLabel(department)} value={id}>
                          {getLookupLabel(department)}
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
                  Batch / session
                  <input
                    value={form.batch_session}
                    onChange={(event) => updateField("batch_session", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Optional"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Curriculum
                  <select
                    value={form.curriculum}
                    onChange={(event) => updateField("curriculum", event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    {CURRICULUM_OPTIONS.filter((option) => option.value !== "university_specific").map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Group
                  <select
                    value={form.stream_group}
                    onChange={(event) => updateField("stream_group", event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select group</option>
                    {STREAM_GROUP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Class level
                  <select
                    value={form.class_level}
                    onChange={(event) => updateField("class_level", event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Select class level</option>
                    {(academicLevel === "ssc" ? CLASS_LEVEL_OPTIONS.ssc : CLASS_LEVEL_OPTIONS.hsc).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Institution / school name
                  <input
                    value={form.institution_name}
                    onChange={(event) => updateField("institution_name", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Optional, not used for subject scoping"
                  />
                </label>
              </>
            )}

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
            {isUniversityLevel && (
              <ErrorMessage tone="info">
                {form.university_id && !departmentsLoading && !departmentsError && departments.length === 0
                  ? "No departments found for this university. Please contact support."
                  : ""}
              </ErrorMessage>
            )}
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

          <Button type="submit" disabled={loading || !isAcademicScopeReady} className="w-full sm:col-span-2">
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
