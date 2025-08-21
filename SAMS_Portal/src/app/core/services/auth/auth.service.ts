import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  email: string;
  role: string;
  exp: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

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
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
