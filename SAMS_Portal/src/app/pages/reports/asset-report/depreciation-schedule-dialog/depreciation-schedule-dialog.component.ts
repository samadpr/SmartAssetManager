import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BaseChartDirective } from 'ng2-charts';
import { AssetDepreciationDto, AssetReportDepreciationDto } from '../../../../core/models/interfaces/asset-report/assetReportDto.interface';
import { ChartConfiguration } from 'chart.js';

interface DialogData {
  asset: AssetReportDepreciationDto;
  currencyCode: string;
}

@Component({
  selector: 'app-depreciation-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    BaseChartDirective
  ],
  templateUrl: './depreciation-schedule-dialog.component.html',
  styleUrl: './depreciation-schedule-dialog.component.scss'
})
export class DepreciationScheduleDialogComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
 
  asset: AssetReportDepreciationDto;
  private _currencyCode: string;
 
  dataSource = new MatTableDataSource<AssetDepreciationDto>([]);
  displayedColumns: string[] = ['year', 'bookValueYearBegining', 'depreciation', 'bookValueYearEnd'];
 
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Book Value',
        fill: true,
        tension: 0.4,
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        pointBackgroundColor: '#3f51b5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3f51b5'
      },
      {
        data: [],
        label: 'Depreciation',
        fill: true,
        tension: 0.4,
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        pointBackgroundColor: '#f44336',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#f44336'
      }
    ]
  };
 
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += this.formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            if (typeof value !== 'number') return value;
            return this.formatCurrencyCompact(value);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
 
  constructor(
    public dialogRef: MatDialogRef<DepreciationScheduleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.asset = data.asset;
    this._currencyCode = data.currencyCode || 'USD';
  }
 
  ngOnInit(): void {
    if (this.asset.depreciationSchedule && this.asset.depreciationSchedule.length > 0) {
      this.dataSource.data = this.asset.depreciationSchedule;
      this.prepareChartData();
    }
  }
 
  prepareChartData(): void {
    const schedule = this.asset.depreciationSchedule || [];
 
    this.lineChartData.labels = schedule.map(s => `Year ${s.year}`);
    this.lineChartData.datasets[0].data = schedule.map(s => s.bookValueYearEnd);
    this.lineChartData.datasets[1].data = schedule.map(s => s.depreciation);
 
    this.chart?.update();
  }
 
  getDepreciationMethodName(): string {
    if (!this.asset.depreciationMethod) return 'None';
    const methods: { [key: number]: string } = {
      0: 'None',
      1: 'Straight Line',
      2: 'Declining Balance',
      3: 'Double Declining Balance',
      4: '150% Declining Balance',
      5: 'Sum of Years Digits'
    };
    return methods[this.asset.depreciationMethod] || 'Unknown';
  }
 
  // ── Currency symbol helper ────────────────────────────────────────────────
  get currencySymbol(): string {
    try {
      return (
        new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode })
          .formatToParts(0)
          .find(p => p.type === 'currency')?.value ?? '$'
      );
    } catch {
      return '$';
    }
  }
 
  /**
   * Full precision currency format for table cells.
   */
  formatCurrency(value: number | undefined): string {
    if (!value && value !== 0) return `${this.currencySymbol}0.00`;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: this._currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch {
      return `${this.currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
 
  /**
   * Compact format used in chart axis ticks and summary card values.
   */
  formatCurrencyCompact(value: number | undefined): string {
    if (!value && value !== 0) return `${this.currencySymbol}0`;
    try {
      if (value >= 1_000_000) {
        return new Intl.NumberFormat('en', {
          style: 'currency', currency: this._currencyCode,
          maximumFractionDigits: 1, notation: 'compact'
        }).format(value);
      }
      if (value >= 10_000) {
        return new Intl.NumberFormat('en', {
          style: 'currency', currency: this._currencyCode,
          maximumFractionDigits: 0, notation: 'compact'
        }).format(value);
      }
      return new Intl.NumberFormat('en', {
        style: 'currency', currency: this._currencyCode,
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value);
    } catch {
      const sym = this.currencySymbol;
      if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 10_000) return `${sym}${(value / 1_000).toFixed(0)}K`;
      return `${sym}${value.toFixed(2)}`;
    }
  }
 
  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
 
  close(): void {
    this.dialogRef.close();
  }
 
  print(): void {
    window.print();
  }
}
