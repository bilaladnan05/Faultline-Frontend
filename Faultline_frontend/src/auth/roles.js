/**
 * The authorization vocabulary, mirroring `@faultline/auth` on the backend.
 *
 * These constants decide what the UI *shows*. They never decide what a caller may
 * *reach*: the API applies the same rules to every request and is the only thing that
 * enforces them. Hiding a button the API would refuse is a courtesy to the user, not a
 * security control - which is why the values here are kept identical to the backend's,
 * and why a mistake in this file is a cosmetic bug rather than a hole.
 */

export const ROLES = {
  ADMIN: "admin",
  ONSITE_ENGINEER: "onsiteengineer",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.ONSITE_ENGINEER]: "Onsite Engineer",
};

export const ROLE_STYLES = {
  [ROLES.ADMIN]: "bg-red-50 text-red-700 border border-red-200",
  [ROLES.ONSITE_ENGINEER]: "bg-teal-50 text-teal-700 border border-teal-200",
};

export const PERMISSIONS = {
  PROJECT_VIEW: "project:view",
  PROJECT_CREATE: "project:create",
  PROJECT_EDIT: "project:edit",
  PROJECT_DELETE: "project:delete",
  PROJECT_ASSIGN: "project:assign",
  INCIDENT_VIEW: "incident:view",
  REMEDIATION_ACT: "remediation:act",
  USER_VIEW: "user:view",
  USER_MANAGE: "user:manage",
  AUDIT_VIEW: "audit:view",
  SETTINGS_MANAGE: "settings:manage",
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ONSITE_ENGINEER]: [
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.INCIDENT_VIEW,
    PERMISSIONS.REMEDIATION_ACT,
  ],
};

export const isAdmin = (user) => user?.role === ROLES.ADMIN;

export const hasRole = (user, ...roles) => !!user && roles.includes(user.role);

/**
 * Prefers the permission list the API sent over the one derived here.
 *
 * The server is the authority on what a role carries; deriving locally is only the
 * fallback for a user object assembled before `/auth/me` answered.
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  return (ROLE_PERMISSIONS[user.role] ?? []).includes(permission);
}

/**
 * Whether the UI should offer a project at all.
 *
 * `projectIds === null` means "not scoped by assignment" and is what the API sends for
 * an Admin - deliberately not an empty array, which means the opposite.
 */
export function hasProjectAccess(user, projectId) {
  if (!user || user.status !== "active") return false;
  if (isAdmin(user)) return true;
  if (!projectId) return false;
  return (user.projectIds ?? []).includes(projectId);
}

export const roleLabel = (role) => ROLE_LABELS[role] ?? role ?? "Unknown";
