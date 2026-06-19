// ASP.NET Core Identity long-form claim URI keys
export const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
export const MS_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

/**
 * Decoded JWT token structure from SAMS backend.
 *
 * ASP.NET Core Identity uses long-form URI claim keys by default:
 *   ClaimTypes.Name  → MS_NAME_CLAIM
 *   ClaimTypes.Role  → MS_ROLE_CLAIM  (can be string OR string[] for multiple roles)
 *
 * Your backend also adds:
 *   unique_name     → from older .NET JWT handler (may also be present)
 *   OrganizationId  → custom claim added in AccountService.GenerateJwtToken()
 */
export interface JwtPayload {
  // ── ASP.NET Core long-form claim keys ────────────────────────────────────────
  [MS_NAME_CLAIM]?: string;                    // ClaimTypes.Name  → user email
  [MS_ROLE_CLAIM]?: string | string[];         // ClaimTypes.Role  → user role(s)

  // ── Short-form keys (present in some .NET JWT configurations) ────────────────
  unique_name?: string;                        // older handler alias for Name claim
  role?: string | string[];                    // short alias for Role claim
  email?: string;
  name?: string;

  // ── Custom claims added in your AccountService ────────────────────────────────
  OrganizationId: string;

  // ── Standard JWT claims ───────────────────────────────────────────────────────
  exp: number;
  iat?: number;
  iss?: string;
  aud?: string;
  jti?: string;

  // Allow any other claims without TypeScript errors
  [key: string]: any;
}

/**
 * Normalized user context built from the JWT.
 * Stored in PermissionService signal — consumed throughout the app.
 */
export interface UserContext {
  email: string;
  organizationId: string;
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  expiresAt: Date;
}

/**
 * Result of a detailed permission check (useful for debugging).
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}