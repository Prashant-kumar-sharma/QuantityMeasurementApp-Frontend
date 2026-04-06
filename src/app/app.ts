import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';   // ✅ ADD

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],  // ✅ FIX
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToHistory() {
    if (!this.authService.isAuthenticated()) {
      alert('Login to view history');
    } else {
      this.router.navigate(['/history']);
    }
  }
}