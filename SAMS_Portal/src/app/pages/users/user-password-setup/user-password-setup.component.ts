import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-password-setup',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './user-password-setup.component.html',
  styleUrl: './user-password-setup.component.scss'
})
export class UserPasswordSetupComponent implements OnInit {
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  userProfileService = inject(UserProfileService);
  globalService = inject(GlobalService);

  form!: FormGroup;
  email = '';
  token = '';
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    this.form = this.fb.group({
      email: [{ value: this.email, disabled: true }, [Validators.required, Validators.email]],
      token: [this.token, Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });

    // If token or email missing, show message and redirect
    if (!this.email || !this.token) {
      this.globalService.showToastr('Password setup link is invalid or expired.', 'error');
      setTimeout(() => this.router.navigateByUrl('/login'), 3000);
    }
  }

  // Custom validator for password strength
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return passwordValid ? null : { passwordStrength: true };
  }

  // Custom validator for matching passwords
  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  // Helper methods for password validation display
  hasMinLength(): boolean {
    const password = this.form.get('password')?.value || '';
    return password.length >= 8;
  }

  hasUpperCase(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[0-9]/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.form.get('password')?.value || '';
    return /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;

    const payload = {
      email: this.email,
      token: this.token,
      password: this.form.get('password')?.value,
      confirmPassword: this.form.get('confirmPassword')?.value
    };

    this.userProfileService.passwordSetup(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res && res.success) {
          this.globalService.showSnackbar('Password set successfully! Redirecting to login...', 'success');
          setTimeout(() => this.router.navigateByUrl('/login'), 2000);
        } else {
          this.globalService.showToastr(res?.message || 'Failed to set password', 'error');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Password setup error', err);
        const errorMessage = err?.error?.message || 'An error occurred while setting password';
        this.globalService.showToastr(errorMessage, 'error');
      }
    });
  }
}
