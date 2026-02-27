import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { AssetQrBarcode } from '../../../../core/models/interfaces/asset-manage/asset-qr-barcode.interface';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';


export interface PrintDialogData {
  assets: AssetQrBarcode[];
  type: 'qr' | 'barcode' | 'both';
  mode: 'single' | 'bulk' | 'all';
}

export interface PrintLabel {
  id: string;
  label: string;
  enabled: boolean;
  getValue: (asset: AssetQrBarcode) => string;
}

@Component({
  selector: 'app-print-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './print-dialog.component.html',
  styleUrl: './print-dialog.component.scss'
})
export class PrintDialogComponent implements OnInit {
  selection = new SelectionModel<AssetQrBarcode>(true, []);
  printType = signal<'qr' | 'barcode' | 'both'>('both');
  stickerSize = signal<'small' | 'medium' | 'large'>('medium');
  columns = signal<2 | 3 | 4>(3);
  customHeadingControl = new FormControl('');

  selectedCount = computed(() => this.selection.selected.length);
  enabledLabelsCount = computed(() =>
    this.availableLabels().filter(l => l.enabled).length
  );


  // Available labels for customization
  availableLabels = signal<PrintLabel[]>([
    { id: 'department', label: 'Department', enabled: false, getValue: (a) => a.departmentDisplay || '' },
    { id: 'location', label: 'Location', enabled: false, getValue: (a) => `${a.siteDisplay || ''} ${a.areaDisplay ? '· ' + a.areaDisplay : ''}`.trim() },
    { id: 'category', label: 'Category', enabled: false, getValue: (a) => a.categoryDisplay || '' },
    { id: 'description', label: 'Description', enabled: false, getValue: (a) => a.description || '' },
    { id: 'serialNo', label: 'Serial No', enabled: false, getValue: (a) => a.assetSerialNo || '' },
    { id: 'brand', label: 'Brand & Model', enabled: false, getValue: (a) => `${a.assetBrand || ''} ${a.assetModelNo || ''}`.trim() },
  ]);

  constructor(
    public dialogRef: MatDialogRef<PrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintDialogData
  ) { }

  ngOnInit(): void {
    this.printType.set(this.data.type);
    // Pre-select all assets
    this.data.assets.forEach((a) => this.selection.select(a));
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.data.assets.length;
  }

