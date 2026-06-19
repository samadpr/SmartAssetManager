import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatCardModule }     from '@angular/material/card';
import { MatDividerModule }  from '@angular/material/divider';
import { MatTooltipModule }  from '@angular/material/tooltip';
 
import {
  AssetTransferHistoryDto,
  AssetTransferLegDto
} from '../../../../core/models/interfaces/asset-report/asset-transfer-report.interface';
import { environment } from '../../../../../environments/environment.development';
 
import jsPDF     from 'jspdf';
import autoTable from 'jspdf-autotable';
 
interface DialogData { asset: AssetTransferHistoryDto; }
@Component({
  selector: 'app-asset-transfer-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatCardModule, MatDividerModule, MatTooltipModule
  ],
  templateUrl: './asset-transfer-detail-dialog.component.html',
  styleUrl: './asset-transfer-detail-dialog.component.scss'
})
export class AssetTransferDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AssetTransferDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
 
  // ── Computed helpers ───────────────────────────────────────────────────────
 
  get totalHoldDays(): number {
    return (this.data.asset.transferChain || []).reduce((s, l) => s + (l.holdDays || 0), 0);
  }
 
  /** 0-100 representing how far along the asset's journey we are */
  get journeyProgress(): number {
    const chain = this.data.asset.transferChain || [];
    if (chain.length < 2) return 100;
    const current = chain.findIndex(l => l.isCurrent);
    return current < 0 ? 100 : Math.round((current / (chain.length - 1)) * 100);
  }
 
  getDisposalLeg(): AssetTransferLegDto | undefined {
    return (this.data.asset.transferChain || []).find(l => l.isDisposalLeg);
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  getImageUrl(path: string | null | undefined): string {
    if (!path || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${environment.assetBaseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
  }
 
  onImageError(e: Event): void { (e.target as HTMLImageElement).style.display = 'none'; }
 
  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  }
 
  close(): void { this.dialogRef.close(); }
 
  printSingle(): void { window.print(); }
 
  // ── Single-asset PDF ───────────────────────────────────────────────────────
 
  exportSinglePDF(): void {
    const asset = this.data.asset;
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W     = doc.internal.pageSize.getWidth();
 
    // Banner
    doc.setFillColor(103, 58, 183);
    doc.rect(0, 0, W, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('ASSET TRANSFER HISTORY — SAMS', W / 2, 10, { align: 'center' });
 
    let y = 22;
 
    // Asset header
    doc.setFillColor(237, 231, 246);
    doc.roundedRect(12, y, W - 24, 28, 3, 3, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
    doc.text(asset.assetName || '—', 16, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
 
    const assetDetails = [
      `Asset ID: ${asset.assetId}`,
      asset.batchCode ? `Batch: ${asset.batchCode}` : '',
      asset.assetBrand ? `Brand: ${asset.assetBrand}` : '',
      asset.assetModelNo ? `Model: ${asset.assetModelNo}` : '',
      asset.assetSerialNo ? `S/N: ${asset.assetSerialNo}` : '',
      asset.categoryDisplay ? `Category: ${asset.categoryDisplay}` : '',
      asset.departmentDisplay ? `Dept: ${asset.departmentDisplay}` : '',
    ].filter(Boolean);
 
    assetDetails.forEach((item, i) => {
      const col = i < 4 ? 0 : 1;
      const row = i < 4 ? i : i - 4;
      doc.text(item, 16 + col * ((W - 28) / 2), y + 16 + row * 5);
    });
 
    // Status badge
    const isDisposed = asset.isDisposed;
    doc.setTextColor(isDisposed ? 198 : 46, isDisposed ? 40 : 125, isDisposed ? 40 : 50);
    doc.setFont('helvetica', 'bold');
    doc.text(isDisposed ? '⚠ DISPOSED' : '✓ ACTIVE', W - 16, y + 8, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    y += 34;
 
    // Stats strip
    doc.setFillColor(248, 244, 255);
    doc.roundedRect(12, y, W - 24, 12, 2, 2, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(103, 58, 183);
    const stats = [
      `Total Transfers: ${asset.totalTransfers}`,
      `Total Days: ${this.totalHoldDays}`,
      `First: ${this.formatDate(asset.firstAssignedDate)}`,
      `Last: ${this.formatDate(asset.lastTransferDate)}`,
    ];
    stats.forEach((s, i) => doc.text(s, 16 + i * ((W - 28) / 4), y + 8));
    doc.setTextColor(40, 40, 40);
    y += 18;
 
    // Current holder
    const ch = asset.currentHolder;
    if (ch && !isDisposed) {
      const holderName = ch.holderUser ? ch.holderUser.fullName :
                         ch.holderSite ? ch.holderSite.siteName : '';
      if (holderName) {
        doc.setFillColor(232, 245, 233);
        doc.roundedRect(12, y, W - 24, 12, 2, 2, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 94, 32);
        doc.text(
          `Currently with: ${holderName}  ·  ${ch.holdDays ?? 0} day(s) since ${this.formatDate(ch.holdStart)}`,
          16, y + 8
        );
        doc.setTextColor(40, 40, 40);
        y += 16;
      }
    }
 
    // Section heading
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
    doc.text('Transfer Chain', 12, y + 6);
    y += 10;
 
    // Transfer table
    const rows = (asset.transferChain || []).map((leg, li) => {
      let holder = '—';
      if (leg.holderUser) holder = leg.holderUser.fullName || '—';
      else if (leg.holderSite) {
        holder = leg.holderSite.siteName || '—';
        if (leg.holderSite.area) holder += ` › ${leg.holderSite.area.areaName}`;
      } else if (leg.assignTo === 3) holder = '⚠ Disposed';
 
      return [
        `${li + 1}`,
        leg.assetTypeDisplay || '—',
        leg.assignTo === 1 ? 'User' : leg.assignTo === 2 ? 'Site' : 'Disposed',
        holder,
        leg.approvalStatusDisplay || '—',
        this.formatDate(leg.transferDate || leg.createdDate),
        `${leg.holdDays ?? 0}d`,
        leg.transferredByUser?.fullName || '—',
        leg.status || '—',
        leg.isCurrent ? '✓' : '',
      ];
    });
 
    if (rows.length) {
      autoTable(doc, {
        head: [['#', 'Type', 'Assign', 'Holder', 'Approval', 'Date', 'Hold', 'By', 'Status', 'Current']],
        body: rows,
        startY: y,
        margin: { left: 12, right: 12 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [74, 20, 140], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [248, 244, 255] },
        columnStyles: {
          0: { cellWidth: 8 }, 1: { cellWidth: 18 }, 2: { cellWidth: 16 },
          3: { cellWidth: 45 }, 4: { cellWidth: 18 }, 5: { cellWidth: 20 },
          6: { cellWidth: 10 }, 7: { cellWidth: 32 }, 8: { cellWidth: 15 },
          9: { cellWidth: 10, fontStyle: 'bold', textColor: [56, 142, 60] }
        },
        didParseCell: (data : any) => {
          const row = rows[data.row.index];
          if (row && row[9] === '✓') data.cell.styles.fillColor = [232, 245, 233];
        }
      } as any);
    }
 
    // Footer
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 180, 180);
    const H = doc.internal.pageSize.getHeight();
    doc.text('SAMS — System-generated · Confidential', W / 2, H - 5, { align: 'center' });
    doc.setFillColor(103, 58, 183);
    doc.rect(0, H - 2, W, 2, 'F');
 
    doc.save(`transfer-history-${asset.assetId}-${Date.now()}.pdf`);
  }
}
