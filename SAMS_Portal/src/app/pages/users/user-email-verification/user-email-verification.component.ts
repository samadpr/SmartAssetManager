import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { UserProfileService } from '../../../core/services/users/user-profile.service';

interface VerificationState {
  loading: boolean;
  success: boolean;
  message: string;
  isLoginAccess: boolean;
}

@Component({
  selector: 'app-user-email-verification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './user-email-verification.component.html',
  styleUrl: './user-email-verification.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms 300ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('300ms ease-out', 
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ])
    ]),
    trigger('spin', [
      transition('* => active', [
        animate('600ms linear')
      ])
    ])
  ]
})
export class UserEmailVerificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly redirectDelay = 2000;
  private redirectTimeout: any;

  verificationState: VerificationState = {
    loading: true,
    success: false,
    message: '',
    isLoginAccess: false
  };

  readonly icons = {
    success: 'check_circle',
    error: 'error',
    loading: 'hourglass_empty',
    redirect: 'login'
  };

  readonly messages = {
    verifying: 'Verifying your email...',
    invalid: 'Invalid verification link',
    failed: 'Email verification failed',
    success: 'Email verified successfully!',
    redirecting: 'Redirecting to login...'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.initializeVerification();
  }

  ngOnDestroy(): void {
    this.clearRedirectTimeout();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVerification(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const userId = params['userId'];
        const token = params['token'];

        if (userId && token) {
          this.performEmailVerification(userId, token);
        } else {
          this.handleInvalidLink();
        }
      });
  }

  private performEmailVerification(userId: string, token: string): void {
    this.userProfileService.verifyEmail(userId, token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleVerificationSuccess(response),
        error: (error) => this.handleVerificationError(error)
      });
  }

  private handleVerificationSuccess(response: any): void {
    this.verificationState = {
      loading: false,
      success: response.success,
      message: response.message || this.messages.success,
      isLoginAccess: response.isLoginAccess || false
    };

    if (response.success && response.isLoginAccess) {
      this.setupRedirect();
    }
  }

  private handleVerificationError(error: any): void {
    const errorMessage = error?.error?.message || this.messages.failed;

    this.verificationState = {
      loading: false,
      success: false,
      message: errorMessage,
      isLoginAccess: false
    };
  }

  private handleInvalidLink(): void {
    this.verificationState = {
      loading: false,
      success: false,
      message: this.messages.invalid,
      isLoginAccess: false
    };
  }

  private setupRedirect(): void {
    this.clearRedirectTimeout();
    this.redirectTimeout = setTimeout(() => {
      this.router.navigate(['/login']);
    }, this.redirectDelay);
  }

  private clearRedirectTimeout(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
      this.redirectTimeout = null;
    }
  }

  navigateToLogin(): void {
    this.clearRedirectTimeout();
    this.router.navigate(['/login']);
  }

  navigateToHome(): void {
    this.clearRedirectTimeout();
    this.router.navigate(['/dashboard']);
  }

  getStatusIcon(): string {
    if (this.verificationState.loading) return this.icons.loading;
    return this.verificationState.success ? this.icons.success : this.icons.error;
  }

  getStatusClass(): string {
    if (this.verificationState.loading) return 'status-loading';
    return this.verificationState.success ? 'status-success' : 'status-error';
  }
}