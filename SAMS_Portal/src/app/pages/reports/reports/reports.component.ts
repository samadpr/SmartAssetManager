import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { DashboardService } from '../../../core/services/dashboard/dashboard.service';
import { AssetReportService } from '../../../core/services/asset-report/asset-report.service';
import { AssetTransferReportService } from '../../../core/services/asset-report/asset-transfer-report/asset-transfer-report.service';
import { CompanyStorageService } from '../../../core/services/localStorage/company/company-storage.service';
import { forkJoin } from 'rxjs';
 
 
// ── Chart data interfaces ──────────────────────────────────────────────────
 
interface KpiItem {
  icon: string;
  label: string;
  value: string;
  gradient: string;
}
 
interface DonutSegment {
  label: string;
  count: number;
  color: string;
  /** stroke-dasharray value — "arcLength circumference" */
  dash: string;
  /** stroke-dashoffset — negative cumulative arc so segments start after previous */
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
  colorLight: string;  // lighter shade for gradient end
}
 
// ── Colour palettes ────────────────────────────────────────────────────────
 
const DONUT_COLOURS = [
  '#7c4dff', '#4caf50', '#2196f3', '#ff9800',
  '#e91e63', '#00bcd4', '#8bc34a', '#ff5722'
];
 
const HBAR_COLOURS: [string, string][] = [
  ['#673ab7', '#9c68e8'],
  ['#1976d2', '#5aa3f0'],
  ['#2e7d32', '#66bb6a'],
  ['#f57c00', '#ffb74d'],
  ['#c62828', '#ef5350'],
  ['#00838f', '#4dd0e1'],
];
 
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatRippleModule,
    MatTooltipModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
 
  // ── State ──────────────────────────────────────────────────────────────────
  loadingKpi    = signal(true);
  loadingCharts = signal(true);
 
  private _kpiStats        = signal<any>(null);
  private _statusDistrib   = signal<any[]>([]);
  private _growth          = signal<any[]>([]);
  private _valueByCategory = signal<any[]>([]);
  private _warrantyExpiring= signal<any[]>([]);
  private _transferSummary = signal<any>(null);
 
  // ── KPI Strip ─────────────────────────────────────────────────────────────
  kpiItems = computed<KpiItem[]>(() => {
    const k = this._kpiStats();
    if (!k) return [];
    return [
      { icon: 'inventory_2',        label: 'Total Assets',       value: String(k.totalAssets?.value ?? 0),          gradient: 'linear-gradient(135deg,#673ab7,#4527a0)' },
      { icon: 'attach_money',       label: 'Total Asset Value',  value: this._fmtCompact(k.totalAssetValue?.value ?? 0), gradient: 'linear-gradient(135deg,#2e7d32,#1b5e20)' },
      { icon: 'group',              label: 'Active Users',        value: String(k.activeUsers?.value ?? 0),           gradient: 'linear-gradient(135deg,#1565c0,#0d47a1)' },
      { icon: 'pending_actions',    label: 'Pending Approvals',  value: String(k.pendingApprovals?.value ?? 0),      gradient: 'linear-gradient(135deg,#e65100,#bf360c)' },
      { icon: 'report_problem',     label: 'Open Issues',        value: String(k.openIssues?.value ?? 0),            gradient: 'linear-gradient(135deg,#c62828,#b71c1c)' },
      { icon: 'delete_forever',     label: 'Disposed Assets',    value: String(k.disposedAssets?.value ?? 0),        gradient: 'linear-gradient(135deg,#6a1b9a,#4a148c)' },
    ];
  });
 
  // ── Donut — r = 72, circumference = 2π×72 ≈ 452.4 ─────────────────────────
  private readonly _R   = 72;
  private readonly _C   = +(2 * Math.PI * this._R).toFixed(2); // 452.39
 
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
      const arcLen    = fraction * this._C;
      // gap of 2px between segments for clarity
      const gap       = data.length > 1 ? 2 : 0;
      const visArcLen = Math.max(0, arcLen - gap);
 
      // stroke-dasharray: visible arc then invisible rest
      const dash   = `${visArcLen.toFixed(2)} ${(this._C - visArcLen).toFixed(2)}`;
      // offset = -(cumulative fraction × circumference)  →  negative = clockwise shift
      const offset = (-cumulative * this._C).toFixed(2);
      cumulative  += fraction;
 
      return {
        label : s.label || s.statusKey || 'Unknown',
        count : s.count || 0,
        color : DONUT_COLOURS[i % DONUT_COLOURS.length],
        dash,
        offset,
      };
    });
  });
 
  // ── Growth Bars ────────────────────────────────────────────────────────────
  growthBars = computed<GrowthBar[]>(() => {
    const data = this._growth();
    if (!data.length) return [];
    const maxVal = Math.max(...data.flatMap(d => [d.acquired || 0, d.disposed || 0]), 1);
    return data.slice(-6).map(d => ({
      month       : this._shortMonth(d.month),
      acquired    : d.acquired || 0,
      disposed    : d.disposed || 0,
      acquiredPct : Math.round(((d.acquired || 0) / maxVal) * 100),
      disposedPct : Math.round(((d.disposed || 0) / maxVal) * 100),
    }));
  });
 
  // ── Top Categories ─────────────────────────────────────────────────────────
  topCategories = computed<CategoryBar[]>(() => {
    const data = this._valueByCategory();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.totalValue || 0), 1);
    return data.slice(0, 5).map((d, i) => {
      const [color, colorLight] = HBAR_COLOURS[i % HBAR_COLOURS.length];
      return {
        label       : d.label || 'Unknown',
        count       : d.count || 0,
        totalValue  : d.totalValue || 0,
        valueDisplay: this._fmtCompact(d.totalValue || 0),
        pct         : Math.round(((d.totalValue || 0) / maxVal) * 100),
        color,
        colorLight,
      };
    });
  });
 
  // ── Insight Counts ─────────────────────────────────────────────────────────
  warrantyAlertCount  = computed(() => this._warrantyExpiring().length);
  pendingApprovalCount= computed(() => this._kpiStats()?.pendingApprovals?.value ?? 0);
  depreciableCount    = computed(() => this._kpiStats()?.depreciableAssets?.value ?? 0);
  totalTransferLegs   = computed(() => this._transferSummary()?.totalTransferLegs ?? 0);
 
  // ── Currency helpers ───────────────────────────────────────────────────────
  private get _code(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
 
  private _fmtCompact(value: number): string {
    if (!value && value !== 0) return '0';
    try {
      const code = this._code;
      if (value >= 1_000_000) {
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 1, notation: 'compact' }).format(value);
      }
      if (value >= 10_000) {
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 0, notation: 'compact' }).format(value);
      }
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
 
  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private transferReportService: AssetTransferReportService,
    private companyStorage: CompanyStorageService,
  ) {}
 
  ngOnInit(): void {
    this._loadKpi();
    this._loadCharts();
  }
 
  private _loadKpi(): void {
    this.loadingKpi.set(true);
    this.dashboardService.getKpiStats().subscribe({
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
      transfers: this.transferReportService.getOrganisationSummary(),
    }).subscribe({
      next: r => {
        if (r.status.success)    this._statusDistrib.set(r.status.data || []);
        if (r.growth.success)    this._growth.set(r.growth.data || []);
        if (r.catValue.success)  this._valueByCategory.set(r.catValue.data || []);
        if (r.warranty.success)  this._warrantyExpiring.set(r.warranty.data || []);
        if (r.transfers.success) this._transferSummary.set(r.transfers.data || null);
        this.loadingCharts.set(false);
      },
      error: () => { this.loadingCharts.set(false); },
    });
  }
 
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
