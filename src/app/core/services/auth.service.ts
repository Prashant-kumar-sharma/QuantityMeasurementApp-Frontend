import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authenticated = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.authenticated.asObservable();
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const b64Url = token.split('.')[1];
      const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));
      return payload.role || (payload.roles && payload.roles[0]) || null;
    } catch (e) {
      return null;
    }
  }

  isAdmin(): boolean {
    const role = this.getRole();
    return role === 'ROLE_ADMIN' || role === 'ADMIN';
  }

  isUser(): boolean {
    const role = this.getRole();
    return role === 'ROLE_USER' || role === 'USER';
  }

  loginWithCredentials(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, {
      observe: 'body'
    });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data, { responseType: 'text' });
  }

  /**
   * FULL UPDATE: 
   * This forces the backend to initiate the Google handshake with prompt=select_account.
   */
  getGoogleAuthUrl(): string {
    return environment.googleAuthUrl;
  }

  login(token: string) {
    localStorage.setItem('token', token);
    this.authenticated.next(true); 
  }

  logout() {
    localStorage.removeItem('token');
    this.authenticated.next(false);
  }

  forgotPassword(email: string) {
    return this.http.post(
      `${this.apiUrl}/forgotPassword/${email}`,
      {},
      { responseType: 'text' } 
    );
  }

  resetPassword(email: string, data: any) {
    return this.http.post(
      `${this.apiUrl}/resetPassword/${email}`,
      data,
      { responseType: 'text' as 'json' }   // ⭐ FIX
    );
  }
}