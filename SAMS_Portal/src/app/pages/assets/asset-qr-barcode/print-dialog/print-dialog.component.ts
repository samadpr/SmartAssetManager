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
 
// ═══════════════════════════════════════════════════════════════════════════
// PRINT SYSTEM — ARCHITECTURE NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// STICKER SIZES (mm):
//   All values are in MILLIMETRES. Edit STICKER_SIZES to change presets.
//   "Custom" option lets users type any W×H in the dialog.
//
// PAGE SIZE (@page):
//   Each sticker is ONE page. @page size = sticker dimensions.
//   This matches physical label-printer paper exactly (e.g. 50×25mm roll).
//   When heading/labels are added, height auto-expands so nothing clips.
//
//   Page size = base sticker width × computed sticker height
//   Computed height = base height + heading row (if any) + label rows (if any)
//
// LAYOUT:
//   QR-only / BC-only → vertical single column
//   Both (QR+BC)      → side-by-side (QR left, BC+labels right)
//
// STICKERS PER ROW:
//   For label-printer rolls: 1 sticker per page (default, most common).
//   For A4 sheet printing: user picks columns (2/3/4).
//   Paper format selector drives this choice.
//
// ═══════════════════════════════════════════════════════════════════════════
 
const MM_TO_PX = 96 / 25.4; // ≈ 3.7795 px/mm — physical constant
 
// ── Preset label sizes ────────────────────────────────────────────────────
//    Edit widthMm / heightMm here to change presets.
//    All layout values recalculate automatically.
const STICKER_SIZES = {
  small:  { widthMm: 38, heightMm: 19 },   // compact label
  medium: { widthMm: 50, heightMm: 25 },   // ← your required size (default)
  large:  { widthMm: 70, heightMm: 35 },   // large label
} as const;
 
type SizeKey = keyof typeof STICKER_SIZES;
 
// ── Paper/print format ────────────────────────────────────────────────────
//    label-roll = one sticker per page, page size = sticker size
//    a4         = multiple stickers on A4, stickers per row selectable
type PaperFormat = 'label-roll' | 'a4';
 
// ── Extra content height estimation (mm) ──────────────────────────────────
//    Used to auto-expand sticker height when heading/labels are present.
const HEADING_ROW_MM    = 5;    // height added per heading row
const LABEL_ROW_MM      = 3.5;  // height added per extra label row
const LABEL_SECTION_MM  = 2;    // border + padding for the labels block
 
// ── Layout parameters ─────────────────────────────────────────────────────
export interface LayoutParams {
  // Base (user-chosen) dimensions
  baseWidthMm: number;
  baseHeightMm: number;
  // Computed dimensions (may be taller than base if heading/labels present)
  stickerWidthMm: number;
  stickerHeightMm: number;   // ← used for @page size
  // Both-mode sticker is wider
  bothStickerWidthMm: number;
  // Pixel helpers
  widthPx: number;
  heightPx: number;
  padding: number;
  usableW: number;
  usableH: number;
  // Image sizes — single code
  imgQr: number;
  imgBcW: number;
  imgBcH: number;
  // Image sizes — both/side-by-side
  bothQr: number;
  bothBcW: number;
  bothBcH: number;
  // Typography
  fontSize: number;
  idFontSize: number;
  labelFontSize: number;
  headingFontSize: number;
  // Display helpers
  labelMm: string;
}
 
