import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiEndpoints } from "../api/api";
import { useAuth } from "../context/useAuth";
import { Button, Card, ErrorMessage, PageHeader, ResponsiveContainer, StatCard } from "../components/ui";
import { getApiErrorMessage } from "../utils/auth";
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
  getAcademicProfileDefaults,
  getAcademicProfileDisplay,
  isAcademicProfileComplete,
  normalizeAcademicLevel,
  STREAM_GROUP_OPTIONS,
  VISIBLE_ACADEMIC_LEVEL_OPTIONS,
} from "../utils/academicProfile";

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const routeMessage = location?.state?.message || "";
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(() => getAcademicProfileDefaults(user));
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(routeMessage);
  const [messageTone, setMessageTone] = useState(routeMessage ? "error" : "info");

  const isStudent = user?.role === "student";
  const academicLevel = normalizeAcademicLevel(form.academic_level) || "university";
  const isUniversityLevel = academicLevel === "university";
  const isSecondaryLevel = academicLevel === "ssc" || academicLevel === "hsc";
  const selectedUniversity = form.university_id;
  const selectedDepartment = form.department_id;
  const academicDisplay = getAcademicProfileDisplay(user);
  const missingAcademicProfile = isStudent && !isAcademicProfileComplete(user);

  useEffect(() => {
    if (!isStudent || !isUniversityLevel) {
      return;
    }

    let active = true;
    Promise.resolve()
      .then(() => {
        setUniversitiesLoading(true);
        return apiEndpoints.getUniversities();
      })
      .then((response) => {
        if (!active) {
          return;
        }
        setUniversities(normalizeUniversities(response.data));
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setUniversities([]);
          setMessageTone("error");
          setMessage(getApiErrorMessage(error, "Unable to load universities."));
        }
      })
      .finally(() => {
        if (active) {
          setUniversitiesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isStudent, isUniversityLevel]);

  useEffect(() => {
    if (!isStudent || !isUniversityLevel || !selectedUniversity) {
      return;
    }

    let active = true;
    Promise.resolve()
      .then(() => {
        setDepartmentsLoading(true);
        return apiEndpoints.getUniversityDepartments(selectedUniversity);
      })
      .then((response) => {
        if (!active) {
          return;
        }
        const nextDepartments = normalizeDepartments(response.data);
        setDepartments(nextDepartments);
        setForm((current) => {
          if (!current.department_id) {
            return current;
          }

          const departmentStillValid = nextDepartments.some((department) => String(getLookupId(department)) === current.department_id);
          return departmentStillValid ? current : { ...current, department_id: "" };
        });
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          setDepartments([]);
          setMessageTone("error");
          setMessage(getApiErrorMessage(error, "Unable to load departments."));
        }
      })
      .finally(() => {
        if (active) {
          setDepartmentsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isStudent, isUniversityLevel, selectedUniversity]);

  const canSaveAcademicScope = Boolean(
    !saving &&
      academicLevel &&
      ((isUniversityLevel && selectedUniversity && selectedDepartment) ||
        (isSecondaryLevel && form.curriculum && form.stream_group)),
  );

  const selectedUniversityName = useMemo(() => {
    return universities.find((university) => String(getLookupId(university)) === selectedUniversity)?.name || "";
  }, [universities, selectedUniversity]);

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
      setDepartmentsLoading(false);
      return;
    }

    if (field === "university_id") {
      setForm((current) => ({
        ...current,
        university_id: value,
        department_id: "",
      }));
      setDepartments([]);
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleUniversityChange(event) {
    updateField("university_id", event.target.value);
    setMessage("");
  }

  async function handleSaveAcademicScope(event) {
    event.preventDefault();

    if (!canSaveAcademicScope) {
      setMessageTone("error");
      setMessage("Complete the required academic profile fields before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = buildAcademicProfilePayload(form);

      await apiEndpoints.updateCurrentUserProfile(payload);
      await refreshUser();
      setMessageTone("success");
      setMessage("Academic profile updated successfully.");
    } catch (error) {
      console.error(error);
      setMessageTone("error");
      setMessage(getApiErrorMessage(error, "Unable to update academic profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Profile"
          title={user?.full_name || "User Profile"}
          description="Your account details used across the Q Arena dashboard."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Role" value={user?.role || "student"} tone="indigo" />
          <StatCard label="Academic level" value={academicDisplay?.academic_level || "Not set"} tone="cyan" />
          <StatCard label="Profile status" value={missingAcademicProfile ? "Needs setup" : "Complete"} tone={missingAcademicProfile ? "amber" : "green"} />
        </div>
        {isStudent && (
          <Card as="form" onSubmit={handleSaveAcademicScope} className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Academic profile</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Academic level and subject scope</h2>
              {missingAcademicProfile && (
                <p className="mt-1 text-sm text-slate-600">
                  Complete your profile to access the right subject library.
                </p>
              )}
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Academic level
              <select
                value={form.academic_level}
                onChange={(event) => updateField("academic_level", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              >
                {VISIBLE_ACADEMIC_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {isUniversityLevel ? (
                <>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    University
                    <select
                      value={selectedUniversity}
                      onChange={handleUniversityChange}
                      disabled={universitiesLoading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Department
                    <select
                      value={selectedDepartment}
                      onChange={(event) => {
                        updateField("department_id", event.target.value);
                        setMessage("");
                      }}
                      disabled={!selectedUniversity || departmentsLoading || departments.length === 0}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">
                        {!selectedUniversity
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

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Program / degree
                    <input
                      value={form.program}
                      onChange={(event) => updateField("program", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="Optional"
                    />
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Batch / session
                    <input
                      value={form.batch_session}
                      onChange={(event) => updateField("batch_session", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="Optional"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Curriculum
                    <select
                      value={form.curriculum}
                      onChange={(event) => updateField("curriculum", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      {CURRICULUM_OPTIONS.filter((option) => option.value !== "university_specific").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Group
                    <select
                      value={form.stream_group}
                      onChange={(event) => updateField("stream_group", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Select group</option>
                      {STREAM_GROUP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Class level (optional)
                    <select
                      value={form.class_level}
                      onChange={(event) => updateField("class_level", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">No class level</option>
                      {(academicLevel === "ssc" ? CLASS_LEVEL_OPTIONS.ssc : CLASS_LEVEL_OPTIONS.hsc).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                    Institution / school name
                    <input
                      value={form.institution_name}
                      onChange={(event) => updateField("institution_name", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      placeholder="Optional"
                    />
                  </label>
                </>
              )}
            </div>

            {selectedUniversity && !departmentsLoading && departments.length === 0 && (
              <ErrorMessage tone="warning">
                {selectedUniversityName
                  ? `No departments found for ${selectedUniversityName}.`
                  : "No departments found for this university."}
              </ErrorMessage>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!canSaveAcademicScope}>
                {saving ? "Saving..." : "Save academic profile"}
              </Button>
              <ErrorMessage tone={messageTone}>{message}</ErrorMessage>
            </div>
          </Card>
        )}
        <Card>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Academic level</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.academicLevel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Institution type</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.institutionType}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Curriculum</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.curriculum}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Group</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.streamGroup}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class level</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.classLevel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">University ID</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.universityId}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department ID</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.departmentId}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Institution</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.institutionName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Department</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.departmentName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Program</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.program}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Batch/session</p>
              <p className="mt-2 font-medium text-slate-950">{academicDisplay.batchSession}</p>
            </div>
          </div>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}

export default ProfilePage;
