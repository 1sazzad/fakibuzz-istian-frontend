export function buildInstitutionMetadata(values = {}) {
  const institutionName = (values.institution_name || values.university_name || "").trim();
  const metadata = {
    institution_id: values.institution_id?.trim() || undefined,
    institution_name: institutionName || undefined,
    university_name: institutionName || undefined,
    department: values.department?.trim() || undefined,
    program: values.program?.trim() || undefined,
    batch_session: values.batch_session?.trim() || undefined,
  };

  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}

export function getInstitutionDisplay(user = {}) {
  return {
    institutionId: user.university_id || user.institution_id || "-",
    institutionName: user.university_name || user.institution_name || user.university?.university_name || "-",
    department: user.department || "-",
    program: user.college_institute_school || user.college || user.program || "-",
    batchSession: user.year_semester || user.year || user.semester || user.batch_session || "-",
  };
}

export function hasInstitutionMetadata(value = {}) {
  return Boolean(
    value.institution_id ||
      value.institution_name ||
      value.university_name ||
      value.department ||
      value.program ||
      value.batch_session,
  );
}
