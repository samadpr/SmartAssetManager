import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { AssetDropdownData } from '../../../models/interfaces/asset-manage/assets.interface';
 
// ─── Row shape returned by parseUploadedTemplate ────────────────────────────
export interface ParsedBulkRow {
  // Required
  name: string;
  assetBrand: string;
  assetModelNo: string;
 
  // Quantity & Serials
  quantity: number;
  /** Comma-separated serial numbers entered by user, or array after parsing */
  serialNumbersRaw: string;
  serialNumbers: string[]; // resolved array, length === quantity
 
  // Optional basic
  unitPrice?: number;
  description?: string;
  warranetyInMonth?: number;
  note?: string;
 
  // Resolved IDs
  category?: number;
  subCategory?: number;
  supplier?: number;
  assetStatus?: number;
  department?: number;
  subDepartment?: number;
  depreciationMethod?: number;
 
  // Display labels
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  supplierDisplay?: string;
  assetStatusDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
 
  // Depreciation
  isDepreciable: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  dateAquired?: Date | null;
 
  // Dates
  dateOfPurchase?: Date | null;
  dateOfManufacture?: Date | null;
  yearOfValuation?: Date | null;
}
 
@Injectable({
  providedIn: 'root'
})
export class AssetBulkTemplateService {
  // ── Template generation ────────────────────────────────────────────────────
  async generateAndDownload(dropdowns: AssetDropdownData): Promise<void> {
    await new Promise(r => setTimeout(r, 600));
 
    const wb = XLSX.utils.book_new();
 
    // ── 1. ASSET UPLOAD SHEET ─────────────────────────────────────────────
    const headers = [
      'No',
      'Asset Name *',
      'Brand *',
      'Model Number *',
      'Quantity *',
      'Serial Numbers *',
      'Unit Price',
      'Description',
      'Category',
      'Sub Category',
      'Supplier',
      'Asset Status',
      'Warranty In Month',
      'Department',
      'Sub Department',
      'Asset is Depreciable (TRUE/FALSE)',
      'Depreciable Cost',
      'Salvage Value',
      'Depreciation Period In Month',
      'Depreciation Method',
      'Date Acquired (YYYY-MM-DD)',
      'Purchase Date (YYYY-MM-DD)',
      'Manufacturing Date (YYYY-MM-DD)',
      'Year of Valuation (YYYY-MM-DD)',
      'Note',
    ];
 
    const sampleRows = [
      [
        'SAMPLE-1',
        'Dell Laptop XPS 15',
        'Dell',
        'XPS-15-9500',
        3,
        'SN-001-DELL, SN-002-DELL, SN-003-DELL',
        85000,
        'High-performance laptop for design team',
        'Electronics',
        'Computers',
        dropdowns.suppliers[0]?.label ?? 'Tech Corp',
        dropdowns.assetStatus[0]?.label ?? 'New',
        12,
        'IT',
        'Infrastructure',
        'TRUE',
        80000,
        5000,
        36,
        'Straight Line',
        '2024-01-15',
        '2024-01-10',
        '2023-12-01',
        '2024-01-01',
        'Procured for design team use',
      ],
      [
        'SAMPLE-2',
        'Office Chair - Ergonomic',
        'Herman Miller',
        'Aeron-B',
        1,
        'SN-HM-001',
        25000,
        'Ergonomic chair for management',
        'Furniture',
        'Seating',
        dropdowns.suppliers[1]?.label ?? 'Office Essentials',
        dropdowns.assetStatus[1]?.label ?? 'Available',
        24,
        'HR',
        'Admin',
        'FALSE',
        '', '', '', '',
        '',
        '2024-02-01',
        '2023-11-15',
        '',
        'Single unit purchase',
      ],
      [
        'SAMPLE-3',
        'Server Rack Unit',
        'HP',
        'ProLiant-DL380',
        2,
        'SRV-001, SRV-002',
        250000,
        'Rack servers for data center',
        'Electronics',
        'Servers',
        dropdowns.suppliers[0]?.label ?? 'Tech Corp',
        dropdowns.assetStatus[0]?.label ?? 'New',
        60,
        'IT',
        'Infrastructure',
        'TRUE',
        240000,
        20000,
        60,
        'Declining Balance',
        '2024-03-01',
        '2024-02-28',
        '2023-10-01',
        '2024-01-01',
        'Data center expansion',
      ],
    ];
 
    const wsData: any[][] = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
 
    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 20 },
      { wch: 10 }, { wch: 45 }, // Serial Numbers column wider
      { wch: 14 }, { wch: 35 }, { wch: 20 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
      { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 26 }, { wch: 26 },
      { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 35 },
    ];
 
