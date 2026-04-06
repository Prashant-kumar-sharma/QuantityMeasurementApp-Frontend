import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  activeTab: 'login' | 'signup' = 'login';

  // NEW STEP FLOW
  step: 'login' | 'forgot' | 'reset' = 'login';

  email = '';
  password = '';
  fullName = '';
  mobileNo = '';

  // OTP FLOW
  otp = '';
  newPassword = '';

  showPassword = false;

  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {

      if (params['token']) {
        setTimeout(() => {
          this.showToast('success', 'Google Login Successful! Redirecting...');
          this.authService.login(params['token']);
          this.router.navigate(['/dashboard']);
        });
      } 

      else if (params['error']) {
        setTimeout(() => {
          this.showToast('error', 'Google Sign-in failed. Please try again.');
        });
      }

    });
  }

  toggleTab(tab: 'login' | 'signup') {
    this.activeTab = tab;
    this.errorMessage = null;
    this.successMessage = null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle() {
    window.open(this.authService.getGoogleAuthUrl(), '_self');
  }

  // ================= TOASTER =================
  private showToast(type: 'success' | 'error', message: string) {

    if (type === 'success') {
      this.successMessage = message;
      this.errorMessage = null;
    } else {
      this.errorMessage = message;
      this.successMessage = null;
    }

    this.cdr.detectChanges();

    setTimeout(() => {
      this.successMessage = null;
      this.errorMessage = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  // ================= VALIDATION =================

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
  }

  private isValidMobile(mobile: string): boolean {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  // ================= FORGOT PASSWORD =================

  goToForgotPassword() {
    this.step = 'forgot';
  }

  sendOtp() {

    if (!this.email || !this.isValidEmail(this.email)) {
      this.showToast('error', 'Enter a valid email');
      return;
    }

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.showToast('success', 'OTP sent to your email');
        this.step = 'reset';
      },
      error: () => {
        this.showToast('error', 'Failed to send OTP');
      }
    });
  }

  resetPassword() {

    if (!this.otp || !this.newPassword) {
      this.showToast('error', 'Enter OTP and new password');
      return;
    }

    if (!this.isValidPassword(this.newPassword)) {
      this.showToast('error',
        'Password must be 8+ chars with uppercase, lowercase, number & special char'
      );
      return;
    }

    this.authService.resetPassword(this.email, {
      otp: this.otp,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.showToast('success', 'Password updated successfully');
        this.step = 'login';
      },
      error: () => {
        this.showToast('error', 'Invalid or expired OTP');
      }
    });
  }

  // ================= MAIN SUBMIT =================

  onSubmit() {

    this.errorMessage = null;
    this.successMessage = null;

    // ===== LOGIN =====
    if (this.activeTab === 'login') {

      if (!this.email || !this.password) {
        this.showToast('error', 'Please enter both Email and Password');
        return;
      }

      if (!this.isValidEmail(this.email)) {
        this.showToast('error', 'Please enter a valid email address');
        return;
      }

      const payload = { email: this.email, password: this.password };

      this.authService.loginWithCredentials(payload).subscribe({

        next: (res: any) => {
          if (res && (res.accessToken || res.token)) {

            this.showToast('success', 'Login Successful! Redirecting...');
            this.authService.login(res.accessToken || res.token);

            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);

          } else {
            this.showToast('error', 'Unexpected response from server');
          }
        },

        error: (err) => {

          let message = 'Login failed';

          if (err.status === 400) message = 'Invalid email or password';
          else if (err.status === 401) message = 'Unauthorized';
          else if (err.status === 0) message = 'Server not reachable';

          this.showToast('error', message);
        }
      });

      return;
    }

    // ===== SIGNUP =====
    if (this.activeTab === 'signup') {

      if (!this.fullName || !this.email || !this.password || !this.mobileNo) {
        this.showToast('error', 'Please fill all fields');
        return;
      }

      if (!this.isValidEmail(this.email)) {
        this.showToast('error', 'Invalid email');
        return;
      }

      if (!this.isValidPassword(this.password)) {
        this.showToast('error', 'Weak password');
        return;
      }

      if (!this.isValidMobile(this.mobileNo)) {
        this.showToast('error', 'Invalid mobile number');
        return;
      }

      const nameParts = this.fullName.trim().split(/\s+/);

      const payload = {
        firstName: nameParts[0],
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User',
        email: this.email,
        password: this.password,
        mobileNo: this.mobileNo
      };

      this.authService.register(payload).subscribe({
        next: (res: any) => {

          // Show success toast
          this.showToast('success', 'Registration Successful! Redirecting...');

          // If backend returns token → login user
          if (res && (res.accessToken || res.token)) {
            this.authService.login(res.accessToken || res.token);
          }

          // Redirect after short delay (for UX)
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },

        error: () => {
          this.showToast('error', 'Registration failed');
        }
      });
    }
  }
}