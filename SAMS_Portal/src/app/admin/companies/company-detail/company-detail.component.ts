import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';

import { AdminPageHeaderComponent } from '../../shared/widgets/admin-page-header/admin-page-header.component';
import { GlobalService } from '../../../core/services/global/global.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssignSubscriptionDialogComponent } from '../assign-subscription-dialog/assign-subscription-dialog.component';
import { ToggleActiveDialogComponent } from '../toggle-active-dialog/toggle-active-dialog.component';
import { AdminUserDetail, CompanyDetailResponse, CompanyFullInfo, CompanyStats, LoginAccessUser, SubscriptionDetail } from '../../../core/models/admin/companies-details.interface';
import { CompanyDetailService } from '../../../core/services/admin/company/company-detail.service';
import { SubscriptionStatus } from '../companies-list/companies-list.component';


// ── Chart palette ─────────────────────────────────────────────
const PALETTE = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316',
];
@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    MatDividerModule, MatTableModule, MatBadgeModule,
    MatDialogModule, MatSlideToggleModule,
    BaseChartDirective,
    AdminPageHeaderComponent,
  ],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss'
})
export class CompanyDetailComponent implements OnInit, OnDestroy {
 
  private destroy$ = new Subject<void>();
 
  companyId = 0;
  orgId = '';
 
  isLoading = signal(true);
  error = signal('');
 
  // ── Data signals ──────────────────────────────────────────────────────────
  company    = signal<CompanyFullInfo | null>(null);
  adminUser  = signal<AdminUserDetail | null>(null);
  subscription = signal<SubscriptionDetail | null>(null);
  stats      = signal<CompanyStats | null>(null);
  loginUsers = signal<LoginAccessUser[]>([]);
 
  // ── Computed helpers ──────────────────────────────────────────────────────
  breadcrumbs = computed(() => [
    { label: 'Companies', url: '/admin/companies-list' },
    { label: this.company()?.name ?? 'Company Detail' }
  ]);
 
  location = computed(() => {
    const c = this.company();
    if (!c) return '';
    return [c.city, c.country].filter(Boolean).join(', ');
  });
 
  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION STATUS — same rules as companies-list
  // ─────────────────────────────────────────────────────────────────────────
 
  /**
   * Computed status drives badge, toggle guard, and tooltip.
   *
   * 'no-plan'       → no subscriptionId
   * 'plan-assigned' → has subscriptionId, missing one/both dates
   * 'expired'       → has all fields, expiryDate < today
   * 'active'        → has all fields, expiryDate >= today
   */
  subscriptionStatus = computed((): SubscriptionStatus => {
    const c = this.company();
    if (!c || !c.subscriptionId) return 'no-plan';
    if (!c.subscriptionDate || !c.subscriptionExpiryDate) return 'plan-assigned';
 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(c.subscriptionExpiryDate);
    expiry.setHours(0, 0, 0, 0);
 
    return expiry < today ? 'expired' : 'active';
  });
 
  subscriptionBadge = computed((): { label: string; icon: string; css: string } => {
    switch (this.subscriptionStatus()) {
      case 'no-plan':
        return { label: 'No Plan',       icon: 'block',      css: 'badge--no-plan'  };
      case 'plan-assigned':
        return { label: 'Plan Assigned', icon: 'pending',    css: 'badge--assigned' };
      case 'expired':
        return { label: 'Expired',       icon: 'event_busy', css: 'badge--expired'  };
      case 'active':
        return { label: 'Subscribed',    icon: 'verified',   css: 'badge--active'   };
    }
  });
 
  /**
   * Toggle enabled ONLY when status is 'active':
   * ✅ has subscriptionId + both dates + expiry not crossed
   *
   * 'expired' → toggle DISABLED (renew plan first)
   */
  canToggleActive = computed(() => this.subscriptionStatus() === 'active');
 
