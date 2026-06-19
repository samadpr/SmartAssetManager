import { Component, computed, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
 
import { MatCardModule }     from '@angular/material/card';
import { MatIconModule }     from '@angular/material/icon';
import { MatButtonModule }   from '@angular/material/button';
import { MatChipsModule }    from '@angular/material/chips';
import { MatRippleModule }   from '@angular/material/core';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatDividerModule }  from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
 
import { PageHeaderComponent }         from '../../../shared/widgets/page-header/page-header.component';
import { DashboardService }            from '../../../core/services/dashboard/dashboard.service';
import { AssetTransferReportService }  from '../../../core/services/asset-report/asset-transfer-report/asset-transfer-report.service';
import { CompanyStorageService }       from '../../../core/services/localStorage/company/company-storage.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
 
// ── Local types ───────────────────────────────────────────────────────────────
 
interface KpiItem {
  icon: string;
  label: string;
  value: string;
  gradient: string;
  route?: string;
}
 
interface DonutSegment {
  label: string;
  count: number;
  color: string;
  dash: string;
  offset: string;
}
 
interface GrowthBar {
  month: string;
  acquired: number;
  disposed: number;
  acquiredPct: number;
  disposedPct: number;
}
 
interface CategoryBar {
  label: string;
  count: number;
  totalValue: number;
  valueDisplay: string;
  pct: number;
  color: string;
  colorLight: string;
}
 
interface InsightCard {
  icon: string;
  label: string;
  value: string | number;
  gradient: string;
  route: string;
  borderColor: string;
  urgent?: boolean;
}
 
interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  route: string;
  badgeLabel: string;
  features: { icon: string; label: string }[];
  btnClass: string;
}
 
// ── Colour palettes ────────────────────────────────────────────────────────────
const DONUT_COLOURS = [
  '#7c4dff', '#4caf50', '#2196f3', '#ff9800',
  '#e91e63', '#00bcd4', '#8bc34a', '#ff5722'
];
 
