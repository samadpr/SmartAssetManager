import {
  Component, OnInit, OnDestroy, computed, signal, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, SlicePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { MatCardModule }         from '@angular/material/card';
import { MatIconModule }         from '@angular/material/icon';
import { MatButtonModule }       from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule }    from '@angular/material/form-field';
import { MatSelectModule }       from '@angular/material/select';
import { MatInputModule }        from '@angular/material/input';
import { MatChipsModule }        from '@angular/material/chips';
import { MatTooltipModule }      from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseChartDirective }    from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { trigger, transition, style, animate } from '@angular/animations';

import { PageHeaderComponent } from '../../shared/widgets/page-header/page-header.component';
import { DashboardService }    from '../../core/services/dashboard/dashboard.service';
import {
  KpiStats, AssetStatusDistribution, AssetGrowth, AssetValueByCategory,
  DepreciationSummary, IssueSummary, UserDistribution, ApprovalPipeline,
  SiteAssetSummary, RecentAsset, RecentUser,
  PendingApprovalAlert, OpenIssueAlert, WarrantyExpiring
} from '../../core/models/interfaces/dashboard/dashboard.interface';
import { FileUrlHelper } from '../../core/helper/get-file-url';

// ─── Local view-model interfaces ─────────────────────────────────────────────

interface KpiCard {
  key: string; label: string; value: number; trend: number;
  icon: string; color: string; sparkline: number[]; isCurrency?: boolean;
}

interface LegendItem  { label: string; value: number; color: string; }
interface IssuePill   { label: string; value: number; color: string; }
interface ApprovalBar { label: string; value: number; pct: number; color: string; }

// Asset row for table — maps from RecentAssetDto
interface AssetRow {
  assetId:       string;
  name:          string;
  category:      string;
  status:        string;
  statusKey:     string;
  value:         number;
  site:          string;
  date:          Date;
  imageUrl:      string | null;   // assetImageUrl from API — null = show icon fallback
}

// User row for table — maps from RecentUserDto
interface UserRow {
  id:            number;
  firstName:     string;          // stored separately for initials
  lastName:      string;
  fullName:      string;          // "FirstName LastName"
  email:         string;
  department:    string;
  designation:   string;
  role:          string;
  date:          Date;
  profilePic:    string | null;   // profilePicture from API — null = show initials
}

// Alert item view-models
interface ApprovalItem {
  assignmentId:     number;
  assetId:          string;
  assetName:        string;
  requesterName:    string;
  requesterPic:     string | null;
  requestedDate:    Date;
  siteName:         string;
  assetImageUrl:    string | null;
}

interface IssueItem {
  id:            number;
  assetName:     string;
  title:         string;
  description:   string;
  statusKey:     string;
  statusLabel:   string;
  priorityKey:   string;
  priorityLabel: string;
  createdDate:   Date;
}

interface WarrantyItem {
  id:          number;
  assetCode:   string;
  name:        string;
  daysLeft:    number;
  site:        string;
}

interface SiteVM {
  siteId:     number;
  name:       string;
  city:       string;
  type:       number;
  assetCount: number;
  totalValue: number;
  assets:     { assetId: string; name: string; status: string; statusKey: string; }[];
}

