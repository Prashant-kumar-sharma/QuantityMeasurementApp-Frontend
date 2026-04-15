import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  activeTab: 'login' | 'signup' = 'login';

  loginForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  signupForm: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    mobileNo: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  showPassword = false;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  successMessage: string | null = null;
  backendErrors: any = {};
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', []],
      password: ['', []]
    });

    this.signupForm = this.fb.nonNullable.group({
      fullName: ['', []],
      email: ['', []],
      mobileNo: ['', []],
      password: ['', []],
      confirmPassword: ['', []]
    });

    // Clear backend errors as user types
    this.setupErrorClearing();
  }

  private setupErrorClearing() {
    this.loginForm.valueChanges.subscribe(() => {
      this.backendErrors = {};
    });

    this.signupForm.get('fullName')?.valueChanges.subscribe(() => {
      delete this.backendErrors.firstName;
      delete this.backendErrors.lastName;
    });
    this.signupForm.get('email')?.valueChanges.subscribe(() => delete this.backendErrors.email);
    this.signupForm.get('mobileNo')?.valueChanges.subscribe(() => delete this.backendErrors.mobileNo);
    this.signupForm.get('password')?.valueChanges.subscribe(() => delete this.backendErrors.password);
    this.signupForm.get('confirmPassword')?.valueChanges.subscribe(() => delete this.backendErrors.confirmPassword);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.infoMessage = params['required'] ? 'Login required to access history.' : null;

      if (params['token']) {
        this.authService.loginWithToken(params['token']);
        const redirectUrl = this.authService.getAndClearPostLoginRedirectUrl() ?? '/dashboard';
        this.router.navigateByUrl(redirectUrl);
        return;
      }

      if (params['error']) {
        this.errorMessage = params['message']
          ? decodeURIComponent(params['message'])
          : 'Google authentication failed. Please try again.';
        return;
      }

      if (this.authService.isAuthenticated()) {
        const redirectUrl = this.authService.getAndClearPostLoginRedirectUrl() ?? '/dashboard';
        this.router.navigateByUrl(redirectUrl);
      }
    });
  }

  toggleTab(tab: 'login' | 'signup') {
    this.activeTab = tab;
    this.errorMessage = null;
    this.infoMessage = null;
    this.successMessage = null;
    this.backendErrors = {};
    this.isLoading = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle() {
    const queryRedirect = this.route.snapshot.queryParamMap.get('returnUrl');
    const fallbackRedirect = this.route.snapshot.queryParamMap.get('required') ? '/history' : '/dashboard';
    this.authService.setPostLoginRedirectUrl(queryRedirect ?? fallbackRedirect);

    window.open(this.authService.getGoogleAuthUrl(), '_self');
  }

  autoCapitalizeName(): void {
    const currentName = this.signupForm.get('fullName')?.value?.trim();
    if (!currentName) {
      return;
    }

    const nameParts = currentName.split(/\s+/);
    const formattedParts = nameParts.map(part => {
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    });
    this.signupForm.patchValue({ fullName: formattedParts.join(' ') });
  }

  private extractErrorMessage(err: unknown, fallbackMessage: string): string {
    const httpErr = err as HttpErrorResponse;
    const body = httpErr?.error;
    
    if (body && typeof body === 'object') {
      if (body.message) return body.message;
      if (body.error) return body.error;
    }
    
    return fallbackMessage;
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;
    this.backendErrors = {};

    if (this.activeTab === 'login') {
      this.isLoading = true;
      const payload = this.loginForm.getRawValue();
      this.authService.loginWithCredentials(payload).subscribe({
        next: (res) => {
          if (!res?.accessToken) {
            this.errorMessage = 'Login succeeded but no access token was returned by server.';
            this.toastService.showError('Login succeeded but no access token was returned by server.');
            this.isLoading = false;
            return;
          }
          this.authService.loginFromResponse(res);
          this.toastService.showSuccess('Login successful');
          this.isLoading = false;
          const redirectUrl = this.authService.getAndClearPostLoginRedirectUrl() ?? '/dashboard';
          this.router.navigateByUrl(redirectUrl);
        },
        error: (err) => {
          const errorMsg = this.extractErrorMessage(err, 'Login failed. Please try again.');
          this.errorMessage = errorMsg;
          this.toastService.showError(errorMsg);
          this.isLoading = false;
        }
      });
      return;
    }

    // Sign Up Submission
    const formValue = this.signupForm.getRawValue();
    const nameParts = (formValue.fullName ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase() : '';

    let lastName = 'User';
    if (nameParts.length > 1) {
      const cleanedLast = nameParts[nameParts.length - 1].replace(/[^a-zA-Z]/g, '');
      if (cleanedLast.length > 0) {
        lastName = cleanedLast.charAt(0).toUpperCase() + cleanedLast.slice(1).toLowerCase();
      }
    }

    this.isLoading = true;
    const payload = {
      firstName,
      lastName,
      email: formValue.email ?? '',
      password: formValue.password ?? '',
      mobileNo: formValue.mobileNo ?? ''
    };
    
    this.authService.register(payload).subscribe({
      next: (res) => {
        this.successMessage = 'Registration successful! You can now log in.';
        this.toastService.showSuccess('Account created successfully');
        this.isLoading = false;
        this.toggleTab('login');
        this.loginForm.patchValue({ email: payload.email, password: '' });
        this.signupForm.reset();
      },
      error: (err) => {
        let errorBody = err.error;
        
        // If responseType is 'text', error might be a JSON string
        if (typeof errorBody === 'string') {
          try {
            errorBody = JSON.parse(errorBody);
          } catch {
            // Not a JSON string; use fallback
          }
        }

        if (errorBody && errorBody.errors) {
          this.backendErrors = errorBody.errors;
          this.errorMessage = 'Please correct the errors below.';
          this.toastService.showError('Please correct the errors below.');
        } else {
          const errorMsg = this.extractErrorMessage(err, 'Registration failed.');
          this.errorMessage = errorMsg;
          this.toastService.showError(errorMsg);
        }
        this.isLoading = false;
      }
    });
  }
}