const HBAR_COLOURS: [string, string][] = [
  ['#673ab7', '#9c68e8'], ['#1976d2', '#5aa3f0'],
  ['#2e7d32', '#66bb6a'], ['#f57c00', '#ffb74d'],
  ['#c62828', '#ef5350'], ['#00838f', '#4dd0e1'],
];
 
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, PageHeaderComponent,
    MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatRippleModule, MatTooltipModule,
    MatDividerModule, MatProgressBarModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy  {
 
  private router          = inject(Router);
  private dashboardService= inject(DashboardService);
  private transferService = inject(AssetTransferReportService);
  private companyStorage  = inject(CompanyStorageService);
  private destroy$        = new Subject<void>();
 
  // ── Loading ───────────────────────────────────────────────────────────────
  loadingKpi    = signal(true);
  loadingCharts = signal(true);
 
  // ── Raw data signals ──────────────────────────────────────────────────────
  private _kpiStats         = signal<any>(null);
  private _statusDistrib    = signal<any[]>([]);
  private _growth           = signal<any[]>([]);
  private _valueByCategory  = signal<any[]>([]);
  private _warrantyExpiring = signal<any[]>([]);
  private _transferSummary  = signal<any>(null);
  private _pendingApprovals = signal<any[]>([]);
  private _openIssues       = signal<any[]>([]);
  private _healthScore      = signal<any>(null);
 
  readonly transferSummary = this._transferSummary.asReadonly();
  
  // ── Donut constants: r=72, C=2π×72≈452.39 ─────────────────────────────────
  private readonly R = 72;
  private readonly C = +(2 * Math.PI * this.R).toFixed(2);
 
  // ── Report navigation cards ────────────────────────────────────────────────
  readonly reportCards: ReportCard[] = [
    {
      id: 'asset',
      title: 'Asset Reports',
      description: 'Full asset inventory by batch, depreciation schedules, and disposal summaries with advanced export (PDF, Excel, CSV).',
      icon: 'assessment',
      gradient: 'linear-gradient(135deg, var(--mat-sys-primary) 0%, #4527a0 100%)',
      route: '/reports/asset-reports',
      badgeLabel: '3 report types',
      features: [
        { icon: 'inventory_2',  label: 'Full Inventory' },
        { icon: 'trending_down',label: 'Depreciation' },
        { icon: 'delete_forever',label: 'Disposal' },
      ],
      btnClass: 'rnc-btn-primary',
    },
    {
      id: 'transfer',
      title: 'Transfer Reports',
      description: 'Complete transfer chain per batch and unit — holders, approval stages, hold durations, and full lifecycle visibility.',
      icon: 'receipt_long',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
      route: '/reports/asset-transfer-reports',
      badgeLabel: 'Batch · Timeline · Table',
      features: [
        { icon: 'swap_horiz',  label: 'Transfer Chain' },
        { icon: 'timeline',    label: 'Timeline View' },
        { icon: 'how_to_reg',  label: 'Approval Track' },
      ],
      btnClass: 'rnc-btn-blue',
    },
  ];
 
  // ── KPI strip ──────────────────────────────────────────────────────────────
  kpiItems = computed<KpiItem[]>(() => {
    const k = this._kpiStats();
    if (!k) return [];
    return [
      { icon: 'inventory_2',     label: 'Total Assets',      value: this._fmt(k.totalAssets?.value ?? 0),       gradient: 'linear-gradient(135deg,#673ab7,#4527a0)',  route: '/reports/asset-reports' },
      { icon: 'attach_money',    label: 'Total Value',        value: this._fmtCurrency(k.totalAssetValue?.value ?? 0), gradient: 'linear-gradient(135deg,#2e7d32,#1b5e20)' },
      { icon: 'widgets',         label: 'Total Batches',      value: this._fmt(k.totalBatches?.value ?? 0),      gradient: 'linear-gradient(135deg,#00838f,#00695c)' },
      { icon: 'group',           label: 'Active Users',       value: this._fmt(k.activeUsers?.value ?? 0),       gradient: 'linear-gradient(135deg,#1565c0,#0d47a1)' },
      { icon: 'pending_actions', label: 'Pending Approvals',  value: this._fmt(k.pendingApprovals?.value ?? 0),  gradient: 'linear-gradient(135deg,#e65100,#bf360c)', route: '/asset-management/asset-approve' },
      { icon: 'report_problem',  label: 'Open Issues',        value: this._fmt(k.openIssues?.value ?? 0),        gradient: 'linear-gradient(135deg,#c62828,#b71c1c)' },
      { icon: 'trending_down',   label: 'Depreciable',        value: this._fmt(k.depreciableAssets?.value ?? 0), gradient: 'linear-gradient(135deg,#7c3aed,#6d28d9)', route: '/reports/asset-reports' },
      { icon: 'delete_forever',  label: 'Disposed',           value: this._fmt(k.disposedAssets?.value ?? 0),    gradient: 'linear-gradient(135deg,#6a1b9a,#4a148c)' },
    ];
  });
 
  // ── Donut ──────────────────────────────────────────────────────────────────
  totalAssetsCount = computed(() =>
    this._statusDistrib().reduce((s, d) => s + (d.count || 0), 0)
  );
 
  donutSegments = computed<DonutSegment[]>(() => {
    const data  = this._statusDistrib();
    const total = this.totalAssetsCount();
    if (!data.length || !total) return [];
    let cumulative = 0;
    return data.slice(0, 7).map((s, i) => {
      const fraction  = (s.count || 0) / total;
      const arcLen    = fraction * this.C;
      const gap       = data.length > 1 ? 2 : 0;
      const visArcLen = Math.max(0, arcLen - gap);
      const dash      = `${visArcLen.toFixed(2)} ${(this.C - visArcLen).toFixed(2)}`;
      const offset    = (-cumulative * this.C).toFixed(2);
      cumulative     += fraction;
      return {
        label : s.label || s.statusKey || 'Unknown',
        count : s.count || 0,
        color : DONUT_COLOURS[i % DONUT_COLOURS.length],
        dash,
        offset,
      };
    });
  });
 
  // ── Growth bars ────────────────────────────────────────────────────────────
  growthBars = computed<GrowthBar[]>(() => {
    const data = this._growth();
    if (!data.length) return [];
    const maxVal = Math.max(...data.flatMap(d => [d.acquired || 0, d.disposed || 0]), 1);
    return data.slice(-6).map(d => ({
      month:       this._shortMonth(d.month),
      acquired:    d.acquired || 0,
      disposed:    d.disposed || 0,
      acquiredPct: Math.round(((d.acquired || 0) / maxVal) * 100),
      disposedPct: Math.round(((d.disposed || 0) / maxVal) * 100),
    }));
  });
 
  // ── Top categories ────────────────────────────────────────────────────────
  topCategories = computed<CategoryBar[]>(() => {
    const data = this._valueByCategory();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.totalValue || 0), 1);
    return data.slice(0, 5).map((d, i) => {
      const [color, colorLight] = HBAR_COLOURS[i % HBAR_COLOURS.length];
      return {
        label:       d.label || 'Unknown',
        count:       d.count || 0,
        totalValue:  d.totalValue || 0,
        valueDisplay:this._fmtCurrency(d.totalValue || 0),
        pct:         Math.round(((d.totalValue || 0) / maxVal) * 100),
        color,
        colorLight,
      };
    });
  });
 
  // ── Health score ──────────────────────────────────────────────────────────
  healthScore = computed(() => this._healthScore());
 
  healthGradeColor = computed<string>(() => {
    const h = this._healthScore();
    if (!h) return '#9e9e9e';
    const score = h.score ?? 0;
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  });
 
  // ── Insight cards ─────────────────────────────────────────────────────────
  insightCards = computed<InsightCard[]>(() => {
    const cards: InsightCard[] = [];
 
    const warrantyCount = this._warrantyExpiring().length;
    if (warrantyCount > 0) {
      cards.push({
        icon: 'warning_amber', label: 'Assets Warranty Expiring (90 days)',
        value: warrantyCount,
        gradient: 'linear-gradient(135deg,#ff9800,#e65100)',
        route: '/reports/asset-reports', borderColor: 'rgba(255,152,0,.35)',
        urgent: this._warrantyExpiring().some(w => w.urgencyKey === 'critical'),
      });
    }
 
    const pending = this._kpiStats()?.pendingApprovals?.value ?? 0;
    if (pending > 0) {
      cards.push({
        icon: 'pending_actions', label: 'Pending Transfer Approvals',
        value: pending,
        gradient: 'linear-gradient(135deg,#9c27b0,#6a1b9a)',
        route: '/reports/asset-transfer-reports', borderColor: 'rgba(156,39,176,.28)',
      });
    }
 
    const openIssues = this._openIssues().length;
    if (openIssues > 0) {
      cards.push({
        icon: 'report_problem', label: 'Open Asset Issues',
        value: openIssues,
        gradient: 'linear-gradient(135deg,#e53935,#b71c1c)',
        route: '/asset-management/asset-issue', borderColor: 'rgba(229,57,53,.28)',
        urgent: true,
      });
    }
 
    cards.push({
      icon: 'trending_down', label: 'Depreciable Assets Tracked',
      value: this._kpiStats()?.depreciableAssets?.value ?? 0,
      gradient: 'linear-gradient(135deg,#1e88e5,#1565c0)',
      route: '/reports/asset-reports', borderColor: 'rgba(30,136,229,.28)',
    });
 
    cards.push({
      icon: 'swap_horiz', label: 'Total Transfer Legs Recorded',
      value: this._transferSummary()?.totalTransferLegs ?? 0,
      gradient: 'linear-gradient(135deg,#43a047,#2e7d32)',
      route: '/reports/asset-transfer-reports', borderColor: 'rgba(67,160,71,.28)',
    });
 
    return cards;
  });
 
  // ── Recent transfers summary (top 5 assets with most transfers) ─────────
  topTransferredAssets = computed(() =>
    (this._transferSummary()?.topTransferred ?? []).slice(0, 5)
  );
 
  // ── Pending approvals list ────────────────────────────────────────────────
  pendingApprovalsList = computed(() =>
    this._pendingApprovals().slice(0, 5)
  );
 
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadKpi();
    this._loadCharts();
  }
 
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 
  private _loadKpi(): void {
    this.loadingKpi.set(true);
    this.dashboardService.getKpiStats().pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { if (r.success && r.data) this._kpiStats.set(r.data); this.loadingKpi.set(false); },
      error: () => { this.loadingKpi.set(false); },
    });
  }
 
  private _loadCharts(): void {
    this.loadingCharts.set(true);
    forkJoin({
      status   : this.dashboardService.getAssetStatusDistribution(),
      growth   : this.dashboardService.getAssetGrowth('6m'),
      catValue : this.dashboardService.getAssetValueByCategory(),
      warranty : this.dashboardService.getWarrantyExpiring(90),
      transfers: this.transferService.getOrganisationSummary(),
      pending  : this.dashboardService.getPendingApprovalAlerts(),
      issues   : this.dashboardService.getOpenIssueAlerts(),
      health   : this.dashboardService.getAssetHealthScore(),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        if (r.status.success)   this._statusDistrib.set(r.status.data || []);
        if (r.growth.success)   this._growth.set(r.growth.data || []);
        if (r.catValue.success) this._valueByCategory.set(r.catValue.data || []);
        if (r.warranty.success) this._warrantyExpiring.set(r.warranty.data || []);
        if (r.transfers.success)this._transferSummary.set(r.transfers.data || null);
        if (r.pending.success)  this._pendingApprovals.set(r.pending.data || []);
        if (r.issues.success)   this._openIssues.set(r.issues.data || []);
        if (r.health.success)   this._healthScore.set(r.health.data || null);
        this.loadingCharts.set(false);
      },
      error: () => { this.loadingCharts.set(false); },
    });
  }
 
  // ── Navigation ────────────────────────────────────────────────────────────
  navigateTo(route: string): void { this.router.navigate([route]); }
 
  // ── Helpers ───────────────────────────────────────────────────────────────
  private get _currencyCode(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
 
  private _fmt(val: number): string { return String(val ?? 0); }
 
  _fmtCurrency(value: number): string {
    if (!value && value !== 0) return '0';
    try {
      const code = this._currencyCode;
      if (value >= 1_000_000)
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 1, notation: 'compact' }).format(value);
      if (value >= 10_000)
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 0, notation: 'compact' }).format(value);
      return new Intl.NumberFormat('en', { style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    } catch {
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
      return `$${value}`;
    }
  }
 
  private _shortMonth(m: string): string {
    if (!m) return '';
    try { return new Date(m + '-01').toLocaleDateString('en', { month: 'short' }); }
    catch { return m.substring(0, 3); }
  }
 
  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
 
  getImageUrl(path: string | null | undefined): string {
    return FileUrlHelper.getFullUrl(path);
  }
 
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
 
  urgencyColor(key: string): string {
    const map: Record<string,string> = { critical: '#c62828', warn: '#f57f17', info: '#1565c0' };
    return map[key] ?? '#9e9e9e';
  }
}
