import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartConfiguration } from 'chart.js';
import { TooltipItem } from 'chart.js';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { AdminPageHeaderComponent } from '../../shared/widgets/admin-page-header/admin-page-header.component';
import { AdminDashboardService } from '../../../core/services/admin/admin-dashboard/admin-dashboard.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AdminDashboardSummary, AdminKpiStats, AdminRecentCompany, AdminRecentUser, CompanyAssetSummary, CompanyGrowth, CompanyRevenue, MonthlyRevenue, SubscriptionPlanDistribution, SystemHealth } from '../../../core/models/admin/admin-dashboard.interface';

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];
 
// Number of plan rows shown inline before "View More"
const PLAN_PREVIEW_COUNT = 1;
 
interface KpiCard {
  key: string; label: string; value: number; trend: number;
  icon: string; color: string; sparkline: number[];
  isCurrency?: boolean; subtitle?: string;
}
 
interface CompanyRow {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  country?: string;
  city?: string;
  adminName?: string;
  adminEmail?: string;
  adminPic?: string;
  adminVerified: boolean;
  planName?: string;
  planAmount: number;
  status: string;
  assetCount: number;
  userCount: number;
  systemUsers: number;
  createdDate: Date;
  isActive: boolean;
}
 
interface UserRow {
  id: number;
  fullName: string;
  email?: string;
  profilePic?: string;
  companyName?: string;
  roleName?: string;
  isVerified: boolean;
  hasAccess: boolean;
  createdDate: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatTooltipModule, MatButtonToggleModule, MatFormFieldModule,
    MatSelectModule, MatProgressBarModule, MatChipsModule,
    MatDividerModule, MatSnackBarModule,
    BaseChartDirective, AdminPageHeaderComponent, DatePipe, DecimalPipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  animations: [
    trigger('dashFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('360ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('stagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(45, animate('300ms ease', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
 
  // ── Loading states ─────────────────────────────────────────────────────
  pageLoading = signal(true);
  chartLoading = signal(true);
 
  // ── Filter controls ────────────────────────────────────────────────────
  revenueChartPeriod = '12';
  growthChartPeriod = '12';
 
  // ── Plan Distribution "view more" state ───────────────────────────────
  showAllPlans = signal(false);
 
  // ── KPI Cards ──────────────────────────────────────────────────────────
  kpiCards = signal<KpiCard[]>([
    { key: 'totalCompanies',    label: 'Total Companies',     value: 0, trend: 0, icon: 'corporate_fare',   color: 'primary',   sparkline: [] },
    { key: 'activeCompanies',   label: 'Active Companies',    value: 0, trend: 0, icon: 'verified',         color: 'success',   sparkline: [] },
    { key: 'totalRevenue',      label: 'Total Revenue',       value: 0, trend: 0, icon: 'account_balance',  color: 'purple',    sparkline: [], isCurrency: true },
    { key: 'monthlyRevenue',    label: 'This Month Revenue',  value: 0, trend: 0, icon: 'payments',         color: 'accent',    sparkline: [], isCurrency: true },
    { key: 'totalAssets',       label: 'Total Assets (All)',  value: 0, trend: 0, icon: 'inventory_2',      color: 'tertiary',  sparkline: [] },
    { key: 'totalUsers',        label: 'Total Users',         value: 0, trend: 0, icon: 'people_alt',       color: 'info',      sparkline: [] },
    { key: 'systemLoginUsers',  label: 'System Login Users',  value: 0, trend: 0, icon: 'manage_accounts',  color: 'warn',      sparkline: [] },
    { key: 'pendingActivations',label: 'Pending Activations', value: 0, trend: 0, icon: 'pending_actions',  color: 'neutral',   sparkline: [] },
  ]);
 
  // ── Health Score ───────────────────────────────────────────────────────
  systemHealth = signal<SystemHealth | null>(null);
 
  // ── Revenue data ───────────────────────────────────────────────────────
  revenueOverview = signal<{
    totalRevenue: number; thisMonthRevenue: number; lastMonthRevenue: number;
    revenueGrowthPct: number; averageRevenuePerCompany: number;
    highestPlanAmount: number; highestPlanName: string;
    activeSubscriptions: number; expiredSubscriptions: number;
  } | null>(null);
  topRevenueCompanies = signal<CompanyRevenue[]>([]);
  planDistribution = signal<SubscriptionPlanDistribution[]>([]);
 
  // ── Charts ─────────────────────────────────────────────────────────────
  revenueChartData  = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  growthChartData   = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  planDonutData     = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  assetUsageChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
 
  // ── Tables ─────────────────────────────────────────────────────────────
  recentCompaniesDS = new MatTableDataSource<CompanyRow>([]);
  recentUsersDS     = new MatTableDataSource<UserRow>([]);
  assetSummaryDS    = new MatTableDataSource<CompanyAssetSummary>([]);
  companyRevDS      = new MatTableDataSource<CompanyRevenue>([]);
 
  companyCols = ['rank', 'company', 'admin', 'plan', 'assets', 'users', 'status', 'date'];
  userCols    = ['user', 'company', 'access', 'date'];
  assetCols   = ['company', 'assets', 'usage', 'value', 'users'];
  revCols     = ['rank', 'company', 'plan', 'revenue', 'share', 'status'];
 
  readonly today = new Date();
 
  // ── Computed: visible plan rows ────────────────────────────────────────
  visiblePlans = computed(() =>
    this.showAllPlans()
      ? this.planDistribution()
      : this.planDistribution().slice(0, PLAN_PREVIEW_COUNT)
  );
  hasMorePlans = computed(() => this.planDistribution().length > PLAN_PREVIEW_COUNT);
 
  constructor(
    private svc: AdminDashboardService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void { this._loadAll(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 
  // ═══════════════════════════════════════════════════════════════════════
  //  LOAD
  // ═══════════════════════════════════════════════════════════════════════
  private _loadAll(): void {
    this.svc.getDashboardSummary()
      .pipe(takeUntil(this.destroy$), finalize(() => {
        this.pageLoading.set(false);
        this.chartLoading.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: res => {
          if (!res?.success || !res.data) return;
          const d: AdminDashboardSummary = res.data;
 
          this._populateKpi(d.kpiStats);
          this.systemHealth.set(d.systemHealth);
          this.revenueOverview.set(d.revenue as any);
          this.topRevenueCompanies.set(d.topRevenueCompanies ?? []);
          this.planDistribution.set(d.planDistribution ?? []);
 
          this._buildRevenueChart(d.monthlyRevenue ?? []);
          this._buildGrowthChart(d.companyGrowth ?? []);
          this._buildPlanDonut(d.planDistribution ?? []);
          this._buildAssetUsageChart(d.companyAssetSummary ?? []);
 
          this._populateCompaniesTable(d.recentCompanies ?? []);
          this._populateUsersTable(d.recentSystemUsers ?? []);
          this.assetSummaryDS.data = (d.companyAssetSummary ?? []).slice(0, 8);
          this.companyRevDS.data   = d.topRevenueCompanies ?? [];
 
          this.cdr.markForCheck();
        },
        error: () => this.snack.open('Failed to load dashboard', 'Dismiss', { duration: 4000 })
      });
  }
 
  // ── KPI ────────────────────────────────────────────────────────────────
  private _populateKpi(d: AdminKpiStats): void {
    const toSpark = (raw: number[]): number[] => {
      if (!raw?.length) return [];
      const max = Math.max(...raw.map(Number), 1);
      return raw.map(n => Math.max(5, Math.round((Number(n) / max) * 100)));
    };
 
    this.kpiCards.update(cards => cards.map(c => {
      switch (c.key) {
        case 'totalCompanies':    return { ...c, value: +d.totalCompanies.value,    trend: +d.totalCompanies.trend,    sparkline: toSpark(d.totalCompanies.sparkline) };
        case 'activeCompanies':   return { ...c, value: +d.activeCompanies.value,   trend: +d.activeCompanies.trend,   sparkline: [] };
        case 'totalRevenue':      return { ...c, value: +d.totalRevenue.value,      trend: +d.totalRevenue.trend,      sparkline: [] };
        case 'monthlyRevenue':    return { ...c, value: +d.monthlyRevenue.value,    trend: +d.monthlyRevenue.trend,    sparkline: [] };
        case 'totalAssets':       return { ...c, value: +d.totalAssets.value,       trend: +d.totalAssets.trend,       sparkline: toSpark(d.totalAssets.sparkline) };
        case 'totalUsers':        return { ...c, value: +d.totalUsers.value,        trend: +d.totalUsers.trend,        sparkline: [] };
        case 'systemLoginUsers':  return { ...c, value: +d.systemLoginUsers.value,  trend: +d.systemLoginUsers.trend,  sparkline: [] };
        case 'pendingActivations':return { ...c, value: +d.pendingActivations.value,trend: +d.pendingActivations.trend,sparkline: [] };
        default: return c;
      }
    }));
  }
 
  // ── Tables ─────────────────────────────────────────────────────────────
  private _populateCompaniesTable(data: AdminRecentCompany[]): void {
    this.recentCompaniesDS.data = data.map(c => ({
      id: c.id,
      name: c.name ?? '—',
      logo: c.logo ? FileUrlHelper.getFullUrl(c.logo) : undefined,
      email: c.email,
      country: c.country,
      city: c.city,
      adminName: c.adminName,
      adminEmail: c.adminEmail,
      adminPic: c.adminProfilePicture ? FileUrlHelper.getFullUrl(c.adminProfilePicture) : undefined,
      adminVerified: c.adminEmailVerified,
      planName: c.planName,
      planAmount: c.planAmount,
      status: c.subscriptionStatus,
      assetCount: c.assetCount,
      userCount: c.userCount,
      systemUsers: c.systemUserCount,
      createdDate: new Date(c.createdDate),
      isActive: c.isActive
    }));
  }
 
  private _populateUsersTable(data: AdminRecentUser[]): void {
    this.recentUsersDS.data = data.map(u => ({
      id: u.userProfileId,
      fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || '—',
      email: u.email,
      profilePic: u.profilePicture ? FileUrlHelper.getFullUrl(u.profilePicture) : undefined,
      companyName: u.companyName,
      roleName: u.roleName,
      isVerified: u.isEmailConfirmed,
      hasAccess: u.hasLoginAccess,
      createdDate: new Date(u.createdDate)
    }));
  }
 
  // ── Charts ─────────────────────────────────────────────────────────────
  private _buildRevenueChart(data: MonthlyRevenue[]): void {
    this.revenueChartData.set({
      labels: data.map(d => d.month),
      datasets: [
        {
          type: 'bar',
          label: 'Revenue (AED)',
          data: data.map(d => d.revenue),
          backgroundColor: P[0] + 'cc',
          borderColor: P[0], borderWidth: 1.5, borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'New Companies',
          data: data.map(d => d.newCompanies),
          borderColor: P[2], backgroundColor: P[2] + '22',
          borderWidth: 2.5, tension: 0.45, fill: false,
          pointBackgroundColor: P[2], pointRadius: 4,
          yAxisID: 'y1'
        }
      ] as any
    });
  }
 
  private _buildGrowthChart(data: CompanyGrowth[]): void {
    this.growthChartData.set({
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'Cumulative Companies',
          data: data.map(d => d.cumulativeCompanies),
          fill: true, tension: 0.45, borderWidth: 2.5,
          borderColor: P[0], backgroundColor: P[0] + '18',
          pointBackgroundColor: P[0], pointBorderColor: '#fff', pointRadius: 4
        },
        {
          label: 'New This Month',
          data: data.map(d => d.newCompanies),
          fill: false, tension: 0.4, borderWidth: 2, borderDash: [5, 3],
          borderColor: P[2], backgroundColor: 'transparent',
          pointBackgroundColor: P[2], pointRadius: 3
        }
      ]
    });
  }
 
  private _buildPlanDonut(data: SubscriptionPlanDistribution[]): void {
    this.planDonutData.set({
      labels: data.map(d => d.planName),
      datasets: [{
        data: data.map(d => d.companyCount),
        backgroundColor: P.slice(0, data.length).map(c => c + 'cc'),
        borderColor: P.slice(0, data.length), borderWidth: 2, hoverOffset: 10
      }]
    });
  }
 
  private _buildAssetUsageChart(data: CompanyAssetSummary[]): void {
    const top8 = data.slice(0, 8);
    this.assetUsageChartData.set({
      labels: top8.map(d => d.companyName.length > 14 ? d.companyName.slice(0, 14) + '…' : d.companyName),
      datasets: [
        {
          label: 'Used',
          data: top8.map(d => d.assetCount),
          backgroundColor: P[0] + 'cc', borderColor: P[0], borderWidth: 1.5, borderRadius: 6
        },
        {
          label: 'Limit',
          data: top8.map(d => d.assetLimit),
          backgroundColor: P[4] + '44', borderColor: P[4], borderWidth: 1.5, borderRadius: 6,
          borderDash: [5, 3]
        }
      ] as any
    });
  }
 
  // ── Chart Options ──────────────────────────────────────────────────────
  revenueChartOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            ctx.datasetIndex === 0
              ? ` AED ${Number(ctx.parsed.y).toLocaleString()}`
              : ` ${ctx.parsed.y} companies`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' }, position: 'left',
        ticks: {
          callback: (v: any) =>
            typeof v === 'number' && v >= 1000
              ? `AED ${(v / 1000).toFixed(0)}k`
              : `AED ${v}`,
          font: { size: 10 }
        }
      },
      y1: {
        beginAtZero: true, border: { display: false },
        grid: { display: false }, position: 'right',
        ticks: { precision: 0, font: { size: 10 } }
      }
    },
    animation: { duration: 700 }
  } as any;
 
  growthChartOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' },
        ticks: { precision: 0, font: { size: 10 } }
      }
    },
    animation: { duration: 700, easing: 'easeInOutQuart' }
  };
 
  planDonutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} companies` }
      }
    },
    animation: { animateRotate: true, duration: 700 }
  };
 
  assetUsageChartOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' },
        ticks: { precision: 0, font: { size: 10 } }
      }
    },
    animation: { duration: 600 }
  };
 
  // ── Helpers ────────────────────────────────────────────────────────────
 
  /** Format a number as AED currency */
  formatCurrency(v: number): string {
    if (!v && v !== 0) return 'AED 0';
    if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `AED ${(v / 1_000).toFixed(1)}k`;
    return `AED ${v.toFixed(0)}`;
  }
 
  healthGradeColor(grade: string): string {
    return ({ A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#f97316', F: '#ef4444' } as Record<string, string>)[grade] ?? '#94a3b8';
  }
 
  statusCss(status: string): string {
    const m: Record<string, string> = {
      active: 'badge--active', expired: 'badge--expired',
      suspended: 'badge--suspended', 'no-plan': 'badge--noplan', 'plan-assigned': 'badge--assigned'
    };
    return m[status] ?? 'badge--noplan';
  }
 
  statusLabel(status: string): string {
    const m: Record<string, string> = {
      active: 'Active', expired: 'Expired',
      suspended: 'Suspended', 'no-plan': 'No Plan', 'plan-assigned': 'Assigned'
    };
    return m[status] ?? status;
  }
 
  statusIcon(status: string): string {
    const m: Record<string, string> = {
      active: 'verified', expired: 'event_busy',
      suspended: 'pause_circle', 'no-plan': 'block', 'plan-assigned': 'pending'
    };
    return m[status] ?? 'help_outline';
  }
 
  initials(name: string): string {
    return (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
 
  avatarColor(name: string): string {
    const h = [...(name ?? 'A')].reduce((a, c) => a + c.charCodeAt(0), 0);
    return P[h % P.length];
  }
 
  rankColor(rank: number): string {
    return (['#f59e0b', '#94a3b8', '#cd7f32'] as string[])[rank - 1] ?? P[0];
  }
 
  rankIcon(rank: number): string {
    return (['emoji_events', 'workspace_premium', 'military_tech'] as string[])[rank - 1] ?? 'star';
  }
 
  usageColor(pct: number): string {
    if (pct >= 90) return '#ef4444';
    if (pct >= 70) return '#f59e0b';
    return '#10b981';
  }
 
  planColor(i: number): string {
    return P[i % P.length];
  }
 
  hasImg(url?: string | null): boolean { return !!(url?.trim()); }
 
  onImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const fb = img.closest('.thumb')?.querySelector<HTMLElement>('.img-fb');
    if (fb) fb.style.display = 'flex';
  }
 
  planDonutTotal = computed(() => this.planDistribution().reduce((s, x) => s + x.companyCount, 0));
 
  toggleShowAllPlans(): void {
    this.showAllPlans.update(v => !v);
  }
}
