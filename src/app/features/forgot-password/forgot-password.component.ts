import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup<{
    email: FormControl<string>;
  }>;

  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.forgotForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const email = this.forgotForm.getRawValue().email;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Password reset link has been sent to your email address.';
        this.toastService.showSuccess('Reset link sent');
        this.forgotForm.reset();
      },
      error: (error) => {
        this.isLoading = false;
        if (error?.status === 404) {
          this.errorMessage = 'No account found with this email address.';
          this.toastService.showError('Email not found');
        } else if (error?.error?.message) {
          this.errorMessage = error.error.message;
          this.toastService.showError(error.error.message);
        } else {
          this.errorMessage = 'Failed to send reset link. Please try again.';
          this.toastService.showError('Failed to send reset link. Please try again.');
        }
      }
    });
  }
}