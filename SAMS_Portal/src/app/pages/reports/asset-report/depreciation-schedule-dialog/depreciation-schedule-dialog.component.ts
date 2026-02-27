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

  dataSource = new MatTableDataSource<AssetDepreciationDto>([]);
  displayedColumns: string[] = ['year', 'bookValueYearBegining', 'depreciation', 'bookValueYearEnd'];

  // Chart configuration
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
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
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
          callback: function (value) {
            return '$' + value.toLocaleString();
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
    @Inject(MAT_DIALOG_DATA) public asset: AssetReportDepreciationDto
  ) { }

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

    // Update chart if it exists
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

  formatCurrency(value: number | undefined): string {
    if (!value && value !== 0) return '$0.00';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  exportToExcel(): void {
    // You can implement Excel export here using XLSX library
    console.log('Export to Excel');
  }
}
