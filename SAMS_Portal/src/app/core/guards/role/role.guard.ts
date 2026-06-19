import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { jwtDecode } from 'jwt-decode';

/**
 * roleGuard
 *
 * Legacy guard kept for backward compatibility.
 * For new routes, prefer permissionGuard with data: { permission: Permissions.X }
 *
 * Usage:
 * ```ts
 * {
 *   path: 'some-route',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['Admin', 'Asset Manager'] }
 * }
 * ```
 *
 * FIX: Previous version read user.role (short key) directly from jwtDecode output.
 * ASP.NET Core uses the long URI claim key by default. Now uses AuthService.getRoles()
 * which already handles both long-form and short-form claim keys correctly.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
 
  const expectedRoles = route.data['roles'] as string[] | undefined;
 
  // No roles configured → allow through
  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }
 
  // Use AuthService.getRoles() — handles both MS long-form and short-form claim keys
  const userRoles = authService.getRoles();
 
  const hasRequiredRole = expectedRoles.some(r => userRoles.includes(r));
 
  if (hasRequiredRole) {
    return true;
  }
 
  return router.createUrlTree(['/unauthorized']);
};