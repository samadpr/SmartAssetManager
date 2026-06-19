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
import { Department, SubDepartmentDto } from '../../../core/models/interfaces/department.interface';
import { AssetSite } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';
import { AssetStatusDto } from '../../../core/models/interfaces/asset-manage/asset-status.interface';
import { forkJoin } from 'rxjs';
import { CommonService } from '../../../core/services/common/common.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { AssetSubCategory } from '../../../core/models/interfaces/asset-category/asset-sub-category.interface';
import { AssetArea } from '../../../core/models/interfaces/sites-or-branchs/asset-area.interface';

// ── LocalStorage key ─────────────────────────────────────────
const PAGINATION_KEY = 'sams_asset_qr_barcode_pagination';

interface PaginationState { pageSize: number; pageIndex: number; }

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

  // ── UI state ─────────────────────────────────────────────────
  filtersExpanded = false;

  // ── Loading ──────────────────────────────────────────────────
  isLoading = signal(true);
  isLoadingFilters = signal(false);

  // ── Data ─────────────────────────────────────────────────────
  allAssets = signal<AssetQrBarcode[]>([]);
  filteredAssets = signal<AssetQrBarcode[]>([]);
  displayedAssets = signal<AssetQrBarcode[]>([]);

  // ── Pagination (persisted) ───────────────────────────────────
  private _saved = this._loadPagination();
  pageSize = signal(this._saved.pageSize);
  pageIndex = signal(this._saved.pageIndex);
  totalItems = computed(() => this.filteredAssets().length);

  // ── Filter controls ──────────────────────────────────────────
  searchControl = new FormControl('');
  categoryControl = new FormControl<number | ''>('');
  subCategoryControl = new FormControl<number | ''>('');
  departmentControl = new FormControl<number | ''>('');
  subDepartmentControl = new FormControl<number | ''>('');
  siteControl = new FormControl<number | ''>('');
  areaControl = new FormControl<number | ''>('');   // ← NEW
  statusControl = new FormControl<number | ''>('');

  // ── Filter option lists ───────────────────────────────────────
  categories = signal<AssetCategory[]>([]);
  subCategories = signal<AssetSubCategory[]>([]);
  departments = signal<Department[]>([]);
  subDepartments = signal<SubDepartmentDto[]>([]);
  sites = signal<AssetSite[]>([]);
  areas = signal<AssetArea[]>([]);                  // ← NEW
  statuses = signal<AssetStatusDto[]>([]);

  // ── Selection ────────────────────────────────────────────────
  private _sel = new SelectionModel<AssetQrBarcode>(true, []);
  get selection() { return this._sel; }
  private _selSig = signal<AssetQrBarcode[]>([]);
  private syncSel() { this._selSig.set([...this._sel.selected]); }

  // ── Computed ─────────────────────────────────────────────────
  selectedCount = computed(() => this._selSig().length);
  filteredCount = computed(() => this.filteredAssets().length);
  totalAssets = computed(() => this.allAssets().length);

  get hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.categoryControl.value ||
      this.subCategoryControl.value ||
      this.departmentControl.value ||
      this.subDepartmentControl.value ||
      this.siteControl.value ||
      this.areaControl.value ||   // ← NEW
      this.statusControl.value
    );
  }

  get activeAdvancedFilterCount(): number {
    return [
      this.categoryControl.value,
      this.subCategoryControl.value,
      this.departmentControl.value,
      this.subDepartmentControl.value,
      this.siteControl.value,
      this.areaControl.value,             // ← NEW
      this.statusControl.value,
    ].filter(Boolean).length;
  }

  displayedColumns = ['select', 'asset', 'category', 'location', 'codes', 'status', 'actions'];

  // ── Lifecycle ────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAssets();
    this.setupListeners();
  }

  // ── Data loading ─────────────────────────────────────────────
  loadFilterOptions(): void {
    this.isLoadingFilters.set(true);
    forkJoin({
      categories: this.commonService.getCategoriesByOrg(),
      subCategories: this.commonService.getSubCategoriesByOrg(),
      departments: this.commonService.getDepartmentsByOrg(),
      subDepartments: this.commonService.getSubDepartmentsByOrg(),
      sites: this.commonService.getSitesByOrg(),
      areas: this.commonService.getAreasByOrg(),     // ← NEW
      statuses: this.commonService.getStatusByOrg(),
    }).subscribe({
      next: r => {
        this.categories.set(r.categories.data || []);
        this.subCategories.set(r.subCategories.data || []);
        this.departments.set(r.departments.data || []);
        this.subDepartments.set(r.subDepartments.data || []);
        this.sites.set(r.sites.data || []);
        this.areas.set(r.areas.data || []); // ← NEW
        this.statuses.set(r.statuses.data || []);
        this.isLoadingFilters.set(false);
      },
      error: () => {
        this.globalService.showToastr('Failed to load filter options', 'error');
        this.isLoadingFilters.set(false);
      },
    });
  }

  loadAssets(): void {
    this.isLoading.set(true);
    this.assetQrBarcodeService.getAssetQrBarcodesByOrg().subscribe({
      next: res => {
        if (res.success && res.data) {
          const mapped = res.data.map(a => ({
            ...a,
            imageUrl: a.imageUrl ? FileUrlHelper.getFullUrl(a.imageUrl) : undefined,
          }));
          this.allAssets.set(mapped);
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

  // ── Listeners ────────────────────────────────────────────────
  setupListeners(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());

    [
      this.categoryControl,
      this.subCategoryControl,
      this.departmentControl,
      this.subDepartmentControl,
      this.siteControl,
      this.areaControl,    // ← NEW
      this.statusControl,
    ].forEach(c => c.valueChanges.subscribe(() => this.applyFilters()));
  }

  // ── Filtering ────────────────────────────────────────────────
  applyFilters(): void {
    const q = (this.searchControl.value || '').toLowerCase().trim();
    const cat = this.categoryControl.value;
    const subCat = this.subCategoryControl.value;
    const dept = this.departmentControl.value;
    const subDept = this.subDepartmentControl.value;
    const site = this.siteControl.value;
    const area = this.areaControl.value;    // ← NEW
    const status = this.statusControl.value;

    const result = this.allAssets().filter(a => {
      const matchQ = !q ||
        a.name.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        (a.assetBrand || '').toLowerCase().includes(q) ||
        (a.assetSerialNo || '').toLowerCase().includes(q) ||
        (a.categoryDisplay || '').toLowerCase().includes(q) ||
        (a.departmentDisplay || '').toLowerCase().includes(q);

      return matchQ
        && (!cat || a.category === cat)
        && (!subCat || a.subCategory === subCat)
        && (!dept || a.department === dept)
        && (!subDept || (a as any).subDepartment === subDept)
        && (!site || a.siteId === site)
        && (!area || a.areaId === area)   // ← NEW
        && (!status || a.assetStatus === status);
    });

    this.filteredAssets.set(result);
    this.pageIndex.set(0);
    this._sel.clear();
    this.syncSel();
    this._savePagination();
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex() * this.pageSize();
    this.displayedAssets.set(this.filteredAssets().slice(start, start + this.pageSize()));
  }

  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this._savePagination();
    this.updatePage();
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue('', { emitEvent: false });
    this.subCategoryControl.setValue('', { emitEvent: false });
    this.departmentControl.setValue('', { emitEvent: false });
    this.subDepartmentControl.setValue('', { emitEvent: false });
    this.siteControl.setValue('', { emitEvent: false });
    this.areaControl.setValue('', { emitEvent: false }); // ← NEW
    this.statusControl.setValue('', { emitEvent: false });
    this.filtersExpanded = false;
    this.applyFilters();
  }

  // ── Selection ────────────────────────────────────────────────
  isAllPageSelected(): boolean {
    const d = this.displayedAssets();
    return d.length > 0 && d.every(r => this._sel.isSelected(r));
  }

  isPageIndeterminate(): boolean {
    const d = this.displayedAssets();
    const n = d.filter(r => this._sel.isSelected(r)).length;
    return n > 0 && n < d.length;
  }

  toggleAllPage(): void {
    if (this.isAllPageSelected()) {
      this.displayedAssets().forEach(r => this._sel.deselect(r));
    } else {
      this.displayedAssets().forEach(r => this._sel.select(r));
    }
    this.syncSel();
  }

  toggleRow(row: AssetQrBarcode): void {
    this._sel.toggle(row);
    this.syncSel();
  }

  selectAllFiltered(): void {
    this.filteredAssets().forEach(r => this._sel.select(r));
    this.syncSel();
  }

  clearSelection(): void {
    this._sel.clear();
    this.syncSel();
  }

  // ── Print / Preview ──────────────────────────────────────────
  openPrintDialog(type: 'qr' | 'barcode' | 'both'): void {
    const hasSel = this.selectedCount() > 0;
    const assets = hasSel ? [...this._sel.selected] : [...this.filteredAssets()];
    if (!assets.length) { this.globalService.showToastr('No assets to print', 'error'); return; }
    this.dialog.open(PrintDialogComponent, {
      data: { assets, type, mode: hasSel ? 'bulk' : 'all' },
      panelClass: 'print-dialog-panel',
      maxWidth: '900px', width: '95vw',
    });
  }

  printSingle(asset: AssetQrBarcode, type: 'qr' | 'barcode' | 'both'): void {
    this.dialog.open(PrintDialogComponent, {
      data: { assets: [asset], type, mode: 'single' },
      panelClass: 'print-dialog-panel',
      maxWidth: '900px', width: '95vw',
    });
  }

  openPreview(asset: AssetQrBarcode, type: 'qr' | 'barcode'): void {
    this.dialog.open(QrBarcodePreviewDialogComponent, {
      data: { asset, type },
      panelClass: 'qr-preview-dialog-panel',
      maxWidth: '480px', width: '90vw',
    });
  }

  // ── Status badge ─────────────────────────────────────────────
  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'New': 'status-new',
      'InUse': 'status-in-use',
      'Available': 'status-available',
      'Damaged': 'status-damaged',
      'UnderMaintenance': 'status-maintenance',
      'Returned': 'status-returned',
      'Expired': 'status-expired',
    };
    return map[status] ?? 'status-default';
  }

  // ── LocalStorage helpers ─────────────────────────────────────
  private _loadPagination(): PaginationState {
    try {
      const raw = localStorage.getItem(PAGINATION_KEY);
      if (raw) {
        const p = JSON.parse(raw) as PaginationState;
        const valid = [5, 10, 25, 50, 100];
        return {
          pageSize: valid.includes(p.pageSize) ? p.pageSize : 10,
          pageIndex: Number.isInteger(p.pageIndex) && p.pageIndex >= 0 ? p.pageIndex : 0,
        };
      }
    } catch { /* ignore */ }
    return { pageSize: 10, pageIndex: 0 };
  }

  private _savePagination(): void {
    try {
      localStorage.setItem(PAGINATION_KEY,
        JSON.stringify({ pageSize: this.pageSize(), pageIndex: this.pageIndex() }));
    } catch { /* ignore */ }
  }
}
