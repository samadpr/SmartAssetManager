import { animate, style, transition, trigger } from "@angular/animations";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AccountService } from "../../../core/services/account/account.service";
import { GlobalService } from "../../../core/services/global/global.service";

// ── Custom validator: passwords must match ───────────────────
function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw = group.get('password')?.value ?? '';
    const cpw = group.get('confirmPassword')?.value ?? '';
    return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
  };
}

// ── Custom validator: password strength ──────────────────────
function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null;
    const hasMin = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    if (hasMin && hasUpper && hasNumber && hasSpecial) return null;
    return { pattern: true };
  };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  animations: [
    trigger('successIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.96)' }),
        animate(
          '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
    ]),
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(
          '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

  // ─── Form ────────────────────────────────────────────────
  _rpForm!: FormGroup;
  isSubmitting = false;

  // ─── Page state ──────────────────────────────────────────
  pageState: 'form' | 'success' | 'invalid' = 'form';

  // ─── URL params ──────────────────────────────────────────
  email = '';
  token = '';

  // ─── Field states ────────────────────────────────────────
  passwordFocused = false;
  confirmFocused = false;
  hidePassword = true;
  hideConfirm = true;

  // ─── Password strength ───────────────────────────────────
  pwStrength = 0;
  pwStrengthLabel = '';
  pwRules = { length: false, upper: false, number: false, special: false };

  // ─── Redirect countdown ──────────────────────────────────
  redirectCountdown = 5;
  private countdownInterval: any;

  // ─── Avatar ──────────────────────────────────────────────
  pupilX = 0;
  pupilY = 0;
  eyeBlink = false;
  avatarHappy = false;
  bubbleText = '';

  private blinkTimer: any;
  private bubbleTimer: any;

  // ─── Computed helpers ────────────────────────────────────
  get confirmError(): boolean {
    const cpw = this._rpForm?.get('confirmPassword');
    return !!(
      (cpw?.invalid && cpw?.touched) ||
      (this._rpForm?.hasError('passwordMismatch') && cpw?.touched && cpw?.value)
    );
  }

  get passwordsMatch(): boolean {
    const pw = this._rpForm?.get('password')?.value;
    const cpw = this._rpForm?.get('confirmPassword')?.value;
    return !!(pw && cpw && pw === cpw && this._rpForm?.get('confirmPassword')?.touched);
  }

  // ─── Left-panel data ─────────────────────────────────────
  badges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '🛡️', label: 'GDPR Ready' },
    { icon: '⚡', label: 'Instant Access' },
  ];

  particles = Array.from({ length: 18 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: +(Math.random() * 6).toFixed(1),
    duration: +(6 + Math.random() * 10).toFixed(1),
  }));

  successParticles = Array.from({ length: 10 }, (_, i) => ({
    angle: i * 36,
    dist: 40 + Math.random() * 25,
    delay: 0.5 + Math.random() * 0.2,
    color: ['#8b5cf6', '#a855f7', '#10b981', '#3b82f6', '#f59e0b'][i % 5],
  }));

  // ─────────────────────────────────────────────────────────
  constructor(
    private builder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private globalService: GlobalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private elRef: ElementRef
  ) { }

  // ─── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
    // Read email & token from query params
    // Email sent as plain string, token sent as base64url-encoded string
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] ?? '';
      this.token = params['token'] ?? '';

      if (!this.email || !this.token) {
        this.pageState = 'invalid';
        return;
      }
    });

    this._rpForm = this.builder.group(
      {
        password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator()]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator() }
    );

    if (isPlatformBrowser(this.platformId)) {
      this._startBlinking();
      this._showBubble('🔐 Choose a strong password!');
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.blinkTimer);
    clearTimeout(this.bubbleTimer);
    clearInterval(this.countdownInterval);
  }

  // ─── Mouse tracking → pupil ──────────────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const avatarEl = this.elRef.nativeElement.querySelector('.avatar-body');
    if (!avatarEl) return;

    const rect = avatarEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.ngZone.run(() => {
      this.pupilX = dist > 0 ? (dx / dist) * Math.min(dist / 80, 3) : 0;
      this.pupilY = dist > 0 ? (dy / dist) * Math.min(dist / 80, 3) : 0;
    });
  }

  // ─── Avatar helpers ───────────────────────────────────────
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

  private _showBubble(text: string, duration = 2800): void {
    clearTimeout(this.bubbleTimer);
    this.bubbleText = text;
    this.bubbleTimer = setTimeout(() => {
      this.ngZone.run(() => { this.bubbleText = ''; });
    }, duration);
  }

  // ─── Password field events ───────────────────────────────
  onPasswordFocus(): void {
    this.passwordFocused = true;
    this._showBubble('🔒 I won\'t peek!', 2000);
  }

  onPasswordBlur(): void {
    this.passwordFocused = false;
  }

  onPasswordInput(): void {
    const val: string = this._rpForm.get('password')?.value ?? '';

    this.pwRules = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val),
    };

    const score = Object.values(this.pwRules).filter(Boolean).length;
    this.pwStrength = score;
    this.pwStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][score] ?? '';

    if (score === 4) {
      this.avatarHappy = true;
      this._showBubble('💪 Strong password!', 1800);
      setTimeout(() => {
        this.ngZone.run(() => { this.avatarHappy = false; });
      }, 700);
    }
  }

  onConfirmFocus(): void {
    this.confirmFocused = true;
    this._showBubble('🔐 One more time!', 2000);
  }

  onConfirmBlur(): void {
    this.confirmFocused = false;
  }

  // ─── Submit ──────────────────────────────────────────────
  resetPassword(): void {
    if (this._rpForm.invalid || this.isSubmitting) {
      Object.keys(this._rpForm.controls).forEach(key =>
        this._rpForm.get(key)?.markAsTouched()
      );
      this._showBubble('⚠️ Fix the errors first', 2000);
      return;
    }

    this.isSubmitting = true;
    this._showBubble('🔄 Resetting...', 3000);

    const payload = {
      email: this.email,
      token: this.token,
      password: this._rpForm.value.password,
      confirmPassword: this._rpForm.value.confirmPassword,
    };

    this.accountService.resetPassword(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;

        if (res.success) {
          this.avatarHappy = true;
          this._showBubble('🎉 Password reset!', 2500);
          setTimeout(() => {
            this.ngZone.run(() => { this.avatarHappy = false; });
          }, 700);

          this.pageState = 'success';
          this.globalService.showSnackbar('Password reset successfully!', 'success');
          this._startRedirectCountdown();
        } else {
          // Handle invalid / expired token from API
          if (
            res.message?.toLowerCase().includes('invalid') ||
            res.message?.toLowerCase().includes('expired') ||
            res.message?.toLowerCase().includes('token')
          ) {
            this.pageState = 'invalid';
          } else {
            this._showBubble('❌ Reset failed', 2000);
            this.globalService.showSnackbar(res.message || 'Reset failed. Please try again.', 'error');
          }
        }
      },
      error: (err) => {
        console.error('Reset password error:', err);
        this.isSubmitting = false;
        this._showBubble('😕 Something went wrong', 2500);
        this.globalService.showSnackbar(
          'An unexpected error occurred. Please try again.',
          'error'
        );
      },
    });
  }

  // ─── Countdown & auto-redirect ───────────────────────────
  private _startRedirectCountdown(): void {
    this.redirectCountdown = 5;
    clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.redirectCountdown--;

        if (this.redirectCountdown <= 0) {
          clearInterval(this.countdownInterval);
          this.router.navigateByUrl('/login');
        }
      });
    }, 1000);
  }

  // Countdown SVG dashoffset: full circle = 163.36 (2π × 26)
  getCountdownOffset(): number {
    const total = 5;
    const elapsed = total - this.redirectCountdown;
    return 163.36 * (elapsed / total);
  }
}
