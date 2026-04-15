import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const extractMessage = (error: HttpErrorResponse): string => {
  const body = error.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const value = body as { message?: string; error?: string; detail?: string };
    if (value.message?.trim()) {
      return value.message;
    }
    if (value.detail?.trim()) {
      return value.detail;
    }
    if (value.error?.trim()) {
      return value.error;
    }
  }

  if (error.status === 0) {
    return 'Network error while contacting API. Please check that backend services are running.';
  }

  if (error.status === 401) {
    return 'Your session is no longer valid. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  return error.message || 'Unexpected API error.';
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      const isAuthEndpoint = /\/api\/auth\//.test(req.url);
      if (!isAuthEndpoint) {
        toast.show(extractMessage(err), 'error');
      }

      return throwError(() => err);
    })
  );
};
