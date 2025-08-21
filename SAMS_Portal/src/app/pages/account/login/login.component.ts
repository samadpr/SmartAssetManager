import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { loginresponse, userLogin } from '../../../core/models/account/user.model';
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
import { localStorageUserProfile, UserProfile } from '../../../core/models/account/userProfile';
import { UserProfileStorageService } from '../../../core/services/localStorage/userProfile/user-profile-storage.service';
import { response } from 'express';

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
  profileData: UserProfile | null = null;
  localStorageUserProfile: localStorageUserProfile | null = null;


  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private deviceInfoService: DeviceInfoService,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private userProfileStorage: UserProfileStorageService
  ) { }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
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
    this.deviceInfoService.patchFormWithDeviceInfo(this._loginform).subscribe();
  }

  proceedlogin() {
    debugger
    if (this._loginform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj: userLogin = this._loginform.value;

      this.accountService.proceedLogin(_obj).subscribe({
        next: (res) => {
          this._response = res;
          if (this._response.isAuthenticated) {
            // Store authentication data
            this.authService.setToken(this._response.token);
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

  
}
