import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AccountService } from '../account/account.service';
import { PermissionService } from '../permission/permission.service';

// Keep your existing claim URI constants exactly as they are
export const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
export const MS_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

export interface JwtPayload {
  email?: string;
  role?: string | string[];
  name?: string;
  exp: number;
  [MS_ROLE_CLAIM]?: string | string[];
  [MS_NAME_CLAIM]?: string;
  [key: string]: any;
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accountService = inject(AccountService);
  private permissionService = inject(PermissionService);  // ← ADD THIS LINE
  private tokenKey = 'auth_token';           // ← YOUR original key, unchanged
  private companyDataKey = 'company_info';
  private userDataKey = 'user_profile';

  constructor(private router: Router) {
    // ── ADD: rehydrate permissions on page refresh ────────────────────────────
    // When the page is refreshed, the token is still in localStorage but the
    // in-memory PermissionService signal is empty. This re-loads it.
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.exp > Date.now() / 1000) {
          this.permissionService.loadFromToken(token);  // ← rehydrate
        } else {
          // Token expired — clean up silently
          this.clearToken();
        }
      } catch {
        this.clearToken();
      }
    }
  }

  // ── YOUR EXISTING METHODS — UNCHANGED ────────────────────────────────────────

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.permissionService.loadFromToken(token);  // ← ADD THIS LINE ONLY
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.permissionService.clear();  // ← ADD THIS LINE ONLY
  }

  clearDatas(): void {
    // ← UNCHANGED
    localStorage.removeItem(this.companyDataKey);
    localStorage.removeItem(this.userDataKey);
  }

  isAuthenticated(): boolean {
    // ← UNCHANGED — your original logic
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
    // ← UNCHANGED
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  getRoles(): string[] {
    // ← UNCHANGED — your original dual-claim logic is kept
    const decoded = this.getUser();
    if (!decoded) return [];

    const msClaim = decoded[MS_ROLE_CLAIM];
    if (msClaim) return Array.isArray(msClaim) ? msClaim : [msClaim];

    const roleClaim = decoded['role'];
    if (roleClaim) return Array.isArray(roleClaim) ? roleClaim : [roleClaim];

    return [];
  }

  hasRole(role: string): boolean {
    // ← UNCHANGED
    return this.getRoles().includes(role);
  }

  logout(): void {
    // ← UNCHANGED
    this.accountService.logout().subscribe({
      next: (res) => {
        console.log(res.message || 'Logout successful');
        this.clearToken();
        this.clearDatas();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout API failed:', err);
        this.clearToken();
        this.clearDatas();
        this.router.navigate(['/login']);
      }
    });
  }

  adminLogout(): void {
    // ← UNCHANGED
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