import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { CompanyService } from '../../services/company/company.service';

/**
 * activationGuard
 *
 * Protects all tenant routes that require an active (admin-approved) company.
 * Flow:
 *   1. Not authenticated              → /login
 *   2. Company isActive === true       → allow
 *   3. Company isActive === false/null → /pending-activation
 *   4. API error / no company yet      → /pending-activation
 */

export const activationGuard: CanActivateFn = (route, state) => {
  const router         = inject(Router);
  const authService    = inject(AuthService);
  const companyService = inject(CompanyService);
 
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
 
  return companyService.getCurrentUserCompany().pipe(
    map(res => {
      if (res?.success && res.data?.isActive === true) {
        return true;
      }
      return router.createUrlTree(['/pending-activation']);
    }),
    catchError(() => of(router.createUrlTree(['/pending-activation'])))
  );
};