function buildLayout(
  widthMm: number,
  heightMm: number,
  hasHeading: boolean,
  labelCount: number,
): LayoutParams {
  // ── Auto-expand height for heading + labels ─────────────────────────────
  let computedHeightMm = heightMm;
  if (hasHeading)   computedHeightMm += HEADING_ROW_MM;
  if (labelCount > 0) computedHeightMm += LABEL_SECTION_MM + labelCount * LABEL_ROW_MM;
 
  const widthPx  = Math.round(widthMm  * MM_TO_PX);
  const heightPx = Math.round(computedHeightMm * MM_TO_PX);
  const padding  = Math.max(6, Math.round(widthPx * 0.055));
  const usableW  = widthPx  - padding * 2;
  const usableH  = Math.round(heightMm * MM_TO_PX) - padding * 2; // base usable (for image sizing)
 
  // Single-code image sizes
  const imgQr  = Math.round(Math.min(usableW * 0.78, usableH * 0.62));
  const imgBcW = Math.round(usableW);
  const imgBcH = Math.round(usableH * 0.60);
 
  // Both side-by-side: sticker is ~1.9× wider
  const bothWidthMm = Math.round(widthMm * 1.9);
  const bothWPx     = Math.round(bothWidthMm * MM_TO_PX);
  const colW        = Math.round((bothWPx - padding * 3) / 2);
  const bothQr      = Math.round(Math.min(colW * 0.80, usableH * 0.62));
  const bothBcW     = Math.round(colW * 0.92);
  const bothBcH     = Math.round(usableH * 0.60);
 
  // Typography scaled to sticker width
  const fontSize        = Math.max(5,   Math.round(widthPx * 0.056));
  const idFontSize      = Math.max(4.5, Math.round(widthPx * 0.046));
  const labelFontSize   = Math.max(4,   Math.round(widthPx * 0.040));
  const headingFontSize = Math.max(5,   Math.round(widthPx * 0.062));
 
  return {
    baseWidthMm:          widthMm,
    baseHeightMm:         heightMm,
    stickerWidthMm:       widthMm,
    stickerHeightMm:      computedHeightMm,
    bothStickerWidthMm:   bothWidthMm,
    widthPx, heightPx, padding, usableW, usableH,
    imgQr, imgBcW, imgBcH,
    bothQr, bothBcW, bothBcH,
    fontSize, idFontSize, labelFontSize, headingFontSize,
    labelMm: `${widthMm}×${heightMm}mm`,
  };
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
  
  // ── State ────────────────────────────────────────────────────────────────
  selection            = new SelectionModel<AssetQrBarcode>(true, []);
  printType            = signal<'qr' | 'barcode' | 'both'>('both');
  stickerSize          = signal<SizeKey | 'custom'>('medium');
  paperFormat          = signal<PaperFormat>('label-roll');
  columnsA4            = signal<2 | 3 | 4>(3);
  customHeadingControl = new FormControl('');
  customWidthMm        = signal<number>(50);
  customHeightMm       = signal<number>(25);
  customHeading = signal<string>('');
 
  // ── Computed ─────────────────────────────────────────────────────────────
  selectedCount      = computed(() => this.selection.selected.length);
  enabledLabelsCount = computed(() => this.availableLabels().filter(l => l.enabled).length);
 
  /** Reactive layout — rebuilds whenever size, heading, or label count changes */
  currentLayout = computed((): LayoutParams => {
    const size = this.stickerSize();
    const [w, h] = size === 'custom'
      ? [Math.max(20, this.customWidthMm()), Math.max(10, this.customHeightMm())]
      : [STICKER_SIZES[size].widthMm, STICKER_SIZES[size].heightMm];
 
    // const hasHeading   = !!(this.customHeadingControl.value?.trim());
    const hasHeading = !!(this.customHeading().trim());
    const labelCount   = this.enabledLabelsCount();
    return buildLayout(w, h, hasHeading, labelCount);
  });
 
  /** Effective page sticker width (depends on print type) */
  effectiveStickerWidthMm = computed((): number =>
    this.printType() === 'both'
      ? this.currentLayout().bothStickerWidthMm
      : this.currentLayout().stickerWidthMm
  );
 
  /** For "label-roll": page = sticker. For A4: page = A4. */
  pageSizeDescription = computed((): string => {
    const L  = this.currentLayout();
    const w  = this.effectiveStickerWidthMm();
    const h  = L.stickerHeightMm;
    if (this.paperFormat() === 'label-roll') {
      return `${w}×${h}mm per sticker (label roll)`;
    }
    return `A4 sheet · ${this.columnsA4()} per row`;
  });
 
  readonly STICKER_SIZES = STICKER_SIZES;
  readonly sizeKeys: SizeKey[] = ['small', 'medium', 'large'];
 
  // ── Available extra labels ────────────────────────────────────────────────
  availableLabels = signal<PrintLabel[]>([
    { id: 'department', label: 'Department',    enabled: false, getValue: (a) => a.departmentDisplay || '' },
    { id: 'location',   label: 'Location',      enabled: false, getValue: (a) => `${a.siteDisplay || ''} ${a.areaDisplay ? '· ' + a.areaDisplay : ''}`.trim() },
    { id: 'category',   label: 'Category',      enabled: false, getValue: (a) => a.categoryDisplay || '' },
    { id: 'description',label: 'Description',   enabled: false, getValue: (a) => (a as any).description || '' },
    { id: 'serialNo',   label: 'Serial No',     enabled: false, getValue: (a) => a.assetSerialNo || '' },
    { id: 'brand',      label: 'Brand & Model', enabled: false, getValue: (a) => `${a.assetBrand || ''} ${a.assetModelNo || ''}`.trim() },
  ]);
 
  constructor(
    public dialogRef: MatDialogRef<PrintDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintDialogData,
  ) {}
 
  ngOnInit(): void {
    this.printType.set(this.data.type);
    this.data.assets.forEach(a => this.selection.select(a));
    // Re-run computed when heading text changes
    this.customHeadingControl.valueChanges.subscribe(value => {
        this.customHeading.set(value || '');
      // Signal already tracked via computed; just trigger change detection
    });
  }
 
  // ── Selection ────────────────────────────────────────────────────────────
  isAllSelected():    boolean { return this.selection.selected.length === this.data.assets.length; }
  isIndeterminate():  boolean {
    const n = this.selection.selected.length;
    return n > 0 && n < this.data.assets.length;
  }
  toggleAll(): void {
    this.isAllSelected() ? this.selection.clear() : this.data.assets.forEach(a => this.selection.select(a));
  }
  toggleLabel(label: PrintLabel): void {
    label.enabled = !label.enabled;
    this.availableLabels.set([...this.availableLabels()]);
  }
 
  close(): void { this.dialogRef.close(); }
 
  getModeLabel(): string {
    switch (this.data.mode) {
      case 'single': return 'Single Asset';
      case 'bulk':   return `${this.data.assets.length} Selected`;
      case 'all':    return `All ${this.data.assets.length} Assets`;
    }
  }
 
  getSizeLabel(key: SizeKey): string {
    const s = STICKER_SIZES[key];
    return `${s.widthMm}×${s.heightMm}mm`;
  }
 
  onCustomWidth(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(v) && v >= 20) this.customWidthMm.set(v);
  }
  onCustomHeight(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(v) && v >= 10) this.customHeightMm.set(v);
  }
 
  // ── Live preview: first asset or dummy ───────────────────────────────────
  get previewAsset(): AssetQrBarcode | null {
    return this.data.assets[0] ?? null;
  }
 
  getEnabledLabels(): PrintLabel[] {
    return this.availableLabels().filter(l => l.enabled);
  }
 
  getRange(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
 
  // How many mm heading adds to height
  getHeadingExpandMm(): number {
    return HEADING_ROW_MM;
  }
 
  // How many mm the active labels add to height
  getLabelExpandMm(): number {
    const n = this.enabledLabelsCount();
    return n > 0 ? Math.round(LABEL_SECTION_MM + n * LABEL_ROW_MM) : 0;
  }
 
  // ── Preview pixel sizing (scaled down from print dimensions) ─────────────
  // We show the preview at ~2× MM scale so it looks reasonable in the dialog.
  private readonly PREVIEW_SCALE = 2.2; // px per mm in preview
 
  getPreviewWidthPx(): number {
    const w = this.printType() === 'both'
      ? this.currentLayout().bothStickerWidthMm
      : this.currentLayout().stickerWidthMm;
    return Math.round(w * this.PREVIEW_SCALE);
  }
 
  getPreviewHeightPx(): number {
    return Math.round(this.currentLayout().stickerHeightMm * this.PREVIEW_SCALE);
  }
 
  getPreviewQrSize(): number {
    const L = this.currentLayout();
    const base = this.printType() === 'both' ? L.bothQr : L.imgQr;
    return Math.round(base * (this.PREVIEW_SCALE / (96 / 25.4)));
  }
 
  getPreviewBcWidth(): number {
    const L = this.currentLayout();
    const base = this.printType() === 'both' ? L.bothBcW : L.imgBcW;
    return Math.round(base * (this.PREVIEW_SCALE / (96 / 25.4)));
  }
 
  getPreviewBcHeight(): number {
    const L = this.currentLayout();
    const base = this.printType() === 'both' ? L.bothBcH : L.imgBcH;
    return Math.round(base * (this.PREVIEW_SCALE / (96 / 25.4)));
  }
 
  getPreviewFontSize(type: 'heading' | 'name' | 'id' | 'label'): number {
    const L = this.currentLayout();
    const scale = this.PREVIEW_SCALE / (96 / 25.4);
    switch (type) {
      case 'heading': return Math.round(L.headingFontSize * scale);
      case 'name':    return Math.round(L.fontSize * scale);
      case 'id':      return Math.round(L.idFontSize * scale);
      case 'label':   return Math.round(L.labelFontSize * scale);
    }
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  // PRINT ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  executePrint(): void {
    const assets = this.selection.selected;
    if (!assets.length) return;
 
    const type          = this.printType();
    const format        = this.paperFormat();
    const cols          = format === 'label-roll' ? 1 : this.columnsA4();
    // const customHeading = this.customHeadingControl.value?.trim() || '';
    const customHeading = this.customHeading().trim();
    const enabledLabels = this.availableLabels().filter(l => l.enabled);
    const L             = this.currentLayout();
 
    // Effective sticker dimensions for this job
    const sW = type === 'both' ? L.bothStickerWidthMm : L.stickerWidthMm;
    const sH = L.stickerHeightMm;   // already includes heading + label expansion
 
    // ── @page size rule ────────────────────────────────────────────────────
    // label-roll: one sticker = one page. Page size = sticker size.
    // a4:         multiple stickers on A4 sheet.
    const pageRule = format === 'label-roll'
      ? `@page { size: ${sW}mm ${sH}mm; margin: 0; }`
      : `@page { size: A4 portrait; margin: 8mm; }`;
 
    // ── Grid columns CSS ───────────────────────────────────────────────────
    const gridCols = format === 'label-roll'
      ? `grid-template-columns: ${sW}mm;`
      : `grid-template-columns: repeat(${cols}, ${sW}mm);`;
 
    // ── Extra labels HTML ──────────────────────────────────────────────────
    const labelsHtml = (asset: AssetQrBarcode): string => {
      if (!enabledLabels.length) return '';
      const rows = enabledLabels
        .map(lbl => {
          const val = lbl.getValue(asset);
          return val ? `<div class="lrow"><span class="lk">${lbl.label}:</span><span class="lv">${val}</span></div>` : '';
        })
        .filter(Boolean).join('');
      return rows ? `<div class="xlabels">${rows}</div>` : '';
    };
 
    // ── BOTH mode: side-by-side sticker ───────────────────────────────────
    const stickerBoth = (asset: AssetQrBarcode): string => `
      <div class="sticker sticker-both" style="width:${sW}mm;min-height:${sH}mm;padding:${L.padding}px;">
        ${customHeading ? `<div class="hstrip">${customHeading}</div>` : ''}
        <div class="blayout">
          <div class="bcol bcol-l">
            ${asset.qrcodeImage
              ? `<div class="iwrap"><div class="wm">INFOASSET</div>
                   <img src="${asset.qrcodeImage}" width="${L.bothQr}" height="${L.bothQr}" alt="QR"
                        style="position:relative;z-index:2;display:block;object-fit:contain;background:#fff;"/></div>`
              : `<div class="nocode" style="width:${L.bothQr}px;height:${L.bothQr}px;">No QR</div>`}
            <div class="aname" style="font-size:${L.fontSize}px;">${asset.name}</div>
            <div class="aid"   style="font-size:${L.idFontSize}px;">${asset.assetId}</div>
          </div>
          <div class="bdivider"></div>
          <div class="bcol bcol-r">
            ${asset.barcode
              ? `<div class="iwrap"><div class="wm">INFOASSET</div>
                   <img src="${asset.barcode}" width="${L.bothBcW}" height="${L.bothBcH}" alt="BC"
                        style="position:relative;z-index:2;display:block;object-fit:contain;background:#fff;"/></div>
                 <div class="aid aid-r" style="font-size:${Math.max(4, L.idFontSize - 0.5)}px;">${asset.assetId}</div>`
              : `<div class="nocode" style="width:${L.bothBcW}px;height:${L.bothBcH}px;">No BC</div>`}
            ${labelsHtml(asset)}
          </div>
        </div>
      </div>`;
 
    // ── Single-code: vertical sticker ─────────────────────────────────────
    const stickerSingle = (asset: AssetQrBarcode): string => {
      const isQr   = type === 'qr';
      const imgHtml = isQr && asset.qrcodeImage
        ? `<div class="iwrap"><div class="wm">INFOASSET</div>
             <img src="${asset.qrcodeImage}" width="${L.imgQr}" height="${L.imgQr}" alt="QR"
                  style="position:relative;z-index:2;display:block;object-fit:contain;background:#fff;"/></div>`
        : !isQr && asset.barcode
        ? `<div class="iwrap bc"><div class="wm">INFOASSET</div>
             <img src="${asset.barcode}" width="${L.imgBcW}" height="${L.imgBcH}" alt="BC"
                  style="position:relative;z-index:2;display:block;object-fit:contain;background:#fff;"/></div>`
        : `<div class="nocode" style="width:${L.imgBcW}px;height:${L.imgBcH}px;">No Code</div>`;
      return `
        <div class="sticker sticker-single" style="width:${sW}mm;min-height:${sH}mm;padding:${L.padding}px;">
          ${customHeading ? `<div class="hstrip" style="font-size:${L.headingFontSize}px;">${customHeading}</div>` : ''}
          ${imgHtml}
          <div class="aname" style="font-size:${L.fontSize}px;">${asset.name}</div>
          <div class="aid"   style="font-size:${L.idFontSize}px;">${asset.assetId}</div>
          ${labelsHtml(asset)}
        </div>`;
    };
 
    const makeStickerHtml = (a: AssetQrBarcode) =>
      type === 'both' ? stickerBoth(a) : stickerSingle(a);
 
    // ── Print document ─────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Stickers — INFOASSET</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f0f5;color:#111}
 
/* ── Screen chrome ─────────────────────────────── */
.scr-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 22px;background:white;border-bottom:3px solid #6366f1;margin-bottom:14px;
}
.brand{font-size:1.3rem;font-weight:800;letter-spacing:.14em;color:#6366f1;text-transform:uppercase}
.hdr-info{font-size:.72rem;color:#555;text-align:right;line-height:1.7}
.hdr-info strong{color:#222}
.scr-acts{
  display:flex;align-items:center;justify-content:center;
  gap:10px;padding:12px 16px;background:white;
  border-bottom:1px solid #e5e5e5;margin-bottom:20px;flex-wrap:wrap;
}
.btn-pr{
  background:#6366f1;color:white;border:none;padding:9px 24px;border-radius:8px;
  font-size:.88rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
  transition:background .2s,transform .15s,box-shadow .2s;
}
.btn-pr:hover{background:#4f46e5;transform:translateY(-1px);box-shadow:0 4px 14px rgba(99,102,241,.3)}
.btn-cl{
  background:white;color:#555;border:2px solid #ccc;padding:9px 18px;
  border-radius:8px;font-size:.88rem;cursor:pointer;
}
.btn-cl:hover{border-color:#888;background:#f5f5f5}
.badge{
  font-size:.7rem;color:#555;background:#f5f5f5;border:1px solid #ddd;
  border-radius:6px;padding:5px 11px;font-family:'Courier New',monospace;
}
.badge.badge-dim { background:#eef2ff; border-color:#c7d2fe; color:#4f46e5; font-weight:700; }
 
/* ── Sticker grid ──────────────────────────────── */
.grid{
  display:grid;
  ${gridCols}
  gap:5mm;padding:0 14px 20px;align-items:start;justify-content:start;
}
 
/* ── Base sticker ──────────────────────────────────
 * min-height: sticker can GROW with content.
 * Width set inline in mm = exact physical label width.
 * page-break-inside:avoid → each sticker stays whole.
 ──────────────────────────────────────────────────── */
.sticker{
  border:1.5px dashed #aaa;border-radius:5px;background:white;
  page-break-inside:avoid;break-inside:avoid;
  box-shadow:0 1px 3px rgba(0,0,0,.08);
  display:flex;flex-direction:column;align-items:center;
  gap:0px;position:relative;overflow:visible;
}
 
/* ── Heading strip ─────────────────────────────────
 * Fixed to top, spans full width.
 * Truncates with ellipsis.
 ──────────────────────────────────────────────────── */
.hstrip{
  width:100%;text-align:center;font-weight:700;
  font-size:${L.headingFontSize}px;color:#111;
  padding:0px 4px 0px;border-bottom:1px solid #e0e0e0;
  margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;
}
 
/* ── Image wrap ──────────────────────────────────── */
.iwrap{
  position:relative;display:inline-flex;
  align-items:center;justify-content:center;
  background:white;flex-shrink:0;
}
.iwrap.bc{border-radius:3px}
/* Watermark behind image */
.wm{
  position:absolute;font-size:.6rem;font-weight:900;
  letter-spacing:.16em;color:rgba(99,102,241,.06);
  text-transform:uppercase;transform:rotate(-22deg);
  pointer-events:none;z-index:1;white-space:nowrap;
}
 
/* ── Asset text ──────────────────────────────────── */
.aname{
  font-weight:700;text-align:center;color:#111;
  line-height:1.2;max-width:100%;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0;
}
.aid{
  font-family:'Courier New',monospace;color:#444;
  letter-spacing:.04em;text-align:center;font-weight:600;flex-shrink:0;
}
 
/* ── Extra labels ────────────────────────────────── */
.xlabels{
  width:100%;border-top:1px dashed #ddd;
  padding-top:3px;margin-top:2px;
  display:flex;flex-direction:column;gap:1px;
}
.lrow{display:flex;gap:3px;font-size:${L.labelFontSize}px;line-height:1.3;overflow:hidden}
.lk{font-weight:700;color:#888;flex-shrink:0}
.lv{color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 
/* ── No-code placeholder ─────────────────────────── */
.nocode{
  display:flex;align-items:center;justify-content:center;
  font-size:${L.labelFontSize}px;color:#bbb;
  background:#f9f9f9;border:1px dashed #ddd;border-radius:4px;
}
 
/* ── BOTH side-by-side ────────────────────────────── */
.sticker-both{flex-direction:column}
.blayout{display:flex;flex-direction:row;align-items:flex-start;gap:0;width:100%;flex:1}
.bcol{display:flex;flex-direction:column;align-items:center;gap:0px;flex:1;min-width:0}
.bcol-l{padding-right:3px}
.bcol-r{padding-left:3px;}
.aid-r{text-align:left}
.bdivider{width:1px;background:#ddd;align-self:stretch;flex-shrink:0;margin:0 2px}
 
/* ── SINGLE vertical ─────────────────────────────── */
.sticker-single{flex-direction:column;align-items:center}
 
/* ── Print media ─────────────────────────────────── */
${pageRule}
@media print{
  body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .no-print{display:none!important}
  .grid{padding:0;gap:4mm}
  .sticker{box-shadow:none;border-color:#bbb}
  ${format === 'label-roll' ? `
  /* label-roll: force each sticker to its own page */
  .sticker{break-inside: avoid;page-break-inside: avoid;}
  .sticker:last-child{page-break-after:auto;break-after:auto}
  ` : ''}
}
</style>
</head>
<body>
 
<!-- Screen header -->
<div class="scr-hdr no-print">
  <span class="brand">INFOASSET</span>
  <div class="hdr-info">
    <div><strong>${assets.length}</strong> sticker(s) &nbsp;·&nbsp;
      ${type === 'qr' ? 'QR Code only' : type === 'barcode' ? 'Barcode only' : 'QR + Barcode (side-by-side)'}
    </div>
    <div>Sticker: <strong>${sW}mm × ${sH}mm</strong>
      ${sH !== L.baseHeightMm ? ` <em style="color:#10b981;">(+${(sH - L.baseHeightMm).toFixed(1)}mm for content)</em>` : ''}
    </div>
    <div>Paper: <strong>${format === 'label-roll' ? `Label roll (1 per page)` : `A4 · ${cols} per row`}</strong></div>
    ${customHeading ? `<div>Heading: "${customHeading}"</div>` : ''}
  </div>
</div>
 
<!-- Screen action bar -->
<div class="scr-acts no-print">
  <button class="btn-pr" onclick="window.print()">🖨️&nbsp; Print ${assets.length} Sticker${assets.length !== 1 ? 's' : ''}</button>
  <button class="btn-cl" onclick="window.close()">✕ Close</button>
  <span class="badge badge-dim">Sticker: ${sW}mm × ${sH}mm</span>
  <span class="badge">Paper: ${format === 'label-roll' ? 'Label Roll' : 'A4'}</span>
  ${sH !== L.baseHeightMm ? `<span class="badge" style="color:#059669;border-color:#6ee7b7;background:#ecfdf5;">
    Auto-expanded +${(sH - L.baseHeightMm).toFixed(1)}mm
  </span>` : ''}
</div>
 
<!-- Sticker grid -->
<div class="grid">
${assets.map(a => makeStickerHtml(a)).join('\n')}
</div>
 
</body>
</html>`;
 
    const win = window.open('', '_blank', 'width=1200,height=880');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    this.dialogRef.close();
  }
}
