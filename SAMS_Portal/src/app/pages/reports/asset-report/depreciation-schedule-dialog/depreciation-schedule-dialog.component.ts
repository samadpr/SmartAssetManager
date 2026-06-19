import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { Chart, registerables } from 'chart.js';
import { AssetDepreciationDto, AssetReportDepreciationDto } from '../../../../core/models/interfaces/asset-report/assetReportDto.interface';
 
Chart.register(...registerables);
 
export interface DepreciationDialogData {
  asset: any;                  // AssetReportDepreciationDto or batch-mode shape
  currencyCode: string;
  isBatch?: boolean;           // true when opened from batch report
  unitCount?: number;          // number of depreciable units in batch
}
 
interface ScheduleRow {
  year: number;
  bookValueYearBegining: number;
  depreciation: number;
  bookValueYearEnd: number;
}

@Component({
  selector: 'app-depreciation-schedule-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatTableModule, MatCardModule, MatDividerModule,
    MatChipsModule, MatTooltipModule, MatButtonToggleModule,
    MatTabsModule,
  ],
  templateUrl: './depreciation-schedule-dialog.component.html',
  styleUrl: './depreciation-schedule-dialog.component.scss'
})
export class DepreciationScheduleDialogComponent implements OnInit {
  @ViewChild('lineCanvas')     lineCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')      barCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
 
  private charts: Chart[] = [];
 
  // ── Dialog inputs ──────────────────────────────────────────────────────────
  asset: any;
  private _currencyCode: string;
  isBatch    = false;
  unitCount  = 1;
 
  // ── View mode toggle ───────────────────────────────────────────────────────
  viewMode = signal<'batch' | 'perUnit'>('batch');
 
  // ── Data sources ───────────────────────────────────────────────────────────
  batchSchedule:   ScheduleRow[] = [];
  perUnitSchedule: ScheduleRow[] = [];
 
  batchDataSource   = new MatTableDataSource<ScheduleRow>([]);
  perUnitDataSource = new MatTableDataSource<ScheduleRow>([]);
 
  displayedColumns = ['year', 'bookValueYearBegining', 'depreciation', 'bookValueYearEnd'];
 
  // Computed aggregates for the active schedule
  activeSchedule = computed(() =>
    this.viewMode() === 'batch' ? this.batchSchedule : this.perUnitSchedule
  );
 
  totalDepreciation = computed(() =>
    this.activeSchedule().reduce((s, r) => s + r.depreciation, 0)
  );
 
  lastBookValue = computed(() => {
    const s = this.activeSchedule();
    return s.length ? s[s.length - 1].bookValueYearEnd : 0;
  });
 
  depProgress = computed(() => {
    const cost = this.viewMode() === 'batch'
      ? (this.asset?.depreciableCost ?? 0)
      : (this.asset?._perUnitCost ?? this.asset?.depreciableCost ?? 0);
    const salvage = this.viewMode() === 'batch'
      ? (this.asset?.salvageValue ?? 0)
      : (this.asset?._perUnitSalvage ?? this.asset?.salvageValue ?? 0);
    const net = cost - salvage;
    return net > 0 ? Math.min(100, (this.totalDepreciation() / net) * 100) : 0;
  });
 
  constructor(
    public  dialogRef: MatDialogRef<DepreciationScheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepreciationDialogData,
    private cdr: ChangeDetectorRef,
  ) {
    this.asset         = data.asset;
    this._currencyCode = data.currencyCode || 'USD';
    this.isBatch       = data.isBatch ?? false;
    this.unitCount     = data.unitCount ?? 1;
  }
 
