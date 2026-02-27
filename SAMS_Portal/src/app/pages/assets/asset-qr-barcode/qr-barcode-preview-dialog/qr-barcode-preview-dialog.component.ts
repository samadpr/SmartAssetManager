import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AssetQrBarcode } from '../../../../core/models/interfaces/asset-manage/asset-qr-barcode.interface';


export interface PreviewDialogData {
  asset: AssetQrBarcode;
  type: 'qr' | 'barcode';
}

@Component({
  selector: 'app-qr-barcode-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
  ],
  templateUrl: './qr-barcode-preview-dialog.component.html',
  styleUrl: './qr-barcode-preview-dialog.component.scss'
})
export class QrBarcodePreviewDialogComponent {
  activeTab = signal<'qr' | 'barcode'>('qr');

  constructor(
    public dialogRef: MatDialogRef<QrBarcodePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData
  ) {
    this.activeTab.set(data.type);
  }

  switchTab(tab: 'qr' | 'barcode'): void {
    this.activeTab.set(tab);
  }

  close(): void {
    this.dialogRef.close();
  }

  downloadImage(type: 'qr' | 'barcode'): void {
    const src = type === 'qr' ? this.data.asset.qrcodeImage : this.data.asset.barcode;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${this.data.asset.assetId}_${type}.png`;
    a.click();
  }
}
