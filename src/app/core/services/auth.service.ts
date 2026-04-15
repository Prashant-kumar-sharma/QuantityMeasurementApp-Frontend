import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  refreshToken?: string;
  user?: AuthUser;
}

interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface AuthUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  picture?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly sessionStorageKey = environment.storage.authSessionKey;
  private readonly redirectStorageKey = `${environment.storage.authSessionKey}_redirect`;
  private readonly authSessionSubject = new BehaviorSubject<AuthSession | null>(this.getStoredSession());
  public readonly authSession$ = this.authSessionSubject.asObservable();
  public readonly isAuthenticated$ = this.authSession$.pipe(map(() => this.isAuthenticated()));
  public readonly currentUser$ = this.authSession$.pipe(map(() => this.getCurrentUser()));

  constructor(private http: HttpClient, private router: Router) {
    if (!this.isAuthenticated()) {
      this.clearSession();
    }
  }

  private normalizeCapitalizedName(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const cleaned = value.trim();
    if (!cleaned) {
      return undefined;
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return true;
      }

      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload?.exp) {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }

  private getStoredSession(): AuthSession | null {
    const raw = localStorage.getItem(this.sessionStorageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.accessToken) {
        return null;
      }
      if (this.isTokenExpired(parsed.accessToken)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
    this.authSessionSubject.next(session);
  }

  private clearSession(): void {
    localStorage.removeItem(this.sessionStorageKey);
    this.authSessionSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.authSessionSubject.value?.accessToken;
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return this.authSessionSubject.value?.accessToken ?? null;
  }

  getCurrentUser(): AuthUser | null {
    const sessionUser = this.authSessionSubject.value?.user;
    if (sessionUser) {
      const computedName = sessionUser.name
        ?? ([sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim() || sessionUser.email);
      return {
        ...sessionUser,
        firstName: this.normalizeCapitalizedName(sessionUser.firstName),
        name: computedName
      };
    }
    return this.getUserFromToken(this.getToken()) ?? null;
  }

  getRefreshToken(): string | null {
    return this.authSessionSubject.value?.refreshToken ?? null;
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const b64Url = token.split('.')[1];
      const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));

      if (payload.role) {
        return payload.role;
      }

      if (Array.isArray(payload.authorities) && payload.authorities.length > 0) {
        return payload.authorities[0];
      }

      if (Array.isArray(payload.roles) && payload.roles.length > 0) {
        return payload.roles[0];
      }

      return null;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getRole() === 'ROLE_ADMIN';
  }

  isUser(): boolean {
    return this.getRole() === 'ROLE_USER';
  }

  loginWithCredentials(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}${environment.authEndpoints.login}`, credentials);
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}${environment.authEndpoints.forgotPassword}`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}${environment.authEndpoints.resetPassword}`,
      { token, newPassword }
    );
  }

  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobileNo: string;
  }): Observable<string> {
    return this.http.post(`${this.apiUrl}${environment.authEndpoints.register}`, data, {
      responseType: 'text'
    });
  }

  getGoogleAuthUrl(): string {
    return `${environment.oauth.googleAuthorizeUrl}?prompt=select_account`;
  }

  setPostLoginRedirectUrl(url: string): void {
    if (!url) {
      return;
    }
    sessionStorage.setItem(this.redirectStorageKey, url);
  }

  getAndClearPostLoginRedirectUrl(): string | null {
    const target = sessionStorage.getItem(this.redirectStorageKey);
    if (target) {
      sessionStorage.removeItem(this.redirectStorageKey);
    }
    return target;
  }

  private getUserFromToken(token: string | null): AuthUser | undefined {
    if (!token) {
      return undefined;
    }

    try {
      const b64Url = token.split('.')[1];
      if (!b64Url) {
        return undefined;
      }

      const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(b64));

      return {
        id: payload.sub,
        firstName: payload.firstName,
        lastName: payload.lastName,
        name: payload.name,
        email: payload.email,
        picture: payload.picture
      };

    } catch {
      return undefined;
    }
  }

  loginFromResponse(response: AuthResponse): void {
    if (!response?.accessToken) {
      this.clearSession();
      return;
    }

    const tokenUser = this.getUserFromToken(response.accessToken);
    const backendUser = response.user
      ? {
          ...response.user,
          id: response.user.id,
          firstName: this.normalizeCapitalizedName(response.user.firstName),
          picture: response.user.picture ?? response.user.imageUrl,
          name: response.user.name
            ?? ([response.user.firstName, response.user.lastName].filter(Boolean).join(' ').trim() || response.user.email)
        }
      : undefined;

    this.setSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: backendUser ?? tokenUser
    });
  }

  loginWithToken(token: string): void {
    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    this.setSession({
      accessToken: token,
      user: this.getUserFromToken(token)
    });
  }

  // Backward-compatible helper
  login(token: string): void {
    this.loginWithToken(token);
  }

  logout(): void {
    const token = this.getToken();
    this.clearSession();
    this.router.navigate(['/login']);

    if (token) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http.post(`${this.apiUrl}${environment.authEndpoints.logout}`, {}, { headers, responseType: 'text' }).subscribe({
        error: () => {
          // ignore backend logout errors; local cleanup still required
        }
      });
    }

    sessionStorage.removeItem(this.redirectStorageKey);
  }
}