  ngOnInit(): void {
    // Batch schedule: provided directly as asset.depreciationSchedule (already scaled)
    this.batchSchedule = (this.asset?.depreciationSchedule ?? []).map((r: any) => ({
      year:                  r.year,
      bookValueYearBegining: r.bookValueYearBegining,
      depreciation:          r.depreciation,
      bookValueYearEnd:      r.bookValueYearEnd,
    }));
 
    // Per-unit schedule: either _perUnitSchedule (from batch mode) or same as batchSchedule
    this.perUnitSchedule = (this.asset?._perUnitSchedule ?? this.asset?.depreciationSchedule ?? []).map((r: any) => ({
      year:                  r.year,
      bookValueYearBegining: r.bookValueYearBegining,
      depreciation:          r.depreciation,
      bookValueYearEnd:      r.bookValueYearEnd,
    }));
 
    this.batchDataSource.data   = this.batchSchedule;
    this.perUnitDataSource.data = this.perUnitSchedule;
  }
 
  ngAfterViewInit(): void {
    // Give Angular one tick so canvas elements are available
    setTimeout(() => { this._initCharts(); this.cdr.markForCheck(); }, 80);
  }
 
  ngOnDestroy(): void {
    this._destroyCharts();
  }
 
  // ── Mode toggle ────────────────────────────────────────────────────────────
 
  onViewModeChange(mode: 'batch' | 'perUnit'): void {
    this.viewMode.set(mode);
    // Rebuild charts with new schedule data
    this._destroyCharts();
    setTimeout(() => { this._initCharts(); this.cdr.markForCheck(); }, 60);
  }
 
  // ── Chart init ─────────────────────────────────────────────────────────────
 
  private _initCharts(): void {
    const schedule = this.viewMode() === 'batch' ? this.batchSchedule : this.perUnitSchedule;
    if (!schedule.length) return;
 
    this._destroyCharts();
 
    const root     = document.documentElement;
    const getVar   = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
    const resolve  = (v: string, alpha = 1) => {
      const raw = getVar(v);
      if (!raw) return `rgba(103,80,164,${alpha})`;
      if (/^\d/.test(raw)) return `rgba(${raw},${alpha})`;
      return alpha < 1
        ? `color-mix(in srgb, ${raw} ${Math.round(alpha * 100)}%, transparent)`
        : raw;
    };
 
    const primary  = resolve('--mat-sys-primary');
    const tertiary = resolve('--mat-sys-tertiary');
    const error    = resolve('--mat-sys-error');
    const gridCol  = resolve('--mat-sys-outline-variant', .4);
    const textCol  = resolve('--mat-sys-on-surface', .75);
    const p15      = resolve('--mat-sys-primary', .15);
    const t15      = resolve('--mat-sys-tertiary', .15);
    const labels   = schedule.map(r => `Yr ${r.year}`);
    const fmt      = (v: number) => this.formatCurrencyCompact(v);
 
    const baseOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { color: textCol, font: { size: 11 }, boxWidth: 12 } },
        tooltip: { callbacks: { label: (ctx: any) => ` ${this.formatCurrency(ctx.parsed?.y ?? ctx.parsed ?? 0)}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textCol, font: { size: 10 } } },
        y: {
          grid: { color: gridCol }, beginAtZero: false,
          ticks: { color: textCol, font: { size: 10 }, callback: (v: any) => fmt(Number(v)) }
        }
      }
    };
 
    // ── LINE chart ─────────────────────────────────────────────────────────
    const lineEl = this.lineCanvas?.nativeElement;
    if (lineEl) {
      const ctx = lineEl.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'Opening Value', data: schedule.map(r => r.bookValueYearBegining),
                borderColor: primary,   backgroundColor: p15, fill: true,
                tension: .4, borderWidth: 2.5, pointBackgroundColor: primary, pointRadius: 4, pointHoverRadius: 7 },
              { label: 'Closing Value', data: schedule.map(r => r.bookValueYearEnd),
                borderColor: tertiary,  backgroundColor: t15, fill: true,
                tension: .4, borderWidth: 2.5, pointBackgroundColor: tertiary, pointRadius: 4, pointHoverRadius: 7 },
            ]
          },
          options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: false } } }
        }));
      }
    }
 
    // ── BAR chart ──────────────────────────────────────────────────────────
    const barEl = this.barCanvas?.nativeElement;
    if (barEl) {
      const ctx = barEl.getContext('2d');
      if (ctx) {
        const n = schedule.length;
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Annual Depreciation',
              data: schedule.map(r => r.depreciation),
              backgroundColor: schedule.map((_, i) => resolve('--mat-sys-error', 0.35 + (i / Math.max(n - 1, 1)) * 0.55)),
              borderColor: error, borderWidth: 1.5, borderRadius: 5,
            }]
          },
          options: { ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } },
            scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, beginAtZero: true } } }
        }));
      }
    }
 
    // ── DOUGHNUT chart ─────────────────────────────────────────────────────
    const doughEl = this.doughnutCanvas?.nativeElement;
    if (doughEl) {
      const ctx = doughEl.getContext('2d');
      if (ctx) {
        const totalDeprec = schedule.reduce((s, r) => s + r.depreciation, 0);
        const remaining   = schedule.length ? schedule[schedule.length - 1].bookValueYearEnd : 0;
        this.charts.push(new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Depreciated', 'Remaining Value'],
            datasets: [{
              data: [totalDeprec, remaining],
              backgroundColor: [error, tertiary],
              borderColor: 'transparent', borderWidth: 0, hoverOffset: 10,
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: {
              legend: { position: 'bottom' as const, labels: { color: textCol, font: { size: 11 }, padding: 14, boxWidth: 12 } },
              tooltip: { callbacks: { label: (ctx: any) => ` ${this.formatCurrency(Number(ctx.parsed))}` } }
            }
          }
        }));
      }
    }
  }
 
  private _destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  get currencySymbol(): string {
    try {
      return (
        new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode })
          .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$'
      );
    } catch { return '$'; }
  }
 
  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '—';
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency', currency: this._currencyCode,
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(v);
    } catch { return `${this.currencySymbol}${(v ?? 0).toFixed(2)}`; }
  }
 
  formatCurrencyCompact(v: number | null | undefined): string {
    if (v == null || v === 0) return '—';
    try {
      const code = this._currencyCode;
      if (v >= 1_000_000)
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 1, notation: 'compact' }).format(v);
      if (v >= 10_000)
        return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 0, notation: 'compact' }).format(v);
      return new Intl.NumberFormat('en', { style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
    } catch {
      if (v >= 1_000_000) return `${this.currencySymbol}${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 10_000)    return `${this.currencySymbol}${(v / 1_000).toFixed(0)}K`;
      return `${this.currencySymbol}${v.toFixed(2)}`;
    }
  }
 