    // Header row style (deep purple)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:Z1');
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '4527A0' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'FFFFFF' } },
          bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
          left: { style: 'thin', color: { rgb: 'FFFFFF' } },
          right: { style: 'thin', color: { rgb: 'FFFFFF' } },
        },
      };
    }
 
    // Highlight Serial Numbers header column (col index 5) with teal accent
    const serialHeaderAddr = XLSX.utils.encode_cell({ r: 0, c: 5 });
    if (ws[serialHeaderAddr]) {
      ws[serialHeaderAddr].s = {
        ...ws[serialHeaderAddr].s,
        fill: { fgColor: { rgb: '00695C' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      };
    }
 
    // Sample row style (italic, muted purple tones)
    for (let R = 1; R <= sampleRows.length; R++) {
      for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) ws[addr] = { t: 's', v: '' };
        ws[addr].s = {
          fill: { fgColor: { rgb: R % 2 === 1 ? 'EDE7F6' : 'F3E5F5' } },
          font: { sz: 10, italic: true, color: { rgb: '5C5C5C' } },
          alignment: { vertical: 'center', wrapText: true },
          border: {
            bottom: { style: 'thin', color: { rgb: 'D1C4E9' } },
            right: { style: 'thin', color: { rgb: 'D1C4E9' } },
          },
        };
      }
      // Highlight serial number cells in sample rows
      const snAddr = XLSX.utils.encode_cell({ r: R, c: 5 });
      if (ws[snAddr]) {
        ws[snAddr].s = {
          ...ws[snAddr].s,
          fill: { fgColor: { rgb: 'E0F2F1' } },
          font: { sz: 10, italic: true, color: { rgb: '00695C' } },
        };
      }
    }
 
    // Freeze header row
    (ws as any)['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }];
 
    XLSX.utils.book_append_sheet(wb, ws, 'Asset Upload Template');
 
    // ── 2. REFERENCE SHEETS ───────────────────────────────────────────────
 
    // Categories
    if (dropdowns.categories.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Categories'],
        ...dropdowns.categories.map(c => [c.label])
      ]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Categories');
    }
 
    // Sub Categories
    if (dropdowns.allSubCategories.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Sub Category', 'Parent Category'],
        ...dropdowns.allSubCategories.map(sc => [
          sc.label,
          dropdowns.categories.find(c => c.value === sc.categoryId)?.label ?? '',
        ]),
      ]);
      s['!cols'] = [{ wch: 30 }, { wch: 25 }];
      this._styleRef(s, 2, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-SubCategories');
    }
 
    // Suppliers
    if (dropdowns.suppliers.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Suppliers'],
        ...dropdowns.suppliers.map(v => [v.label])
      ]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Suppliers');
    }
 
    // Asset Status
    if (dropdowns.assetStatus.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Asset Status'],
        ...dropdowns.assetStatus.map(v => [v.label])
      ]);
      s['!cols'] = [{ wch: 26 }];
      this._styleRef(s, 1, '00695C');
      XLSX.utils.book_append_sheet(wb, s, 'REF-AssetStatus');
    }
 
    // Departments
    if (dropdowns.departments.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Departments'],
        ...dropdowns.departments.map(d => [d.label])
      ]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Departments');
    }
 
    // Sub Departments
    if (dropdowns.allSubDepartments.length) {
      const s = XLSX.utils.aoa_to_sheet([
        ['Sub Department', 'Parent Department'],
        ...dropdowns.allSubDepartments.map(sd => [
          sd.label,
          dropdowns.departments.find(d => d.value === sd.departmentId)?.label ?? '',
        ]),
      ]);
      s['!cols'] = [{ wch: 30 }, { wch: 25 }];
      this._styleRef(s, 2, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-SubDepartments');
    }
 
    // Depreciation Methods
    const deprMethods = [
      'None', 'Straight Line', 'Declining Balance',
      'Double Declining Balance', '150% Declining Balance', 'Sum of Years Digits',
    ];
    const ds = XLSX.utils.aoa_to_sheet([
      ['Depreciation Methods'],
      ...deprMethods.map(m => [m])
    ]);
    ds['!cols'] = [{ wch: 32 }];
    this._styleRef(ds, 1, '4527A0');
    XLSX.utils.book_append_sheet(wb, ds, 'REF-DeprecMethods');
 
    // ── 3. INSTRUCTIONS SHEET ─────────────────────────────────────────────
    const instr = [
      ['SAMS — Bulk Asset Upload Guide (Batch Mode)', ''],
      ['', ''],
      ['INSTRUCTIONS', ''],
      ['1. Fill in the "Asset Upload Template" sheet starting from Row 2.', ''],
      ['2. Rows 2–4 are SAMPLE rows — overwrite or delete them before uploading.', ''],
      ['3. Fields marked with * are REQUIRED.', ''],
      ['4. For dropdown columns, copy exact values from the REF-* sheets.', ''],
      ['5. Dates must be in YYYY-MM-DD format (e.g. 2024-06-15).', ''],
      ['6. "Asset is Depreciable" must be TRUE or FALSE (all caps).', ''],
      ['7. If Depreciable = FALSE, leave depreciation fields blank.', ''],
      ['8. Save and upload via the SAMS Bulk Upload portal.', ''],
      ['', ''],
      ['SERIAL NUMBERS — IMPORTANT', ''],
      ['• Quantity = 1 : Enter ONE serial number. Example: SN-001-DELL', ''],
      ['• Quantity > 1 : Enter serial numbers separated by commas, one per unit.', ''],
      ['  Example (Qty 3): SN-001-DELL, SN-002-DELL, SN-003-DELL', ''],
      ['  The count of serial numbers MUST match the Quantity value.', ''],
      ['  If you supply fewer serials, the system auto-generates the missing ones.', ''],
      ['', ''],
      ['FIELD REFERENCE', ''],
      ['Column', 'Description / Allowed Values'],
      ['No', 'Row number (optional, for your reference)'],
      ['Asset Name *', 'Full descriptive name of the asset'],
      ['Brand *', 'Manufacturer / Brand name'],
      ['Model Number *', 'Model identifier'],
      ['Quantity *', 'Number of identical units in this batch (min 1)'],
      ['Serial Numbers *', 'Comma-separated serial numbers (count must match Quantity)'],
      ['Unit Price', 'Cost per single unit'],
      ['Description', 'Optional description'],
      ['Category', 'See REF-Categories tab'],
      ['Sub Category', 'See REF-SubCategories tab'],
      ['Supplier', 'See REF-Suppliers tab'],
      ['Asset Status', 'See REF-AssetStatus tab'],
      ['Warranty In Month', 'Warranty duration in months (numeric)'],
      ['Department', 'See REF-Departments tab'],
      ['Sub Department', 'See REF-SubDepartments tab'],
      ['Asset is Depreciable', 'TRUE or FALSE (all caps)'],
      ['Depreciable Cost', 'Total cost basis for depreciation (numeric)'],
      ['Salvage Value', 'Residual/scrap value at end of life (numeric)'],
      ['Depreciation Period In Month', 'Useful life in months (numeric)'],
      ['Depreciation Method', 'See REF-DeprecMethods tab'],
      ['Date Acquired', 'Acquisition date in YYYY-MM-DD format'],
      ['Purchase Date', 'Purchase date in YYYY-MM-DD format'],
      ['Manufacturing Date', 'Manufacturing date in YYYY-MM-DD format'],
      ['Year of Valuation', 'Valuation date in YYYY-MM-DD format'],
      ['Note', 'Additional notes or remarks'],
    ];
 
    const instrSheet = XLSX.utils.aoa_to_sheet(instr);
    instrSheet['!cols'] = [{ wch: 52 }, { wch: 58 }];
 
    // Title style
    if (instrSheet['A1']) {
      instrSheet['A1'].s = {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4527A0' } },
        alignment: { horizontal: 'center' },
      };
    }
 
    // Serial numbers section highlight
    ['A14', 'A15', 'A16', 'A17', 'A18', 'A19'].forEach(addr => {
      if (instrSheet[addr]) {
        instrSheet[addr].s = {
          font: { bold: addr === 'A14', sz: 10, color: { rgb: '00695C' } },
          fill: { fgColor: { rgb: 'E0F2F1' } },
        };
      }
    });
 
    XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');
 
    XLSX.writeFile(wb, `SAMS_Asset_Bulk_Template_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
 
  // ── Style helper for reference sheets ─────────────────────────────────────
  private _styleRef(ws: XLSX.WorkSheet, colCount: number, colorHex: string): void {
    for (let C = 0; C < colCount; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: colorHex } },
        alignment: { horizontal: 'center' },
      };
    }
  }
 
  // ── Parse uploaded template ────────────────────────────────────────────────
  /**
   * Parse the uploaded Excel file and return typed rows.
   * Handles:
   *  - Strips sample rows
   *  - Parses comma-separated serial numbers
   *  - Validates serial count vs quantity
   *  - Auto-fills missing serials
   */
  parseUploadedTemplate(file: File, dropdowns: AssetDropdownData): Promise<ParsedBulkRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
 
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: true });
 
          const ws = wb.Sheets['Asset Upload Template'];
          if (!ws) {
            reject(new Error(
              'Sheet "Asset Upload Template" not found. Please use the official SAMS template.'
            ));
            return;
          }
 
          const rows: any[] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: '',
            blankrows: false,
          });
 
          if (!rows || rows.length < 2) {
            resolve([]);
            return;
          }
 
          // Strip " *" from header keys
          const HEADERS = (rows[0] as string[]).map(h =>
            h ? h.toString().replace(' *', '').trim() : ''
          );
 
          // Filter out blank and unmodified sample rows
          const dataRows = rows.slice(1).filter((row: any[]) => {
            if (!row.some((v: any) => v !== '' && v !== null && v !== undefined)) return false;
            const noCol = row[0]?.toString().trim() ?? '';
            const nameCol = row[1]?.toString().trim() ?? '';
            if (noCol === 'SAMPLE-1' && nameCol === 'Dell Laptop XPS 15') return false;
            if (noCol === 'SAMPLE-2' && nameCol === 'Office Chair - Ergonomic') return false;
            if (noCol === 'SAMPLE-3' && nameCol === 'Server Rack Unit') return false;
            return true;
          });
 
          const parsed = dataRows.map((row: any[]) => {
            const get = (key: string) => {
              const idx = HEADERS.indexOf(key);
              return idx >= 0 ? row[idx] : '';
            };
 
            const label = (key: string) => (get(key)?.toString().trim() || '');
 
            // Resolve dropdowns
            const catLabel = label('Category');
            const subCatLabel = label('Sub Category');
            const suppLabel = label('Supplier');
            const statusLabel = label('Asset Status');
            const deptLabel = label('Department');
            const subDeptLabel = label('Sub Department');
            const deprMethodStr = label('Depreciation Method');
 
            const catObj = dropdowns.categories.find(c => c.label.toLowerCase() === catLabel.toLowerCase());
            const subCatObj = dropdowns.allSubCategories.find(s => s.label.toLowerCase() === subCatLabel.toLowerCase());
            const suppObj = dropdowns.suppliers.find(s => s.label.toLowerCase() === suppLabel.toLowerCase());
            const statusObj = dropdowns.assetStatus.find(s => s.label.toLowerCase() === statusLabel.toLowerCase());
            const deptObj = dropdowns.departments.find(d => d.label.toLowerCase() === deptLabel.toLowerCase());
            const subDeptObj = dropdowns.allSubDepartments.find(s => s.label.toLowerCase() === subDeptLabel.toLowerCase());
 
            const deprMethodMap: Record<string, number> = {
              'none': 0, 'straight line': 1, 'declining balance': 2,
              'double declining balance': 3, '150% declining balance': 4,
              'sum of years digits': 5,
            };
            const resolvedDeprMethod = deprMethodStr
              ? (deprMethodMap[deprMethodStr.toLowerCase()] ?? undefined)
              : undefined;
 
            const isDepr = label('Asset is Depreciable (TRUE/FALSE)').toUpperCase() === 'TRUE';
            const qty = Math.max(1, this._toNum(get('Quantity')) ?? 1);
 
            // Parse serial numbers
            const snRaw = label('Serial Numbers');
            const { serials, autoFilled } = this._parseSerials(snRaw, qty, label('Model Number'));
 
            const result: ParsedBulkRow = {
              name: label('Asset Name') || '',
              assetBrand: label('Brand') || '',
              assetModelNo: label('Model Number') || '',
              quantity: qty,
              serialNumbersRaw: snRaw,
              serialNumbers: serials,
 
              unitPrice: this._toNum(get('Unit Price')),
              description: label('Description') || undefined,
              warranetyInMonth: this._toNum(get('Warranty In Month')),
              note: label('Note') || undefined,
 
              category: catObj?.value,
              subCategory: subCatObj?.value,
              supplier: suppObj?.value,
              assetStatus: statusObj?.value,
              department: deptObj?.value,
              subDepartment: subDeptObj?.value,
 
              categoryDisplay: catLabel || undefined,
              subCategoryDisplay: subCatLabel || undefined,
              supplierDisplay: suppLabel || undefined,
              assetStatusDisplay: statusLabel || undefined,
              departmentDisplay: deptLabel || undefined,
              subDepartmentDisplay: subDeptLabel || undefined,
 
              isDepreciable: isDepr,
              depreciableCost: isDepr ? this._toNum(get('Depreciable Cost')) : undefined,
              salvageValue: isDepr ? this._toNum(get('Salvage Value')) : undefined,
              depreciationInMonth: isDepr ? this._toNum(get('Depreciation Period In Month')) : undefined,
              depreciationMethod: resolvedDeprMethod,
              dateAquired: this._toDate(get('Date Acquired (YYYY-MM-DD)')),
              dateOfPurchase: this._toDate(get('Purchase Date (YYYY-MM-DD)')),
              dateOfManufacture: this._toDate(get('Manufacturing Date (YYYY-MM-DD)')),
              yearOfValuation: this._toDate(get('Year of Valuation (YYYY-MM-DD)')),
            };
 
            return result;
          });
 
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
 
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
 
  // ── Serial number parser ───────────────────────────────────────────────────
  private _parseSerials(
    raw: string,
    qty: number,
    modelNo: string
  ): { serials: string[]; autoFilled: boolean } {
    if (!raw || !raw.toString().trim()) {
      // Auto-generate all
      const base = modelNo?.trim() || 'SN';
      return {
        serials: Array.from({ length: qty }, (_, i) => `${base}-${String(i + 1).padStart(3, '0')}`),
        autoFilled: true,
      };
    }
 
    // Split on commas, trim whitespace
    const parts = raw.toString().split(',').map(s => s.trim()).filter(Boolean);
 
    if (parts.length === qty) {
      return { serials: parts, autoFilled: false };
    }
 
    if (parts.length > qty) {
      // Take only the first qty
      return { serials: parts.slice(0, qty), autoFilled: false };
    }
 
    // Fewer serials than qty — auto-fill the rest
    const base = modelNo?.trim() || 'SN';
    const filled = [...parts];
    for (let i = parts.length; i < qty; i++) {
      filled.push(`${base}-${String(i + 1).padStart(3, '0')}`);
    }
    return { serials: filled, autoFilled: true };
  }
 
  private _toNum(v: any): number | undefined {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = parseFloat(v.toString());
    return isNaN(n) ? undefined : n;
  }
 
  private _toDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v.toString());
    return isNaN(d.getTime()) ? null : d;
  }
}
