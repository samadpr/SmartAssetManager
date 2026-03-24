import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // 🔥 Check if trying to access admin
  if (state.url.startsWith('/admin')) {
    return router.createUrlTree(['/admin/login']);
  }

  return router.createUrlTree(['/login']);
};


export const portalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const portalType = route.data['portal']; // 'admin' | 'tenant'
  const roles = authService.getRoles();

  const isSuperAdmin = roles.includes('Super Admin');

  // 🔥 Admin portal
  if (portalType === 'admin') {
    if (isSuperAdmin) return true;
    return router.createUrlTree(['/dashboard']);
  }

  // 🔥 Tenant portal
  if (portalType === 'tenant') {
    if (!isSuperAdmin) return true;
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};