  formatDate(date: any): string {
    if (!date) return '—';
    try { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  }
 
  getDepreciationMethodName(): string {
    const m = this.asset?.depreciationMethod ?? this.asset?.depreciationMethod;
    const methods: Record<number, string> = {
      0: 'None', 1: 'Straight Line', 2: 'Declining Balance',
      3: 'Double Declining Balance', 4: '150% Declining Balance', 5: 'Sum of Years Digits'
    };
    return methods[m] ?? 'Unknown';
  }
 
  depreciationPercent(row: ScheduleRow): number {
    const cost = this.viewMode() === 'batch'
      ? (this.asset?.depreciableCost ?? 0)
      : (this.asset?._perUnitCost ?? this.asset?.depreciableCost ?? 0);
    return cost > 0 ? parseFloat(((row.depreciation / cost) * 100).toFixed(1)) : 0;
  }
 
  get activeDisplayCost(): number {
    return this.viewMode() === 'batch'
      ? (this.asset?.depreciableCost ?? 0)
      : (this.asset?._perUnitCost ?? this.asset?.depreciableCost ?? 0);
  }
 
  get activeDisplaySalvage(): number {
    return this.viewMode() === 'batch'
      ? (this.asset?.salvageValue ?? 0)
      : (this.asset?._perUnitSalvage ?? this.asset?.salvageValue ?? 0);
  }
 
  get activeDataSource() {
    return this.viewMode() === 'batch' ? this.batchDataSource : this.perUnitDataSource;
  }
 
  close():  void { this.dialogRef.close(); }
  print():  void { window.print(); }
}
