import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { GlobalService } from '../../../core/services/global/global.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { QrBarcodePreviewDialogComponent } from './qr-barcode-preview-dialog/qr-barcode-preview-dialog.component';
import { PrintDialogComponent } from './print-dialog/print-dialog.component';
import { AssetQrBarcodeService } from '../../../core/services/asset/asset-qr-barcode/asset-qr-barcode.service';
import { AssetQrBarcode } from '../../../core/models/interfaces/asset-manage/asset-qr-barcode.interface';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssetCategory } from '../../../core/models/interfaces/asset-category/asset-category.interface';
import { Department } from '../../../core/models/interfaces/department.interface';
import { AssetSite } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';
import { AssetStatusDto } from '../../../core/models/interfaces/asset-manage/asset-status.interface';
import { forkJoin } from 'rxjs';
import { CommonService } from '../../../core/services/common/common.service';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-asset-qr-barcode',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatChipsModule,
    MatSelectModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MatExpansionModule,
    PageHeaderComponent,
  ],
  templateUrl: './asset-qr-barcode.component.html',
  styleUrl: './asset-qr-barcode.component.scss'
})
export class AssetQrBarcodeComponent implements OnInit {
  private assetQrBarcodeService = inject(AssetQrBarcodeService);
  private commonService = inject(CommonService);
  private globalService = inject(GlobalService);
  private dialog = inject(MatDialog);

  // ─── Loading ────────────────────────────────────────────────
  isLoading = signal(true);
  isLoadingFilters = signal(false);

  // ─── Data ───────────────────────────────────────────────────
  allAssets      = signal<AssetQrBarcode[]>([]);
  filteredAssets = signal<AssetQrBarcode[]>([]);
  displayedAssets= signal<AssetQrBarcode[]>([]);

  // ─── Pagination ─────────────────────────────────────────────
  pageSize  = signal(10);
  pageIndex = signal(0);
  totalItems = computed(() => this.filteredAssets().length);

  // ─── Filters (form controls) ────────────────────────────────
  searchControl     = new FormControl('');
  categoryControl   = new FormControl<number | ''>('');
  departmentControl = new FormControl<number | ''>('');
  siteControl       = new FormControl<number | ''>('');
  statusControl     = new FormControl<number | ''>('');

  // ─── Filter option lists ────────────────────────────────────
  categories  = signal<AssetCategory[]>([]);
  departments = signal<Department[]>([]);
  sites       = signal<AssetSite[]>([]);
  statuses    = signal<AssetStatusDto[]>([]);

  // ─── Selection ──────────────────────────────────────────────
  // SelectionModel is NOT reactive on its own.
  // We mirror selection into a Signal so templates and computed()
  // re-evaluate whenever rows are selected / deselected.
  private _selection = new SelectionModel<AssetQrBarcode>(true, []);
  // Expose read-only SelectionModel for template [checked] bindings
  get selection(): SelectionModel<AssetQrBarcode> { return this._selection; }

  // Signal mirror – always in sync with _selection
  private _selectedSignal = signal<AssetQrBarcode[]>([]);

  private syncSelection(): void {
    // Writing a new array reference forces Angular signals to re-evaluate
    this._selectedSignal.set([...this._selection.selected]);
  }

  // ─── Reactive helpers (use these in templates & computed) ───
  selectedCount  = computed(() => this._selectedSignal().length);
  filteredCount  = computed(() => this.filteredAssets().length);
  totalAssets    = computed(() => this.allAssets().length);

  // ─── Stats: active-filter count ─────────────────────────────
  activeFilterCount = computed(() =>
    (this.filteredAssets().length !== this.allAssets().length ? 1 : 0)
  );

