import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../../core/services/account/account.service';
import { GlobalService } from '../../../core/services/global/global.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
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
  ],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  // ─── Form ────────────────────────────────────────────────
  _fpForm!: FormGroup;
  isSubmitting = false;
  isResending  = false;
 
  // ─── Page state ──────────────────────────────────────────
  pageState: 'form' | 'success' = 'form';
  sentToEmail = '';
 
  // ─── Field states ────────────────────────────────────────
  emailFocused = false;
 
  get emailError(): boolean {
    const c = this._fpForm?.get('email');
    return !!(c?.invalid && c?.touched);
  }
 
  // ─── Resend cooldown ─────────────────────────────────────
  resendCooldown = 0;
  private cooldownInterval: any;
 
  // ─── Avatar ──────────────────────────────────────────────
  pupilX         = 0;
  pupilY         = 0;
  eyeBlink       = false;
  avatarThinking = false;
  avatarHappy    = false;
  bubbleText     = '';
 
  private blinkTimer: any;
  private bubbleTimer: any;
 
  // ─── Left-panel data ─────────────────────────────────────
  recoverySteps = [
    {
      title:  'Enter your email',
      desc:   'Provide your registered SAMS email address',
      active: true,
    },
    {
      title:  'Check your inbox',
      desc:   'Open the secure reset link we send you',
      active: false,
    },
    {
      title:  'Create new password',
      desc:   'Choose a strong password to secure your account',
      active: false,
    },
  ];
 
  badges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '⏰', label: 'Link expires in 24h' },
    { icon: '🛡️', label: 'One-time use' },
  ];
 
  particles = Array.from({ length: 18 }, () => ({
    x:        Math.random() * 100,
    y:        Math.random() * 100,
    delay:    +(Math.random() * 6).toFixed(1),
    duration: +(6 + Math.random() * 10).toFixed(1),
  }));
 
  successParticles = Array.from({ length: 10 }, (_, i) => ({
    angle: i * 36,
    dist:  40 + Math.random() * 25,
    delay: 0.5 + Math.random() * 0.2,
    color: ['#8b5cf6', '#a855f7', '#10b981', '#3b82f6', '#f59e0b'][i % 5],
  }));
 
  // ─────────────────────────────────────────────────────────
  constructor(
    private builder:        FormBuilder,
    private accountService: AccountService,
    private globalService:  GlobalService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone:         NgZone,
    private elRef:          ElementRef
  ) {}
 
  // ─── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
    this._fpForm = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
    });
 
    if (isPlatformBrowser(this.platformId)) {
      this._startBlinking();
      this._showBubble('🔑 Let\'s get you back in!');
    }
  }
 
  ngOnDestroy(): void {
    clearTimeout(this.blinkTimer);
    clearTimeout(this.bubbleTimer);
    clearInterval(this.cooldownInterval);
  }
 
  // ─── Mouse tracking → pupil ──────────────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
 
    const avatarEl = this.elRef.nativeElement.querySelector('.avatar-body');
    if (!avatarEl) return;
 
    const rect = avatarEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
 
    this.ngZone.run(() => {
      this.pupilX = dist > 0 ? (dx / dist) * Math.min(dist / 80, 3) : 0;
      this.pupilY = dist > 0 ? (dy / dist) * Math.min(dist / 80, 3) : 0;
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
    this._showBubble('📧 Enter your email');
  }
 
  onEmailBlur(): void {
    this.emailFocused = false;
  }
 
  onEmailInput(): void {
    const val: string = this._fpForm.get('email')?.value ?? '';
    if (val.includes('@') && val.includes('.')) {
      this.avatarHappy = true;
      this._showBubble('✅ Got it!', 1500);
      setTimeout(() => {
        this.ngZone.run(() => { this.avatarHappy = false; });
      }, 600);
    }
  }
 
  // ─── Submit ──────────────────────────────────────────────
  sendResetLink(): void {
    if (this._fpForm.invalid || this.isSubmitting) {
      Object.keys(this._fpForm.controls).forEach(key =>
        this._fpForm.get(key)?.markAsTouched()
      );
      this._showBubble('⚠️ Enter a valid email', 2000);
      return;
    }
 
    this.isSubmitting = true;
    this.avatarThinking = true;
    this._showBubble('📤 Sending link...', 3000);
 
    this.accountService.forgotPassword({ email: this._fpForm.value.email }).subscribe({
      next: (res) => {
        this.avatarThinking = false;
        this.isSubmitting   = false;
 
        // API always returns success (security best practice — don't reveal if email exists)
        // Show success state regardless
        this.sentToEmail = this._fpForm.value.email;
        this.avatarHappy = true;
        this._showBubble('🎉 Email sent!', 2000);
        setTimeout(() => {
          this.ngZone.run(() => { this.avatarHappy = false; });
        }, 700);
 
        this.pageState = 'success';
        this.startResendCooldown();
      },
      error: (err) => {
        console.error('Forgot password error:', err);
        this.avatarThinking = false;
        this.isSubmitting   = false;
        this._showBubble('❌ Something went wrong', 2500);
        this.globalService.showSnackbar(
          'Failed to send reset email. Please try again.',
          'error'
        );
      },
    });
  }
 
  // ─── Resend ──────────────────────────────────────────────
  resendLink(): void {
    if (this.resendCooldown > 0 || this.isResending) return;
 
    this.isResending = true;
    this._showBubble('📤 Resending...', 2500);
 
    this.accountService.forgotPassword({ email: this.sentToEmail }).subscribe({
      next: () => {
        this.isResending = false;
        this._showBubble('📬 Resent!', 2000);
        this.globalService.showSnackbar('Reset link resent successfully.', 'success');
        this.startResendCooldown();
      },
      error: () => {
        this.isResending = false;
        this._showBubble('❌ Try again', 2000);
        this.globalService.showSnackbar('Failed to resend. Please try again.', 'error');
      },
    });
  }
 
  // ─── Cooldown timer ──────────────────────────────────────
  startResendCooldown(): void {
    this.resendCooldown = 60;
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          clearInterval(this.cooldownInterval);
        }
      });
    }, 1000);
  }
 
  // Cooldown SVG dashoffset: full circle = 81.68 (2π × 13)
  getResendOffset(): number {
    const total   = 60;
    const elapsed = total - this.resendCooldown;
    return 81.68 * (elapsed / total);
  }
}
