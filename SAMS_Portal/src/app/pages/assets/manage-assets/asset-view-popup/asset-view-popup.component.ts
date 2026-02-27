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
  PLATFORM_ID
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

Chart.register(...registerables);

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
  styleUrl: './asset-view-popup.component.scss'
})
export class AssetViewPopupComponent implements OnInit, OnDestroy {

  private dialogRef = inject(MatDialogRef<AssetViewPopupComponent>);
  public data: AssetViewPopupData = inject(MAT_DIALOG_DATA);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChartCanvas') doughnutChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart: Chart | null = null;
  private barChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  asset = signal<AssetDetail>({} as AssetDetail);

  readonly depreciationColumns = [
    'year',
    'bookValueYearBegining',
    'depreciation',
    'bookValueYearEnd',
    'depreciationPercent'
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void { this.asset.set(this.data.asset); }
  ngOnDestroy(): void { this.destroyCharts(); }

  // ─── Getters ──────────────────────────────────────────────────────
  get assetData(): AssetDetail { return this.asset(); }

  get hasDepreciation(): boolean {
    return !!(this.assetData.isDepreciable && this.assetData.depreciationSchedule?.length);
  }

  get depreciationSchedule(): AssetDepreciation[] {
    return this.assetData.depreciationSchedule ?? [];
  }

  get totalDepreciation(): number {
    return this.depreciationSchedule.reduce((s, d) => s + (d.depreciation ?? 0), 0);
  }

  get depreciationProgress(): number {
    if (!this.assetData.depreciableCost) return 0;
    return Math.min((this.totalDepreciation / this.assetData.depreciableCost) * 100, 100);
  }

  get assignToLabel(): string {
    switch (this.assetData.assignTo) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      default: return 'Not Assigned';
    }
  }

  get depreciationMethodLabel(): string {
    switch (this.assetData.depreciationMethod) {
      case DepreciationMethod.StraightLine: return 'Straight Line';
      case DepreciationMethod.DecliningBalance: return 'Declining Balance';
      case DepreciationMethod.DoubleDecliningBalance: return 'Double Declining Balance';
      case DepreciationMethod.OneFiftyDecliningBalance: return '150% Declining Balance';
      case DepreciationMethod.SumOfYearsDigits: return 'Sum of Years Digits';
      default: return 'None';
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  getDepreciationPercent(item: AssetDepreciation): number {
    if (!this.assetData.depreciableCost) return 0;
    return parseFloat(((item.depreciation / this.assetData.depreciableCost) * 100).toFixed(1));
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openFile(url: string | undefined): void {
    if (url) window.open(url, '_blank');
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit' });
    this.data.onEdit?.();
  }

  onClose(): void {
    this.dialogRef.close({ action: 'close' });
  }

  // ─── Tab change ───────────────────────────────────────────────────
  onTabChange(index: number): void {
    if (index === 1 && isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initCharts(), 160);
    }
  }

  // ─── Chart helpers ────────────────────────────────────────────────
  /**
   * Read a computed CSS custom-property value from :root.
   * Angular Material M3 exposes colours as bare sRGB triplets: "R G B"
   * so we wrap them in rgba().
   */
  private cssColor(varName: string, alpha = 1): string {
    if (!isPlatformBrowser(this.platformId)) return `rgba(99,102,241,${alpha})`;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    // M3 tokens come as "63 81 181" → convert to rgba
    if (raw && /^\d/.test(raw)) return `rgba(${raw},${alpha})`;
    // fallback if token returns a hex/named colour directly
    return raw || `rgba(99,102,241,${alpha})`;
  }

  // ─── Chart init ───────────────────────────────────────────────────
  private initCharts(): void {
    if (!this.depreciationSchedule.length) return;
    this.destroyCharts();

    const schedule = this.depreciationSchedule;
    const labels = schedule.map(d => `Year ${d.year}`);
    const n = schedule.length;

    // Colours pulled from the live theme — auto dark/light
    const primary = this.cssColor('--mat-sys-primary');
    const secondary = this.cssColor('--mat-sys-secondary');
    const error = this.cssColor('--mat-sys-error');
    const tertiary = this.cssColor('--mat-sys-tertiary');
    const onSurface = this.cssColor('--mat-sys-on-surface', 0.6);
    const gridLine = this.cssColor('--mat-sys-outline-variant', 0.4);
    const primaryFg = this.cssColor('--mat-sys-primary', 0.12);
    const secondaryFg = this.cssColor('--mat-sys-secondary', 0.12);

    const axisY = (beginAtZero: boolean) => ({
      beginAtZero,
      grid: { color: gridLine },
      ticks: {
        color: onSurface,
        callback: (v: any) => `₹${Number(v).toLocaleString('en-IN')}`
      }
    });
    const axisX = (showGrid = true) => ({
      grid: { display: showGrid, color: gridLine },
      ticks: { color: onSurface }
    });
    const legend = { color: onSurface, font: { size: 12 } };

    const inrTooltip = (ctx: any) =>
      ` ₹${(ctx.parsed?.y ?? ctx.parsed ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // ── Line chart ────────────────────────────────────────────────
    const lineCtx = this.lineChartCanvas?.nativeElement.getContext('2d');
    if (lineCtx) {
      this.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Book Value (Beginning)',
              data: schedule.map(d => d.bookValueYearBegining),
              borderColor: primary, backgroundColor: primaryFg,
              borderWidth: 2.5, tension: 0.4, fill: true,
              pointBackgroundColor: primary, pointRadius: 5, pointHoverRadius: 7
            },
            {
              label: 'Book Value (Ending)',
              data: schedule.map(d => d.bookValueYearEnd),
              borderColor: secondary, backgroundColor: secondaryFg,
              borderWidth: 2.5, tension: 0.4, fill: true,
              pointBackgroundColor: secondary, pointRadius: 5, pointHoverRadius: 7
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: legend },
            tooltip: { callbacks: { label: inrTooltip } }
          },
          scales: { x: axisX(), y: axisY(false) }
        }
      });
    }

    // ── Bar chart ─────────────────────────────────────────────────
    const barCtx = this.barChartCanvas?.nativeElement.getContext('2d');
    if (barCtx) {
      this.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Annual Depreciation',
            data: schedule.map(d => d.depreciation),
            backgroundColor: schedule.map((_, i) =>
              this.cssColor('--mat-sys-primary', 0.40 + (i / n) * 0.60)
            ),
            borderColor: primary, borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: inrTooltip } }
          },
          scales: { x: axisX(false), y: axisY(true) }
        }
      });
    }

    // ── Doughnut chart ────────────────────────────────────────────
    const doughnutCtx = this.doughnutChartCanvas?.nativeElement.getContext('2d');
    if (doughnutCtx) {
      const last = schedule[schedule.length - 1];
      const remaining = last?.bookValueYearEnd ?? 0;

      this.doughnutChart = new Chart(doughnutCtx, {
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
          responsive: true, maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { ...legend, padding: 18 } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ₹${ctx.parsed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
            }
          }
        }
      });
    }
  }

  private destroyCharts(): void {
    this.lineChart?.destroy();
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
    this.lineChart = this.barChart = this.doughnutChart = null;
  }
  get lastBookValue(): number | undefined {
    const schedule = this.depreciationSchedule;
    if (!schedule.length) return undefined;
    return schedule[schedule.length - 1].bookValueYearEnd;
  }

}