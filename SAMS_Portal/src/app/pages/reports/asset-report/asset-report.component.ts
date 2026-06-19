import {
  Component,
  computed,
  OnInit,
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRippleModule } from '@angular/material/core';
import {
  animate,
  style,
  transition,
  trigger,
  stagger,
  query
} from '@angular/animations';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { AssetReportService } from '../../../core/services/asset-report/asset-report.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { CompanyStorageService } from '../../../core/services/localStorage/company/company-storage.service';
import {
  BatchReportSummaryDto,
  BatchUnitRowDto,
  PagedBatchReportDto,
} from '../../../core/models/interfaces/asset-report/asset-batch-report.interface';
import { DisposeFilterPipe } from '../../../core/pipe/dispose-filter.pipe';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DepreciationScheduleDialogComponent } from './depreciation-schedule-dialog/depreciation-schedule-dialog.component';

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE_KEY  = 'sams_asset_report_page_size';
const REPORT_TAB_KEY = 'sams_asset_report_tab';
 
function readPageSize(): number {
  try { const v = localStorage.getItem(PAGE_SIZE_KEY); return v ? parseInt(v, 10) : 20; }
  catch { return 20; }
}
function savePageSize(size: number): void {
  try { localStorage.setItem(PAGE_SIZE_KEY, String(size)); } catch {}
}
function readReportTab(): 'full' | 'depreciation' | 'disposal' {
  try {
    const v = localStorage.getItem(REPORT_TAB_KEY);
    if (v === 'depreciation' || v === 'disposal') return v;
    return 'full';
  } catch { return 'full'; }
}
function saveReportTab(tab: string): void {
  try { localStorage.setItem(REPORT_TAB_KEY, tab); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-asset-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatTooltipModule, MatMenuModule,
    MatProgressSpinnerModule, MatRadioModule, MatCheckboxModule,
    MatBadgeModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatTableModule, MatSortModule,
    MatPaginatorModule, MatSlideToggleModule, MatRippleModule,
    MatButtonToggleModule,
    DisposeFilterPipe,
  ],
  templateUrl: './asset-report.component.html',
  styleUrl: './asset-report.component.scss',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('240ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('expandRow', [
      transition(':enter', [
        style({ opacity: 0, height: '0px' }),
        animate('280ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(.4,0,.2,1)',
          style({ opacity: 0, height: '0px' }))
      ])
    ]),
    trigger('filterPanel', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)', height: '0', overflow: 'hidden' }),
        animate('250ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none', height: '*' }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(.4,0,.2,1)',
          style({ opacity: 0, transform: 'translateY(-4px)', height: '0', overflow: 'hidden' }))
      ])
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(6px)' }),
          stagger('25ms', animate('200ms ease-out', style({ opacity: 1, transform: 'none' })))
        ], { optional: true })
      ])
    ])
  ]
})
export class AssetReportComponent implements OnInit, OnDestroy {
  private reportService  = inject(AssetReportService);
  private globalService  = inject(GlobalService);
  private companyStorage = inject(CompanyStorageService);
  private cdr            = inject(ChangeDetectorRef);
  private matDialog      = inject(MatDialog);
  private destroy$       = new Subject<void>();
 
  // ── Core state ─────────────────────────────────────────────────────────────
  loading         = signal(false);
  exportLoading   = signal(false);
  reportType      = signal<'full' | 'depreciation' | 'disposal'>(readReportTab());
  pagedData       = signal<PagedBatchReportDto | null>(null);
  filterPanelOpen = signal(false);
 
  // Pagination
  currentPage = signal(1);
  pageSize    = signal(readPageSize());
  totalCount  = signal(0);
 
  // ── Filter form controls ───────────────────────────────────────────────────
  searchControl      = new FormControl('');
  // Dropdown filters — all client-side on current page
  categoryFilter     = new FormControl<string>('');
  subCategoryFilter  = new FormControl<string>('');
  departmentFilter   = new FormControl<string>('');
  statusFilter       = new FormControl<string>('');
  assignTypeFilter   = new FormControl<string>(''); // 'all'|'0'|'1'|'2'|'3'
  siteFilter         = new FormControl<string>('');
  areaFilter         = new FormControl<string>(''); 
  supplierFilter     = new FormControl<string>('');
  depOnlyToggle      = new FormControl<boolean>(false);
  startDate          = new FormControl<Date | null>(null);
  endDate            = new FormControl<Date | null>(null);
 
  // Internal debounced search signal (fixes: filtering was not reactive because
  // the computed() read FormControl.value synchronously at signal evaluation time,
  // not as a reactive dependency — solved by mirroring into a signal)
  private _search         = signal('');
  private _category       = signal('');
  private _subCategory    = signal('');
  private _department     = signal('');
  private _status         = signal('');
  private _assignType     = signal('');
  private _site           = signal('');
  private _area           = signal('');
  private _supplier       = signal('');
  private _depOnly        = signal(false);
  private _startDate      = signal<Date | null>(null);
  private _endDate        = signal<Date | null>(null);
 
  activeFilters = signal<{ key: string; label: string }[]>([]);
 
  // ── Computed ───────────────────────────────────────────────────────────────
  batches = computed(() => this.pagedData()?.batches ?? []);
 
