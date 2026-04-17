import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, AuthUser } from './core/services/auth.service';
import { Router } from '@angular/router';
import { Observable, map, shareReplay } from 'rxjs';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<AuthUser | null>;
  userAvatar$: Observable<string | undefined>;
  
  // Track image loading state per user
  avatarLoaded = true;

  // Navbar scroll tracking
  isNavbarVisible = true;
  lastScrollTop = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentScroll <= 0) {
      this.isNavbarVisible = true;
    } else if (currentScroll > this.lastScrollTop) {
      // Scrolling down
      this.isNavbarVisible = false;
    } else {
      // Scrolling up
      this.isNavbarVisible = true;
    }

    this.lastScrollTop = currentScroll;
  }

  constructor(private authService: AuthService, private router: Router, private toastService: ToastService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
    
    // Create avatar observable with proper null/undefined handling
    this.userAvatar$ = this.currentUser$.pipe(
      map(user => {
        if (!user) return undefined;
        const avatarUrl = user.picture || user.imageUrl;
        // Return undefined for empty/null/whitespace URLs
        if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
          return undefined;
        }
        return avatarUrl;
      }),
      shareReplay(1)
    );
  }

  getUserDisplayName(user: AuthUser | null): string {
    if (!user) return 'User';
    
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase();
    }
    
    const raw = user.name || user.email || 'User';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  getAvatarInitial(user: AuthUser | null): string {
    const name = this.getUserDisplayName(user);
    return name.charAt(0).toUpperCase();
  }

  onAvatarError(): void {
    this.avatarLoaded = false;
    console.warn('Avatar image failed to load, showing fallback');
  }

  loginWithGoogle(): void {
    const currentUrl = this.router.url === '/login' ? '/dashboard' : this.router.url;
    this.authService.setPostLoginRedirectUrl(currentUrl || '/dashboard');
    window.open(this.authService.getGoogleAuthUrl(), '_self');
  }

  goToLogin(): void {
    const currentUrl = this.router.url === '/login' ? '/dashboard' : this.router.url;
    this.authService.setPostLoginRedirectUrl(currentUrl || '/dashboard');
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
    this.toastService.showSuccess('Logged out successfully');
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
