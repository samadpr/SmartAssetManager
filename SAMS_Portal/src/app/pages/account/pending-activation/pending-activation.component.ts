import {
  Component, OnInit, OnDestroy, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription, switchMap } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
 
import { MatCardModule }            from '@angular/material/card';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
 
import { CompanyService }   from '../../../core/services/company/company.service';
import { AuthService }      from '../../../core/services/auth/auth.service';
 
/** Interval between status-poll API calls (ms) */
const POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-pending-activation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pending-activation.component.html',
  styleUrl: './pending-activation.component.scss',
    animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('350ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(32px)', opacity: 0 }),
        animate('450ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class PendingActivationComponent implements OnInit, OnDestroy {
 
  // ── Signals ──────────────────────────────────────────────────────────────
  isActive  = signal(false);
  countdown = signal(POLL_INTERVAL_MS / 1000);  // visible countdown
  pollDots  = signal('');                         // animated "..." suffix
 
  // ── Internal ─────────────────────────────────────────────────────────────
  private pollSub?: Subscription;
  private tickSub?: Subscription;
  private dotsSub?: Subscription;
  private dotsCount = 0;
 
  constructor(
    private companyService: CompanyService,
    private authService:    AuthService,
    private router:         Router
  ) {}
 
  // ═════════════════════════════════════════════════════════════════════════
  ngOnInit(): void {
    // 1. Immediate first check
    this._checkActivation();
 
    // 2. Poll every POLL_INTERVAL_MS
    this.pollSub = interval(POLL_INTERVAL_MS).pipe(
      switchMap(() => this.companyService.getCurrentUserCompany())
    ).subscribe(res => {
      if (res?.success && res.data?.isActive === true) {
        this._onActivated();
      } else {
        // Reset countdown after each poll fires
        this.countdown.set(POLL_INTERVAL_MS / 1000);
      }
    });
 
    // 3. 1-second tick — countdown display
    this.tickSub = interval(1000).subscribe(() => {
      this.countdown.update(v => (v > 1 ? v - 1 : POLL_INTERVAL_MS / 1000));
    });
 
    // 4. Animated dots "..." every 600ms
    this.dotsSub = interval(600).subscribe(() => {
      this.dotsCount = (this.dotsCount + 1) % 4;
      this.pollDots.set('.'.repeat(this.dotsCount));
    });
  }
 
  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.tickSub?.unsubscribe();
    this.dotsSub?.unsubscribe();
  }
 
  // ─── Helpers ──────────────────────────────────────────────────────────────
 
  private _checkActivation(): void {
    this.companyService.getCurrentUserCompany().subscribe(res => {
      if (res?.success && res.data?.isActive === true) {
        this._onActivated();
      }
    });
  }
 
  private _onActivated(): void {
    this.isActive.set(true);
    // Stop polling
    this.pollSub?.unsubscribe();
    this.tickSub?.unsubscribe();
    this.dotsSub?.unsubscribe();
    // Auto-redirect after 2.5s so the user sees the success state
    setTimeout(() => this.goToDashboard(), 2500);
  }
 
  goToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }
 
  logout(): void {
    this.authService.clearToken();
    this.router.navigateByUrl('/login');
  }
}
