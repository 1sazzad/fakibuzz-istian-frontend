export const ALLOWED_PAPER_TYPES = ["CQ", "MCQ", "WRITTEN"];

export function normalizePaperType(value) {
  const paperType = String(value ?? "").trim().toUpperCase();
  return ALLOWED_PAPER_TYPES.includes(paperType) ? paperType : "";
}

export function normalizeSupportedPaperTypes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizePaperType)
    .filter((paperType, index, items) => paperType && items.indexOf(paperType) === index);
}

export function getDefaultPaperType(supportedPaperTypes) {
  const normalizedTypes = normalizeSupportedPaperTypes(supportedPaperTypes);
  return normalizedTypes.includes("CQ") ? "CQ" : normalizedTypes[0] || "";
}

export function hasPaperTypeSupport(subject) {
  const supportedTypes = normalizeSupportedPaperTypes(subject?.supported_paper_types);
  const academicLevel = String(subject?.academic_level || "").trim().toUpperCase();
  return supportedTypes.length > 0 || academicLevel === "SSC" || academicLevel === "HSC";
}

export function formatSupportedPaperTypes(supportedPaperTypes) {
  const normalizedTypes = normalizeSupportedPaperTypes(supportedPaperTypes);

  if (normalizedTypes.length === 1) {
    return `${normalizedTypes[0]} only`;
  }

  return normalizedTypes.join(" + ");
}
