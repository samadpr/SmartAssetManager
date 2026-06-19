import { ActivatedRouteSnapshot, CanActivateFn, Router } from "@angular/router";
import { PermissionService } from "../../services/permission/permission.service";
import { inject } from "@angular/core";
import { Permission, ROUTE_PERMISSIONS } from "../../models/rbac/permissions.constants";

/**
 * permissionGuard
 *
 * Checks if the authenticated user has the required permission for a route.
 * Run AFTER authGuard — assumes user is already authenticated.
 *
 * Permission resolution order:
 *   1. route.data['permission']   — explicit declaration (preferred)
 *   2. ROUTE_PERMISSIONS map lookup by path  — auto-detection fallback
 *   3. No match → allow through (no restriction)
 *
 * Usage:
 * ```ts
 * {
 *   path: 'assets',
 *   component: ManageAssetsComponent,
 *   canActivate: [authGuard, permissionGuard],
 *   data: { permission: Permissions.ASSET }
 * }
 * ```
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
 
  // 1. Explicit permission from route data (always prefer this)
  const explicitPermission = route.data['permission'] as Permission | undefined;
 
  // 2. Auto-lookup fallback using the route path
  const routePath = buildRoutePath(route);
  const mappedPermission = ROUTE_PERMISSIONS[routePath];
 
  const requiredPermission = explicitPermission ?? mappedPermission;
 
  // 3. No permission restriction defined → allow
  if (!requiredPermission) {
    return true;
  }
 
  // 4. Check permission
  if (permissionService.hasPermission(requiredPermission)) {
    return true;
  }
 
  // 5. Denied
  console.warn(
    `[permissionGuard] Access denied to "${routePath}". ` +
    `Required: "${requiredPermission}". ` +
    `User roles: [${permissionService.getRoles().join(', ')}]`
  );
 
  return router.createUrlTree(['/unauthorized']);
};
 
/**
 * Builds a clean route path string from the ActivatedRouteSnapshot.
 *
 * Walks up the route tree collecting URL segments, then joins them.
 * Filters out empty segments that come from layout wrapper routes (path: '').
 *
 * Examples:
 *   /assets           → "assets"
 *   /assets/suppliers → "assets/suppliers"
 *   /department/sub-department → "department/sub-department"
 */
function buildRoutePath(route: ActivatedRouteSnapshot): string {
  const segments: string[] = [];
  let current: ActivatedRouteSnapshot | null = route;
 
  while (current) {
    if (current.url.length > 0) {
      // Filter out empty path segments from layout wrapper routes
      const nonEmpty = current.url.map(u => u.path).filter(p => p.length > 0);
      segments.unshift(...nonEmpty);
    }
    current = current.parent;
  }
 
  return segments.join('/');
}