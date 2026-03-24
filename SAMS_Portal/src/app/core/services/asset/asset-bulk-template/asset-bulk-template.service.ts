import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { AssetDropdownData } from '../../../models/interfaces/asset-manage/assets.interface';
 
@Injectable({
  providedIn: 'root'
})
export class AssetBulkTemplateService {

  async generateAndDownload(dropdowns: AssetDropdownData): Promise<void> {
    await new Promise(r => setTimeout(r, 700));
 
    const wb = XLSX.utils.book_new();
 
    // ── 1. ASSET DATA SHEET ─────────────────────────────────────────────────
    // Header = Row 1.  Sample rows = Rows 2-3 (users overwrite / delete them).
    // Parser reads from row index 1 onward (row 2 in Excel) and skips only
    // un-modified sample rows, so users who start filling from row 2 are fine.
    const templateHeaders = [
      'No',
      'Asset Name *',
      'Brand *',
      'Model Number *',
      'Serial Number *',
      'Quantity',
      'Unit Price',
      'Description',
      'Category',
      'Sub Category',
      'Supplier',
      'Asset Status',                      // ← added
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
        'SN-001-DELL',
        2,
        85000,
        'High-performance laptop for design team',
        'Electronics',
        'Computers',
        dropdowns.suppliers[0]?.label         ?? 'Tech Corp',
        dropdowns.assetStatus[0]?.label       ?? 'New',
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
        'SN-002-HM',
        10,
        25000,
        'Ergonomic chairs for open floor',
        'Furniture',
        'Seating',
        dropdowns.suppliers[1]?.label         ?? 'Office Essentials',
        dropdowns.assetStatus[1]?.label       ?? 'Available',
        24,
        'HR',
        'Admin',
        'FALSE',
        '', '', '', '',
        '',
        '2024-02-01',
        '2023-11-15',
        '',
        'Bulk purchase for floor renovation',
      ],
    ];
 
