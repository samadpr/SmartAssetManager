import {
  Component, OnInit, OnDestroy, computed, signal, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, SlicePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { PageHeaderComponent } from '../../shared/widgets/page-header/page-header.component';
import { DashboardService } from '../../core/services/dashboard/dashboard.service';
import {
  KpiStats, AssetStatusDistribution, AssetGrowth, AssetValueByCategory,
  DepreciationSummary, IssueSummary, UserDistribution, ApprovalPipeline,
  SiteAssetSummary, RecentAsset, RecentUser,
  PendingApprovalAlert, OpenIssueAlert, WarrantyExpiring,
  AssetHealthScore,
  DashboardSummary
} from '../../core/models/interfaces/dashboard/dashboard.interface';
import { FileUrlHelper } from '../../core/helper/get-file-url';
import { CompanyStorageService } from '../../core/services/localStorage/company/company-storage.service';
import { MatDividerModule } from '@angular/material/divider';
import { UserProfileStorageService } from '../../core/services/localStorage/userProfile/user-profile-storage.service';


// ─── Local view-model interfaces ─────────────────────────────────────────────
interface KpiCard {
  key: string; label: string; value: number; trend: number;
  icon: string; color: string; sparkline: number[]; isCurrency?: boolean;
  subtitle?: string;
}
 
interface LegendItem  { label: string; value: number; color: string; pct?: number; }
interface IssuePill   { label: string; value: number; color: string; }
interface ApprovalBar { label: string; value: number; pct: number; color: string; }
 
interface AssetRow {
  batchId?:      number;
  batchCode?:    string;
  assetId:       string;
  name:          string;
  category:      string;
  status:        string;
  statusKey:     string;
  value:         number;
  totalValue?:   number;
  qty:           number;
  isBatch:       boolean;
  site:          string;
  date:          Date;
  imageUrl:      string | null;
}
 
interface UserRow {
  id:          number;
  firstName:   string;
  lastName:    string;
  fullName:    string;
  email:       string;
  department:  string;
  designation: string;
  role:        string;
  date:        Date;
  profilePic:  string | null;
}
 
interface ApprovalItem {
  assignmentId:  number;
  assetId:       string;
  assetName:     string;
  batchCode?:    string;
  requesterName: string;
  requesterPic:  string | null;
  requestedDate: Date;
  siteName:      string;
  assetImageUrl: string | null;
}
 
interface IssueItem {
  id:           number;
  assetName:    string;
  title:        string;
  description:  string;
  statusKey:    string;
  statusLabel:  string;
  priorityKey:  string;
  priorityLabel:string;
  createdDate:  Date;
}
 
interface WarrantyItem {
  id:        number;
  assetCode: string;
  name:      string;
  daysLeft:  number;
  site:      string;
  urgency:   string;
}
 
interface SiteVM {
  siteId:         number;
  name:           string;
  city:           string;
  type:           number;
  assetCount:     number;
  batchCount:     number;
  totalValue:     number;
  inUseCount:     number;
  availableCount: number;
  assets:         { assetId: string; name: string; status: string; statusKey: string; batchCode?: string; quantity?: number; }[];
}
 
// ─── Palette ─────────────────────────────────────────────────────────────────
const P = [
  '#7c3aed','#06b6d4','#10b981','#f59e0b',
  '#ef4444','#8b5cf6','#3b82f6','#ec4899','#14b8a6','#f97316'
];
 
const STATUS_COLOR: Record<string, string> = {
  inuse:       '#10b981',
  available:   '#06b6d4',
  damaged:     '#ef4444',
  maintenance: '#f59e0b',
  expired:     '#94a3b8',
  new:         '#7c3aed',
  returned:    '#3b82f6',
  inprogress:  '#06b6d4',
  pending:     '#f59e0b',
  blocker:     '#ef4444',
  hold:        '#f97316',
  accepted:    '#10b981',
  resolved:    '#10b981',
  closed:      '#94a3b8',
};
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatChipsModule, MatTooltipModule, MatButtonToggleModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
    BaseChartDirective, PageHeaderComponent,
    DecimalPipe, DatePipe, SlicePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('dashFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(50, animate('320ms ease', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Loading ───────────────────────────────────────────────────────────────
  pageLoading = signal(true);
  kpiLoading = signal(true);
  chartLoading = signal(true);
  siteLoading = signal(true);
  tableLoading = signal(true);
  alertLoading = signal(true);

  // ── Greeting ──────────────────────────────────────────────────────────────
  greeting = signal('');
  greetingIcon = signal('');
  userName = signal('');

  // ── Filter controls ───────────────────────────────────────────────────────
  assetStatusFilter = 'all';
  assetTrendPeriod = '1y';
  depreciationSort = 'method';
  categorySort = 'value';
  userChartView = 'department';
  issueSort = 'status';
  siteFilter = 'all';

  // ── Currency ──────────────────────────────────────────────────────────────
  private get _currencyCode(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
  get currencySymbol(): string {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$';
    } catch { return '$'; }
  }

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  kpiCards = signal<KpiCard[]>([
    { key: 'totalAssets', label: 'Total Units', value: 0, trend: 0, icon: 'inventory_2', color: 'primary', sparkline: [] },
    { key: 'totalBatches', label: 'Asset Groups', value: 0, trend: 0, icon: 'layers', color: 'accent', sparkline: [] },
    { key: 'assignedAssets', label: 'Assigned', value: 0, trend: 0, icon: 'assignment_turned_in', color: 'success', sparkline: [] },
    { key: 'availableAssets', label: 'Available', value: 0, trend: 0, icon: 'check_circle_outline', color: 'info', sparkline: [] },
    { key: 'totalValue', label: 'Total Asset Value', value: 0, trend: 0, icon: 'account_balance', color: 'purple', sparkline: [], isCurrency: true },
    { key: 'openIssues', label: 'Open Tickets', value: 0, trend: 0, icon: 'report_problem', color: 'warn', sparkline: [] },
    { key: 'pendingApprovals', label: 'Pending Approvals', value: 0, trend: 0, icon: 'rule', color: 'tertiary', sparkline: [] },
    { key: 'sites', label: 'Sites & Branches', value: 0, trend: 0, icon: 'location_city', color: 'neutral', sparkline: [] },
  ]);

  // ── Health Score ──────────────────────────────────────────────────────────
  healthScore = signal<AssetHealthScore | null>(null);

  // ── Chart signals ─────────────────────────────────────────────────────────
  assetStatusChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  assetGrowthData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  categoryChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  depreciationChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  issueChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  userChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  approvalChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  // ── Summary signals ───────────────────────────────────────────────────────
  assetStatusLegend = signal<LegendItem[]>([]);
  issuePills = signal<IssuePill[]>([]);
  approvalBars = signal<ApprovalBar[]>([]);
  donutTotal = computed(() => this.assetStatusLegend().reduce((s, x) => s + x.value, 0));

  // ── Sites & Alerts ────────────────────────────────────────────────────────
  private _allSites = signal<SiteVM[]>([]);
  private _approvalAlerts = signal<ApprovalItem[]>([]);
  private _issueAlerts = signal<IssueItem[]>([]);
  private _warrantyAlerts = signal<WarrantyItem[]>([]);

  filteredSites = computed(() => {
    const f = this.siteFilter;
    return f === 'all' ? this._allSites() : this._allSites().filter(s => String(s.type) === f);
  });
  pendingApprovals = computed(() => this._approvalAlerts());
  openIssues = computed(() => this._issueAlerts());
  warrantyExpiring = computed(() => this._warrantyAlerts());

  // ── Tables ────────────────────────────────────────────────────────────────
  recentAssetsDS = new MatTableDataSource<AssetRow>([]);
  recentUsersDS = new MatTableDataSource<UserRow>([]);
  assetCols = ['name', 'category', 'status', 'qty', 'value', 'site', 'date'];
  userCols = ['name', 'dept', 'role', 'date'];

  // ═════════════════════════════════════════════════════════════════════════
  //  Chart Options
  // ═════════════════════════════════════════════════════════════════════════

  doughnutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} ` } }
    },
    animation: { animateRotate: true, duration: 700 }
  };

  userDoughnutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '55%',
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } }
    },
    animation: { animateRotate: true, duration: 700 }
  };

  lineOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' }, ticks: { precision: 0, font: { size: 11 } }
      }
    },
    animation: { duration: 700, easing: 'easeInOutQuart' }
  };

  barOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            return v == null ? ' 0' : v >= 1000 ? ` ${this.currencySymbol}${(v / 1000).toFixed(0)}k` : ` ${v}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' },
        ticks: {
          font: { size: 11 },
          callback: v => typeof v === 'number' && v >= 1000
            ? `${this.currencySymbol}${(v / 1000).toFixed(0)}k` : v
        }
      }
    },
    animation: { duration: 600 }
  };

  hBarOpts: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x}` } }
    },
    scales: {
      x: {
        beginAtZero: true, border: { display: false },
        grid: { color: 'rgba(128,128,128,.1)' }, ticks: { precision: 0, font: { size: 11 } }
      },
      y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
    },
    animation: { duration: 600 }
  };

  constructor(
    private dashSvc: DashboardService,
    private snack: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private companyStorage: CompanyStorageService
  ) { }

  ngOnInit(): void {
    this._setGreeting();
    this._loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  GREETING
  // ═════════════════════════════════════════════════════════════════════════
  private _setGreeting(): void {
    const h = new Date().getHours();
    if (h < 12) { this.greeting.set('Good Morning'); this.greetingIcon.set('wb_sunny'); }
    else if (h < 17) { this.greeting.set('Good Afternoon'); this.greetingIcon.set('wb_cloudy'); }
    else if (h < 20) { this.greeting.set('Good Evening'); this.greetingIcon.set('nights_stay'); }
    else { this.greeting.set('Good Night'); this.greetingIcon.set('bedtime'); }

    // Try to get user name from localStorage / company storage service
    // Adjust the key below to match your actual storage key
    try {
      const raw = localStorage.getItem('user_profile') || '';
      if (raw) {
        const profile = JSON.parse(raw);
        const name = profile?.firstName || profile?.fullName || profile?.name || '';
        this.userName.set(name ? `, ${name}` : '');
      }
    } catch { /* ignore */ }
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  LOAD — single HTTP call
  // ═════════════════════════════════════════════════════════════════════════
  private _loadAll(): void {
    this.dashSvc.getDashboardSummary()
      .pipe(takeUntil(this.destroy$), finalize(() => {
        this.pageLoading.set(false);
        this.kpiLoading.set(false);
        this.chartLoading.set(false);
        this.siteLoading.set(false);
        this.tableLoading.set(false);
        this.alertLoading.set(false);
      }))
      .subscribe({
        next: res => {
          if (!res?.success || !res.data) return;
          const d: DashboardSummary = res.data;

          this._populateKpi(d.kpiStats);
          this._buildStatusChart(d.assetStatusDistribution);
          this._buildGrowthChart(d.assetGrowth);
          this._buildCategoryChart(d.assetValueByCategory);
          this._buildDepreciationChart(d.depreciationSummary);
          this._buildIssueChart(d.issueSummary);
          this._buildUserChart(d.userDistribution);
          this._buildApprovalChart(d.approvalPipeline);
          this._populateSites(d.siteAssetSummary);
          this._populateTables(d.recentAssets, d.recentUsers);
          this._populateAlerts(d.pendingApprovals, d.openIssues, d.warrantyExpiring);
          this.healthScore.set(d.assetHealthScore);
        },
        error: () => this._toast('Failed to load dashboard data')
      });
  }

  // ── KPI population ────────────────────────────────────────────────────────
  private _populateKpi(d: KpiStats): void {
    const toSparkline = (raw: any[]): number[] => {
      if (!raw?.length) return [];
      const nums = raw.map(v => Number(v) || 0);
      const max = Math.max(...nums, 1);
      return nums.map(n => Math.max(5, Math.round((n / max) * 100)));
    };

    this.kpiCards.update(cards => cards.map(c => {
      switch (c.key) {
        case 'totalAssets': return { ...c, value: Number(d.totalAssets.value) || 0, trend: Number(d.totalAssets.trend) || 0, sparkline: toSparkline(d.totalAssets.sparkline) };
        case 'totalBatches': return { ...c, value: Number(d.totalBatches.value) || 0, trend: Number(d.totalBatches.trend) || 0, sparkline: [] };
        case 'assignedAssets': return { ...c, value: Number(d.assignedAssets.value) || 0, trend: Number(d.assignedAssets.trend) || 0, sparkline: [] };
        case 'availableAssets': return { ...c, value: Number(d.availableAssets.value) || 0, trend: Number(d.availableAssets.trend) || 0, sparkline: [] };
        case 'totalValue': return { ...c, value: Number(d.totalAssetValue.value) || 0, trend: Number(d.totalAssetValue.trend) || 0, sparkline: toSparkline(d.totalAssetValue.sparkline) };
        case 'openIssues': return { ...c, value: Number(d.openIssues.value) || 0, trend: Number(d.openIssues.trend) || 0, sparkline: toSparkline(d.openIssues.sparkline) };
        case 'pendingApprovals': return { ...c, value: Number(d.pendingApprovals.value) || 0, trend: Number(d.pendingApprovals.trend) || 0, sparkline: [] };
        case 'sites': return { ...c, value: Number(d.sitesAndBranches.value) || 0, trend: Number(d.sitesAndBranches.trend) || 0, sparkline: [] };
        default: return c;
      }
    }));
  }

  // ── Sites ─────────────────────────────────────────────────────────────────
  private _populateSites(data: SiteAssetSummary[]): void {
    this._allSites.set((data ?? []).map(s => ({
      siteId: Number(s.siteId),
      name: s.name,
      city: s.city ?? '',
      type: s.type,
      assetCount: s.assetCount,
      batchCount: s.batchCount,
      totalValue: Number(s.totalValue),
      inUseCount: s.inUseCount,
      availableCount: s.availableCount,
      assets: (s.assets ?? []).map(a => ({
        assetId: a.assetId,
        name: a.name,
        status: a.status,
        statusKey: a.statusKey,
        batchCode: a.batchCode ?? undefined,
        quantity: (a as any).quantity ?? 0
      }))
    })));
  }

  // ── Tables ────────────────────────────────────────────────────────────────
  private _populateTables(assets: RecentAsset[], users: RecentUser[]): void {
    if (assets) {
      this.recentAssetsDS.data = assets.map((a: RecentAsset) => ({
        batchId: a.batchId,
        batchCode: a.batchCode,
        assetId: a.assetId,
        name: a.name ?? '—',
        category: a.category ?? '',
        status: a.status ?? '—',
        statusKey: a.statusKey ?? 'new',
        value: Number(a.unitPrice) || 0,
        totalValue: Number(a.totalValue) || 0,
        qty: a.activeQuantity ?? 1,
        isBatch: a.isBatch ?? false,
        site: a.siteDisplay ?? '—',
        date: new Date(a.createdDate),
        imageUrl: a.assetImageUrl ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null
      }));
    }

    if (users) {
      this.recentUsersDS.data = users.map((u: RecentUser) => {
        const first = (u.firstName ?? '').trim();
        const last = (u.lastName ?? '').trim();
        return {
          id: Number(u.userProfileId),
          firstName: first,
          lastName: last,
          fullName: [first, last].filter(Boolean).join(' ') || '—',
          email: u.email ?? '',
          department: u.departmentDisplay ?? '—',
          designation: u.designationDisplay ?? '—',
          role: u.roleIdDisplay ?? '—',
          date: u.joiningDate ? new Date(u.joiningDate) : new Date(),
          profilePic: u.profilePicture ? FileUrlHelper.getFullUrl(u.profilePicture) : null
        };
      });
    }
  }

  // ── Alerts ────────────────────────────────────────────────────────────────
  private _populateAlerts(
    approvals: PendingApprovalAlert[],
    issues: OpenIssueAlert[],
    warranty: WarrantyExpiring[]
  ): void {
    if (approvals) {
      this._approvalAlerts.set(approvals.map((a: PendingApprovalAlert) => ({
        assignmentId: Number(a.assignmentId),
        assetId: a.assetId,
        assetName: a.assetName ?? a.assetId,
        batchCode: a.batchCode,
        requesterName: a.requestedByName ?? a.requestedByEmail ?? '—',
        requesterPic: (a.requestedByProfilePicture?.trim()) ? a.requestedByProfilePicture.trim() : null,
        requestedDate: new Date(a.requestedDate),
        siteName: a.siteName ?? '',
        assetImageUrl: a.assetImageUrl ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null
      })));
    }

    if (issues) {
      this._issueAlerts.set(issues.map((i: OpenIssueAlert) => ({
        id: Number(i.issueId),
        assetName: i.assetName ?? i.assetId ?? '—',
        title: i.title ?? '',
        description: i.description ?? '',
        statusKey: i.statusKey,
        statusLabel: i.statusDisplay,
        priorityKey: i.priorityKey ?? '',
        priorityLabel: i.priorityDisplay ?? '',
        createdDate: new Date(i.createdDate)
      })));
    }

    if (warranty) {
      this._warrantyAlerts.set(warranty.map((w: WarrantyExpiring) => ({
        id: Number(w.assetId),
        assetCode: w.assetCode,
        name: w.name ?? w.assetCode,
        daysLeft: w.daysLeft,
        site: w.siteDisplay ?? '',
        urgency: w.urgencyKey ?? 'info'
      })));
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  Chart rebuilders (filter change)
  // ═════════════════════════════════════════════════════════════════════════
  rebuildStatusChart(): void {
    this.dashSvc.getAssetStatusDistribution(this.assetStatusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildStatusChart(res.data); });
  }

  rebuildGrowthChart(): void {
    this.dashSvc.getAssetGrowth(this.assetTrendPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildGrowthChart(res.data); });
  }

  rebuildCategoryChart(): void {
    this.dashSvc.getAssetValueByCategory(this.categorySort)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildCategoryChart(res.data); });
  }

  rebuildDepreciationChart(): void {
    this.dashSvc.getDepreciationSummary(this.depreciationSort)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildDepreciationChart(res.data); });
  }

  rebuildIssueChart(): void {
    this.dashSvc.getIssueSummary(this.issueSort)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildIssueChart(res.data); });
  }

  rebuildUserChart(): void {
    this.dashSvc.getUserDistribution(this.userChartView)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => { if (res?.success && res.data) this._buildUserChart(res.data); });
  }

  onSiteFilterChange(): void {
    this.siteLoading.set(true);
    this.dashSvc.getSitesAssetSummary(this.siteFilter)
      .pipe(takeUntil(this.destroy$), finalize(() => this.siteLoading.set(false)))
      .subscribe({
        next: res => { if (res?.success && res.data) this._populateSites(res.data); },
        error: () => this._toast('Failed to load site data')
      });
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  Chart builders
  // ═════════════════════════════════════════════════════════════════════════
  private _buildStatusChart(data: AssetStatusDistribution[]): void {
    const items: LegendItem[] = data.map((d, i) => ({
      label: d.label,
      value: d.count,
      pct: d.percentage,
      color: STATUS_COLOR[d.statusKey] ?? P[i % P.length]
    }));
    this.assetStatusLegend.set(items);
    this.assetStatusChartData.set({
      labels: items.map(d => d.label),
      datasets: [{
        data: items.map(d => d.value),
        backgroundColor: items.map(d => d.color),
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.06)', hoverOffset: 10
      }]
    });
  }

  private _buildGrowthChart(data: AssetGrowth[]): void {
    this.assetGrowthData.set({
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'Acquired', data: data.map(d => d.acquired),
          fill: true, tension: 0.45, borderWidth: 2.5,
          borderColor: P[0], backgroundColor: P[0] + '18',
          pointBackgroundColor: P[0], pointBorderColor: '#fff', pointRadius: 4, pointHoverRadius: 7
        },
        {
          label: 'Disposed', data: data.map(d => d.disposed),
          fill: true, tension: 0.45, borderWidth: 2.5,
          borderColor: P[4], backgroundColor: P[4] + '18',
          pointBackgroundColor: P[4], pointBorderColor: '#fff', pointRadius: 4, pointHoverRadius: 7
        },
        {
          label: 'Net Growth', data: data.map(d => d.net),
          fill: false, tension: 0.4, borderWidth: 2, borderDash: [5, 3],
          borderColor: P[2], backgroundColor: 'transparent',
          pointBackgroundColor: P[2], pointRadius: 3, pointHoverRadius: 6
        }
      ]
    });
  }

  private _buildCategoryChart(data: AssetValueByCategory[]): void {
    const labels = data.map(d => d.label);
    const vals = data.map(d => this.categorySort === 'count' ? d.count : Number(d.totalValue));
    this.categoryChartData.set({
      labels, datasets: [{
        label: this.categorySort === 'count' ? 'Units' : `Value (${this.currencySymbol})`,
        data: vals,
        backgroundColor: P.slice(0, labels.length).map(c => c + 'cc'),
        borderColor: P.slice(0, labels.length), borderWidth: 1.5, borderRadius: 6
      }]
    });
  }

  private _buildDepreciationChart(data: DepreciationSummary[]): void {
    const labels = data.map(d => d.label);
    this.depreciationChartData.set({
      labels, datasets: [{
        label: `Depreciable Value (${this.currencySymbol})`,
        data: data.map(d => Number(d.total)),
        backgroundColor: P.slice(0, labels.length).map(c => c + 'cc'),
        borderColor: P.slice(0, labels.length), borderWidth: 1.5, borderRadius: 6
      }]
    });
  }

  private _buildIssueChart(data: IssueSummary[]): void {
    const labels = data.map(d => d.label);
    const colors = data.map((d, i) =>
      (d.statusKey && STATUS_COLOR[d.statusKey]) ? STATUS_COLOR[d.statusKey] : P[i % P.length]);

    this.issueChartData.set({
      labels, datasets: [{
        label: 'Issues', data: data.map(d => d.count),
        backgroundColor: colors.map(c => c + '99'),
        borderColor: colors, borderWidth: 1.5, borderRadius: 6
      }]
    });

    const OPEN = new Set(['new', 'inprogress', 'pending', 'blocker', 'hold']);
    this.issuePills.set(
      this.issueSort === 'status'
        ? data.filter(d => d.statusKey && OPEN.has(d.statusKey))
          .map(d => ({ label: d.label, value: d.count, color: STATUS_COLOR[d.statusKey!] ?? P[0] }))
        : []
    );
  }

  private _buildUserChart(data: UserDistribution[]): void {
    const labels = data.map(d => d.label);
    this.userChartData.set({
      labels, datasets: [{
        data: data.map(d => d.count),
        backgroundColor: P.slice(0, labels.length).map(c => c + 'cc'),
        borderColor: P.slice(0, labels.length), borderWidth: 2
      }]
    });
  }

  private _buildApprovalChart(data: ApprovalPipeline): void {
    const p = data?.pending || 0, a = data?.approved || 0, r = data?.rejected || 0;
    const t = p + a + r || 1;
    this.approvalBars.set([
      { label: 'Pending', value: p, pct: Math.round(p / t * 100), color: '#f59e0b' },
      { label: 'Approved', value: a, pct: Math.round(a / t * 100), color: '#10b981' },
      { label: 'Rejected', value: r, pct: Math.round(r / t * 100), color: '#ef4444' }
    ]);
    this.approvalChartData.set({
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{
        data: [p, a, r],
        backgroundColor: ['#f59e0b99', '#10b98199', '#ef444499'],
        borderColor: ['#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 2, hoverOffset: 6
      }]
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ═════════════════════════════════════════════════════════════════════════
  hasImg(url: string | null | undefined): boolean {
    return !!(url?.trim());
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const parent = img.closest('.thumb');
    if (!parent) { img.style.display = 'none'; return; }
    img.style.display = 'none';
    const fb = parent.querySelector<HTMLElement>('.img-fb');
    if (fb) fb.style.display = 'flex';
  }

  formatKpi(v: number): string {
    if (!v) return `${this.currencySymbol}0`;
    try {
      if (v >= 1_000_000) return new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode, maximumFractionDigits: 1, notation: 'compact' }).format(v);
      return new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode, maximumFractionDigits: 0 }).format(v);
    } catch {
      const sym = this.currencySymbol;
      if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(0)}K`;
      return `${sym}${v}`;
    }
  }

  initials(firstName: string, lastName: string): string {
    return (((firstName ?? '').trim()[0] ?? '') + ((lastName ?? '').trim()[0] ?? '')).toUpperCase() || '?';
  }

  userColor(name: string): string {
    const h = [...(name ?? 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return P[h % P.length];
  }

  catColor(cat: string): string {
    const m: Record<string, string> = { 'IT Equipment': '#7c3aed', Vehicles: '#06b6d4', Furniture: '#10b981', Machinery: '#f59e0b', Electronics: '#ef4444' };
    return m[cat] ?? '#94a3b8';
  }

  catIcon(cat: string): string {
    const m: Record<string, string> = { 'IT Equipment': 'computer', Vehicles: 'directions_car', Furniture: 'chair', Machinery: 'precision_manufacturing', Electronics: 'devices_other' };
    return m[cat] ?? 'inventory_2';
  }

  priorityClass(key: string): string {
    return { high: 'pri--high', medium: 'pri--med', low: 'pri--low', critical: 'pri--crit' }[key?.toLowerCase()] ?? 'pri--med';
  }

  healthGradeColor(grade: string): string {
    return { A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[grade] ?? '#94a3b8';
  }

  /** Today's date — used in the template for the greeting bar date display */
  readonly today = new Date();

  private _toast(msg: string): void {
    this.snack.open(msg, 'Dismiss', { duration: 4000 });
  }
}
