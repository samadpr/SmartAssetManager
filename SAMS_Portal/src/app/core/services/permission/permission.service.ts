import { computed, Injectable, signal } from '@angular/core';
import { PermissionCheckResult, UserContext } from '../../models/rbac/jwt-payload.interface';
import { jwtDecode } from 'jwt-decode';
import { Permission, Permissions } from '../../models/rbac/permissions.constants';

// ─── ASP.NET Core claim URI constants ────────────────────────────────────────
// ASP.NET Core Identity emits ClaimTypes.Role and ClaimTypes.Name as these
// long URI strings by default. This matches your existing AuthService exactly.
export const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
export const MS_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
 
/**
 * PermissionService
 *
 * Single source of truth for all RBAC checks in SAMS.
 *
 * Handles BOTH JWT role claim formats from ASP.NET Core:
 *   - Long URI:  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"  ← your backend default
 *   - Short key: "role"  ← fallback if backend ever maps to short names
 *
 * Admin / Super Admin bypass every permission check automatically.
 */

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  // ─── Reactive state ──────────────────────────────────────────────────────────
 
  private _userContext = signal<UserContext | null>(null);
 
  readonly userContext = this._userContext.asReadonly();
  readonly isAdmin     = computed(() => {
    const ctx = this._userContext();
    return ctx?.isAdmin || ctx?.isSuperAdmin || false;
  });
  readonly userRoles   = computed(() => this._userContext()?.roles ?? []);
 
  // ─── Token loading ────────────────────────────────────────────────────────────
 
  /**
   * Decode a JWT and build the UserContext signal.
   * Call on login AND on app startup (page-refresh rehydration).
   *
   * Role extraction priority:
   *   1. MS long-form URI  (ASP.NET Core default — ClaimTypes.Role)
   *   2. Short "role" key  (fallback)
   *   3. Empty array       (no roles found)
   */
  loadFromToken(token: string): void {
    try {
      // Use Record<string,any> so we can safely access both long-URI and short keys
      const decoded: Record<string, any> = jwtDecode(token);
 
      // ── 1. Roles ──────────────────────────────────────────────────────────────
      const rawRoles =
        decoded[MS_ROLE_CLAIM] ??  // ASP.NET Core long-form (your backend)
        decoded['role']        ??  // short-form fallback
        null;
 
      const roles: string[] = rawRoles === null
        ? []
        : Array.isArray(rawRoles) ? rawRoles : [rawRoles];
 
      // ── 2. Email / name ───────────────────────────────────────────────────────
      const email: string =
        decoded[MS_NAME_CLAIM]  ??  // ASP.NET Core long-form name claim
        decoded['unique_name']  ??  // older .NET JWT handler format
        decoded['email']        ??
        decoded['name']         ??
        '';
 
      // ── 3. OrganizationId (custom claim added in your AccountService) ─────────
      const organizationId: string = decoded['OrganizationId'] ?? '';
 
      const ctx: UserContext = {
        email,
        organizationId,
        roles,
        isAdmin:      roles.includes(Permissions.ADMIN),
        isSuperAdmin: roles.includes(Permissions.SUPER_ADMIN),
        expiresAt:    new Date(decoded['exp'] * 1000),
      };
 
      this._userContext.set(ctx);
    } catch (err) {
      console.error('[PermissionService] Failed to decode token:', err);
      this._userContext.set(null);
    }
  }
 
  /**
   * Clear the user context (called on logout).
   */
  clear(): void {
    this._userContext.set(null);
  }
 
  // ─── Core permission check ────────────────────────────────────────────────────
 
  /**
   * Primary permission check.
   *
   * Admin / Super Admin always return true.
   * Others: checks if the user has the given role string in their roles[].
   *
   * @param permission - A string from the Permissions constant or any role name
   */
  hasPermission(permission: Permission | string): boolean {
    const ctx = this._userContext();
    if (!ctx) return false;
 
    // Admins bypass everything
    if (ctx.isAdmin || ctx.isSuperAdmin) return true;
 
    return ctx.roles.includes(permission);
  }
 
  /**
   * Shorthand alias for hasPermission — for cleaner template usage.
   * Usage: permissionService.can(Permissions.ASSET)
   */
  can(permission: Permission | string): boolean {
    return this.hasPermission(permission);
  }
 
  /**
   * Check multiple permissions — returns true if the user has ALL of them.
   */
  hasAll(...permissions: (Permission | string)[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }
 
  /**
   * Check multiple permissions — returns true if the user has ANY of them.
   */
  hasAny(...permissions: (Permission | string)[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }
 
  /**
   * Detailed check with reason string (useful for debugging / logging).
   */
  check(permission: Permission | string): PermissionCheckResult {
    const ctx = this._userContext();
 
    if (!ctx) return { allowed: false, reason: 'No authenticated user context' };
    if (ctx.isSuperAdmin) return { allowed: true, reason: 'Super Admin bypass' };
    if (ctx.isAdmin) return { allowed: true, reason: 'Admin bypass' };
 
    const allowed = ctx.roles.includes(permission);
    return {
      allowed,
      reason: allowed
        ? `User has role: ${permission}`
        : `User lacks role: ${permission}. User roles: [${ctx.roles.join(', ')}]`,
    };
  }
 
  // ─── Route-level check ────────────────────────────────────────────────────────
 
  /**
   * Used by the permission guard to decide if a route can be activated.
   * Checks the ROUTE_PERMISSIONS map → then calls hasPermission.
   *
   * Import ROUTE_PERMISSIONS in the guard and pass the route's required permission.
   */
  canActivateWithPermission(requiredPermission: Permission | string): boolean {
    return this.hasPermission(requiredPermission);
  }
 
  // ─── Utility ─────────────────────────────────────────────────────────────────
 
  /**
   * Returns true if the user is currently authenticated (context loaded & token not expired).
   */
  isAuthenticated(): boolean {
    const ctx = this._userContext();
    if (!ctx) return false;
    return ctx.expiresAt > new Date();
  }
 
  /**
   * Get all roles the current user has.
   */
  getRoles(): string[] {
    return this._userContext()?.roles ?? [];
  }
}
