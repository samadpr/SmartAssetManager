import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { loginresponse, userLogin } from '../../../core/models/interfaces/account/user.model';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../../core/services/account/account.service';
import { DeviceInfoService } from '../../../core/services/account/device/device-info.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserProfileStorageService } from '../../../core/services/localStorage/userProfile/user-profile-storage.service';
import { response } from 'express';
import { localStorageUserProfile, UserProfileData } from '../../../core/models/interfaces/account/userProfile';
import { CompanyService } from '../../../core/services/company/company.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  _loginform!: FormGroup;
  _response!: loginresponse;
  hidePassword = true;
  isSubmitting = false;
  profileData: UserProfileData | null = null;
  localStorageUserProfile: localStorageUserProfile | null = null;
  deviceInfoLoaded = false;


  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private deviceInfoService: DeviceInfoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private userProfileStorage: UserProfileStorageService,
    private companyService: CompanyService
  ) { }

  ngOnInit(): void {
    // If already authenticated, decide where to send them
    if (this.authService.isAuthenticated()) {
      this._redirectByActivationStatus();
      return;
    }

    this._loginform = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false],
      latitude: [''],
      longitude: [''],
      publicIP: [''],
      browser: [''],
      operatingSystem: [''],
      device: ['']
    });

    // Set device and location information
    this.deviceInfoService.patchFormWithDeviceInfo(this._loginform)
      .subscribe({
        next: () => {
          this.deviceInfoLoaded = true;
          console.log('Device info patched:', this._loginform.value);
        },
        error: (err) => {
          this.deviceInfoLoaded = true;
          console.warn('Failed to patch device info:', err);
        }
      });
  }

  proceedlogin() {
    if (this._loginform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj: userLogin = this._loginform.value;

      this.accountService.proceedLogin(_obj).subscribe({
        next: (res) => {
          this._response = res;
          if (this._response.isAuthenticated) {
            // Store authentication data
            this.authService.setToken(this._response.token);

            const roles = this.authService.getRoles();

            // 🔥 BLOCK SUPER ADMIN FROM NORMAL LOGIN
            if (roles.includes('Super Admin')) {
              this.authService.clearToken();
              this.toastr.error(
                'Super Admin must login via Admin Portal',
                'Access Denied'
              );
              this.isSubmitting = false;
              return;
            }

            this.localStorageUserProfile = {
              email: this._response.email,
              fullName: this._response.fullName,
              createdBy: this._response.createdBy
            };
            // Save user profile to localStorage
            this.userProfileStorage.save(this.localStorageUserProfile)

            this.toastr.success('Welcome back!', 'Login Successful');
            this.router.navigateByUrl('/');
          } else {
            this.toastr.error(this._response.message, 'Login Failed');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          const errorMessage = error?.error?.message || 'An unexpected error occurred';
          this.toastr.error(`Failed due to ${errorMessage}`, 'Login Failed');
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this._loginform.controls).forEach(key => {
        this._loginform.get(key)?.markAsTouched();
      });
      this.toastr.warning('Please fill in all required fields correctly', 'Form Validation');
    }
  }

    /**
   * Fetches company status and routes accordingly:
   *   - isActive true  → /dashboard
   *   - isActive false → /pending-activation
   *   - No company yet → /company-onboarding  (fresh registration)
   *   - API error       → /dashboard (fail open so users aren't stuck)
   */
  private _redirectByActivationStatus(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          if (res.data.isActive === true) {
            this.router.navigateByUrl('/dashboard');
          } else {
            // Company exists but not yet activated
            this.router.navigateByUrl('/pending-activation');
          }
        } else {
          // No company record — user hasn't done onboarding yet
          this.router.navigateByUrl('/company-onboarding');
        }
      },
      error: () => {
        // Can't reach API — send to dashboard and let guards handle it
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

}
