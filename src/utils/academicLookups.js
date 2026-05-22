function readLookupItems(payload, legacyKey) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.[legacyKey])) {
    return payload[legacyKey];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

export function normalizeUniversities(payload) {
  return readLookupItems(payload, "universities").map((university) => ({
    id: university?.id ?? university?.university_id,
    name: String(university?.name ?? university?.university_name ?? "").trim(),
    short_name: String(university?.short_name ?? "").trim(),
  }));
}

export function normalizeDepartments(payload) {
  return readLookupItems(payload, "departments").map((department) => ({
    id: department?.id ?? department?.department_id,
    name: String(department?.name ?? department?.department_name ?? "").trim(),
    short_name: String(department?.short_name ?? "").trim(),
    university_id: department?.university_id ?? department?.university?.id ?? department?.university?.university_id,
  }));
}

export function getLookupId(item) {
  return item?.id;
}

export function getLookupLabel(item) {
  const name = item?.name || "";
  const shortName = item?.short_name || "";
  return shortName ? `${name} (${shortName})` : name;
}