  isIndeterminate(): boolean {
    const s = this.selection.selected.length;
    return s > 0 && s < this.data.assets.length;
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.data.assets.forEach((a) => this.selection.select(a));
    }
  }

  toggleLabel(label: PrintLabel): void {
    label.enabled = !label.enabled;
    this.availableLabels.set([...this.availableLabels()]);
  }

  close(): void {
    this.dialogRef.close();
  }

  getModeLabel(): string {
    switch (this.data.mode) {
      case 'single': return 'Single Asset';
      case 'bulk': return `${this.data.assets.length} Selected Assets`;
      case 'all': return `All ${this.data.assets.length} Assets`;
    }
  }

  executePrint(): void {
    const assetsToPrint = this.selection.selected;
    if (!assetsToPrint.length) return;

    const type = this.printType();
    const size = this.stickerSize();
    const cols = this.columns();
    const customHeading = this.customHeadingControl.value || '';
    const enabledLabels = this.availableLabels().filter(l => l.enabled);

    const sizeMap = {
      small: { width: 160, imgQr: 70, imgBc: 100, bcH: 38, fontSize: 8, idFontSize: 7, labelFontSize: 6.5 },
      medium: { width: 200, imgQr: 90, imgBc: 130, bcH: 50, fontSize: 9, idFontSize: 7.5, labelFontSize: 7 },
      large: { width: 260, imgQr: 120, imgBc: 170, bcH: 65, fontSize: 10, idFontSize: 8, labelFontSize: 7.5 },
    };
    const s = sizeMap[size];

    const stickerHtml = (asset: AssetQrBarcode): string => {
      const showQr = type === 'qr' || type === 'both';
      const showBc = type === 'barcode' || type === 'both';
      const padding = size === 'small' ? 10 : size === 'medium' ? 12 : 16;

      let content = '';

      // Custom heading if provided
      if (customHeading) {
        content += `
          <div class="custom-heading">${customHeading}</div>`;
      }

      if (showQr && asset.qrcodeImage) {
        content += `
          <div class="sticker-section">
            <div class="sticker-img-wrap qr-wrap">
              <div class="watermark">INFOASSET</div>
              <img src="${asset.qrcodeImage}" width="${s.imgQr}" height="${s.imgQr}" alt="QR" style="display:block;object-fit:contain;background:white;" />
            </div>
            <div class="sticker-name">${asset.name}</div>
            <div class="sticker-id">${asset.assetId}</div>
          </div>`;
      }

      if (showBc && asset.barcode) {
        content += `
          <div class="sticker-section" style="${showQr ? 'border-top:1px dashed #ccc;margin-top:8px;padding-top:8px;' : ''}">
            <div class="sticker-img-wrap bc-wrap">
              <div class="watermark">INFOASSET</div>
              <img src="${asset.barcode}" width="${s.imgBc}" height="${s.bcH}" alt="Barcode" style="display:block;object-fit:contain;background:white;" />
            </div>
            ${!showQr ? `<div class="sticker-name">${asset.name}</div>` : ''}
            <div class="sticker-id">${asset.assetId}</div>
          </div>`;
      }

      // Add custom labels
      if (enabledLabels.length > 0) {
        content += '<div class="custom-labels">';
        enabledLabels.forEach(label => {
          const value = label.getValue(asset);
          if (value) {
            content += `
              <div class="custom-label-item">
                <span class="label-key">${label.label}:</span>
                <span class="label-value">${value}</span>
              </div>`;
          }
        });
        content += '</div>';
      }

      return `
        <div class="sticker" style="width:${s.width}px;padding:${padding}px;font-size:${s.fontSize}px;">
          ${content}
        </div>`;
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Asset Codes - INFOASSET</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #f5f5f5; 
          }

          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 3px solid #6366f1;
            margin-bottom: 24px;
            background: white;
          }
          .print-header .brand { 
            font-size: 1.5rem; 
            font-weight: 800; 
            letter-spacing: 0.15em; 
            color: #6366f1;
            text-transform: uppercase;
          }
          .print-header .info { 
            font-size: 0.8rem; 
            color: #666; 
            text-align: right;
          }

          .stickers-grid {
            display: grid;
            grid-template-columns: repeat(${cols}, auto);
            gap: 12px;
            padding: 0 24px 24px;
            justify-content: start;
          }

          .sticker {
            border: 2px dashed #999;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: white;
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .custom-heading {
            width: 100%;
            text-align: center;
            font-weight: 700;
            font-size: ${s.fontSize + 1}px;
            color: #333;
            padding-bottom: 4px;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 6px;
          }

          .sticker-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            width: 100%;
          }

          .sticker-img-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 6px;
            border-radius: 6px;
          }

          .watermark {
            position: absolute;
            font-size: 0.65rem;
            font-weight: 900;
            letter-spacing: 0.2em;
            color: rgba(99, 102, 241, 0.08);
            text-transform: uppercase;
            transform: rotate(-30deg);
            pointer-events: none;
            z-index: 1;
            white-space: nowrap;
          }

          .sticker-img-wrap img { 
            position: relative; 
            z-index: 2; 
          }

          .sticker-name {
            font-weight: 700;
            text-align: center;
            color: #222;
            font-size: ${s.fontSize}px;
            line-height: 1.2;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sticker-id {
            font-family: 'Courier New', monospace;
            font-size: ${s.idFontSize}px;
            color: #555;
            letter-spacing: 0.05em;
            text-align: center;
            font-weight: 600;
          }

          .custom-labels {
            width: 100%;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #e0e0e0;
          }

          .custom-label-item {
            display: flex;
            gap: 4px;
            font-size: ${s.labelFontSize}px;
            color: #666;
            line-height: 1.3;
            margin-bottom: 2px;
          }

          .label-key {
            font-weight: 600;
            color: #888;
          }

          .label-value {
            color: #333;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              background: white;
            }
            .no-print { display: none !important; }
            .sticker { 
              border-color: #aaa; 
              box-shadow: none;
            }
          }

          .print-actions {
            text-align: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
            background: white;
          }
          .print-actions button {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0 8px;
            transition: all 0.2s ease;
          }
          .print-actions button:hover {
            background: #4f46e5;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          .print-actions button.secondary {
            background: white;
            color: #666;
            border: 2px solid #ddd;
          }
          .print-actions button.secondary:hover {
            background: #f5f5f5;
            border-color: #999;
          }
        </style>
      </head>
      <body>
        <div class="print-header no-print">
          <span class="brand">INFOASSET</span>
          <div class="info">
            <div>Print Preview</div>
            <div>${assetsToPrint.length} sticker(s) · ${type === 'qr' ? 'QR Code' : type === 'barcode' ? 'Barcode' : 'QR + Barcode'}</div>
            <div>Size: ${size} · ${cols} per row</div>
          </div>
        </div>

        <div class="print-actions no-print">
          <button onclick="window.print()">🖨️ Print Stickers</button>
          <button class="secondary" onclick="window.close()">✕ Close Preview</button>
        </div>

        <div class="stickers-grid">
          ${assetsToPrint.map((asset) => stickerHtml(asset)).join('')}
        </div>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=1000,height=800');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    this.dialogRef.close();
  }
}
