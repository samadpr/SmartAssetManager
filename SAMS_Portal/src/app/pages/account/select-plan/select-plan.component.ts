import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SubscriptionsService } from '../../../core/services/admin/subscriptions/subscriptions.service';
import { Subscription } from '../../../core/models/admin/subscriptions.interface';

@Component({
  selector: 'app-select-plan',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRippleModule,
  ],
  templateUrl: './select-plan.component.html',
  styleUrl: './select-plan.component.scss'
})
export class SelectPlanComponent {
  plans   = signal<Subscription[]>([]);
  loading = signal(true);
  selectedPlanId = signal<number | null>(null);

  // Derived — highlighted plan (one with sortOrder=1 or badgeLabel set)
  featuredPlanId = computed(() => {
    const list = this.plans();
    const featured = list.find(p => p.badgeLabel) ?? list[0];
    return featured?.id ?? null;
  });

  constructor(
    private subscriptionsService: SubscriptionsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    // Only fetch standard (non-custom) plans for public display
    this.subscriptionsService.getSubscriptionsByCustom(false).subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          // Sort by sortOrder, fall back to creation order
          const sorted = [...res.data].sort(
            (a: Subscription, b: Subscription) =>
              (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)
          );
          this.plans.set(sorted);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  selectPlan(plan: Subscription): void {
    this.selectedPlanId.set(plan.id ?? null);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDuration(days: number): string {
    if (days >= 365) { const y = Math.round(days / 365); return `${y} Year${y > 1 ? 's' : ''}`; }
    if (days >= 30)  { const m = Math.round(days / 30);  return `${m} Month${m > 1 ? 's' : ''}`; }
    return `${days} Days`;
  }

  formatDurationShort(days: number): string {
    if (days >= 365) return `${Math.round(days / 365)}yr`;
    if (days >= 30)  return `${Math.round(days / 30)}mo`;
    return `${days}d`;
  }

  getCardColor(plan: Subscription): string {
    return plan.cardColor || '#7c3aed';
  }

  getCardColorSecondary(plan: Subscription): string {
    return plan.cardColorSecondary || '#a855f7';
  }

  isFeatured(plan: Subscription): boolean {
    return plan.id === this.featuredPlanId();
  }

  isSelected(plan: Subscription): boolean {
    return plan.id === this.selectedPlanId();
  }

  get currentYear(): number { return new Date().getFullYear(); }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
