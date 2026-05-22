const ACADEMIC_LEVEL_LABELS = {
  university: "University",
  ssc: "SSC",
  hsc: "HSC",
  school: "School",
  diploma: "Diploma",
  admission: "Admission",
};

export const VISIBLE_ACADEMIC_LEVEL_OPTIONS = [
  { value: "university", label: ACADEMIC_LEVEL_LABELS.university },
  { value: "ssc", label: ACADEMIC_LEVEL_LABELS.ssc },
  { value: "hsc", label: ACADEMIC_LEVEL_LABELS.hsc },
];

export const CURRICULUM_OPTIONS = [
  { value: "national", label: "National Curriculum" },
  { value: "english_version", label: "English Version" },
  { value: "madrasa", label: "Madrasa" },
  { value: "university_specific", label: "University Specific" },
];

export const STREAM_GROUP_OPTIONS = [
  { value: "Science", label: "Science" },
  { value: "Business Studies", label: "Business Studies" },
  { value: "Humanities", label: "Humanities" },
];

const STREAM_GROUP_LABELS = new Map([
  ...STREAM_GROUP_OPTIONS.map((option) => [option.value.toLowerCase(), option.label]),
  ["business_studies", "Business Studies"],
  ["commerce", "Business Studies"],
]);

const STREAM_GROUP_VALUES = new Set(STREAM_GROUP_OPTIONS.map((option) => option.value));

export const CLASS_LEVEL_OPTIONS = {
  ssc: [
    { value: "9", label: "Class 9" },
    { value: "10", label: "Class 10" },
  ],
  hsc: [
    { value: "11", label: "Class 11" },
    { value: "12", label: "Class 12" },
  ],
};

function normalizeString(value) {
  return String(value ?? "").trim();
}

