import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountService } from '../../../core/services/account/account.service';
import { loginresponse, registerconfirm } from '../../../core/models/interfaces/account/user.model';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserProfileStorageService } from '../../../core/services/localStorage/userProfile/user-profile-storage.service';
import { localStorageUserProfile } from '../../../core/models/interfaces/account/userProfile';


@Component({
  selector: 'app-confirmotp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirmotp.component.html',
  styleUrl: './confirmotp.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ConfirmotpComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('otpInput') otpInput!: ElementRef<HTMLInputElement>;

  otptext = '';
  regresponse!: registerconfirm;
  isLoading = false;
  isSubmitting = false;
  isResending = false;
  errorMessage = '';
  resendCooldown = 0;

  private cooldownInterval: any;
  private _response: any;

  constructor(
    private toastr: ToastrService,
    private router: Router,
    private services: AccountService,
    private authService: AuthService,
    private userProfileStorage: UserProfileStorageService
  ) { }

  ngOnInit(): void {
    this.regresponse = this.services._registerresp();

    // If no registration data, redirect to register
    if (!this.regresponse?.email) {
      this.toastr.warning('Please complete registration first', 'Registration Required');
      this.router.navigateByUrl('/register');
      return;
    }

    // Start initial loading
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);

    // Start cooldown timer
    this.startResendCooldown();
  }

  ngAfterViewInit(): void {
    // Auto-focus the input after view init and loading completes
    setTimeout(() => {
      if (this.otpInput && !this.isLoading) {
        this.otpInput.nativeElement.focus();
      }
    }, 1100);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onOtpInput(event: any): void {
    const value = event.target.value;
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue !== value) {
      this.otptext = numericValue;
      event.target.value = numericValue;
    }

    // Clear error when user starts typing
    if (this.errorMessage) {
      this.errorMessage = '';
    }

    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      setTimeout(() => this.confirmOTP(), 300);
    }
  }

  confirmOTP(): void {
    if (this.otptext.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit code';
      return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.regresponse.otpText = this.otptext;

    this.services.confirmRegistration(this.regresponse).subscribe({
      next: (response: loginresponse) => {
        if (response.isAuthenticated) {
          // ✅ Store token and user profile just like login
          this.authService.setToken(response.token);

          const localProfile: localStorageUserProfile = {
            email: response.email,
            fullName: response.fullName,
            createdBy: response.createdBy
          };
          this.userProfileStorage.save(localProfile);

          this.toastr.success('Email Verified & Logged in Successfully!', 'Success');

          // Clear registration data
          this.services._registerresp.set({ email: '', otpText: '' });

          // ✅ Redirect to dashboard after verification
          setTimeout(() => {
            this.router.navigateByUrl('/company-onboarding');
          }, 800);
        } else {
          this.errorMessage = response.message || 'Verification failed. Please try again.';
          this.toastr.error(this.errorMessage, 'Verification Failed');
        }
      },
      error: (error) => {
        debugger
        console.error('OTP verification error:', error);
        this.errorMessage = 'Network error. Please check your connection and try again.';
        this.toastr.error(this.errorMessage, 'Connection Error');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  resendOTP(): void {
    if (this.resendCooldown > 0 || this.isResending) return;

    this.isResending = true;
    this.errorMessage = '';

    this.services.resendVerificationCode(this.regresponse.email).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success('A new verification code has been sent to your email', 'Code Sent');
          this.otptext = ''; // Clear current OTP
          this.startResendCooldown();

          // Focus input after resend
          setTimeout(() => {
            if (this.otpInput) {
              this.otpInput.nativeElement.focus();
            }
          }, 100);
        } else {
          this.errorMessage = response.message || 'Failed to resend code. Please try again.';
          this.toastr.error(this.errorMessage, 'Resend Failed');
        }
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        this.errorMessage = 'Failed to resend code. Please try again later.';
        this.toastr.error(this.errorMessage, 'Resend Failed');
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60; // 60 seconds cooldown

    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  goBack(): void {
    // Clear any stored registration data
    this.services._registerresp.set({
      email: '',
      otpText: ''
    });
    this.router.navigateByUrl('/register');
  }
}