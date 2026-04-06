import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const userGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isUser()) {
    return true;
  }

  // Redirect to a generic error or admin page if admin is navigating here
  return authService.isAdmin() ? router.parseUrl('/dashboard') : router.parseUrl('/login');
};
