import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { jwtDecode } from 'jwt-decode';

// ─── Constants ────────────────────────────────────────────────────────────────
// Defined locally so this guard has ZERO dependency on PermissionService.
// The guard runs before Angular has fully bootstrapped the DI signal graph,
// so reading from PermissionService._userContext signal here is unreliable.
// Reading directly from the token in localStorage is always safe and synchronous.
 
const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const SUPER_ADMIN_ROLE = 'Super Admin';
 
/**
 * getRolesFromToken
 *
 * Reads roles straight from localStorage token — NO dependency on PermissionService signal.
 * This is intentional: guards run during navigation, before signal state is guaranteed
 * to be populated. Token in localStorage is always the source of truth.
 */
function getRolesFromToken(authService: AuthService): string[] {
  const token = authService.getToken();
  if (!token) return [];
  try {
    const decoded: Record<string, any> = jwtDecode(token);
    const raw = decoded[MS_ROLE_CLAIM] ?? decoded['role'] ?? null;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  } catch {
    return [];
  }
}
 
// ─── authGuard ────────────────────────────────────────────────────────────────
 
/**
 * Ensures the user is authenticated (token present & not expired).
 * Does NOT check permissions — use permissionGuard for that.
 *
 * Redirects:
 *  - /admin/* paths  → /admin/login
 *  - all other paths → /login?returnUrl=...
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  if (authService.isAuthenticated()) {
    return true;
  }
 
  if (state.url.startsWith('/admin')) {
    return router.createUrlTree(['/admin/login']);
  }
 
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
 
// ─── portalGuard ──────────────────────────────────────────────────────────────
 
/**
 * Enforces the two-portal separation:
 *   - Super Admin  → can ONLY access /admin portal
 *   - Company Admin / other users → can ONLY access tenant portal
 *
 * ROOT CAUSE FIX for "always redirects to admin dashboard":
 *   The previous version used permissionService.hasPermission() which reads from
 *   a Signal. Signals are populated in AuthService constructor, but Angular's DI
 *   order means the Signal may still be null when the guard first runs after login.
 *
 *   Fix: read roles DIRECTLY from the JWT token via localStorage — always available,
 *   always synchronous, zero Signal timing dependency.
 *
 * Logic:
 *   JWT contains 'Admin'       → company-registered user (tenant portal)
 *   JWT contains 'Super Admin' → solution admin (admin portal only)
 */
export const portalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  const portalType = route.data['portal'] as 'admin' | 'tenant';
 
  // ← Read directly from token — bypasses Signal timing issue
  const roles = getRolesFromToken(authService);
  const isSuperAdmin = roles.includes(SUPER_ADMIN_ROLE);
 
  if (portalType === 'admin') {
    // Only Super Admin can access admin portal
    if (isSuperAdmin) return true;
    // Regular user tried to access admin → send to tenant dashboard
    return router.createUrlTree(['/dashboard']);
  }
 
  if (portalType === 'tenant') {
    // Super Admin cannot access tenant portal
    if (!isSuperAdmin) return true;
    // Super Admin tried to access tenant → send to admin dashboard
    return router.createUrlTree(['/admin/dashboard']);
  }
 
  return true;
};