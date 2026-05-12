export const STUDENT_ROLES = ["student", "sub_admin", "super_admin"];
export const ADMIN_ROLES = ["sub_admin", "super_admin"];
export const PHONE_PATTERN = /^\d{10,15}$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PHONE_VALIDATION_MESSAGE = "Phone number must contain only digits and be 10 to 15 digits long.";
export const PASSWORD_VALIDATION_MESSAGE =
  "Password must be at least 8 characters and include at least one letter and one number.";
export const PERMISSION_DENIED_MESSAGE = "You do not have permission to access this page.";
export const UNVERIFIED_EMAIL_MESSAGE = "Please verify your email before logging in.";

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
  const detail = error.response?.data?.detail || error.response?.data?.message || error.data?.detail || error.data?.message;

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

  return detail || error.message || fallback;
}

export function isUnverifiedEmailError(error) {
  return getApiErrorMessage(error, "") === UNVERIFIED_EMAIL_MESSAGE;
}
