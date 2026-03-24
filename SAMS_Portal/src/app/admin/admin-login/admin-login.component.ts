import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../../core/services/account/account.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { loginresponse, userLogin } from '../../core/models/interfaces/account/user.model';
import { DeviceInfoService } from '../../core/services/account/device/device-info.service';

// Microsoft .NET JWT uses these long claim URIs instead of short names
const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const MS_NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  _loginform!: FormGroup;
  _response!: loginresponse;
  hidePassword = true;
  isSubmitting = false;
  deviceInfoLoaded = false;

  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private deviceInfoService: DeviceInfoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated as Super Admin
    if (this.authService.isAuthenticated()) {
      if (this.hasSuperAdminRole()) {
        this.router.navigate(['/admin/dashboard']);
        return;
      }
      this.router.navigate(['/dashboard']);
      return;
    }

    // Build form — mirrors main LoginComponent with all device/location fields
    this._loginform = this.builder.group({
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', Validators.required],
      rememberMe:      [false],
      latitude:        [''],
      longitude:       [''],
      publicIP:        [''],
      browser:         [''],
      operatingSystem: [''],
      device:          ['']
    });

    // Collect device + location info asynchronously and patch into form
    this.deviceInfoService.patchFormWithDeviceInfo(this._loginform).subscribe({
      next: () => {
        this.deviceInfoLoaded = true;
        console.log('Admin device info patched:', this._loginform.value);
      },
      error: (err) => {
        this.deviceInfoLoaded = true;
        console.warn('Failed to patch admin device info:', err);
      }
    });
  }

  /**
   * Extracts roles from a decoded JWT that may use either:
   *  - Short key:    { role: 'Super Admin' }  or  { role: ['Super Admin', ...] }
   *  - MS namespace: { 'http://schemas.microsoft.com/...': ['Super Admin', ...] }
   */
  private getRolesFromToken(): string[] {
    const decoded = this.authService.getUser();
    if (!decoded) return [];

    // Try Microsoft namespace claim first (used by ASP.NET Core)
    const msClaim = (decoded as any)[MS_ROLE_CLAIM];
    if (msClaim) {
      return Array.isArray(msClaim) ? msClaim : [msClaim];
    }

    // Fallback: short 'role' key
    const roleClaim = (decoded as any)['role'];
    if (roleClaim) {
      return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
    }

    return [];
  }

  private hasSuperAdminRole(): boolean {
    return this.getRolesFromToken().includes('Super Admin');
  }

  // ─── Convenience getters for template display ───────────────────────────────
  get deviceBrowser():  string { return this._loginform?.get('browser')?.value          || '—'; }
  get deviceOS():       string { return this._loginform?.get('operatingSystem')?.value   || '—'; }
  get deviceType():     string { return this._loginform?.get('device')?.value            || '—'; }
  get deviceIP():       string { return this._loginform?.get('publicIP')?.value          || '—'; }
  get deviceLat():      string { return this._loginform?.get('latitude')?.value          || '—'; }
  get deviceLng():      string { return this._loginform?.get('longitude')?.value         || '—'; }
  // ────────────────────────────────────────────────────────────────────────────

  proceedLogin(): void {
    if (this._loginform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj: userLogin = this._loginform.value;

      this.accountService.proceedLogin(_obj).subscribe({
        next: (res: any) => {
          this._response = res;

          if (this._response.isAuthenticated) {
            // Store the token first so getUser() can decode it
            this.authService.setToken(this._response.token);

            // Now check roles from the newly stored token
            if (this.hasSuperAdminRole()) {
              this.toastr.success('Welcome, Super Admin!', 'Login Successful');
              this.router.navigate(['/admin/dashboard']);
            } else {
              // Token stored but user is not Super Admin — clear and reject
              this.authService.clearToken();
              this.toastr.error(
                'Access denied. Super Admin role required.',
                'Unauthorized'
              );
              this.isSubmitting = false;
            }
          } else {
            this.toastr.error(
              this._response.message || 'Login failed',
              'Authentication Failed'
            );
            this.isSubmitting = false;
          }
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'An unexpected error occurred';
          this.toastr.error(msg, 'Login Failed');
          this.isSubmitting = false;
        }
      });
    } else {
      Object.keys(this._loginform.controls).forEach(k =>
        this._loginform.get(k)?.markAsTouched()
      );
      this.toastr.warning('Please fill in all required fields correctly', 'Validation');
    }
  }
}
