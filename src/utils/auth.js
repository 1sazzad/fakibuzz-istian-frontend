export const STUDENT_ROLES = ["student", "sub_admin", "super_admin"];
export const ADMIN_ROLES = ["sub_admin", "super_admin"];
export const PHONE_PATTERN = /^(?:01\d{9}|8801\d{9}|\+8801\d{9})$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PHONE_VALIDATION_MESSAGE = "Enter a valid Bangladesh phone number, such as 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX.";
export const PASSWORD_VALIDATION_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";
export const PERMISSION_DENIED_MESSAGE = "You do not have permission to access this page.";
export const UNVERIFIED_EMAIL_MESSAGE = "Please verify your email before logging in.";
export const MISSING_STUDENT_SCOPE_BACKEND_MESSAGE = "Please complete your academic profile first.";
export const MISSING_STUDENT_SCOPE_MESSAGE = "Please complete your academic profile first to access subjects.";

const MISSING_STUDENT_SCOPE_CODES = new Set([
  "MISSING_ACADEMIC_PROFILE",
  "MISSING_STUDENT_SCOPE",
  "INVALID_ACADEMIC_LEVEL",
  "INVALID_CURRICULUM",
  "INVALID_STREAM_GROUP",
  "INVALID_CLASS_LEVEL",
  "UNIVERSITY_OR_DEPARTMENT_REQUIRED",
  "INVALID_SUBJECT_SCOPE",
]);

const API_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_INACTIVE: "Your account is inactive. Please contact support.",
  EMAIL_NOT_VERIFIED: UNVERIFIED_EMAIL_MESSAGE,
  LOGIN_RATE_LIMITED: "Too many login attempts. Please try again later.",
  SUSPICIOUS_REQUEST: "Request was rejected for security reasons.",
};

function flattenErrorMessages(value) {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenErrorMessages);
  }

  if (typeof value === "object") {
    return [
      value.message,
      value.msg,
      value.detail,
      value.error,
    ].flatMap(flattenErrorMessages);
  }

  return [String(value)];
}

function getCommonStudentGroupErrorMessage(error) {
  const data = error.response?.data || error.data || {};
  const messages = flattenErrorMessages([data.detail, data.message, data.error]);
  const hasCommonGroupError = messages.some((message) => {
    const normalized = message.toLowerCase();
    return normalized.includes("common") && (normalized.includes("student group") || normalized.includes("stream_group") || normalized.includes("group"));
  });

  return hasCommonGroupError ? "Common is not a student group. Please select Science, Business Studies, or Humanities." : "";
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function isStudentRouteRole(role) {
  return STUDENT_ROLES.includes(role);
}

export function isSuperAdminRole(role) {
  return role === "super_admin";
}

export function getApiErrorMessage(error, fallback) {
  const data = error.response?.data || error.data || {};
  const detail = data.detail;
  const directMessage = data.message;
  const code = data.code || detail?.code;
  const commonStudentGroupError = getCommonStudentGroupErrorMessage(error);

  if (commonStudentGroupError) {
    return commonStudentGroupError;
  }

  if (isMissingStudentScopeError(error)) {
    return MISSING_STUDENT_SCOPE_MESSAGE;
  }

  if (MISSING_STUDENT_SCOPE_CODES.has(code)) {
    return MISSING_STUDENT_SCOPE_MESSAGE;
  }

  if (typeof detail === "string") {
    const normalizedDetail = detail.toLowerCase();
    if (normalizedDetail.includes("academic profile") || normalizedDetail.includes("subject scope")) {
      return MISSING_STUDENT_SCOPE_MESSAGE;
    }
  }

  if (code && code !== "VALIDATION_ERROR" && API_ERROR_MESSAGES[code]) {
    return API_ERROR_MESSAGES[code];
  }

  if (directMessage) {
    return directMessage;
  }

  if (detail?.message) {
    return detail.message;
  }

  if (typeof detail === "string" && detail) {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const loc = Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
        const message = item.msg || item.message || JSON.stringify(item);
        return loc ? `${loc}: ${message}` : message;
      })
      .join("\n");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  if (error.response?.status === 401 || error.status === 401) {
    return detail || "Your session has expired. Please login again.";
  }

  if (error.response?.status === 403 || error.status === 403) {
    return detail || PERMISSION_DENIED_MESSAGE;
  }

  if (!error.response && !error.status) {
    return error.message || "Network error. Please check your connection and try again.";
  }

  return error.message || fallback;
}

export function isUnverifiedEmailError(error) {
  return getApiErrorCode(error) === "EMAIL_NOT_VERIFIED" || getApiErrorMessage(error, "") === UNVERIFIED_EMAIL_MESSAGE;
}

export function getApiErrorCode(error) {
  const data = error.response?.data || error.data || {};
  return data.code || data.detail?.code || "";
}

export function getApiErrorField(error) {
  const data = error.response?.data || error.data || {};
  return data.field || data.detail?.field || "";
}

export function isMissingStudentScopeError(error) {
  const status = error.response?.status || error.status;
  const detail = error.response?.data?.detail || error.response?.data?.message || error.data?.detail || error.data?.message;
  const code = error.response?.data?.code || error.response?.data?.detail?.code || error.data?.code || error.data?.detail?.code;

  if (status !== 400) {
    return false;
  }

  if (MISSING_STUDENT_SCOPE_CODES.has(code)) {
    return true;
  }

  if (typeof detail === "string") {
    const normalizedDetail = detail.toLowerCase();
    return (
      normalizedDetail.includes("academic profile") ||
      normalizedDetail.includes("subject scope") ||
      (normalizedDetail.includes("university") && normalizedDetail.includes("department"))
    );
  }

  return detail === MISSING_STUDENT_SCOPE_BACKEND_MESSAGE;
}
