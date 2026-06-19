import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, QueryList, ViewChildren, NgZone, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { GlobalService } from '../../../core/services/global/global.service';


// OTP box model
export interface OtpBox {
  value: string;
  focused: boolean;
}

@Component({
  selector: 'app-confirmotp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmotp.component.html',
  styleUrl: './confirmotp.component.scss',
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('errorIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ]
})
export class ConfirmotpComponent implements OnInit, OnDestroy, AfterViewInit {
 
  @ViewChildren('otpBox') otpBoxEls!: QueryList<ElementRef<HTMLInputElement>>;
 
  // ─── OTP state ───────────────────────────────────────────
  /** 6 individual box models */
  otpBoxes: OtpBox[] = Array.from({ length: 6 }, () => ({ value: '', focused: false }));
 
  /** Derived full OTP string */
  get otpFullValue(): string {
    return this.otpBoxes.map(b => b.value).join('');
  }
 
  regresponse!: registerconfirm;
  isLoading    = false;
  isSubmitting = false;
  isResending  = false;
  otpError     = false;
  otpVerified  = false;
  errorMessage = '';
  resendCooldown = 0;
 
  private cooldownInterval: any;
 
  // ─── Avatar ──────────────────────────────────────────────
  pupilX         = 0;
  pupilY         = 0;
  eyeBlink       = false;
  avatarHappy    = false;
  avatarThinking = false;
  avatarError    = false;
  bubbleText     = '';
 
  private blinkTimer: any;
  private bubbleTimer: any;
 
  // ─── Left panel data ─────────────────────────────────────
  steps = [
    {
      title:   'Create your account',
      desc:    'Personal details filled in',
      done:    true,
      current: false,
    },
    {
      title:   'Verify your email',
      desc:    'Enter the code we sent you',
      done:    false,
      current: true,
    },
    {
      title:   'Set up your organisation',
      desc:    'Tell us about your company',
      done:    false,
      current: false,
    },
    {
      title:   'Start managing assets',
      desc:    'You\'re ready to go!',
      done:    false,
      current: false,
    },
  ];
 
  badges = [
    { icon: '🔒', label: 'SSL Secured' },
    { icon: '⚡', label: 'Instant Setup' },
    { icon: '🛡️', label: 'GDPR Ready' },
  ];
 
  particles = Array.from({ length: 20 }, () => ({
    x:        Math.random() * 100,
    y:        Math.random() * 100,
    delay:    +(Math.random() * 6).toFixed(1),
    duration: +(6 + Math.random() * 10).toFixed(1),
  }));
 
  // ─────────────────────────────────────────────────────────
  constructor(
    private toastr:       ToastrService,
    private router:       Router,
    private services:     AccountService,
    private authService:  AuthService,
    private userStorage:  UserProfileStorageService,
    private ngZone:       NgZone,
    private elRef:        ElementRef,
    private globalService: GlobalService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}
 
  // ─── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
    this.regresponse = this.services._registerresp();
 
    if (!this.regresponse?.email) {
      this.globalService.showSnackbar('Please complete registration first', 'error');
      this.router.navigateByUrl('/register');
      return;
    }
 
    this.isLoading = true;
    setTimeout(() => {
      this.ngZone.run(() => { this.isLoading = false; });
    }, 900);
 
    this.startResendCooldown();
 
    if (isPlatformBrowser(this.platformId)) {
      this._startBlinking();
      this._showBubble('📬 Check your email!');
    }
  }
 
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (isPlatformBrowser(this.platformId)) {
        this._focusBox(0);
      }
    }, 1050);
  }
 
  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
    clearTimeout(this.blinkTimer);
    clearTimeout(this.bubbleTimer);
  }
 
  // ─── Mouse pupil tracking ─────────────────────────────────
  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.elRef.nativeElement.querySelector('.avatar-body');
    if (!el) return;
    const rect = el.getBoundingClientRect();
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
 
  // ─── Avatar helpers ───────────────────────────────────────
  private _startBlinking(): void {
    const next = () => {
      this.blinkTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.eyeBlink = true;
          setTimeout(() => { this.eyeBlink = false; next(); }, 130);
        });
      }, 2200 + Math.random() * 3000);
    };
    next();
  }
 
  private _showBubble(text: string, duration = 2800): void {
    clearTimeout(this.bubbleTimer);
    this.bubbleText = text;
    this.bubbleTimer = setTimeout(() => {
      this.ngZone.run(() => { this.bubbleText = ''; });
    }, duration);
  }
 
  private _triggerHappy(bubble: string): void {
    this.avatarHappy = true;
    this._showBubble(bubble, 2000);
    setTimeout(() => { this.ngZone.run(() => { this.avatarHappy = false; }); }, 700);
  }
 
  private _triggerError(bubble: string): void {
    this.avatarError = true;
    this._showBubble(bubble, 2400);
    setTimeout(() => { this.ngZone.run(() => { this.avatarError = false; }); }, 600);
  }
 
  private _triggerThinking(bubble: string): void {
    this.avatarThinking = true;
    this._showBubble(bubble, 2000);
    setTimeout(() => { this.ngZone.run(() => { this.avatarThinking = false; }); }, 500);
  }
 
  // ─── OTP Box focus helpers ────────────────────────────────
  private _focusBox(index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const inputs = this.otpBoxEls?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }
 
  onBoxFocus(index: number): void {
    this.otpBoxes[index].focused = true;
    this.otpError = false;
    this.errorMessage = '';
    // Avatar looks at box as user fills in
    if (index === 0) this._showBubble('👀 I\'m watching...', 1500);
  }
 
  onBoxBlur(index: number): void {
    this.otpBoxes[index].focused = false;
  }
 
  onBoxInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
 
    // If user typed more than one digit (e.g. paste into a box), handle first char only
    if (val.length > 1) {
      val = val[0];
    }
 
    this.otpBoxes[index].value = val;
    input.value = val;
 
    if (val) {
      // Move to next box
      if (index < 5) {
        this._focusBox(index + 1);
      } else {
        // Last box filled — auto-submit
        this._showBubble('🤞 Verifying...', 2000);
        setTimeout(() => this.confirmOTP(), 250);
      }
 
      // React at halfway
      if (index === 2) {
        this._triggerThinking('🤔 Keep going...', );
      }
    }
  }
 
  onBoxKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.otpBoxes[index].value) {
        this.otpBoxes[index].value = '';
      } else if (index > 0) {
        this.otpBoxes[index - 1].value = '';
        this._focusBox(index - 1);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this._focusBox(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this._focusBox(index + 1);
    } else if (event.key === 'Enter') {
      this.confirmOTP();
    }
  }
 
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;
 
    pasted.split('').forEach((char, i) => {
      if (i < 6) this.otpBoxes[i].value = char;
    });
 
    const nextEmpty = Math.min(pasted.length, 5);
    this._focusBox(nextEmpty);
    this._showBubble('📋 Code pasted!', 1500);
 
    if (pasted.length === 6) {
      setTimeout(() => this.confirmOTP(), 300);
    }
  }
 
  // ─── Verify ───────────────────────────────────────────────
  confirmOTP(): void {
    const code = this.otpFullValue;
 
    if (code.length !== 6) {
      this.otpError = true;
      this.errorMessage = 'Please enter all 6 digits of the verification code.';
      this._triggerError('⚠️ 6 digits needed!');
      return;
    }
 
    if (this.isSubmitting || this.otpVerified) return;
 
    this.isSubmitting = true;
    this.errorMessage = '';
    this.otpError     = false;
    this.regresponse.otpText = code;
 
    this._showBubble('🔍 Checking...', 3000);
 
    this.services.confirmRegistration(this.regresponse).subscribe({
      next: (response: loginresponse) => {
        if (response.isAuthenticated) {
          this.authService.setToken(response.token);
 
          const profile: localStorageUserProfile = {
            email:     response.email,
            fullName:  response.fullName,
            createdBy: response.createdBy,
          };
          this.userStorage.save(profile);
 
          // Mark verified & celebrate
          this.otpVerified = true;
          this.otpBoxes.forEach(b => { /* success class via binding */ });
          this._triggerHappy('🎉 Verified!');
 
          this.globalService.showSnackbar('Email Verified & Logged in Successfully!', 'success');
          this.services._registerresp.set({ email: '', otpText: '' });
 
          setTimeout(() => {
            this.router.navigateByUrl('/company-onboarding');
          }, 1200);
        } else {
          this.errorMessage = response.message || 'Verification failed. Please try again.';
          this.otpError = true;
          this._triggerError('❌ Wrong code!');
          this.globalService.showSnackbar(this.errorMessage + ' Verification Failed', 'error');
          // Clear boxes for re-entry
          this._clearBoxes();
        }
      },
      error: (error) => {
        console.error('OTP verification error:', error);
        this.errorMessage = 'Network error. Please check your connection and try again.';
        this.otpError = true;
        this._triggerError('😕 Network issue');
        this.globalService.showToastr('Network error. Please check your connection and try again.', 'error');
        this.isSubmitting = false;
        this._clearBoxes();
      },
      complete: () => {
        if (!this.otpVerified) {
          this.isSubmitting = false;
        }
      }
    });
  }
 
  private _clearBoxes(): void {
    this.otpBoxes.forEach(b => { b.value = ''; });
    setTimeout(() => this._focusBox(0), 150);
  }
 
  // ─── Resend ───────────────────────────────────────────────
  resendOTP(): void {
    if (this.resendCooldown > 0 || this.isResending) return;
 
    this.isResending  = true;
    this.errorMessage = '';
    this.otpError     = false;
 
    this._showBubble('📤 Sending new code...', 2500);
 
    this.services.resendVerificationCode(this.regresponse.email).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.globalService.showSnackbar('A new verification code has been sent to your email', 'info');
          this._clearBoxes();
          this.startResendCooldown();
          this._triggerHappy('📬 Code sent!');
        } else {
          this.errorMessage = response.message || 'Failed to resend code. Please try again.';
          this._triggerError('❌ Resend failed');
          this.globalService.showSnackbar(this.errorMessage + ' Resend Failed', 'error');
        }
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        this.errorMessage = 'Failed to resend code. Please try again later.';
        this._triggerError('😕 Try again');
        this.globalService.showToastr('Network error. Please check your connection and try again.', 'error');
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }
 
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
  getCooldownOffset(): number {
    const total = 60;
    const elapsed = total - this.resendCooldown;
    return 81.68 * (elapsed / total);
  }
 
  goBack(): void {
    this.services._registerresp.set({ email: '', otpText: '' });
    this.router.navigateByUrl('/register');
  }
}