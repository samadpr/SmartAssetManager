import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  signal,
  computed,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { isPlatformBrowser, CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { Chart, registerables } from 'chart.js';
import { AssetDepreciation, AssetDetail } from '../../../../core/models/interfaces/asset-manage/assets.interface';
import { AssignToType, DepreciationMethod } from '../../../../core/enum/asset.enums';
import { MatCardModule } from '@angular/material/card';
import { animate, style, transition, trigger } from '@angular/animations';
import { CompanyStorageService } from '../../../../core/services/localStorage/company/company-storage.service';

// Register ALL Chart.js modules once
Chart.register(...registerables);
 
// ── Public interface so manage-assets can type-check the dialog data ──
export interface AssetViewPopupData {
  asset: AssetDetail;
  onEdit?: () => void;
}

@Component({
  selector: 'app-asset-view-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatTableModule,
    MatCardModule
  ],
  templateUrl: './asset-view-popup.component.html',
  styleUrl: './asset-view-popup.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AssetViewPopupComponent implements OnInit, OnDestroy {
 
  // ── Injections ────────────────────────────────────────────────────
  private dialogRef    = inject(MatDialogRef<AssetViewPopupComponent>);
  public  dialogData: AssetViewPopupData = inject(MAT_DIALOG_DATA);
  private platformId   = inject(PLATFORM_ID);
  private cdr          = inject(ChangeDetectorRef);
  private companyStorage = inject(CompanyStorageService);
 
  // ── Chart canvas refs ─────────────────────────────────────────────
  @ViewChild('lineChartCanvas')     lineChartCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas')      barChartCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas!: ElementRef<HTMLCanvasElement>;
 
  private lineChart:     Chart | null = null;
  private barChart:      Chart | null = null;
  private doughnutChart: Chart | null = null;
 
  // ── State ─────────────────────────────────────────────────────────
  activeTab = 0;
 
  /** Expose enum to template */
  AssignToType = AssignToType;
 
  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    // Ensure data is loaded; mark for check so OnPush picks up the input
    this.cdr.markForCheck();
  }
 
  ngOnDestroy(): void {
    this.destroyCharts();
  }
 
  // ── Tab change ────────────────────────────────────────────────────
  onTabChange(index: number): void {
    this.activeTab = index;
    this.cdr.markForCheck();
    if (index === 1 && isPlatformBrowser(this.platformId)) {
      setTimeout(() => { this.initCharts(); this.cdr.markForCheck(); }, 80);
    }
  }
 
  // ── Data accessor (safe null-guard) ───────────────────────────────
  get assetData(): AssetDetail {
    return this.dialogData?.asset ?? ({} as AssetDetail);
  }
 
  // ── Computed helpers ──────────────────────────────────────────────
  get hasDepreciation(): boolean {
    return !!(
      this.assetData?.isDepreciable &&
      this.assetData?.depreciationSchedule?.length
    );
  }
 
  get depreciationSchedule(): AssetDepreciation[] {
    return this.assetData?.depreciationSchedule ?? [];
  }
 
  get totalDepreciation(): number {
    return this.depreciationSchedule.reduce((s, d) => s + (d.depreciation ?? 0), 0);
  }
 
  get depreciationProgress(): number {
    const cost = this.assetData?.depreciableCost;
    if (!cost || cost <= 0) return 0;
    return Math.min((this.totalDepreciation / cost) * 100, 100);
  }
 
  get lastBookValue(): number {
    const s = this.depreciationSchedule;
    return s.length ? s[s.length - 1].bookValueYearEnd : 0;
  }
 
  get hasDocuments(): boolean {
    return !!(
      this.assetData?.imageUrl ||
      this.assetData?.deliveryNote ||
      this.assetData?.purchaseReceipt ||
      this.assetData?.invoice
    );
  }
 
  get documentCount(): number {
    let n = 0;
    if (this.assetData?.imageUrl)        n++;
    if (this.assetData?.deliveryNote)    n++;
    if (this.assetData?.purchaseReceipt) n++;
    if (this.assetData?.invoice)         n++;
    return n;
  }
 
  get assignToLabel(): string {
    switch (this.assetData?.assignTo) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      default:                return 'Not Assigned';
    }
  }
 
  get depreciationMethodLabel(): string {
    switch (this.assetData?.depreciationMethod) {
      case DepreciationMethod.StraightLine:            return 'Straight Line';
      case DepreciationMethod.DecliningBalance:        return 'Declining Balance';
      case DepreciationMethod.DoubleDecliningBalance:  return 'Double Declining Balance';
      case DepreciationMethod.OneFiftyDecliningBalance: return '150% Declining Balance';
      case DepreciationMethod.SumOfYearsDigits:        return 'Sum of Years Digits';
      default:                                          return 'None';
    }
  }
 
  // ── Template helpers ──────────────────────────────────────────────
  getAssignIcon(val: number | undefined): string {
    const icons: Record<number, string> = {
      [AssignToType.User]: 'person',
      [AssignToType.Site]: 'location_city',
      [AssignToType.NotAssigned]: 'do_not_disturb'
    };
    return val != null ? (icons[val] ?? 'help_outline') : 'help_outline';
  }
 
  getDepreciationPercent(row: AssetDepreciation): number {
    const cost = this.assetData?.depreciableCost;
    if (!cost || cost <= 0) return 0;
    return parseFloat(((row.depreciation / cost) * 100).toFixed(1));
  }
 
  /** Currency symbol from company storage — fallback to ₹ */
  get currencySymbol(): string {
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'INR';
      return (
        new Intl.NumberFormat('en', { style: 'currency', currency: code })
          .formatToParts(0)
          .find(p => p.type === 'currency')?.value ?? '₹'
      );
    } catch { return '₹'; }
  }
 
  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'INR';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: code,
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
  }
 
  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return '—'; }
  }
 
  openFile(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }
 
  // ── Dialog actions ────────────────────────────────────────────────
  onEdit(): void {
    this.dialogRef.close(true);
    this.dialogData?.onEdit?.();
  }
 
  onClose(): void {
    this.dialogRef.close({ action: 'close' });
  }
 
  // ── Chart helpers ─────────────────────────────────────────────────
 
  /**
   * Read a CSS custom property from :root.
   * Angular Material M3 tokens can be bare "R G B" triplets or hex strings.
   */
  private cssVar(name: string, alpha = 1): string {
    if (!isPlatformBrowser(this.platformId)) {
      return `rgba(103,80,164,${alpha})`; // M3 default purple fallback
    }
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
 
    // "63 81 181" style
    if (raw && /^\d/.test(raw)) return `rgba(${raw},${alpha})`;
    // "#xxxxxx" or named colour — wrap in rgba via a canvas trick is complex;
    // just return as-is with a simpler opacity trick
    if (raw) return alpha < 1 ? `color-mix(in srgb, ${raw} ${alpha * 100}%, transparent)` : raw;
 
    return `rgba(103,80,164,${alpha})`;
  }
 
  private initCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.depreciationSchedule.length) return;
 
    this.destroyCharts();
 
    const schedule = this.depreciationSchedule;
    const labels   = schedule.map(d => `Yr ${d.year}`);
    const n        = schedule.length;
 
    // ── Theme colours ──────────────────────────────────────────────
    const primary      = this.cssVar('--mat-sys-primary');
    const secondary    = this.cssVar('--mat-sys-secondary');
    const error        = this.cssVar('--mat-sys-error');
    const tertiary     = this.cssVar('--mat-sys-tertiary');
    const onSurface06  = this.cssVar('--mat-sys-on-surface', 0.6);
    const gridColor    = this.cssVar('--mat-sys-outline-variant', 0.35);
    const primaryBg    = this.cssVar('--mat-sys-primary', 0.12);
    const secondaryBg  = this.cssVar('--mat-sys-secondary', 0.10);
 
    // ── Shared config factories ────────────────────────────────────
    const yAxis = (beginAtZero: boolean) => ({
      beginAtZero,
      grid: { color: gridColor },
      ticks: {
        color: onSurface06,
        callback: (v: any) =>
          `${this.currencySymbol}${Number(v).toLocaleString('en-IN')}`
      }
    });
    const xAxis = () => ({
      grid: { display: false },
      ticks: { color: onSurface06, maxRotation: 45 }
    });
    const legendLabels = { color: onSurface06, font: { size: 11 } };
 
    const tooltipLabel = (ctx: any) => {
      const val = ctx.parsed?.y ?? ctx.parsed ?? 0;
      return ` ${this.formatCurrency(val)}`;
    };
 
    // ── 1. LINE CHART — Book Value Trend ──────────────────────────
    const lineEl = this.lineChartCanvas?.nativeElement;
    if (lineEl) {
      const ctx = lineEl.getContext('2d');
      if (ctx) {
        this.lineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Beginning Value',
                data: schedule.map(d => d.bookValueYearBegining),
                borderColor: primary,
                backgroundColor: primaryBg,
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: primary,
                pointRadius: 4,
                pointHoverRadius: 7
              },
              {
                label: 'Ending Value',
                data: schedule.map(d => d.bookValueYearEnd),
                borderColor: secondary,
                backgroundColor: secondaryBg,
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: secondary,
                pointRadius: 4,
                pointHoverRadius: 7
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: legendLabels },
              tooltip: { callbacks: { label: tooltipLabel } }
            },
            scales: { x: xAxis(), y: yAxis(false) }
          }
        });
      }
    }
 
    // ── 2. BAR CHART — Annual Depreciation ───────────────────────
    const barEl = this.barChartCanvas?.nativeElement;
    if (barEl) {
      const ctx = barEl.getContext('2d');
      if (ctx) {
        this.barChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Annual Depreciation',
              data: schedule.map(d => d.depreciation),
              backgroundColor: schedule.map((_, i) =>
                this.cssVar('--mat-sys-primary', 0.35 + (i / Math.max(n - 1, 1)) * 0.65)
              ),
              borderColor: primary,
              borderWidth: 1.5,
              borderRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: tooltipLabel } }
            },
            scales: { x: xAxis(), y: yAxis(true) }
          }
        });
      }
    }
 
    // ── 3. DOUGHNUT CHART — Depreciated vs Remaining ─────────────
    const doughEl = this.doughnutChartCanvas?.nativeElement;
    if (doughEl) {
      const ctx = doughEl.getContext('2d');
      if (ctx) {
        const remaining = this.lastBookValue;
        this.doughnutChart = new Chart<'doughnut'>(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Total Depreciated', 'Remaining Value'],
            datasets: [{
              data: [this.totalDepreciation, remaining],
              backgroundColor: [error, tertiary],
              borderColor: 'transparent',
              borderWidth: 0,
              hoverOffset: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { ...legendLabels, padding: 16, boxWidth: 12 }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    ` ${this.formatCurrency(ctx.parsed as number)}`
                }
              }
            }
          }
        });
      }
    }
  }
 
  private destroyCharts(): void {
    this.lineChart?.destroy();
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
    this.lineChart = this.barChart = this.doughnutChart = null;
  }

}