import { Component, Inject } from '@angular/core';
import { AssetTransferHistoryDto, AssetTransferLegDto } from '../../../../core/models/interfaces/asset-report/asset-transfer-report.interface';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../../environments/environment.development';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface DialogData {
  asset: AssetTransferHistoryDto;
}

@Component({
  selector: 'app-asset-transfer-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './asset-transfer-detail-dialog.component.html',
  styleUrl: './asset-transfer-detail-dialog.component.scss'
})
export class AssetTransferDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AssetTransferDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
 
  getImageUrl(path: string | null | undefined): string {
    if (!path || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${environment.assetBaseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
  }
 
  onImageError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
 
  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
 
  getDisposalLeg(): AssetTransferLegDto | undefined {
    return (this.data.asset.transferChain || []).find(l => l.isDisposalLeg);
  }
 
  close(): void { this.dialogRef.close(); }
  printSingle(): void { window.print(); }
}