    const wsData: any[][] = [templateHeaders, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
 
    ws['!cols'] = [
      { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 20 }, { wch: 22 },
      { wch: 10 }, { wch: 14 }, { wch: 35 }, { wch: 20 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
      { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 26 }, { wch: 26 },
      { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 35 },
    ];
 
    // Header row style
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
 
    // Sample row style (italic, muted)
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
            right:  { style: 'thin', color: { rgb: 'D1C4E9' } },
          },
        };
      }
    }
 
    // Freeze header row
    (ws as any)['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }];
    XLSX.utils.book_append_sheet(wb, ws, 'Asset Upload Template');
 
    // ── 2. REFERENCE SHEETS ──────────────────────────────────────────────────
 
    if (dropdowns.categories.length) {
      const s = XLSX.utils.aoa_to_sheet([['Categories'], ...dropdowns.categories.map(c => [c.label])]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Categories');
    }
 
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
 
    if (dropdowns.suppliers.length) {
      const s = XLSX.utils.aoa_to_sheet([['Suppliers'], ...dropdowns.suppliers.map(v => [v.label])]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Suppliers');
    }
 
    // ← NEW: Asset Status reference sheet
    if (dropdowns.assetStatus.length) {
      const s = XLSX.utils.aoa_to_sheet([['Asset Status'], ...dropdowns.assetStatus.map(v => [v.label])]);
      s['!cols'] = [{ wch: 26 }];
      this._styleRef(s, 1, '00695C');
      XLSX.utils.book_append_sheet(wb, s, 'REF-AssetStatus');
    }
 
    if (dropdowns.departments.length) {
      const s = XLSX.utils.aoa_to_sheet([['Departments'], ...dropdowns.departments.map(d => [d.label])]);
      s['!cols'] = [{ wch: 30 }];
      this._styleRef(s, 1, '1565C0');
      XLSX.utils.book_append_sheet(wb, s, 'REF-Departments');
    }
 
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
 
    const deprMethods = [
      'None','Straight Line','Declining Balance',
      'Double Declining Balance','150% Declining Balance','Sum of Years Digits',
    ];
    const ds = XLSX.utils.aoa_to_sheet([['Depreciation Methods'], ...deprMethods.map(m => [m])]);
    ds['!cols'] = [{ wch: 32 }];
    this._styleRef(ds, 1, '4527A0');
    XLSX.utils.book_append_sheet(wb, ds, 'REF-DeprecMethods');
 
    // Instructions
    const instr = [
      ['SAMS — Bulk Asset Upload Guide', ''],
      ['', ''],
      ['INSTRUCTIONS', ''],
      ['1. Fill in the "Asset Upload Template" sheet starting from Row 2.', ''],
      ['2. Rows 2–3 are SAMPLE rows — overwrite or delete them before uploading.', ''],
      ['3. Fields marked with * are REQUIRED.', ''],
      ['4. For dropdown columns, copy exact values from the REF-* sheets.', ''],
      ['5. Dates must be in YYYY-MM-DD format (e.g. 2024-06-15).', ''],
      ['6. "Asset is Depreciable" must be TRUE or FALSE (all caps).', ''],
      ['7. If Depreciable = FALSE, leave depreciation fields blank.', ''],
      ['8. Save and upload via the SAMS Bulk Upload portal.', ''],
      ['', ''],
      ['FIELD REFERENCE', ''],
      ['Column', 'Description / Allowed Values'],
      ['No', 'Row number (optional)'],
      ['Asset Name *', 'Full descriptive name'],
      ['Brand *', 'Manufacturer / Brand'],
      ['Model Number *', 'Model identifier'],
      ['Serial Number *', 'Unique serial number'],
      ['Quantity', 'Units (default: 1)'],
      ['Unit Price', 'Cost per unit'],
      ['Description', 'Optional description'],
      ['Category', 'See REF-Categories'],
      ['Sub Category', 'See REF-SubCategories'],
      ['Supplier', 'See REF-Suppliers'],
      ['Asset Status', 'See REF-AssetStatus'],
      ['Warranty In Month', 'Warranty in months'],
      ['Department', 'See REF-Departments'],
      ['Sub Department', 'See REF-SubDepartments'],
      ['Asset is Depreciable', 'TRUE or FALSE'],
      ['Depreciable Cost', 'Cost basis (numeric)'],
      ['Salvage Value', 'Residual value (numeric)'],
      ['Depreciation Period In Month', 'Useful life months'],
      ['Depreciation Method', 'See REF-DeprecMethods'],
      ['Date Acquired', 'YYYY-MM-DD'],
      ['Purchase Date', 'YYYY-MM-DD'],
      ['Manufacturing Date', 'YYYY-MM-DD'],
      ['Year of Valuation', 'YYYY-MM-DD'],
      ['Note', 'Additional notes'],
    ];
    const instrSheet = XLSX.utils.aoa_to_sheet(instr);
    instrSheet['!cols'] = [{ wch: 45 }, { wch: 55 }];
    if (instrSheet['A1']) {
      instrSheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4527A0' } },
        alignment: { horizontal: 'center' },
      };
    }
    XLSX.utils.book_append_sheet(wb, instrSheet, 'Instructions');
 
    XLSX.writeFile(wb, `SAMS_Asset_Upload_Template_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
 
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
 
  /**
   * Parse an uploaded Excel file and return rows as plain objects.
   *
   * FIX (Bug #2):
   * Original code used rows.slice(3) which hard-skipped rows 2 & 3 entirely,
   * so any user data entered there was lost. Now we:
   *  - Start reading from row index 1 (Excel row 2, immediately after the header)
   *  - Only skip rows that are still the unmodified SAMPLE rows by checking
   *    the "No" column for "SAMPLE-1"/"SAMPLE-2" signatures
   *  - All other non-blank rows (including rows 2 & 3 if the user filled them) are included
   */
  parseUploadedTemplate(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb   = XLSX.read(data, { type: 'array', cellDates: true });
 
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
 
          // Strip " *" suffix from header names for consistent key lookup
          const HEADERS = (rows[0] as string[]).map(h =>
            h ? h.toString().replace(' *', '').trim() : ''
          );
 
          // Read from row index 1 (Excel row 2) onward.
          // Skip: fully blank rows, and unmodified SAMPLE rows.
          const dataRows = rows.slice(1).filter((row: any[]) => {
            // Skip fully blank rows
            if (!row.some((v: any) => v !== '' && v !== null && v !== undefined)) {
              return false;
            }
            const noCol   = row[0]?.toString().trim() ?? '';
            const nameCol = row[1]?.toString().trim() ?? '';
            // Skip unmodified sample rows (user still has SAMPLE tag + default name)
            if (noCol === 'SAMPLE-1' && nameCol === 'Dell Laptop XPS 15')       return false;
            if (noCol === 'SAMPLE-2' && nameCol === 'Office Chair - Ergonomic') return false;
            return true;
          });
 
          const parsed = dataRows.map((row: any[]) => {
            const obj: any = {};
            HEADERS.forEach((h, i) => {
              if (h) obj[h] = row[i] ?? '';
            });
            return obj;
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
}
