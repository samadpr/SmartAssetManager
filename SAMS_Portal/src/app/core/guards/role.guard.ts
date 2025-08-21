import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { jwtDecode } from 'jwt-decode';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['roles'] as string[];
  const user = authService.getToken() ? jwtDecode<any>(authService.getToken()!) : null;

  if(user && expectedRole.includes(user.role)){
    return true;
  }

  return router.createUrlTree(['/unauthorized'])
};