// ─── Chart palette & status color map ────────────────────────────────────────

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
    MatProgressSpinnerModule, MatSnackBarModule,
    BaseChartDirective, PageHeaderComponent,
    DecimalPipe, DatePipe, SlicePipe, CurrencyPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('dashFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy  {

  private destroy$ = new Subject<void>();

  // ── Loading states per section ────────────────────────────────────────────
  kpiLoading     = signal(true);
  chartLoading   = signal(true);
  siteLoading    = signal(true);
  tableLoading   = signal(true);
  alertLoading   = signal(true);

  /** Global loading — true while KPI is still loading (drives skeleton visibility) */
  isLoading = computed(() => this.kpiLoading());

  // ── Filter controls ───────────────────────────────────────────────────────
  assetStatusFilter = 'all';
  assetTrendPeriod  = '1y';
  depreciationSort  = 'method';
  categorySort      = 'value';
  userChartView     = 'department';
  issueSort         = 'status';
  siteFilter        = 'all';
  assetSearch       = '';

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  kpiCards = signal<KpiCard[]>([
    { key:'totalAssets',      label:'Total Assets',       value:0, trend:0, icon:'inventory_2',    color:'primary',  sparkline:[] },
    { key:'activeUsers',      label:'Active Users',        value:0, trend:0, icon:'group',          color:'accent',   sparkline:[] },
    { key:'openIssues',       label:'Open Issues',         value:0, trend:0, icon:'report_problem', color:'warn',     sparkline:[] },
    { key:'pendingApprovals', label:'Pending Approvals',   value:0, trend:0, icon:'rule',           color:'tertiary', sparkline:[] },
    { key:'totalValue',       label:'Total Asset Value',   value:0, trend:0, icon:'attach_money',   color:'success',  sparkline:[], isCurrency:true },
    { key:'depreciated',      label:'Depreciable Assets',  value:0, trend:0, icon:'trending_down',  color:'info',     sparkline:[] },
    { key:'sites',            label:'Sites & Branches',    value:0, trend:0, icon:'location_city',  color:'purple',   sparkline:[] },
    { key:'disposed',         label:'Disposed Assets',     value:0, trend:0, icon:'delete_outline', color:'neutral',  sparkline:[] },
  ]);

  // ── Chart data signals ────────────────────────────────────────────────────
  assetStatusChartData  = signal<ChartData<'doughnut'>>({ labels:[], datasets:[] });
  assetGrowthData       = signal<ChartData<'line'>>({ labels:[], datasets:[] });
  categoryChartData     = signal<ChartData<'bar'>>({ labels:[], datasets:[] });
  depreciationChartData = signal<ChartData<'bar'>>({ labels:[], datasets:[] });
  issueChartData        = signal<ChartData<'bar'>>({ labels:[], datasets:[] });
  userChartData         = signal<ChartData<'polarArea'>>({ labels:[], datasets:[] });
  approvalChartData     = signal<ChartData<'doughnut'>>({ labels:[], datasets:[] });

  // ── Computed / summary signals ────────────────────────────────────────────
  assetStatusLegend = signal<LegendItem[]>([]);
  issuePills        = signal<IssuePill[]>([]);
  approvalBars      = signal<ApprovalBar[]>([]);
  donutTotal        = computed(() => this.assetStatusLegend().reduce((s, x) => s + x.value, 0));

  // ── Raw data signals ──────────────────────────────────────────────────────
  private _allSites       = signal<SiteVM[]>([]);
  private _approvalAlerts = signal<ApprovalItem[]>([]);
  private _issueAlerts    = signal<IssueItem[]>([]);
  private _warrantyAlerts = signal<WarrantyItem[]>([]);

  filteredSites    = computed(() => {
    const f = this.siteFilter;
    return f === 'all' ? this._allSites() : this._allSites().filter(s => String(s.type) === f);
  });
  pendingApprovals = computed(() => this._approvalAlerts());
  openIssues       = computed(() => this._issueAlerts());
  warrantyExpiring = computed(() => this._warrantyAlerts());

  // ── Table data sources ────────────────────────────────────────────────────
  recentAssetsDS = new MatTableDataSource<AssetRow>([]);
  recentUsersDS  = new MatTableDataSource<UserRow>([]);
  assetCols = ['name', 'category', 'status', 'value', 'site', 'date'];
  userCols  = ['name', 'dept', 'role', 'date'];

  // ══════════════════════════════════════════════════════════════════════════
  //  Chart Options
  // ══════════════════════════════════════════════════════════════════════════

  doughnutOpts: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } }
    },
    animation: { animateRotate: true, duration: 700 }
  };

  lineOpts: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, border: { display: false },
           grid: { color: 'rgba(128,128,128,.1)' }, ticks: { precision: 0, font: { size: 11 } } }
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
            if (v == null) return ' 0';
            return v >= 1000 ? ` $${(v / 1000).toFixed(0)}k` : ` ${v}`;
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, border: { display: false },
           grid: { color: 'rgba(128,128,128,.1)' },
           ticks: { font: { size: 11 },
                    callback: v => typeof v === 'number' && v >= 1000 ? `$${(v/1000).toFixed(0)}k` : v }
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
      x: { beginAtZero: true, border: { display: false },
           grid: { color: 'rgba(128,128,128,.1)' }, ticks: { precision: 0, font: { size: 11 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } }
    },
    animation: { duration: 600 }
  };

  polarOpts: ChartConfiguration<'polarArea'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } } },
    scales: { r: { grid: { color: 'rgba(128,128,128,.15)' }, ticks: { display: false } } },
    animation: { duration: 700 }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  Constructor & Lifecycle
  // ══════════════════════════════════════════════════════════════════════════

  constructor(
    private dashSvc: DashboardService,
    private snack:   MatSnackBar,
    private cdr:     ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this._loadKpi();
    this._loadCharts();
    this._loadSites();
    this._loadTables();
    this._loadAlerts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SECTION LOADERS
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. KPI ────────────────────────────────────────────────────────────────
  private _loadKpi(): void {
    this.dashSvc.getKpiStats()
      .pipe(takeUntil(this.destroy$), finalize(() => this.kpiLoading.set(false)))
      .subscribe({
        next: res => {
          if (!res?.success || !res.data) return;
          const d: KpiStats = res.data;

          // Helper: sparkline values from API are cumulative numbers (object[])
          // Normalize to number[] and scale 0–100 for bar heights
          const toSparkline = (raw: any[]): number[] => {
            if (!raw?.length) return [];
            const nums = raw.map(v => Number(v) || 0);
            const max  = Math.max(...nums, 1);
            return nums.map(n => Math.max(5, Math.round((n / max) * 100)));
          };

          this.kpiCards.update(cards => cards.map(c => {
            switch (c.key) {
              case 'totalAssets':
                return { ...c, value: Number(d.totalAssets.value)||0,
                               trend: Number(d.totalAssets.trend)||0,
                               sparkline: toSparkline(d.totalAssets.sparkline) };
              case 'activeUsers':
                return { ...c, value: Number(d.activeUsers.value)||0,
                               trend: Number(d.activeUsers.trend)||0,
                               sparkline: toSparkline(d.activeUsers.sparkline) };
              case 'openIssues':
                return { ...c, value: Number(d.openIssues.value)||0,
                               trend: Number(d.openIssues.trend)||0,
                               sparkline: toSparkline(d.openIssues.sparkline) };
              case 'pendingApprovals':
                return { ...c, value: Number(d.pendingApprovals.value)||0,
                               trend: Number(d.pendingApprovals.trend)||0,
                               sparkline: toSparkline(d.pendingApprovals.sparkline) };
              case 'totalValue':
                return { ...c, value: Number(d.totalAssetValue.value)||0,
                               trend: Number(d.totalAssetValue.trend)||0,
                               sparkline: toSparkline(d.totalAssetValue.sparkline) };
              case 'depreciated':
                return { ...c, value: Number(d.depreciableAssets.value)||0,
                               trend: Number(d.depreciableAssets.trend)||0,
                               sparkline: toSparkline(d.depreciableAssets.sparkline) };
              case 'sites':
                return { ...c, value: Number(d.sitesAndBranches.value)||0,
                               trend: Number(d.sitesAndBranches.trend)||0,
                               sparkline: toSparkline(d.sitesAndBranches.sparkline) };
              case 'disposed':
                return { ...c, value: Number(d.disposedAssets.value)||0,
                               trend: Number(d.disposedAssets.trend)||0,
                               sparkline: toSparkline(d.disposedAssets.sparkline) };
              default: return c;
            }
          }));
        },
        error: () => this._toast('Failed to load KPI stats')
      });
  }

  // ── 2–8. Charts — load all in parallel ───────────────────────────────────
  private _loadCharts(): void {
    forkJoin({
      status:      this.dashSvc.getAssetStatusDistribution(this.assetStatusFilter),
      growth:      this.dashSvc.getAssetGrowth(this.assetTrendPeriod),
      category:    this.dashSvc.getAssetValueByCategory(this.categorySort),
      depreciation: this.dashSvc.getDepreciationSummary(this.depreciationSort),
      issues:      this.dashSvc.getIssueSummary(this.issueSort),
      users:       this.dashSvc.getUserDistribution(this.userChartView),
      approval:    this.dashSvc.getApprovalPipeline()
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.chartLoading.set(false)))
    .subscribe({
      next: r => {
        if (r.status.success  && r.status.data)      this._buildStatusChart(r.status.data);
        if (r.growth.success  && r.growth.data)      this._buildGrowthChart(r.growth.data);
        if (r.category.success && r.category.data)   this._buildCategoryChart(r.category.data);
        if (r.depreciation.success && r.depreciation.data) this._buildDepreciationChart(r.depreciation.data);
        if (r.issues.success  && r.issues.data)      this._buildIssueChart(r.issues.data);
        if (r.users.success   && r.users.data)       this._buildUserChart(r.users.data);
        if (r.approval.success && r.approval.data)   this._buildApprovalChart(r.approval.data);
      },
      error: () => this._toast('Failed to load chart data')
    });
  }

  // ── 9. Sites ──────────────────────────────────────────────────────────────
  private _loadSites(): void {
    this.dashSvc.getSitesAssetSummary(this.siteFilter)
      .pipe(takeUntil(this.destroy$), finalize(() => this.siteLoading.set(false)))
      .subscribe({
        next: res => {
          if (!res?.success || !res.data) return;
          this._allSites.set(res.data.map((s: SiteAssetSummary) => ({
            siteId:     Number(s.siteId),
            name:       s.name,
            city:       s.city ?? '',
            type:       s.type,
            assetCount: s.assetCount,
            totalValue: Number(s.totalValue),
            assets:     (s.assets ?? []).map(a => ({
              assetId:   a.assetId,
              name:      a.name,
              status:    a.status,
              statusKey: a.statusKey
            }))
          })));
        },
        error: () => this._toast('Failed to load site data')
      });
  }

  // ── 10 & 11. Tables ───────────────────────────────────────────────────────
  private _loadTables(): void {
    forkJoin({
      assets: this.dashSvc.getRecentAssets(6),
      users:  this.dashSvc.getRecentUsers(5)
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.tableLoading.set(false)))
    .subscribe({
      next: ({ assets, users }) => {

        // ── Recent Assets: use assetImageUrl; fall back to category icon ──
        if (assets?.success && assets.data) {
          this.recentAssetsDS.data = assets.data.map((a: RecentAsset) => ({
            assetId:   a.assetId,
            name:      a.name        ?? '—',
            category:  a.category    ?? '',
            status:    a.status      ?? '—',
            statusKey: a.statusKey   ?? 'new',
            value:     Number(a.unitPrice) || 0,
            site:      a.siteDisplay ?? '—',
            date:      new Date(a.createdDate),
            imageUrl:  a.assetImageUrl ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null
          }));

          this.recentAssetsDS.filterPredicate = (r, f) =>
            r.name.toLowerCase().includes(f) ||
            r.assetId.toLowerCase().includes(f) ||
            r.category.toLowerCase().includes(f);
        }

        // ── Recent Users: profilePicture; fall back to initials avatar ────
        if (users?.success && users.data) {
          this.recentUsersDS.data = users.data.map((u: RecentUser) => {
            const first = (u.firstName ?? '').trim();
            const last  = (u.lastName  ?? '').trim();
            return {
              id:          Number(u.userProfileId),
              firstName:   first,
              lastName:    last,
              fullName:    [first, last].filter(Boolean).join(' ') || '—',
              email:       u.email               ?? '',
              department:  u.departmentDisplay   ?? '—',
              designation: u.designationDisplay  ?? '—',
              role:        u.roleIdDisplay        ?? '—',
              date:        u.joiningDate ? new Date(u.joiningDate) : new Date(),
              profilePic:  u.profilePicture ? FileUrlHelper.getFullUrl(u.profilePicture) : null
            };
          });
        }
      },
      error: () => this._toast('Failed to load recent data')
    });
  }

  // ── 12–14. Alerts ─────────────────────────────────────────────────────────
  private _loadAlerts(): void {
    forkJoin({
      approvals: this.dashSvc.getPendingApprovalAlerts(),
      issues:    this.dashSvc.getOpenIssueAlerts(),
      warranty:  this.dashSvc.getWarrantyExpiring(90)
    })
    .pipe(takeUntil(this.destroy$), finalize(() => this.alertLoading.set(false)))
    .subscribe({
      next: ({ approvals, issues, warranty }) => {

        if (approvals?.success && approvals.data) {
          this._approvalAlerts.set(approvals.data.map((a: PendingApprovalAlert) => ({
            assignmentId:  Number(a.assignmentId),
            assetId:       a.assetId,
            assetName:     a.assetName     ?? a.assetId,
            requesterName: a.requestedByName ?? a.requestedByEmail ?? '—',
            requesterPic:  (a.requestedByProfilePicture && a.requestedByProfilePicture.trim())
                             ? a.requestedByProfilePicture.trim() : null,
            requestedDate: new Date(a.requestedDate),
            siteName:      a.siteName      ?? '',
            assetImageUrl: a.assetImageUrl ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null
          })));
        }

        if (issues?.success && issues.data) {
          this._issueAlerts.set(issues.data.map((i: OpenIssueAlert) => ({
            id:            Number(i.issueId),
            assetName:     i.assetName    ?? i.assetId ?? '—',
            title:         i.title        ?? '',
            description:   i.description  ?? '',
            statusKey:     i.statusKey,
            statusLabel:   i.statusDisplay,
            priorityKey:   i.priorityKey  ?? '',
            priorityLabel: i.priorityDisplay ?? '',
            createdDate:   new Date(i.createdDate)
          })));
        }

        if (warranty?.success && warranty.data) {
          this._warrantyAlerts.set(warranty.data.map((w: WarrantyExpiring) => ({
            id:        Number(w.assetId),
            assetCode: w.assetCode,
            name:      w.name       ?? w.assetCode,
            daysLeft:  w.daysLeft,
            site:      w.siteDisplay ?? ''
          })));
        }
      },
      error: () => this._toast('Failed to load alert data')
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Chart rebuilders — wired to template filter controls
  // ══════════════════════════════════════════════════════════════════════════

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
        next: res => {
          if (!res?.success || !res.data) return;
          this._allSites.set(res.data.map((s: SiteAssetSummary) => ({
            siteId:     Number(s.siteId),
            name:       s.name, city: s.city ?? '',
            type:       s.type, assetCount: s.assetCount,
            totalValue: Number(s.totalValue),
            assets:     (s.assets ?? []).map(a => ({
              assetId: a.assetId, name: a.name, status: a.status, statusKey: a.statusKey
            }))
          })));
        },
        error: () => this._toast('Failed to load site data')
      });
  }

  filterAssets(): void {
    this.recentAssetsDS.filter = this.assetSearch.trim().toLowerCase();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Chart data builders (from real API response)
  // ══════════════════════════════════════════════════════════════════════════

  private _buildStatusChart(data: AssetStatusDistribution[]): void {
    const items: LegendItem[] = data.map((d, i) => ({
      label: d.label,
      value: d.count,
      color: STATUS_COLOR[d.statusKey] ?? P[i % P.length]
    }));
    this.assetStatusLegend.set(items);
    this.assetStatusChartData.set({
      labels: items.map(d => d.label),
      datasets: [{
        data: items.map(d => d.value),
        backgroundColor: items.map(d => d.color),
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.08)', hoverOffset: 8
      }]
    });
  }

  private _buildGrowthChart(data: AssetGrowth[]): void {
    this.assetGrowthData.set({
      labels: data.map(d => d.month),
      datasets: [
        { label: 'Acquired', data: data.map(d => d.acquired),
          fill: true, tension: 0.45, borderWidth: 2.5,
          borderColor: P[0], backgroundColor: P[0] + '22',
          pointBackgroundColor: P[0], pointBorderColor: '#fff',
          pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Disposed', data: data.map(d => d.disposed),
          fill: true, tension: 0.45, borderWidth: 2.5,
          borderColor: P[4], backgroundColor: P[4] + '22',
          pointBackgroundColor: P[4], pointBorderColor: '#fff',
          pointRadius: 4, pointHoverRadius: 7 }
      ]
    });
  }

  private _buildCategoryChart(data: AssetValueByCategory[]): void {
    const labels = data.map(d => d.label);
    const vals   = data.map(d => this.categorySort === 'count' ? d.count : Number(d.totalValue));
    this.categoryChartData.set({ labels, datasets: [{
      label: this.categorySort === 'count' ? 'Count' : 'Value ($)',
      data: vals,
      backgroundColor: P.slice(0, labels.length).map(c => c + 'cc'),
      borderColor: P.slice(0, labels.length), borderWidth: 1.5, borderRadius: 6
    }]});
  }

  private _buildDepreciationChart(data: DepreciationSummary[]): void {
    const labels = data.map(d => d.label);
    const vals   = data.map(d => Number(d.total));
    this.depreciationChartData.set({ labels, datasets: [{
      label: 'Depreciation ($)', data: vals,
      backgroundColor: P.slice(0, labels.length).map(c => c + 'cc'),
      borderColor: P.slice(0, labels.length), borderWidth: 1.5, borderRadius: 6
    }]});
  }

  private _buildIssueChart(data: IssueSummary[]): void {
    const labels = data.map(d => d.label);
    const counts = data.map(d => d.count);
    const colors = data.map((d, i) =>
      (d.statusKey && STATUS_COLOR[d.statusKey]) ? STATUS_COLOR[d.statusKey] : P[i % P.length]
    );

    this.issueChartData.set({ labels, datasets: [{
      label: 'Issues', data: counts,
      backgroundColor: colors.map(c => c + '99'),
      borderColor: colors, borderWidth: 1.5, borderRadius: 6
    }]});

    // Pills — only shown in status grouping view, for open statuses
    const OPEN_STATUSES = new Set(['new','inprogress','pending','blocker','hold']);
    this.issuePills.set(
      this.issueSort === 'status'
        ? data
            .filter(d => d.statusKey && OPEN_STATUSES.has(d.statusKey))
            .map(d => ({
              label: d.label,
              value: d.count,
              color: STATUS_COLOR[d.statusKey!] ?? P[0]
            }))
        : []
    );
  }

  private _buildUserChart(data: UserDistribution[]): void {
    const labels = data.map(d => d.label);
    this.userChartData.set({ labels, datasets: [{
      data: data.map(d => d.count),
      backgroundColor: P.slice(0, labels.length).map(c => c + 'bb'),
      borderColor: P.slice(0, labels.length), borderWidth: 1.5
    }]});
  }

  private _buildApprovalChart(data: ApprovalPipeline): void {
    const p = data.pending || 0;
    const a = data.approved || 0;
    const r = data.rejected || 0;
    const t = p + a + r || 1;

    this.approvalBars.set([
      { label:'Pending',  value:p, pct:Math.round(p/t*100), color:'#f59e0b' },
      { label:'Approved', value:a, pct:Math.round(a/t*100), color:'#10b981' },
      { label:'Rejected', value:r, pct:Math.round(r/t*100), color:'#ef4444' }
    ]);
    this.approvalChartData.set({
      labels: ['Pending','Approved','Rejected'],
      datasets: [{
        data: [p, a, r],
        backgroundColor: ['#f59e0b99','#10b98199','#ef444499'],
        borderColor:     ['#f59e0b',  '#10b981',  '#ef4444'],
        borderWidth: 2, hoverOffset: 6
      }]
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Image helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** True when the URL string is non-null and non-empty */
  hasImg(url: string | null | undefined): boolean {
    return !!(url && url.trim().length > 0);
  }

  /**
   * Fallback when <img> fails to load.
   * Hides the broken img and shows the sibling .img-fb element.
   */
  onImgError(event: Event): void {
    const img    = event.target as HTMLImageElement;
    const parent = img.closest('.thumb');
    if (!parent) { img.style.display = 'none'; return; }
    img.style.display = 'none';
    const fb = parent.querySelector<HTMLElement>('.img-fb');
    if (fb) fb.style.display = 'flex';
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Utility helpers
  // ══════════════════════════════════════════════════════════════════════════

  formatKpi(v: number): string {
    if (!v) return '$0';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  }

  /**
   * Build initials from FIRST + LAST name separately.
   * "Ahmed Al Rashid" → "AA" (uses firstName[0] + lastName[0])
   */
  initials(firstName: string, lastName: string): string {
    const f = (firstName ?? '').trim();
    const l = (lastName  ?? '').trim();
    return ((f[0] ?? '') + (l[0] ?? '')).toUpperCase() || '?';
  }

  /** Deterministic color from a name string */
  userColor(name: string): string {
    const h = [...(name ?? 'A')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return P[h % P.length];
  }

  catColor(cat: string): string {
    const m: Record<string,string> = {
      'IT Equipment': '#7c3aed', 'Vehicles': '#06b6d4',
      'Furniture':    '#10b981', 'Machinery': '#f59e0b',
      'Electronics':  '#ef4444'
    };
    return m[cat] ?? '#94a3b8';
  }

  catIcon(cat: string): string {
    const m: Record<string,string> = {
      'IT Equipment': 'computer',           'Vehicles':    'directions_car',
      'Furniture':    'chair',              'Machinery':   'precision_manufacturing',
      'Electronics':  'devices_other'
    };
    return m[cat] ?? 'inventory_2';
  }

  priorityClass(key: string): string {
    const m: Record<string,string> = { high:'pri--high', medium:'pri--med', low:'pri--low', critical:'pri--crit' };
    return m[key?.toLowerCase()] ?? 'pri--med';
  }

  private _toast(msg: string): void {
    this.snack.open(msg, 'Dismiss', { duration: 4000 });
  }
}
