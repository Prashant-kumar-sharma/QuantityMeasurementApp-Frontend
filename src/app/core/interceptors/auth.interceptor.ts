import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const requestUrl = new URL(req.url, window.location.origin);
  const isApiRequest = requestUrl.pathname.startsWith('/api/')
    || requestUrl.href.startsWith(environment.gatewayBaseUrl)
    || requestUrl.href.startsWith(environment.apiUrl);
  const isHistoryRequest = /\/history(\/|$)/.test(req.url);

  const handleUnauthorized = (error: any) => {
    if (error?.status === 401 && authService.isAuthenticated()) {
      authService.logout();

      if (!router.url.startsWith('/login') && (isHistoryRequest || router.url.startsWith('/history'))) {
        authService.setPostLoginRedirectUrl('/history');
        router.navigate(['/login'], { queryParams: { required: 1 } });
      }
    }

    return throwError(() => error);
  };

  if (token && isApiRequest) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq).pipe(
      catchError(handleUnauthorized)
    );
  }

  return next(req).pipe(catchError(handleUnauthorized));
};
