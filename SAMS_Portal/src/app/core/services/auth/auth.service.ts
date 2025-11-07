import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AccountService } from '../account/account.service';

export interface JwtPayload {
  email: string;
  role: string;
  exp: number;
  name?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
   private accountService = inject(AccountService);

  private tokenKey = 'auth_token';

  constructor(private router: Router) { }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    if(typeof window === 'undefined') return null
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
      const isExpired = decoded.exp < Date.now() / 1000;
      return !isExpired;
    } catch (err) {
      return false;
    }
  }

  getUser(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<JwtPayload>(token);
    } catch (err) {
      return null;
    }
  }

  logout(): void {
    this.accountService.logout().subscribe({
      next: (res) => {
        // Call succeeded (API returned 200)
        console.log(res.message || 'Logout successful');
        this.clearToken();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Call failed (e.g. network issue or token already invalid)
        console.error('Logout API failed:', err);
        this.clearToken();
        this.router.navigate(['/login']);
      }
    });
  }
}
