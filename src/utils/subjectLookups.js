import { formatSupportedPaperTypes, normalizeSupportedPaperTypes } from "./paperTypes";

export const MAX_SUBJECT_SEARCH_QUERY_LENGTH = 100;

function getSubjectEntries(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [payload.items, payload.subjects, payload.data, payload.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(payload.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload.data?.subjects)) {
    return payload.data.subjects;
  }

  if (Array.isArray(payload.data?.data)) {
    return payload.data.data;
  }

  return [];
}

export function normalizeSubject(subject = {}) {
  return {
    id: subject?.id ?? subject?.subject_id ?? subject?.subjectId ?? null,
    subject_code: String(subject?.subject_code ?? subject?.code ?? subject?.subjectCode ?? "").trim(),
    subject_name: String(subject?.subject_name ?? subject?.name ?? subject?.subjectName ?? "").trim(),
    academic_level: String(subject?.academic_level ?? subject?.academicLevel ?? "").trim(),
    group: String(subject?.group ?? subject?.stream_group ?? subject?.streamGroup ?? "").trim(),
    supported_paper_types: normalizeSupportedPaperTypes(subject?.supported_paper_types ?? subject?.supportedPaperTypes),
    university_id: subject?.university_id ?? subject?.universityId ?? null,
    department_id: subject?.department_id ?? subject?.departmentId ?? null,
    university_name: String(subject?.university_name ?? subject?.university?.university_name ?? subject?.university?.name ?? "").trim(),
    department_name: String(subject?.department_name ?? subject?.department?.department_name ?? subject?.department?.name ?? "").trim(),
  };
}

export function normalizeSubjectList(payload) {
  return getSubjectEntries(payload)
    .map(normalizeSubject)
    .filter((subject) => Boolean(subject.subject_code));
}

function resolveSubjectLikePayload(payload) {
  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.subject && typeof payload.subject === "object") {
    return payload.subject;
  }

  if (payload.item && typeof payload.item === "object") {
    return payload.item;
  }

  if (payload.items && Array.isArray(payload.items) && payload.items.length > 0) {
    return payload.items[0];
  }

  if (payload.subjects && Array.isArray(payload.subjects) && payload.subjects.length > 0) {
    return payload.subjects[0];
  }

  if (payload.data && Array.isArray(payload.data) && payload.data.length > 0) {
    return payload.data[0];
  }

  return payload;
}

export function normalizeSubjectLookupResponse(payload) {
  const subjectPayload = resolveSubjectLikePayload(payload);

  if (!subjectPayload || typeof subjectPayload !== "object") {
    return null;
  }

  return {
    ...subjectPayload,
    ...normalizeSubject(subjectPayload),
  };
}

export function formatSubjectLabel(subjectOrCode, subjectName = "") {
  const subjectCode = typeof subjectOrCode === "object"
    ? String(subjectOrCode?.subject_code ?? "").trim()
    : String(subjectOrCode ?? "").trim();
  const normalizedSubjectName = typeof subjectOrCode === "object"
    ? String(subjectOrCode?.subject_name ?? "").trim()
    : String(subjectName ?? "").trim();

  if (subjectCode && normalizedSubjectName) {
    return `${subjectCode} — ${normalizedSubjectName}`;
  }

  return subjectCode || normalizedSubjectName || "Unknown subject";
}

export function formatSubjectMeta(subject = {}) {
  const parts = [
    subject?.academic_level,
    subject?.group,
    formatSupportedPaperTypes(subject?.supported_paper_types),
  ].filter(Boolean);

  return parts.join(" · ");
}

export function formatAdminSubjectMeta(subject = {}) {
  const academicLevel = String(subject?.academic_level || "").trim();
  const isUniversity = academicLevel.toLowerCase() === "university" || Boolean(subject?.university_id || subject?.department_id);
  const parts = (isUniversity
    ? ["University", subject?.university_name || subject?.university_id, subject?.department_name || subject?.department_id, subject?.subject_code]
    : [academicLevel, subject?.group, formatSupportedPaperTypes(subject?.supported_paper_types), subject?.subject_code]
  ).filter(Boolean);

  return parts.join(" Â· ");
}

export function normalizeSubjectSearchQuery(query, maxLength = MAX_SUBJECT_SEARCH_QUERY_LENGTH) {
  const trimmedQuery = String(query ?? "").trim();
  const safeMaxLength = Number.isFinite(Number(maxLength)) && Number(maxLength) > 0
    ? Number(maxLength)
    : MAX_SUBJECT_SEARCH_QUERY_LENGTH;

  return trimmedQuery.slice(0, safeMaxLength);
}