export function normalizeAcademicLevel(value) {
  const normalized = normalizeString(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(ACADEMIC_LEVEL_LABELS, normalized) ? normalized : "";
}

export function getAcademicLevelLabel(value) {
  const normalized = normalizeAcademicLevel(value);
  return ACADEMIC_LEVEL_LABELS[normalized] || "";
}

export function getAcademicLevelOptions(includeHidden = false) {
  const options = [
    { value: "university", label: ACADEMIC_LEVEL_LABELS.university },
    { value: "ssc", label: ACADEMIC_LEVEL_LABELS.ssc },
    { value: "hsc", label: ACADEMIC_LEVEL_LABELS.hsc },
  ];

  if (!includeHidden) {
    return options;
  }

  return options.concat([
    { value: "school", label: ACADEMIC_LEVEL_LABELS.school },
    { value: "diploma", label: ACADEMIC_LEVEL_LABELS.diploma },
    { value: "admission", label: ACADEMIC_LEVEL_LABELS.admission },
  ]);
}

export function getCurriculumLabel(value) {
  return CURRICULUM_OPTIONS.find((option) => option.value === normalizeString(value))?.label || "";
}

export function getStreamGroupLabel(value) {
  const normalized = normalizeString(value);
  return STREAM_GROUP_LABELS.get(normalized.toLowerCase()) || "";
}

export function normalizeStudentStreamGroup(value) {
  const normalized = normalizeString(value);

  if (!normalized || normalized.toLowerCase() === "common") {
    return "";
  }

  if (normalized.toLowerCase() === "business_studies" || normalized.toLowerCase() === "commerce") {
    return "Business Studies";
  }

  const label = getStreamGroupLabel(normalized);
  return label && STREAM_GROUP_VALUES.has(label) ? label : "";
}

export function getClassLevelLabel(value) {
  const normalized = normalizeString(value);
  for (const optionGroup of Object.values(CLASS_LEVEL_OPTIONS)) {
    const match = optionGroup.find((option) => option.value === normalized);
    if (match) {
      return match.label;
    }
  }

  return "";
}

export function isUniversityAcademicProfile(user = {}) {
  const academicLevel = normalizeAcademicLevel(user?.academic_level);
  return academicLevel === "university" || (!academicLevel && Boolean(user?.university_id && user?.department_id));
}

export function isSecondaryAcademicProfile(user = {}) {
  const academicLevel = normalizeAcademicLevel(user?.academic_level);
  return academicLevel === "ssc" || academicLevel === "hsc";
}

export function isAcademicProfileComplete(user = {}) {
  if (isUniversityAcademicProfile(user)) {
    return Boolean(user?.university_id && user?.department_id);
  }

  if (isSecondaryAcademicProfile(user)) {
    return Boolean(user?.curriculum && user?.stream_group && user?.class_level);
  }

  return Boolean(user?.university_id && user?.department_id);
}

export function getAcademicProfileSignature(user = {}) {
  return [
    normalizeAcademicLevel(user?.academic_level),
    normalizeString(user?.institution_type),
    normalizeString(user?.curriculum),
    normalizeString(user?.stream_group),
    normalizeString(user?.class_level),
    normalizeString(user?.university_id),
    normalizeString(user?.department_id),
  ].join("|");
}

export function buildAcademicProfilePayload(values = {}) {
  const academicLevel = normalizeAcademicLevel(values?.academic_level);

  if (academicLevel === "university") {
    return {
      academic_level: "university",
      institution_type: "university",
      curriculum: "university_specific",
      university_id: values?.university_id ? Number(values.university_id) : undefined,
      department_id: values?.department_id ? Number(values.department_id) : undefined,
      program: normalizeString(values?.program) || undefined,
      batch_session: normalizeString(values?.batch_session) || undefined,
    };
  }

  if (academicLevel === "ssc" || academicLevel === "hsc") {
    return {
      academic_level: academicLevel,
      institution_type: academicLevel === "ssc" ? "school" : "college",
      curriculum: normalizeString(values?.curriculum) || undefined,
      stream_group: normalizeStudentStreamGroup(values?.stream_group) || undefined,
      class_level: normalizeString(values?.class_level) || undefined,
    };
  }

  return {
    academic_level: academicLevel || undefined,
  };
}

export function buildSubjectScopeParams(user = {}, baseParams = {}) {
  const params = { ...baseParams };
  const academicLevel = normalizeAcademicLevel(user?.academic_level);

  if (academicLevel === "university" || (!academicLevel && Boolean(user?.university_id && user?.department_id))) {
    params.academic_level = academicLevel || "university";
    params.institution_type = user?.institution_type || "university";
    params.curriculum = user?.curriculum || "university_specific";

    if (user?.university_id !== undefined && user?.university_id !== null && user?.university_id !== "") {
      params.university_id = user.university_id;
    }

    if (user?.department_id !== undefined && user?.department_id !== null && user?.department_id !== "") {
      params.department_id = user.department_id;
    }

    return params;
  }

  if (academicLevel === "ssc" || academicLevel === "hsc") {
    params.academic_level = academicLevel;
    params.institution_type = user?.institution_type || (academicLevel === "ssc" ? "school" : "college");

    if (user?.curriculum !== undefined && user?.curriculum !== null && user?.curriculum !== "") {
      params.curriculum = user.curriculum;
    }

    if (user?.stream_group !== undefined && user?.stream_group !== null && user?.stream_group !== "") {
      params.stream_group = user.stream_group;
    }

    if (user?.class_level !== undefined && user?.class_level !== null && user?.class_level !== "") {
      params.class_level = user.class_level;
    }

    return params;
  }

  if (user?.university_id !== undefined && user?.university_id !== null && user?.university_id !== "") {
    params.university_id = user.university_id;
  }

  if (user?.department_id !== undefined && user?.department_id !== null && user?.department_id !== "") {
    params.department_id = user.department_id;
  }

  return params;
}

export function getAcademicProfileDefaults(user = {}) {
  const academicLevel = normalizeAcademicLevel(user?.academic_level) || (user?.university_id && user?.department_id ? "university" : "");

  return {
    academic_level: academicLevel,
    institution_type: normalizeString(user?.institution_type) || (academicLevel === "university" ? "university" : academicLevel === "ssc" ? "school" : academicLevel === "hsc" ? "college" : ""),
    curriculum: normalizeString(user?.curriculum) || (academicLevel === "university" ? "university_specific" : ""),
    stream_group: normalizeStudentStreamGroup(user?.stream_group),
    class_level: normalizeString(user?.class_level),
    university_id: normalizeString(user?.university_id),
    department_id: normalizeString(user?.department_id),
    program: normalizeString(user?.program || user?.college_institute_school),
    batch_session: normalizeString(user?.batch_session || user?.year_semester),
    institution_name: normalizeString(user?.institution_name || user?.school_name || user?.college_name || user?.university_name),
  };
}

export function getAcademicProfileDisplay(user = {}) {
  const academicLevel = normalizeAcademicLevel(user?.academic_level) || (user?.university_id && user?.department_id ? "university" : "");

  return {
    academicLevel: getAcademicLevelLabel(academicLevel) || "-",
    institutionType: normalizeString(user?.institution_type) || "-",
    curriculum: getCurriculumLabel(user?.curriculum) || normalizeString(user?.curriculum) || "-",
    streamGroup: getStreamGroupLabel(user?.stream_group) || "-",
    classLevel: getClassLevelLabel(user?.class_level) || normalizeString(user?.class_level) || "-",
    universityId: normalizeString(user?.university_id || user?.institution_id) || "-",
    departmentId: normalizeString(user?.department_id) || "-",
    institutionName: normalizeString(user?.university_name || user?.institution_name || user?.school_name || user?.college_name) || "-",
    departmentName: normalizeString(user?.department || user?.department_name) || "-",
    program: normalizeString(user?.program || user?.college_institute_school) || "-",
    batchSession: normalizeString(user?.batch_session || user?.year_semester || user?.year || user?.semester) || "-",
  };
}