  // FIX: All filters now read from signals (not FormControl.value) so computed()
  // properly tracks them as reactive dependencies and re-evaluates on change.
  filteredBatches = computed<BatchReportSummaryDto[]>(() => {
    const q        = this._search().toLowerCase().trim();
    const cat      = this._category();
    const subCat   = this._subCategory();
    const dept     = this._department();
    const stat     = this._status();
    const assign   = this._assignType();
    const site     = this._site();
    const area     = this._area(); 
    const supplier = this._supplier();
    const depOnly  = this._depOnly();
    const start    = this._startDate();
    const end      = this._endDate();
 
    return this.batches().filter(b => {
      // Full-text search across key fields
      if (q && !(
        b.assetName?.toLowerCase().includes(q)         ||
        b.batchCode?.toLowerCase().includes(q)         ||
        b.categoryDisplay?.toLowerCase().includes(q)   ||
        b.subCategoryDisplay?.toLowerCase().includes(q)||
        b.departmentDisplay?.toLowerCase().includes(q) ||
        b.supplierDisplay?.toLowerCase().includes(q)   ||
        b.siteDisplay?.toLowerCase().includes(q)       ||
        b.areaDisplay?.toLowerCase().includes(q)       ||
        b.createdByName?.toLowerCase().includes(q)
      )) return false;
 
      if (cat     && b.categoryDisplay     !== cat)     return false;
      if (subCat  && b.subCategoryDisplay  !== subCat)  return false;
      if (dept    && b.departmentDisplay   !== dept)    return false;
      if (stat && !this.batchHasStatus(b, stat)) return false;
      if (site    && b.siteDisplay         !== site)    return false;
      if (area    && b.areaDisplay         !== area)    return false;
      if (supplier && b.supplierDisplay    !== supplier)return false;
      if (depOnly && b.depreciableCount    === 0)       return false;
 
      // Assign type filter — compare against assignedCount / unassignedCount / disposedCount
      if (assign === '0' && b.unassignedCount === 0) return false; // not-assigned only
      if (assign === '1' && b.assignedCount   === 0) return false; // user-assigned
      if (assign === '3' && b.disposedCount   === 0) return false; // disposed
 
      if (start) {
        const cd = new Date(b.createdDate);
        const sd = new Date(start); sd.setHours(0, 0, 0, 0);
        if (cd < sd) return false;
      }
      if (end) {
        const cd = new Date(b.createdDate);
        const ed = new Date(end); ed.setHours(23, 59, 59, 999);
        if (cd > ed) return false;
      }
      return true;
    });
  });

  private batchHasStatus(batch: BatchReportSummaryDto, status: string): boolean {
    const breakdown = batch.statusBreakdown;
    if (breakdown && Object.keys(breakdown).length) {
      return (breakdown[status] ?? 0) > 0;
    }
    return batch.assetStatusDisplay === status;
  }