  get hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value       ||
      this.categoryControl.value     ||
      this.departmentControl.value   ||
      this.siteControl.value         ||
      this.statusControl.value
    );
  }

  displayedColumns: string[] = ['select','asset','category','location','codes','status','actions'];

  // ─── Init ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAssets();
    this.setupSearch();
    this.setupFilterListeners();
  }

  // ─── Load filter dropdowns ───────────────────────────────────
  loadFilterOptions(): void {
    this.isLoadingFilters.set(true);
    forkJoin({
      categories:  this.commonService.getCategoriesByOrg(),
      departments: this.commonService.getDepartmentsByOrg(),
      sites:       this.commonService.getSitesByOrg(),
      statuses:    this.commonService.getStatusByOrg(),
    }).subscribe({
      next: (r) => {
        this.categories.set(r.categories.data   || []);
        this.departments.set(r.departments.data || []);
        this.sites.set(r.sites.data             || []);
        this.statuses.set(r.statuses.data       || []);
        this.isLoadingFilters.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to load filter options', 'error');
        this.isLoadingFilters.set(false);
      },
    });
  }

  // ─── Load / refresh assets ───────────────────────────────────
  // KEY FIX: after fresh data arrives, call applyFilters() so any
  // currently-active search/filter values are immediately applied,
  // instead of blindly showing ALL assets.
  loadAssets(): void {
    this.isLoading.set(true);
    this.assetQrBarcodeService.getAssetQrBarcodesByOrg().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const mapped = response.data.map((a) => ({
            ...a,
            imageUrl: a.imageUrl ? FileUrlHelper.getFullUrl(a.imageUrl) : undefined,
          }));
          this.allAssets.set(mapped);

          // Re-apply active filters instead of resetting to all data
          this.applyFilters();
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to load assets', 'error');
        this.isLoading.set(false);
      },
    });
  }

  // ─── Search debounce ─────────────────────────────────────────
  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  // ─── Dropdown filter listeners ───────────────────────────────
  setupFilterListeners(): void {
    [this.categoryControl, this.departmentControl, this.siteControl, this.statusControl]
      .forEach((c) => c.valueChanges.subscribe(() => this.applyFilters()));
  }

  // ─── Core filter logic ───────────────────────────────────────
  applyFilters(): void {
    const search   = (this.searchControl.value     || '').toLowerCase().trim();
    const cat      = this.categoryControl.value;
    const dept     = this.departmentControl.value;
    const site     = this.siteControl.value;
    const status   = this.statusControl.value;

    const filtered = this.allAssets().filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search)                   ||
        a.assetId.toLowerCase().includes(search)                ||
        (a.assetBrand        || '').toLowerCase().includes(search) ||
        (a.assetSerialNo     || '').toLowerCase().includes(search) ||
        (a.categoryDisplay   || '').toLowerCase().includes(search) ||
        (a.departmentDisplay || '').toLowerCase().includes(search);

      return (
        matchSearch &&
        (!cat    || a.category   === cat)    &&
        (!dept   || a.department === dept)   &&
        (!site   || a.siteId     === site)   &&
        (!status || a.assetStatus=== status)
      );
    });

    this.filteredAssets.set(filtered);
    this.pageIndex.set(0);
    // Clear selection and sync signal when filter changes
    this._selection.clear();
    this.syncSelection();
    this.updateDisplayedAssets();
  }

  updateDisplayedAssets(): void {
    const start = this.pageIndex() * this.pageSize();
    this.displayedAssets.set(this.filteredAssets().slice(start, start + this.pageSize()));
  }

  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.updateDisplayedAssets();
  }

  clearFilters(): void {
    // Emit no-op to avoid double applyFilters trigger from each control
    this.searchControl.setValue('',     { emitEvent: false });
    this.categoryControl.setValue('',   { emitEvent: false });
    this.departmentControl.setValue('', { emitEvent: false });
    this.siteControl.setValue('',       { emitEvent: false });
    this.statusControl.setValue('',     { emitEvent: false });
    this.applyFilters(); // single call
  }

  // ─── Selection helpers ───────────────────────────────────────
  isAllPageSelected(): boolean {
    const displayed = this.displayedAssets();
    return displayed.length > 0 && displayed.every((r) => this._selection.isSelected(r));
  }

  isPageIndeterminate(): boolean {
    const displayed = this.displayedAssets();
    const selectedOnPage = displayed.filter((r) => this._selection.isSelected(r)).length;
    return selectedOnPage > 0 && selectedOnPage < displayed.length;
  }

  toggleAllPage(): void {
    if (this.isAllPageSelected()) {
      this.displayedAssets().forEach((r) => this._selection.deselect(r));
    } else {
      this.displayedAssets().forEach((r) => this._selection.select(r));
    }
    this.syncSelection();
  }

  toggleRow(row: AssetQrBarcode): void {
    this._selection.toggle(row);
    this.syncSelection();
  }

  selectAllFiltered(): void {
    this.filteredAssets().forEach((r) => this._selection.select(r));
    this.syncSelection();
  }

  clearSelection(): void {
    this._selection.clear();
    this.syncSelection();
  }

  // ─── Smart Print ─────────────────────────────────────────────
  // If rows are selected → print those rows.
  // If nothing selected  → print all filtered assets.
  openPrintDialog(type: 'qr' | 'barcode' | 'both'): void {
    const hasSelection = this.selectedCount() > 0;
    const assets = hasSelection
      ? [...this._selection.selected]
      : [...this.filteredAssets()];

    if (!assets.length) {
      this.globalService.showToastr('No assets available to print', 'error');
      return;
    }

    this.dialog.open(PrintDialogComponent, {
      data: {
        assets,
        type,
        mode: hasSelection ? 'bulk' : 'all',
      },
      panelClass: 'print-dialog-panel',
      maxWidth: '900px',
      width: '95vw',
    });
  }

  // ─── Row-level single asset print ───────────────────────────
  printSingle(asset: AssetQrBarcode, type: 'qr' | 'barcode' | 'both'): void {
    this.dialog.open(PrintDialogComponent, {
      data: { assets: [asset], type, mode: 'single' },
      panelClass: 'print-dialog-panel',
      maxWidth: '900px',
      width: '95vw',
    });
  }

  // ─── Preview ────────────────────────────────────────────────
  openPreview(asset: AssetQrBarcode, type: 'qr' | 'barcode'): void {
    this.dialog.open(QrBarcodePreviewDialogComponent, {
      data: { asset, type },
      panelClass: 'qr-preview-dialog-panel',
      maxWidth: '480px',
      width: '90vw',
    });
  }

  // ─── Status badge ────────────────────────────────────────────
  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'New':              'status-new',
      'InUse':            'status-in-use',
      'Available':        'status-available',
      'Damaged':          'status-damaged',
      'UnderMaintenance': 'status-maintenance',
      'Returned':         'status-returned',
      'Expired':          'status-expired',
    };
    return map[status] ?? 'status-default';
  }
}
