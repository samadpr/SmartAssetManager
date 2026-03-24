import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AccountService } from '../account/account.service';

// ASP.NET Core Identity uses these long URI-based claim keys
export const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
export const MS_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

export interface JwtPayload {
  // Short-form keys (may or may not be present depending on backend config)
  email?: string;
  role?:  string | string[];
  name?:  string;
  exp:    number;
  // Microsoft .NET long-form claim keys
  [MS_ROLE_CLAIM]?: string | string[];
  [MS_NAME_CLAIM]?: string;
  // Allow any other claims
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accountService = inject(AccountService);
  private tokenKey = 'auth_token';

  constructor(private router: Router) {}

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded: JwtPayload = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getUser(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  /**
   * Returns all roles from the token, handling both:
   *  - ASP.NET Core long claim URI  (MS_ROLE_CLAIM)
   *  - Short 'role' key
   * Always returns a string array (empty if no roles found).
   */
  getRoles(): string[] {
    const decoded = this.getUser();
    if (!decoded) return [];

    // Microsoft namespace claim (ASP.NET Core default)
    const msClaim = decoded[MS_ROLE_CLAIM];
    if (msClaim) return Array.isArray(msClaim) ? msClaim : [msClaim];

    // Short-form fallback
    const roleClaim = decoded['role'];
    if (roleClaim) return Array.isArray(roleClaim) ? roleClaim : [roleClaim];

    return [];
  }

  /** Convenience: check if the current user has a specific role */
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  logout(): void {
    this.accountService.logout().subscribe({
      next: (res) => {
        console.log(res.message || 'Logout successful');
        this.clearToken();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout API failed:', err);
        this.clearToken();
        this.router.navigate(['/login']);
      }
    });
  }
    adminLogout(): void {
    this.accountService.logout().subscribe({
      next: (res) => {
        console.log(res.message || 'Logout successful');
        this.clearToken();
        this.router.navigate(['admin/login']);
      },
      error: (err) => {
        console.error('Logout API failed:', err);
        this.clearToken();
        this.router.navigate(['admin/login']);
      }
    });
  }
}