  getStatusBreakdown(batch: BatchReportSummaryDto): { status: string; count: number }[] {
    const breakdown = batch.statusBreakdown;
    if (breakdown && Object.keys(breakdown).length > 0) {
      return Object.entries(breakdown)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({ status, count }));
    }
    if (batch.assetStatusDisplay) {
      return [{ status: batch.assetStatusDisplay, count: batch.activeQuantity }];
    }
    return [];
  }

  hasMultipleStatuses(batch: BatchReportSummaryDto): boolean {
    return this.getStatusBreakdown(batch).length > 1;
  }
 
  activeFilterCount = computed(() => this.activeFilters().length);
 
  // Dropdown options derived from current page data
  uniqueCategories = computed(() => {
    const s = new Set(this.batches().map(b => b.categoryDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  uniqueSubCategories = computed(() => {
    const s = new Set(this.batches().map(b => b.subCategoryDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  uniqueDepartments = computed(() => {
    const s = new Set(this.batches().map(b => b.departmentDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  uniqueStatuses = computed(() => {
    const s = new Set<string>();
    this.batches().forEach(b => {
      const breakdown = b.statusBreakdown;
      if (breakdown && Object.keys(breakdown).length) {
        Object.keys(breakdown).forEach(k => s.add(k));
      } else if (b.assetStatusDisplay) {
        s.add(b.assetStatusDisplay);
      }
    });
    return [...s].sort();
  });
  uniqueSites = computed(() => {
    const s = new Set(this.batches().map(b => b.siteDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  uniqueAreas = computed(() => {
    const s = new Set(this.batches().map(b => b.areaDisplay).filter((a): a is string => !!a));
    return [...s].sort();
  });
  uniqueSuppliers = computed(() => {
    const s = new Set(this.batches().map(b => b.supplierDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
 
  // Grand totals
  grandTotalBatches     = computed(() => this.pagedData()?.grandTotalBatches    ?? 0);
  grandTotalUnits       = computed(() => this.pagedData()?.grandTotalUnits       ?? 0);
  grandTotalValue       = computed(() => this.pagedData()?.grandTotalValue       ?? 0);
  grandDepreciableUnits = computed(() => this.pagedData()?.grandDepreciableUnits ?? 0);
  grandDisposedUnits    = computed(() => this.pagedData()?.grandDisposedUnits    ?? 0);
  grandAssignedUnits    = computed(() => this.pagedData()?.grandAssignedUnits    ?? 0);
 
  readonly PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
 
  // ── Lifecycle ──────────────────────────────────────────────────────────────
 
  ngOnInit(): void {
    this.loadData();
    this._setupListeners();
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  private _setupListeners(): void {
    // Search — debounced, mirrors into signal
    this.searchControl.valueChanges.pipe(
      debounceTime(320), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => { this._search.set(v ?? ''); this._updateActiveFilters(); this.cdr.markForCheck(); });
 
    // Each filter control mirrors its value into a corresponding signal immediately
    // so computed() can track it as a reactive dependency
    const mirror = (ctrl: FormControl<any>, setter: (v: any) => void) =>
      ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
        setter(v ?? '');
        this._updateActiveFilters();
        this.cdr.markForCheck();
      });
 
    mirror(this.categoryFilter,    v => this._category.set(v));
    mirror(this.subCategoryFilter, v => this._subCategory.set(v));
    mirror(this.departmentFilter,  v => this._department.set(v));
    mirror(this.statusFilter,      v => this._status.set(v));
    mirror(this.assignTypeFilter,  v => this._assignType.set(v));
    mirror(this.siteFilter,        v => this._site.set(v));
    mirror(this.areaFilter,        v => this._area.set(v));
    mirror(this.supplierFilter,    v => this._supplier.set(v));
 
    this.depOnlyToggle.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this._depOnly.set(v ?? false);
      this._updateActiveFilters();
      this.cdr.markForCheck();
    });
    this.startDate.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this._startDate.set(v);
      this._updateActiveFilters();
      this.cdr.markForCheck();
    });
    this.endDate.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this._endDate.set(v);
      this._updateActiveFilters();
      this.cdr.markForCheck();
    });
  }
 
  // ── Data loading ───────────────────────────────────────────────────────────
 
  loadData(page = this.currentPage(), size = this.pageSize()): void {
    this.loading.set(true);
    const type = this.reportType();
 
    const obs$ =
      type === 'depreciation' ? this.reportService.getDepreciationBatchReport(page, size) :
      type === 'disposal'     ? this.reportService.getDisposalBatchReport(page, size)     :
                                this.reportService.getBatchSummaryReport(page, size);
 
    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.pagedData.set(res.data);
          this.totalCount.set(res.totalCount ?? res.data.totalCount ?? 0);
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalService.showToastr('Failed to load report', 'error');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
 
  onPageChange(e: PageEvent): void {
    this.currentPage.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    savePageSize(e.pageSize);
    this.batches().forEach(b => { b._expanded = false; });
    this.loadData(e.pageIndex + 1, e.pageSize);
  }
 
  onReportTypeChange(type: 'full' | 'depreciation' | 'disposal'): void {
    this.reportType.set(type);
    saveReportTab(type);
    this.currentPage.set(1);
    this.batches().forEach(b => { b._expanded = false; (b as any).units = null; });
    this.pagedData.set(null);
    this.loadData(1, this.pageSize());
  }
 
  // ── Expand / lazy-load units ───────────────────────────────────────────────
 
  toggleBatch(batch: BatchReportSummaryDto): void {
    if (batch._expanded) {
      batch._expanded = false;
      this.cdr.markForCheck();
      return;
    }
    if (batch.units !== undefined && batch.units !== null) {
      batch._expanded = true;
      this.cdr.markForCheck();
      return;
    }
    batch._loadingUnits = true;
    batch._expanded     = true;
    this.cdr.markForCheck();
 
    this.reportService.getBatchDetailReport(batch.batchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success && res.data) {
          batch.units           = res.data.units ?? [];
          batch.assignedCount   = res.data.assignedCount;
          batch.unassignedCount = res.data.unassignedCount;
          batch.disposedCount   = res.data.disposedCount;
        } else {
          batch.units = [];
        }
        batch._loadingUnits = false;
        this.cdr.markForCheck();
      },
      error: () => {
        batch.units         = [];
        batch._loadingUnits = false;
        this.cdr.markForCheck();
      }
    });
  }
 
  // ── Filter helpers ─────────────────────────────────────────────────────────
 
  toggleFilterPanel(): void { this.filterPanelOpen.update(v => !v); }
 
  private _updateActiveFilters(): void {
    const chips: { key: string; label: string }[] = [];
    if (this._search())       chips.push({ key: 'search',      label: `"${this._search()}"` });
    if (this._category())     chips.push({ key: 'category',    label: `Cat: ${this._category()}` });
    if (this._subCategory())  chips.push({ key: 'subCategory', label: `Sub: ${this._subCategory()}` });
    if (this._department())   chips.push({ key: 'department',  label: `Dept: ${this._department()}` });
    if (this._status())       chips.push({ key: 'status',      label: `Status: ${this._status()}` });
    if (this._assignType())   chips.push({ key: 'assignType',  label: `Assign: ${this.assignTypeLabel(this._assignType())}` });
    if (this._site())         chips.push({ key: 'site',        label: `Site: ${this._site()}` });
    if (this._area())         chips.push({ key: 'area',        label: `Area: ${this._area()}` });
    if (this._supplier())     chips.push({ key: 'supplier',    label: `Supplier: ${this._supplier()}` });
    if (this._depOnly())      chips.push({ key: 'depOnly',     label: 'Depreciable only' });
    if (this._startDate() && this._endDate())
      chips.push({ key: 'dateRange', label: `${this.fmt(this._startDate())} – ${this.fmt(this._endDate())}` });
    this.activeFilters.set(chips);
  }
 
  removeFilter(key: string): void {
    const reset: Record<string, () => void> = {
      search:      () => { this.searchControl.setValue('');  this._search.set(''); },
      category:    () => { this.categoryFilter.setValue(''); this._category.set(''); },
      subCategory: () => { this.subCategoryFilter.setValue(''); this._subCategory.set(''); },
      department:  () => { this.departmentFilter.setValue(''); this._department.set(''); },
      status:      () => { this.statusFilter.setValue('');   this._status.set(''); },
      assignType:  () => { this.assignTypeFilter.setValue(''); this._assignType.set(''); },
      site:        () => { this.siteFilter.setValue('');     this._site.set(''); },
      area:        () => { this.areaFilter.setValue('');     this._area.set(''); },
      supplier:    () => { this.supplierFilter.setValue(''); this._supplier.set(''); },
      depOnly:     () => { this.depOnlyToggle.setValue(false); this._depOnly.set(false); },
      dateRange:   () => {
        this.startDate.setValue(null); this._startDate.set(null);
        this.endDate.setValue(null);   this._endDate.set(null);
      },
    };
    reset[key]?.();
    this._updateActiveFilters();
  }
 
  clearAllFilters(): void {
    // Reset all controls without emitting to avoid multiple re-renders
    this.searchControl.setValue('',    { emitEvent: false });
    this.categoryFilter.setValue('',   { emitEvent: false });
    this.subCategoryFilter.setValue('',{ emitEvent: false });
    this.departmentFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('',     { emitEvent: false });
    this.assignTypeFilter.setValue('', { emitEvent: false });
    this.siteFilter.setValue('',       { emitEvent: false });
    this.areaFilter.setValue('',       { emitEvent: false });
    this.supplierFilter.setValue('',   { emitEvent: false });
    this.depOnlyToggle.setValue(false, { emitEvent: false });
    this.startDate.setValue(null,      { emitEvent: false });
    this.endDate.setValue(null,        { emitEvent: false });
    // Reset all signals in one batch
    this._search.set(''); this._category.set(''); this._subCategory.set('');
    this._department.set(''); this._status.set(''); this._assignType.set('');
    this._site.set(''); this._area.set(''); this._supplier.set(''); this._depOnly.set(false);
    this._startDate.set(null); this._endDate.set(null);
    this.activeFilters.set([]);
    this.cdr.markForCheck();
  }
 
  // ── Depreciation dialog ────────────────────────────────────────────────────
 
  openDepreciationDialog(batch: BatchReportSummaryDto): void {
    if (!batch.units?.length) return;
 
    // Find the first depreciable unit that has a schedule
    const repUnit = batch.units.find(u => u.isDepreciable && u.depreciationSchedule?.length);
    if (!repUnit) {
      this.globalService.showToastr('No depreciation schedule available for this batch', 'error');
      return;
    }
 
    // Build the AssetReportDepreciationDto shape the dialog expects,
    // but scale the financials by the number of depreciable units
    const depUnits     = batch.units.filter(u => u.isDepreciable);
    const unitCount    = depUnits.length;
 
    // Batch-total schedule: multiply per-unit row values by unit count
    const batchSchedule = repUnit.depreciationSchedule!.map(row => ({
      year:                  row.year,
      bookValueYearBegining: row.bookValueYearBegining * unitCount,
      depreciation:          row.depreciation          * unitCount,
      bookValueYearEnd:      row.bookValueYearEnd       * unitCount,
    }));
 
    const dialogAsset = {
      // Per-unit info
      assetId:              repUnit.assetId,
      name:                 batch.assetName,
      categoryDisplay:      batch.categoryDisplay,
      departmentDisplay:    batch.departmentDisplay,
      dateAquired:          repUnit.dateAquired,
      depreciationMethod:   repUnit.depreciationMethod,
      depreciationInMonth:  repUnit.depreciationInMonth,
 
      // Batch totals shown in the dialog
      depreciableCost:  (repUnit.depreciableCost ?? 0)  * unitCount,
      salvageValue:     (repUnit.salvageValue    ?? 0)  * unitCount,
 
      // Metadata for the dialog header
      _batchCode:       batch.batchCode,
      _unitCount:       unitCount,
      _repUnitId:       repUnit.assetId,
      _perUnitCost:     repUnit.depreciableCost,
      _perUnitSalvage:  repUnit.salvageValue,
      _perUnitSchedule: repUnit.depreciationSchedule,  // per-unit schedule shown separately
 
      depreciationSchedule: batchSchedule,
    };
 
    this.matDialog.open(DepreciationScheduleDialogComponent, {
      width: '1050px',
      maxWidth: '97vw',
      maxHeight: '92vh',
      data: {
        asset:        dialogAsset,
        currencyCode: this._currencyCode,
        isBatch:      true,
        unitCount,
      },
      panelClass: 'depreciation-schedule-dialog'
    });
  }
 
  // ── Export ─────────────────────────────────────────────────────────────────
 
  exportToPDF():   void { this._runExport('pdf');   }
  exportToExcel(): void { this._runExport('excel'); }
  exportToCSV():   void { this._runExport('csv');   }
  printReport():   void { this._runExport('print'); }
 
  private _runExport(format: 'pdf' | 'excel' | 'csv' | 'print'): void {
    this.exportLoading.set(true);
    this.cdr.markForCheck();
 
    this.reportService.getFullExportData().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (!res.success || !res.data) {
          this.globalService.showToastr('No data to export', 'error');
          this.exportLoading.set(false);
          this.cdr.markForCheck();
          return;
        }
        const batches = res.data as BatchReportSummaryDto[];
        switch (format) {
          case 'pdf':   this._generatePDF(batches);   break;
          case 'excel': this._generateExcel(batches); break;
          case 'csv':   this._generateCSV(batches);   break;
          case 'print': this._generatePrint(batches); break;
        }
        this.exportLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalService.showToastr('Export failed', 'error');
        this.exportLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
 
  private _generatePDF(batches: BatchReportSummaryDto[]): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W   = doc.internal.pageSize.getWidth();
    const tab = this.reportType();
    const titleMap: Record<string, string> = {
      full: 'Full Asset Report', depreciation: 'Depreciation Report', disposal: 'Disposal Report'
    };
 
    doc.setFillColor(103, 58, 183);
    doc.rect(0, 0, W, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('SAMS — Smart Asset Management System', W / 2, 10, { align: 'center' });
 
    let y = 20;
    doc.setFontSize(10); doc.setTextColor(50, 50, 50);
    doc.text(titleMap[tab], 14, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Batches: ${batches.length}`, W - 14, y, { align: 'right' });
    y += 8;
 
    batches.forEach((batch, bi) => {
      if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 16; }
 
      doc.setFillColor(237, 231, 246);
      doc.roundedRect(12, y, W - 24, 12, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
      doc.text(`${bi + 1}. [${batch.batchCode}]  ${batch.assetName}`, 16, y + 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
      const meta = [batch.categoryDisplay, `${batch.activeQuantity}/${batch.originalQuantity} units`,
        batch.assetStatusDisplay, batch.totalValue ? `Value: ${this.formatCurrencyCompact(batch.totalValue)}` : null
      ].filter(Boolean).join('   ·   ');
      doc.text(meta, W - 15, y + 8, { align: 'right' });
      y += 15;
 
      const units = batch.units ?? [];
      if (!units.length) { y += 2; return; }
 
      let head: string[] = []; let rows: string[][] = [];
      if (tab === 'depreciation') {
        head = ['#', 'Asset ID', 'Serial', 'Method', 'Depr. Cost', 'Salvage', 'Period'];
        rows = units.filter(u => u.isDepreciable).map(u => [
          String(u.batchSequence ?? ''), u.assetId, u.assetSerialNo ?? '—',
          u.depreciationMethodDisplay ?? '—', this.formatCurrency(u.depreciableCost),
          this.formatCurrency(u.salvageValue), u.depreciationInMonth ? `${u.depreciationInMonth}mo` : '—',
        ]);
      } else if (tab === 'disposal') {
        head = ['#', 'Asset ID', 'Serial', 'Method', 'Disposal Date', 'Status'];
        rows = units.filter(u => u.assignTo === 3).map(u => [
          String(u.batchSequence ?? ''), u.assetId, u.assetSerialNo ?? '—',
          u.disposalMethodDisplay ?? '—', this.fmt(u.disposalDate),
          u.disposalAppStatus === 2 ? 'Approved' : u.disposalAppStatus === 1 ? 'Pending' : 'Rejected',
        ]);
      } else {
        head = ['#', 'Asset ID', 'Serial', 'Assign Type', 'Assigned To', 'Site', 'Status', 'Avail.'];
        rows = units.map(u => [
          String(u.batchSequence ?? ''), u.assetId, u.assetSerialNo ?? '—',
          this.assignLabel(u.assignTo), u.assignUserDisplay ?? u.siteDisplay ?? '—',
          u.siteDisplay ?? '—', u.assetStatusDisplay ?? '—', u.isAvilable ? '✓' : '✗',
        ]);
      }
      if (rows.length) {
        autoTable(doc, { head: [head], body: rows, startY: y, margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [74, 20, 140], textColor: 255, fontStyle: 'bold', fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 244, 255] } } as any);
        y = (doc as any).lastAutoTable.finalY + 5;
      }
      if (tab === 'depreciation') {
        const firstDep = units.find(u => u.isDepreciable && u.depreciationSchedule?.length);
        if (firstDep?.depreciationSchedule?.length) {
          if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 16; }
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
          doc.text(`Schedule — ${firstDep.assetId} (per unit, ${firstDep.depreciationMethodDisplay})`, 14, y);
          y += 4;
          autoTable(doc, { head: [['Year', 'Opening Value', 'Depreciation', 'Closing Value']],
            body: firstDep.depreciationSchedule.map(r => [
              `Year ${r.year}`, this.formatCurrency(r.bookValueYearBegining),
              this.formatCurrency(r.depreciation), this.formatCurrency(r.bookValueYearEnd),
            ]),
            startY: y, margin: { left: 14, right: 14 },
            styles: { fontSize: 6.5, cellPadding: 2 },
            headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 7 },
            alternateRowStyles: { fillColor: [255, 235, 238] } } as any);
          y = (doc as any).lastAutoTable.finalY + 8;
        }
      }
    });
 
    const pc = doc.getNumberOfPages();
    for (let i = 1; i <= pc; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 180, 180);
      doc.text(`System-generated — SAMS   |   Page ${i} of ${pc}`, W / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }
    doc.save(`sams-${tab}-report-${Date.now()}.pdf`);
    this.globalService.showToastr('PDF exported successfully', 'success');
  }
 
  private _generateExcel(batches: BatchReportSummaryDto[]): void {
    const wb = XLSX.utils.book_new(); const tab = this.reportType();
    const summaryRows = batches.map(b => ({
      'Batch Code': b.batchCode, 'Asset Name': b.assetName, 'Category': b.categoryDisplay ?? '',
      'Sub Category': b.subCategoryDisplay ?? '', 'Department': b.departmentDisplay ?? '',
      'Original Qty': b.originalQuantity, 'Active Qty': b.activeQuantity,
      'Total Value': b.totalValue ?? 0, 'Unit Price': b.unitPrice ?? 0,
      'Assigned': b.assignedCount, 'Unassigned': b.unassignedCount,
      'Disposed': b.disposedCount, 'Depreciable Units': b.depreciableCount,
      'Total Depr. Cost': b.totalDepreciableCost ?? 0, 'Total Salvage': b.totalSalvageValue ?? 0,
      'Status': b.assetStatusDisplay ?? '', 'Created Date': this.fmt(b.createdDate), 'Created By': b.createdByName ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Batch Summary');
 
    const unitRows: any[] = [];
    batches.forEach(b => {
      (b.units ?? []).forEach(u => {
        const row: any = {
          'Batch Code': b.batchCode, 'Batch Name': b.assetName, 'Category': b.categoryDisplay ?? '',
          'Sequence': u.batchSequence ?? '', 'Asset ID': u.assetId, 'Serial No': u.assetSerialNo ?? '',
          'Brand': u.assetBrand ?? '', 'Model': u.assetModelNo ?? '',
          'Assign Type': this.assignLabel(u.assignTo), 'Assigned User': u.assignUserDisplay ?? '',
          'Site': u.siteDisplay ?? '', 'Area': u.areaDisplay ?? '',
          'Status': u.assetStatusDisplay ?? '', 'Available': u.isAvilable ? 'Yes' : 'No',
        };
        if (tab !== 'disposal') {
          row['Depreciable'] = u.isDepreciable ? 'Yes' : 'No';
          row['Depreciation Method'] = u.depreciationMethodDisplay ?? '';
          row['Depreciable Cost'] = u.depreciableCost ?? '';
          row['Salvage Value'] = u.salvageValue ?? '';
          row['Period (months)'] = u.depreciationInMonth ?? '';
          row['Date Acquired'] = this.fmt(u.dateAquired);
        }
        if (tab !== 'depreciation') {
          row['Disposal Method'] = u.disposalMethodDisplay ?? '';
          row['Disposal Date'] = this.fmt(u.disposalDate);
          row['Disposal Status'] = u.disposalAppStatus === 2 ? 'Approved' : u.disposalAppStatus === 1 ? 'Pending' : '';
        }
        unitRows.push(row);
      });
    });
    if (unitRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(unitRows), 'Unit Details');
 
    if (tab === 'depreciation' || tab === 'full') {
      const schedRows: any[] = [];
      batches.forEach(b => {
        (b.units ?? []).filter(u => u.depreciationSchedule?.length).forEach(u => {
          u.depreciationSchedule!.forEach(row => {
            schedRows.push({ 'Batch Code': b.batchCode, 'Asset ID': u.assetId, 'Serial No': u.assetSerialNo ?? '',
              'Method': u.depreciationMethodDisplay ?? '', 'Year': row.year,
              'Opening Value': row.bookValueYearBegining, 'Depreciation': row.depreciation,
              'Closing Value': row.bookValueYearEnd });
          });
        });
      });
      if (schedRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedRows), 'Depr. Schedules');
    }
    XLSX.writeFile(wb, `sams-${tab}-report-${Date.now()}.xlsx`);
    this.globalService.showToastr('Excel exported successfully', 'success');
  }
 
  private _generateCSV(batches: BatchReportSummaryDto[]): void {
    const tab = this.reportType(); const rows: any[] = [];
    batches.forEach(b => {
      (b.units ?? []).forEach(u => {
        const row: any = { 'Batch Code': b.batchCode, 'Batch Name': b.assetName,
          'Category': b.categoryDisplay ?? '', 'Sequence': u.batchSequence ?? '',
          'Asset ID': u.assetId, 'Serial No': u.assetSerialNo ?? '',
          'Assign Type': this.assignLabel(u.assignTo), 'Assigned User': u.assignUserDisplay ?? '',
          'Site': u.siteDisplay ?? '', 'Status': u.assetStatusDisplay ?? '',
          'Available': u.isAvilable ? 'Yes' : 'No' };
        if (tab === 'depreciation' || tab === 'full') {
          row['Depreciable'] = u.isDepreciable ? 'Yes' : 'No';
          row['Depr. Method'] = u.depreciationMethodDisplay ?? '';
          row['Depr. Cost'] = u.depreciableCost ?? '';
          row['Salvage'] = u.salvageValue ?? '';
        }
        if (tab === 'disposal' || tab === 'full') {
          row['Disposal Method'] = u.disposalMethodDisplay ?? '';
          row['Disposal Date'] = this.fmt(u.disposalDate);
          row['Disposal Status'] = u.disposalAppStatus === 2 ? 'Approved' : u.disposalAppStatus === 1 ? 'Pending' : '';
        }
        rows.push(row);
      });
    });
    const csv  = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows));
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sams-${tab}-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    this.globalService.showToastr('CSV exported successfully', 'success');
  }
 
  private _generatePrint(batches: BatchReportSummaryDto[]): void {
    const win = window.open('', '_blank', 'width=1280,height=960');
    if (!win) { this.globalService.showToastr('Allow popups to print', 'error'); return; }
    const tab = this.reportType();
    const titleMap: Record<string, string> = {
      full: 'Full Asset Report', depreciation: 'Depreciation Report', disposal: 'Disposal Report'
    };
    let batchesHtml = '';
    batches.forEach((b, bi) => {
      let thead = ''; let unitRows = '';
      if (tab === 'depreciation') {
        thead = '<tr><th>#</th><th>Asset ID</th><th>Serial</th><th>Method</th><th>Cost</th><th>Salvage</th><th>Period</th></tr>';
        const du = (b.units ?? []).filter(u => u.isDepreciable);
        du.forEach(u => {
          unitRows += `<tr><td>${u.batchSequence??''}</td><td class="code">${u.assetId}</td><td class="mono">${u.assetSerialNo??'—'}</td><td>${u.depreciationMethodDisplay??'—'}</td><td class="num">${this.formatCurrency(u.depreciableCost)}</td><td class="num">${this.formatCurrency(u.salvageValue)}</td><td>${u.depreciationInMonth??'—'}mo</td></tr>`;
          if (u.depreciationSchedule?.length) {
            unitRows += `<tr><td colspan="7" class="sched-cell"><div class="sched-label">Schedule — ${u.assetId}</div><table class="sched-table"><thead><tr><th>Year</th><th>Opening</th><th>Depreciation</th><th>Closing</th></tr></thead><tbody>`;
            u.depreciationSchedule.forEach(r => { unitRows += `<tr><td>Yr ${r.year}</td><td class="num">${this.formatCurrency(r.bookValueYearBegining)}</td><td class="num red">${this.formatCurrency(r.depreciation)}</td><td class="num">${this.formatCurrency(r.bookValueYearEnd)}</td></tr>`; });
            unitRows += '</tbody></table></td></tr>';
          }
        });
        if (!du.length) unitRows = `<tr><td colspan="7" class="no-data">No depreciable units.</td></tr>`;
      } else if (tab === 'disposal') {
        thead = '<tr><th>#</th><th>Asset ID</th><th>Serial</th><th>Method</th><th>Disposal Date</th><th>Status</th></tr>';
        const du = (b.units ?? []).filter(u => u.assignTo === 3);
        du.forEach(u => {
          const s = u.disposalAppStatus===2 ? '<span class="badge-ok">Approved</span>' : u.disposalAppStatus===1 ? '<span class="badge-pend">Pending</span>' : '<span class="badge-rej">Rejected</span>';
          unitRows += `<tr><td>${u.batchSequence??''}</td><td class="code">${u.assetId}</td><td class="mono">${u.assetSerialNo??'—'}</td><td>${u.disposalMethodDisplay??'—'}</td><td>${this.fmt(u.disposalDate)}</td><td>${s}</td></tr>`;
        });
        if (!du.length) unitRows = `<tr><td colspan="6" class="no-data">No disposed units.</td></tr>`;
      } else {
        thead = '<tr><th>#</th><th>Asset ID</th><th>Serial</th><th>Assign</th><th>To</th><th>Site</th><th>Status</th><th>Avail.</th></tr>';
        (b.units ?? []).forEach(u => {
          const loc = [u.siteDisplay,u.areaDisplay].filter(Boolean).join(' · ')||'—';
          unitRows += `<tr><td>${u.batchSequence??''}</td><td class="code">${u.assetId}</td><td class="mono">${u.assetSerialNo??'—'}</td><td>${this.assignLabel(u.assignTo)}</td><td>${u.assignUserDisplay??u.siteDisplay??'—'}</td><td>${loc}</td><td>${u.assetStatusDisplay??'—'}</td><td class="${u.isAvilable?'avail-yes':'avail-no'}">${u.isAvilable?'✓':'✗'}</td></tr>`;
        });
        if (!b.units?.length) unitRows = `<tr><td colspan="8" class="no-data">No units.</td></tr>`;
      }
      batchesHtml += `<div class="batch-block"><div class="batch-header"><div class="bh-left"><span class="batch-num">${bi+1}</span><div><div class="batch-code">${b.batchCode}</div><div class="batch-name">${b.assetName}</div></div></div><div class="bh-right"><span>${b.categoryDisplay??''}</span><span>${b.activeQuantity}/${b.originalQuantity}</span>${b.assetStatusDisplay?`<span>${b.assetStatusDisplay}</span>`:''}</div></div><table class="units-table"><thead>${thead}</thead><tbody>${unitRows}</tbody></table></div>`;
    });
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titleMap[tab]}</title><style>*{margin:0;padding:0;box-sizing:border-box}@page{size:A4 landscape;margin:12mm}body{font-family:"Segoe UI",sans-serif;color:#1a1a1a;padding:16px;font-size:9.5pt}.print-header{text-align:center;border-bottom:3px solid #673ab7;padding-bottom:12px;margin-bottom:16px}.print-header h1{color:#673ab7;font-size:20pt;font-weight:800;text-transform:uppercase}.print-header .meta{display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:8pt;color:#666}.batch-block{margin-bottom:16px;break-inside:avoid}.batch-header{display:flex;justify-content:space-between;align-items:center;background:#ede7f6;border-left:4px solid #673ab7;padding:7px 12px;border-radius:0 6px 6px 0;margin-bottom:5px}.bh-left{display:flex;align-items:center;gap:10px}.batch-num{width:26px;height:26px;border-radius:50%;background:#673ab7;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10pt;flex-shrink:0}.batch-code{font-family:monospace;font-size:8.5pt;font-weight:700;color:#4a148c}.batch-name{font-size:10pt;font-weight:700;color:#1a1a1a;margin-top:2px}.bh-right{display:flex;gap:12px;font-size:8pt;color:#555}.units-table{width:100%;border-collapse:collapse;font-size:8.5pt}.units-table th{background:#4a148c;color:#fff;padding:6px 8px;text-align:left;font-weight:700;font-size:7.5pt}.units-table td{padding:5px 8px;border-bottom:1px solid #eee}.units-table tbody tr:nth-child(even) td{background:#fafafa}.code{font-family:monospace;font-weight:700;color:#4a148c;font-size:8pt}.mono{font-family:monospace;font-size:8pt}.num{text-align:right;font-family:monospace}.red{color:#c62828;font-weight:700}.avail-yes{color:#2e7d32;font-weight:700;text-align:center}.avail-no{color:#c62828;font-weight:700;text-align:center}.badge-ok{background:#e8f5e9;color:#2e7d32;padding:2px 7px;border-radius:10px;font-weight:700;font-size:7.5pt}.badge-pend{background:#fff3e0;color:#e65100;padding:2px 7px;border-radius:10px;font-weight:700;font-size:7.5pt}.badge-rej{background:#ffebee;color:#c62828;padding:2px 7px;border-radius:10px;font-weight:700;font-size:7.5pt}.no-data{text-align:center;color:#999;padding:8px;font-style:italic;font-size:8pt}.sched-cell{padding:4px 0 8px 18px;background:#f8f4ff}.sched-label{font-size:7.5pt;font-weight:700;color:#4a148c;margin-bottom:5px}.sched-table{width:45%;border-collapse:collapse;font-size:7.5pt}.sched-table th{background:#7c4dff;color:#fff;padding:4px 8px}.sched-table td{padding:3px 8px;border-bottom:1px solid #ede7f6}.print-footer{margin-top:14px;padding-top:10px;border-top:1px solid #eee;text-align:center;font-size:7.5pt;color:#bbb}@media print{.batch-block{page-break-inside:avoid}.units-table thead{display:table-header-group}}</style></head><body><div class="print-header"><h1>${titleMap[tab]}</h1><div class="meta"><span>Generated: ${new Date().toLocaleString()}</span><span>Batches: ${batches.length}</span><span>Units: ${batches.reduce((s,b)=>s+(b.units?.length??0),0)}</span></div></div>${batchesHtml}<div class="print-footer">System-generated — SAMS · Confidential</div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body></html>`);
    win.document.close();
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  fmt(date: any): string {
    if (!date) return '—';
    try { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  }
 
  private get _currencyCode(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
 
  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '—';
    try { return new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v); }
    catch { return `$${v.toLocaleString()}`; }
  }
 
  formatCurrencyCompact(v: number | null | undefined): string {
    if (v == null || v === 0) return '—';
    try {
      const code = this._currencyCode;
      if (v >= 1_000_000) return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 1, notation: 'compact' }).format(v);
      if (v >= 10_000)    return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 0, notation: 'compact' }).format(v);
      return new Intl.NumberFormat('en', { style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
    } catch { return `$${v}`; }
  }
 
  statusColor(s: string | undefined): string {
    const map: Record<string, string> = {
      New: '#7c3aed', InUse: '#10b981', Available: '#06b6d4',
      Damaged: '#ef4444', UnderMaintenance: '#f59e0b',
      Returned: '#3b82f6', Expired: '#94a3b8'
    };
    return map[s ?? ''] ?? '#94a3b8';
  }
 
  assignIcon(t: number | undefined): string {
    if (t === 1) return 'person';
    if (t === 2) return 'location_city';
    if (t === 3) return 'delete_forever';
    return 'radio_button_unchecked';
  }
 
  assignLabel(t: number | undefined): string {
    if (t === 1) return 'User';
    if (t === 2) return 'Site / Branch';
    if (t === 3) return 'Disposed';
    return 'Unassigned';
  }
 
  assignTypeLabel(v: string): string {
    if (v === '0') return 'Unassigned';
    if (v === '1') return 'User-assigned';
    if (v === '3') return 'Disposed';
    return v;
  }
 
  utilizationPct(b: BatchReportSummaryDto): number {
    return b.originalQuantity ? Math.round((b.activeQuantity / b.originalQuantity) * 100) : 0;
  }
 
  isDisposed(u: BatchUnitRowDto): boolean { return u.assignTo === 3; }
 
  hasDepreciableUnits(batch: BatchReportSummaryDto): boolean {
    return batch?.units?.some(u => u.isDepreciable) ?? false;
  }
  hasDisposedUnits(batch: BatchReportSummaryDto): boolean {
    return batch?.units?.some(u => this.isDisposed(u)) ?? false;
  }
 
  getFileUrl(path: string | null | undefined): string {
    return FileUrlHelper.getFullUrl(path) || '';
  }
 
  trackByBatchId(_: number, b: BatchReportSummaryDto): number { return b.batchId; }
  trackByUnitId (_: number, u: BatchUnitRowDto): number { return u.id; }
 
  getDeprecProgress(unit: BatchUnitRowDto): number {
    if (!unit.depreciationSchedule?.length || !unit.depreciableCost) return 0;
    const net   = unit.depreciableCost - (unit.salvageValue ?? 0);
    const total = unit.depreciationSchedule.reduce((s, r) => s + r.depreciation, 0);
    return Math.min(100, net > 0 ? (total / net) * 100 : 0);
  }
  getTotalDepreciation(unit: BatchUnitRowDto): number {
    return (unit.depreciationSchedule ?? []).reduce((s, r) => s + r.depreciation, 0);
  }
getLastBookValue(unit: BatchUnitRowDto | undefined): number {
  if (!unit) return 0;
  const s = unit.depreciationSchedule ?? [];
  return s.length ? s[s.length - 1].bookValueYearEnd : (unit.depreciableCost ?? 0);
}
 
  // Batch depreciation helpers (used in depreciation mode summary card)
  getBatchDeprecProgress(batch: BatchReportSummaryDto): number {
    const rep = batch.units?.find(u => u.isDepreciable && u.depreciationSchedule?.length);
    if (!rep) return 0;
    const cnt  = batch.units?.filter(u => u.isDepreciable).length ?? 1;
    const net  = ((rep.depreciableCost ?? 0) - (rep.salvageValue ?? 0)) * cnt;
    const tot  = rep.depreciationSchedule!.reduce((s, r) => s + r.depreciation, 0) * cnt;
    return Math.min(100, net > 0 ? (tot / net) * 100 : 0);
  }
  getBatchTotalDeprec(batch: BatchReportSummaryDto): number {
    const rep = batch.units?.find(u => u.isDepreciable && u.depreciationSchedule?.length);
    if (!rep) return 0;
    const cnt = batch.units?.filter(u => u.isDepreciable).length ?? 1;
    return rep.depreciationSchedule!.reduce((s, r) => s + r.depreciation, 0) * cnt;
  }
getBatchRepUnit(batch: BatchReportSummaryDto): BatchUnitRowDto | undefined {
  // Prefer a unit that has a schedule
  const withSchedule = batch.units?.find(u => u.isDepreciable && u.depreciationSchedule?.length);
  if (withSchedule) return withSchedule;
  // Fall back to any depreciable unit (schedule may be absent for short periods)
  return batch.units?.find(u => u.isDepreciable);
}
  getBatchDepreciableCount(batch: BatchReportSummaryDto): number {
    return batch.units?.filter(u => u.isDepreciable).length ?? batch.depreciableCount;
  }
}