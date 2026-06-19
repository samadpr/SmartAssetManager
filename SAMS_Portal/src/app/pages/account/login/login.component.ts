import { Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { loginresponse, userLogin } from '../../../core/models/interfaces/account/user.model';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../../core/services/account/account.service';
import { DeviceInfoService } from '../../../core/services/account/device/device-info.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { GlobalService } from '../../../core/services/global/global.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  // ─── Form ────────────────────────────────────────────────
  _loginform!: FormGroup;
  _response!: loginresponse;
  hidePassword = true;
  isSubmitting = false;
  localStorageUserProfile: localStorageUserProfile | null = null;
  deviceInfoLoaded = false;

  // ─── Field focus states ──────────────────────────────────
  emailFocused = false;
  passwordFocused = false;

  get emailError(): boolean {
    const c = this._loginform?.get('email');
    return !!(c?.invalid && c?.touched);
  }

  get passwordError(): boolean {
    const c = this._loginform?.get('password');
    return !!(c?.invalid && c?.touched);
  }

  // ─── Avatar ──────────────────────────────────────────────
  pupilX = 0;
  pupilY = 0;
  eyeBlink = false;
  avatarPeek = false;
  avatarHappy = false;
  bubbleText = '';

  private blinkTimer: any;
  private bubbleTimer: any;
  private avatarEl!: HTMLElement;

  // ─── Left-panel data ─────────────────────────────────────
  features = [
    'Secure asset management system',
    'Role-based access control (RBAC)',
    'QR / Barcode generation & scanning',
    'Asset transfer & tracking history',
    'Maintenance & issue management',
  ];

  particles = Array.from({ length: 18 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: +(Math.random() * 6).toFixed(1),
    duration: +(6 + Math.random() * 10).toFixed(1),
  }));

  // ─────────────────────────────────────────────────────────
  constructor(
    private builder: FormBuilder,
    private accountService: AccountService,
    private deviceInfoService: DeviceInfoService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastr: ToastrService,
    private router: Router,
    private authService: AuthService,
    private userProfileStorage: UserProfileStorageService,
    private companyService: CompanyService,
    private globelService: GlobalService,
    private ngZone: NgZone,
    private elRef: ElementRef,
  ) { }

  // ─── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
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
      device: [''],
    });

    this.deviceInfoService.patchFormWithDeviceInfo(this._loginform).subscribe({
      next: () => { this.deviceInfoLoaded = true; },
      error: () => { this.deviceInfoLoaded = true; },
    });

    if (isPlatformBrowser(this.platformId)) {
      this._startBlinking();
      this._showBubble('👋 Welcome back!');
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.blinkTimer);
    clearTimeout(this.bubbleTimer);
  }

  // ─── Mouse tracking → pupil movement ─────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const avatarContainer = this.elRef.nativeElement.querySelector('.avatar-body');
    if (!avatarContainer) return;

    const rect = avatarContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 3; // clamp pupil movement

    this.ngZone.run(() => {
      this.pupilX = dist > 0 ? (dx / dist) * Math.min(dist / 80, maxDist) : 0;
      this.pupilY = dist > 0 ? (dy / dist) * Math.min(dist / 80, maxDist) : 0;
    });
  }

  // ─── Avatar blinking ─────────────────────────────────────
  private _startBlinking(): void {
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 3000;
      this.blinkTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.eyeBlink = true;
          setTimeout(() => { this.eyeBlink = false; scheduleNext(); }, 150);
        });
      }, delay);
    };
    scheduleNext();
  }

  // ─── Speech bubble ───────────────────────────────────────
  private _showBubble(text: string, duration = 2800): void {
    clearTimeout(this.bubbleTimer);
    this.bubbleText = text;
    this.bubbleTimer = setTimeout(() => {
      this.ngZone.run(() => { this.bubbleText = ''; });
    }, duration);
  }

  // ─── Email field events ──────────────────────────────────
  onEmailFocus(): void {
    this.emailFocused = true;
    this.avatarPeek = true;
    this._showBubble('📧 Enter your email');
  }

  onEmailBlur(): void {
    this.emailFocused = false;
    this.avatarPeek = false;
  }

  onEmailInput(): void {
    const val: string = this._loginform.get('email')?.value ?? '';
    if (val.includes('@') && val.includes('.')) {
      this.avatarHappy = true;
      this._showBubble('✅ Looks good!', 1500);
      setTimeout(() => { this.ngZone.run(() => { this.avatarHappy = false; }); }, 600);
    }
  }

  // ─── Password field events ───────────────────────────────
  onPasswordFocus(): void {
    this.passwordFocused = true;
    this._showBubble('🔒 I won\'t peek!', 2000);
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  // ─── Login submit ─────────────────────────────────────────
  proceedlogin(): void {
    if (this._loginform.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const _obj: userLogin = this._loginform.value;

      this.accountService.proceedLogin(_obj).subscribe({
        next: (res) => {
          this._response = res;
          if (this._response.isAuthenticated) {
            this.authService.setToken(this._response.token);
            const roles = this.authService.getRoles();

            if (roles.includes('Super Admin')) {
              this.authService.clearToken();
              this.toastr.error('Super Admin must login via Admin Portal', 'Access Denied');
              this.isSubmitting = false;
              return;
            }

            this.localStorageUserProfile = {
              email: this._response.email,
              fullName: this._response.fullName,
              createdBy: this._response.createdBy,
            };
            this.userProfileStorage.save(this.localStorageUserProfile);

            // Happy avatar on success
            this.avatarHappy = true;
            this._showBubble('🎉 Welcome!', 1500);

            this.globelService.showSnackbar('Welcome back!', 'success');
            this._redirectByActivationStatus();
          } else {
            this._showBubble('❌ Try again', 2000);
            this.globelService.showSnackbar(this._response.message + 'Login Failed', 'error');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          const errorMessage = error?.error?.message || 'An unexpected error occurred';
          this._showBubble('😕 Login failed', 2000);
          this.globelService.showSnackbar(`Failed due to ${errorMessage}` + 'Login Failed', 'error');
          this.isSubmitting = false;
        },
      });
    } else {
      Object.keys(this._loginform.controls).forEach((key) =>
        this._loginform.get(key)?.markAsTouched()
      );
      this._showBubble('⚠️ Fill all fields', 2000);
      this.toastr.warning('Please fill in all required fields correctly', 'Form Validation');
    }
  }

  // ─── Redirect logic (unchanged) ──────────────────────────
  private _redirectByActivationStatus(): void {
    this.companyService.getCurrentUserCompany().subscribe({
      next: (res) => {
        if (res?.success && res.data && res.data?.subscriptionId != null) {
          if (res.data.isActive === true) {
            this.router.navigateByUrl('/');
          } else {
            this.router.navigateByUrl('/pending-activation');
          }
        } else if (
          res?.success &&
          res.data?.subscriptionId == null &&
          (res.data?.isActive == false || res.data?.isActive == null)
        ) {
          this.router.navigateByUrl('/company-onboarding');
        }
      },
      error: () => {
        this.router.navigateByUrl('/dashboard');
      },
    });
  }
}