  toggleTooltip = computed(() => {
    switch (this.subscriptionStatus()) {
      case 'no-plan':       return 'Assign a subscription plan before activating';
      case 'plan-assigned': return 'Subscription dates required to activate';
      case 'expired':       return 'Subscription has expired — renew to activate';
      case 'active':
        return this.company()?.isActive
          ? 'Active — click to suspend'
          : 'Suspended — click to activate';
    }
  });
 
  /** Whether company is currently active/inactive */
  isActive = computed(() => this.company()?.isActive ?? false);
 
  // ── Subscription progress ────────────────────────────────────────────────
  subscriptionUsedPct = computed(() => {
    const sub = this.subscription();
    if (!sub?.durationDays) return 0;
    const used = sub.durationDays - (sub.daysRemaining ?? 0);
    return Math.min(100, Math.round((used / sub.durationDays) * 100));
  });
 
  daysRemainingColor = computed(() => {
    const d = this.subscription()?.daysRemaining ?? 999;
    if (d <= 15) return '#ef4444';
    if (d <= 30) return '#f59e0b';
    return '#10b981';
  });
 
  // ── Chart data ────────────────────────────────────────────────────────────
  userSplitChart  = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  masterCountChart = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
 
  doughnutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } }
    },
    animation: { animateRotate: true, duration: 700 }
  };
 
  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' }, ticks: { precision: 0, font: { size: 11 } }
      }
    },
    animation: { duration: 600 }
  };
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detailService: CompanyDetailService,
    private globalService: GlobalService,
    private dialog: MatDialog,
  ) { }
 
  ngOnInit(): void {
    this.companyId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.companyId) {
      this.router.navigate(['/admin/companies-list']);
      return;
    }
    this.loadDetail();
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  // ── Load ──────────────────────────────────────────────────────────────────
 
  loadDetail(): void {
    this.isLoading.set(true);
    this.error.set('');
 
    this.detailService.getCompanyDetail(this.companyId, this.orgId)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (!res?.success || !res.data) {
            this.error.set('Failed to load company details.');
            return;
          }
          const d: CompanyDetailResponse = res.data;
          this.orgId = d.company.organizationId;
 
          // Resolve image URLs
          if (d.adminUser?.profilePicture) {
            d.adminUser.profilePicture = FileUrlHelper.getFullUrl(d.adminUser.profilePicture);
          }
          if (d.company?.logo) {
            d.company.logo = FileUrlHelper.getFullUrl(d.company.logo);
          }
          d.loginAccessUsers?.forEach(u => {
            if (u.profilePicture) u.profilePicture = FileUrlHelper.getFullUrl(u.profilePicture);
          });
 
          this.company.set(d.company);
          this.adminUser.set(d.adminUser);
          this.subscription.set(d.subscription);
          this.stats.set(d.stats);
          this.loginUsers.set(d.loginAccessUsers ?? []);
 
          this._buildCharts(d.stats);
        },
        error: () => this.error.set('Unable to load company details. Please try again.')
      });
  }
 
  // ── Chart builders ────────────────────────────────────────────────────────
 
  private _buildCharts(stats: CompanyStats): void {
    this.userSplitChart.set({
      labels: ['System Users', 'Regular Users'],
      datasets: [{
        data: [stats.systemUsers, Math.max(0, stats.totalUsers - stats.systemUsers)],
        backgroundColor: ['#7c3aed99', '#06b6d499'],
        borderColor: ['#7c3aed', '#06b6d4'],
        borderWidth: 2, hoverOffset: 6
      }]
    });
 
    this.masterCountChart.set({
      labels: ['Assets', 'Users', 'Categories', 'Sub-Cat', 'Suppliers',
        'Sites', 'Branches', 'Areas', 'Depts', 'Designations', 'Roles'],
      datasets: [{
        label: 'Count',
        data: [
          stats.totalAssets, stats.totalUsers, stats.assetCategories,
          stats.assetSubCategories, stats.suppliers, stats.sites,
          stats.branches, stats.areas, stats.departments,
          stats.designations, stats.roles,
        ],
        backgroundColor: PALETTE.map(c => c + 'cc'),
        borderColor: PALETTE, borderWidth: 1.5, borderRadius: 6
      }]
    });
  }
 
  // ── Helpers ───────────────────────────────────────────────────────────────
 
  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
 
  getUserInitials(u: AdminUserDetail | LoginAccessUser): string {
    return this.getInitials(`${u.firstName ?? ''} ${u.lastName ?? ''}`);
  }
 
  subscriptionProgressColor(): string {
    const p = this.subscriptionUsedPct();
    if (p >= 90) return 'warn';
    if (p >= 70) return 'accent';
    return 'primary';
  }
 
  isExpiringSoon(date?: string): boolean {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  }
 
  userColor(name: string): string {
    const h = [...(name ?? 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return PALETTE[h % PALETTE.length];
  }
 
  isCurrentlyLoggedIn(user: LoginAccessUser): boolean {
    if (!user.lastLoginDate) return false;
    if (!user.lastLogoutDate) return true;
    return new Date(user.lastLoginDate) > new Date(user.lastLogoutDate);
  }
 
  // ── Actions ───────────────────────────────────────────────────────────────
 
  goBack(): void {
    this.router.navigate(['/admin/companies-list']);
  }
 
  /**
   * Opens the assign/edit subscription dialog.
   * On close: patches company signal with new dates (does NOT touch isActive),
   * then does a full detail reload for authoritative server state.
   */
  openSubscriptionDialog(): void {
    const c = this.company();
    if (!c) return;
 
    const wasEditMode = !!c.subscriptionId;
 
    const ref = this.dialog.open(AssignSubscriptionDialogComponent, {
      width: '600px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'assign-sub-dialog-panel',
      data: {
        company: {
          id: c.id,
          name: c.name,
          organizationId: c.organizationId,
          subscriptionId: c.subscriptionId,
          subscriptionDate: c.subscriptionDate,
          subscriptionExpiryDate: c.subscriptionExpiryDate,
          isActive: c.isActive,
        }
      }
    });
 
    ref.afterClosed().subscribe(result => {
      if (!result) return;
 
      // Optimistic patch — update subscription fields only
      // ⚠️  isActive is NOT touched — toggle is intentional, never auto-changed
      this.company.update(co => co ? {
        ...co,
        subscriptionId: result.subscriptionId,
        subscriptionDate: result.startDate,
        subscriptionExpiryDate: result.endDate,
      } : co);
 
      // Full reload for authoritative server state
      this.loadDetail();
 
      this.globalService.showToastr(
        `Subscription ${wasEditMode ? 'updated' : 'assigned'} for ${c.name}`,
        'success'
      );
    });
  }
 
  /**
   * Opens the activate/suspend confirmation dialog.
   * On confirm: calls API and patches only isActive in the company signal.
   */
  onToggleActive(): void {
    if (!this.canToggleActive()) {
      this.globalService.showToastr(this.toggleTooltip(), 'warning');
      return;
    }
 
    const c = this.company();
    if (!c) return;
 
    const newState = !this.isActive();
 
    const ref = this.dialog.open(ToggleActiveDialogComponent, {
      width: '440px',
      maxWidth: '96vw',
      panelClass: 'toggle-active-dialog-panel',
      data: {
        company: {
          name: c.name,
          id: c.id,
          organizationId: c.organizationId,
        },
        activate: newState,
      }
    });
 
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
 
      this.detailService.toggleCompanyActive(c.id, c.organizationId, newState)
        .subscribe({
          next: (res) => {
            if (res?.success) {
              // Only patch isActive — leave everything else intact
              this.company.update(co => co ? { ...co, isActive: newState } : co);
              this.globalService.showToastr(
                `${c.name} ${newState ? 'activated' : 'suspended'} successfully`,
                'success'
              );
            } else {
              this.globalService.showToastr(res?.message ?? 'Toggle failed', 'error');
            }
          },
          error: () => {
            this.globalService.showToastr('Failed to update company status', 'error');
          }
        });
    });
  }
 
  contactAdmin(): void {
    const email = this.adminUser()?.email ?? this.company()?.email;
    if (email) window.open(`mailto:${email}`);
    else this.globalService.showToastr('No email address found', 'warning');
  }
}
