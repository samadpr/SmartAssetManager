import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../core/services/asset/manage-assets.service';
import { SuppliersService } from '../../../core/services/supplier/suppliers.service';
import { DepartmentService } from '../../../core/services/department/department.service';
import { SubDepartmentService } from '../../../core/services/department/sub-department/sub-department.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../core/services/sites-or-branchs/areas/asset-area.service';
import { AssetBatchDeleteRequest, AssetBatchListItem, AssetDepreciation, AssetDetail, AssetDisposeRequest, AssetDropdownData, AssetRequest, AssetTransferRequest } from '../../../core/models/interfaces/asset-manage/assets.interface';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { forkJoin, Observable } from 'rxjs';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { FormsModule, Validators } from '@angular/forms';
import { AssetCategoriesService } from '../../../core/services/asset-categories/asset-categories.service';
import { AssetSubCategoriesService } from '../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { FileUrlHelper } from '../../../core/helper/get-file-url';
import { AssetIssueStatus, AssignToType, DepreciationMethod, DisposalMethod } from '../../../core/enum/asset.enums';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { AssetStatusService } from '../../../core/services/asset/asset-status/asset-status.service';
import { AssetIssue } from '../../../core/models/interfaces/asset-manage/asset-issue.interface';
import { AssetIssueService } from '../../../core/services/asset/asset-issues/asset-issue.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { CompanyStorageService, SubscriptionStorageService } from '../../../core/services/localStorage/company/company-storage.service';
import { Router } from '@angular/router';
import { AssetBulkTemplateService } from '../../../core/services/asset/asset-bulk-template/asset-bulk-template.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { AssetEditPopupComponent, AssetEditPopupData } from './add-edit-popup/asset-edit-popup/asset-edit-popup.component';
import { AssetViewPopupComponent, AssetViewPopupData } from './asset-view-popup/asset-view-popup.component';
import { AssetAddPopupComponent, AssetAddPopupData } from './add-edit-popup/asset-add-popup/asset-add-popup.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

// ─── Export libraries ────────────────────────────────────────────────────────
// Note: install via  npm install xlsx jspdf jspdf-autotable
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
 
// ─── Utility ─────────────────────────────────────────────────────────────────
export function encodeBatchId(id: number): string {
  return btoa(`sams-batch-${id}`).replace(/=/g, '');
}
 
const STORAGE_KEY_PAGE      = 'sams_assets_page_index';
const STORAGE_KEY_PAGE_SIZE = 'sams_assets_page_size';
 

@Component({
  selector: 'app-manage-assets',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, FormsModule,
    PageHeaderComponent,
    MatIconModule, MatButtonModule, MatTooltipModule, MatRippleModule,
    MatMenuModule, MatChipsModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCheckboxModule, MatDividerModule, MatPaginatorModule,
    MatSlideToggleModule,
  ],
  templateUrl: './manage-assets.component.html',
  styleUrl: './manage-assets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('250ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('bannerSlide', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' }),
        animate('300ms ease', style({ opacity: 1, maxHeight: '200px' }))
      ]),
      transition(':leave', [animate('200ms ease', style({ opacity: 0, maxHeight: '0px' }))])
    ]),
    trigger('fadeInOut', [
      transition(':enter',  [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))]),
      transition(':leave',  [animate('150ms ease', style({ opacity: 0 }))])
    ]),
    trigger('filterSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('200ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [
        animate('150ms ease', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ]),
  ]
})

export class ManageAssetsComponent implements OnInit {
  // ── Service injections ────────────────────────────────────────────────────
  private assetService              = inject(ManageAssetsService);
  private supplierService           = inject(SuppliersService);
  private departmentService         = inject(DepartmentService);
  private subDepartmentService      = inject(SubDepartmentService);
  private siteService               = inject(SitesOrBranchesService);
  private areaService               = inject(AssetAreaService);
  private assetCategoryService      = inject(AssetCategoriesService);
  private assetSubCategoriesService = inject(AssetSubCategoriesService);
  private userService               = inject(UserProfileService);
  private assetStatusService        = inject(AssetStatusService);
  private globalService             = inject(GlobalService);
  private popupService              = inject(PopupWidgetService);
  private router                    = inject(Router);
  private companyStorage            = inject(CompanyStorageService);
  private subscriptionStorage       = inject(SubscriptionStorageService);
  private bulkTemplateService       = inject(AssetBulkTemplateService);
  private matDialog                 = inject(MatDialog);
  private cdr                       = inject(ChangeDetectorRef);
 
  // ── Core state ────────────────────────────────────────────────────────────
  batches             = signal<AssetBatchListItem[]>([]);
  loading             = signal(false);
  downloadingTemplate = signal(false);
  exportingData       = signal(false);
  exportMessage       = signal('Exporting…');
  private _bannerDismissed = signal(false);
 
  // ── Filter / search state ─────────────────────────────────────────────────
  searchQuery       = signal('');
  filterStatus      = signal<string>('all');
  filterCategory    = signal<number | null>(null);
  filterSubCategory = signal<number | null>(null);
  filterSupplier    = signal<number | null>(null);
  filterSite        = signal<number | null>(null);
  filterDepartment  = signal<number | null>(null);
  filterDepreciable = signal(false);
  sortKey           = signal<'name' | 'date' | 'qty'>('date');
  viewMode          = signal<'grid' | 'list'>('list');
  filterPanelOpen   = signal(false);
 
  // ── Selection state ───────────────────────────────────────────────────────
  selectedIds = signal<Set<number>>(new Set());
 
  // ── Pagination state (persisted to localStorage) ──────────────────────────
  pageIndex = signal(0);
  pageSize  = signal(20);
 
  // ── Dropdown data ─────────────────────────────────────────────────────────
  dropdownData = signal<AssetDropdownData>({
    categories: [], allSubCategories: [], suppliers: [], sites: [],
    allAreas: [], departments: [], allSubDepartments: [],
    depreciationMethods: [], assignToOptions: [], usersList: [], assetStatus: []
  });
 
  // ── Computed: sub-categories filtered by selected category ────────────────
  filteredSubCategoryOptions = computed(() => {
    const catId = this.filterCategory();
    const all   = this.dropdownData().allSubCategories;
    return catId ? all.filter(sc => sc.categoryId === catId) : all;
  });
 
  // ── Computed: active filter count ─────────────────────────────────────────
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.searchQuery())                  n++;
    if (this.filterStatus() !== 'all')       n++;
    if (this.filterCategory())               n++;
    if (this.filterSubCategory())            n++;
    if (this.filterSupplier())               n++;
    if (this.filterSite())                   n++;
    if (this.filterDepartment())             n++;
    if (this.filterDepreciable())            n++;
    return n;
  });
 
  hasActiveFilters = computed(() => this.activeFilterCount() > 0);
 
  // ── Computed: filtered + sorted list ─────────────────────────────────────
  filteredBatches = computed<AssetBatchListItem[]>(() => {
    const q    = this.searchQuery().toLowerCase().trim();
    const st   = this.filterStatus();
    const cat  = this.filterCategory();
    const sub  = this.filterSubCategory();
    const sup  = this.filterSupplier();
    const site = this.filterSite();
    const dept = this.filterDepartment();
    const dep  = this.filterDepreciable();
    const sk   = this.sortKey();
 
    let list = this.batches();
 
    if (q) list = list.filter(b =>
      b.assetName.toLowerCase().includes(q) ||
      b.batchCode.toLowerCase().includes(q) ||
      (b.categoryDisplay ?? '').toLowerCase().includes(q) ||
      (b.subCategoryDisplay ?? '').toLowerCase().includes(q));
 
    if (st !== 'all') {
      list = list.filter(batch => {
        const statuses =
          batch.statusBreakdown?.map(s =>
            s.statusName.toLowerCase().replace(/\s/g, '')
          ) ?? [
            (batch.assetStatusDisplay ?? '')
              .toLowerCase()
              .replace(/\s/g, '')
          ];
        
        return statuses.includes(st);
      });
    }
 
    // Category filter — match by display label (batch list doesn't carry IDs directly)
    if (cat) {
      const label = this.getCategoryLabel(cat).toLowerCase();
      list = list.filter(b => (b.categoryDisplay ?? '').toLowerCase() === label);
    }
 
    if (sub) {
      const label = this.getSubCategoryLabel(sub).toLowerCase();
      list = list.filter(b => (b.subCategoryDisplay ?? '').toLowerCase() === label);
    }
 
    // Supplier, site, department — these are on AssetDetail not BatchListItem
    // We do best-effort matching from the batch list; full filtering happens server-side ideally
    // For now, keep them as UI-side signals so the chip renders; real deep filtering
    // would require enriched batch list data from backend.
 
    return [...list].sort((a, b) => {
      switch (sk) {
        case 'name': return a.assetName.localeCompare(b.assetName);
        case 'qty':  return b.activeQuantity - a.activeQuantity;
        default:     return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
    });
  });
 
  // ── Computed: paginated slice ─────────────────────────────────────────────
  pagedBatches = computed<AssetBatchListItem[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredBatches().slice(start, start + this.pageSize());
  });
 
  // ── Computed: limit / subscription ───────────────────────────────────────
  assetLimit      = computed(() => this.subscriptionStorage.getAssetLimit());
  totalUnits      = computed(() => this.batches().reduce((s, b) => s + b.activeQuantity, 0));
  remainingAssets = computed(() => {
    const lim = this.assetLimit();
    return (!lim || lim <= 0) ? Infinity : Math.max(0, lim - this.totalUnits());
  });
  isLimitReached = computed(() => {
    const lim = this.assetLimit();
    return (!!lim && lim > 0) && this.totalUnits() >= lim;
  });
  limitPercent = computed(() => {
    const lim = this.assetLimit();
    return (!lim || lim <= 0) ? 0 : Math.min(100, (this.totalUnits() / lim) * 100);
  });
  showLimitBanner = computed(() =>
    !this._bannerDismissed() && !!this.assetLimit() && this.assetLimit() > 0 &&
    (this.isLimitReached() || this.remainingAssets() <= 10));
  totalBatches = computed(() => this.batches().length);
 
  currencySymbol = computed<string>(() => {
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'USD';
      return new Intl.NumberFormat('en', { style: 'currency', currency: code })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$';
    } catch { return '$'; }
  });
 
  // ── Selection helpers ─────────────────────────────────────────────────────
  isSelected(id: number): boolean { return this.selectedIds().has(id); }
 
  toggleSelect(id: number): void {
    const s = new Set(this.selectedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedIds.set(s);
  }
 
  clearSelection(): void { this.selectedIds.set(new Set()); }
  get selectionCount(): number { return this.selectedIds().size; }
 
  // Page-level select/all
  allPageSelected = computed(() => {
    const p = this.pagedBatches();
    return p.length > 0 && p.every(b => this.selectedIds().has(b.batchId));
  });
 
  get pageSelectionCount(): number {
    return this.pagedBatches().filter(b => this.selectedIds().has(b.batchId)).length;
  }
 
  toggleSelectAll(): void {
    this.allPageSelected()
      ? this.selectedIds.update(s => {
          const n = new Set(s);
          this.pagedBatches().forEach(b => n.delete(b.batchId));
          return n;
        })
      : this.selectedIds.update(s => {
          const n = new Set(s);
          this.pagedBatches().forEach(b => n.add(b.batchId));
          return n;
        });
  }
 
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.restorePaginationFromStorage();
    this.loadDropdownData();
    this.loadBatches();
  }
 
  // ── Pagination persistence ────────────────────────────────────────────────
  private restorePaginationFromStorage(): void {
    try {
      const idx  = localStorage.getItem(STORAGE_KEY_PAGE);
      const size = localStorage.getItem(STORAGE_KEY_PAGE_SIZE);
      if (idx)  this.pageIndex.set(parseInt(idx,  10));
      if (size) this.pageSize.set(parseInt(size, 10));
    } catch { /* ignore */ }
  }
 
  private savePaginationToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_PAGE,      String(this.pageIndex()));
      localStorage.setItem(STORAGE_KEY_PAGE_SIZE, String(this.pageSize()));
    } catch { /* ignore */ }
  }
 
  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.savePaginationToStorage();
    this.cdr.markForCheck();
  }
 
  // Reset to page 0 whenever filters change
  private resetPage(): void {
    this.pageIndex.set(0);
    this.savePaginationToStorage();
  }
 
  // ── Data loading ──────────────────────────────────────────────────────────
  private loadDropdownData(): void {
    forkJoin({
      suppliers:      this.supplierService.getSuppliersByOrg(),
      departments:    this.departmentService.getMyDepartments(),
      subDepartments: this.subDepartmentService.getSubDepartments(),
      sites:          this.siteService.getMySites(),
      areas:          this.areaService.getMyAreas(),
      categories:     this.assetCategoryService.getCategoriesByOrg(),
      subCategories:  this.assetSubCategoriesService.getSubCategoriesByOrg(),
      usersList:      this.userService.getOrganizationUsers(),
      assetStatus:    this.assetStatusService.getByOrganization()
    }).subscribe({
      next: (res) => {
        this.dropdownData.update(cur => ({
          ...cur,
          suppliers:         res.suppliers.data?.map(s => ({ value: s.id!, label: s.name! })) ?? [],
          departments:       res.departments.data?.map(d => ({ value: d.id!, label: d.name! })) ?? [],
          allSubDepartments: res.subDepartments.data?.map(sd => ({ value: sd.id, label: sd.name ?? '', departmentId: sd.departmentId })) ?? [],
          sites:             res.sites.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          allAreas:          res.areas.data?.map(a => ({ value: a.id, label: a.name ?? '', siteId: a.siteId })) ?? [],
          categories:        res.categories.data?.map(c => ({ value: c.id, label: c.name })) ?? [],
          allSubCategories:  res.subCategories.data?.map(sc => ({ value: sc.id, label: sc.name ?? '', categoryId: sc.assetCategorieId })) ?? [],
          usersList:         res.usersList.data?.map(u => ({ value: u.userProfileId, label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown' })) ?? [],
          assetStatus:       res.assetStatus.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          depreciationMethods: [
            { value: DepreciationMethod.None,                     label: 'None' },
            { value: DepreciationMethod.StraightLine,             label: 'Straight Line' },
            { value: DepreciationMethod.DecliningBalance,         label: 'Declining Balance' },
            { value: DepreciationMethod.DoubleDecliningBalance,   label: 'Double Declining Balance' },
            { value: DepreciationMethod.OneFiftyDecliningBalance, label: '150% Declining Balance' },
            { value: DepreciationMethod.SumOfYearsDigits,         label: 'Sum of Years Digits' }
          ],
          assignToOptions: [
            { value: AssignToType.NotAssigned, label: 'Not Assigned' },
            { value: AssignToType.User,        label: 'User' },
            { value: AssignToType.Site,        label: 'Site' }
          ]
        }));
        this.cdr.markForCheck();
      },
      error: () => this.globalService.showToastr('Failed to load form data', 'error')
    });
  }
 
  loadBatches(): void {
    this.loading.set(true);
    this.assetService.getAssetBatchList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.batches.set(response.data.map(b => ({
            ...b,
            imageUrl: b.imageUrl ? FileUrlHelper.getFullUrl(b.imageUrl) : undefined
          })));
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalService.showToastr('Failed to load assets', 'error');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
 
  // ── Filter helpers (label lookup) ─────────────────────────────────────────
  getCategoryLabel(id: number | null): string {
    return this.dropdownData().categories.find(c => c.value === id)?.label ?? '';
  }
  getSubCategoryLabel(id: number | null): string {
    return this.dropdownData().allSubCategories.find(c => c.value === id)?.label ?? '';
  }
  getSupplierLabel(id: number | null): string {
    return this.dropdownData().suppliers.find(c => c.value === id)?.label ?? '';
  }
  getSiteLabel(id: number | null): string {
    return this.dropdownData().sites.find(c => c.value === id)?.label ?? '';
  }
  getDepartmentLabel(id: number | null): string {
    return this.dropdownData().departments.find(c => c.value === id)?.label ?? '';
  }
 
  clearAllFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('all');
    this.filterCategory.set(null);
    this.filterSubCategory.set(null);
    this.filterSupplier.set(null);
    this.filterSite.set(null);
    this.filterDepartment.set(null);
    this.filterDepreciable.set(false);
    this.resetPage();
    this.cdr.markForCheck();
  }
 
  // ── Navigation ────────────────────────────────────────────────────────────
  openBatchDetail(batch: AssetBatchListItem): void {
    this.router.navigate(['/asset-management/batch', encodeBatchId(batch.batchId)]);
  }
  goToUpgrade():    void { this.router.navigate(['/settings/subscription']); }
  goToBulkUpload(): void { this.router.navigate(['/asset-management/bulk-upload']); }
  goToApprovals():  void { this.router.navigate(['/asset-management/asset-approve']); }
  dismissLimitBanner(): void { this._bannerDismissed.set(true); }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  ADD ASSET
  // ══════════════════════════════════════════════════════════════════════════
  onAddAsset(): void {
    if (this.isLimitReached()) {
      this.popupService.openGenericConfirmation(
        'Asset Limit Reached',
        `You have reached your plan limit of ${this.assetLimit()} assets.`,
        { confirmButtonText: 'Upgrade Plan', confirmButtonIcon: 'rocket_launch', icon: 'lock', iconColor: 'warn' }
      ).subscribe(r => { if (r?.action === 'confirm') this.goToUpgrade(); });
      return;
    }
 
    const ref = this.matDialog.open(AssetAddPopupComponent, {
      data: { dropdownData: this.dropdownData() } as AssetAddPopupData,
      maxWidth: '960px', width: '95vw', maxHeight: '96vh',
      disableClose: true, panelClass: 'asset-popup-panel'
    });
 
    ref.afterClosed().subscribe(result => {
      if (result?.action === 'submit') this.handleAddAsset(result.data);
    });
  }
 
  private handleAddAsset(formData: any): void {
    const qty = formData.quantity ?? 1;
 
    const req: AssetRequest = {
      name:                formData.name,
      assetBrand:          formData.assetBrand,
      assetModelNo:        formData.assetModelNo,
      assetSerialNo:       formData.assetSerialNo,
      serialNumbers:       formData.serialNumbers,
      description:         formData.description,
      category:            formData.category,
      subCategory:         formData.subCategory,
      quantity:            qty,
      unitPrice:           formData.unitPrice,
      supplier:            formData.supplier,
      siteId:              formData.siteId,
      areaId:              formData.areaId,
      department:          formData.department,
      subDepartment:       formData.subDepartment,
      warranetyInMonth:    formData.warranetyInMonth,
      assetStatus:         formData.assetStatus,
      isDepreciable:       formData.isDepreciable ?? false,
      depreciableCost:     formData.depreciableCost,
      salvageValue:        formData.salvageValue,
      depreciationInMonth: formData.depreciationInMonth,
      depreciationMethod:  formData.depreciationMethod,
      dateAquired:         formData.dateAquired,
      dateOfPurchase:      formData.dateOfPurchase,
      dateOfManufacture:   formData.dateOfManufacture,
      yearOfValuation:     formData.yearOfValuation,
      assignTo:            formData.assignTo ?? AssignToType.NotAssigned,
      assignUserId:        formData.assignUserId,
      assignSiteId:        formData.siteId,
      assignAreaId:        formData.areaId,
      transferDate:        formData.transferDate,
      dueDate:             formData.dueDate,
      note:                formData.note,
 
      // ── Per-unit assignments ─────────────────────────────────────────────
      // Populated only when user chose "Individual Assignment" in the popup.
      // Each entry carries sequence (1-based), assignTo, assignUserId / siteId
      // / areaId.  The backend CreateAsync iterates createdAssets and matches
      // by BatchSequence == entry.Sequence.
      unitAssignments: formData.unitAssignments,
    };
 
    if (formData.ImageFile           instanceof File) req.imageFile          = formData.ImageFile;
    if (formData.DeliveryNoteFile    instanceof File) req.deliveryNoteFile    = formData.DeliveryNoteFile;
    if (formData.PurchaseReceiptFile instanceof File) req.purchaseReceiptFile = formData.PurchaseReceiptFile;
    if (formData.InvoiceFile         instanceof File) req.invoiceFile         = formData.InvoiceFile;
 
    this.loading.set(true);
    this.assetService.createAsset(req).subscribe({
      next: (res) => {
        if (res.success) {
          this.globalService.showSnackbar(
            `Batch created with ${qty} unit${qty > 1 ? 's' : ''} successfully`,
            'success'
          );
          this.loadBatches();
        } else {
          this.globalService.showToastr(res.message || 'Failed to create asset', 'error');
          this.loading.set(false);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalService.showToastr('Failed to create asset', 'error');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  EDIT BATCH
  // ══════════════════════════════════════════════════════════════════════════
  onEditBatch(batch: AssetBatchListItem, event: Event): void {
    event.stopPropagation();
    this.assetService.getAssetBatchDetail(batch.batchId).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.globalService.showToastr('Failed to load batch details', 'error');
          return;
        }
        const firstUnit = res.data.assets?.[0];
        if (!firstUnit) {
          this.globalService.showToastr('No units found in this batch', 'error');
          return;
        }
        const assetForEdit = {
          ...firstUnit,
          batchId:   res.data.batchId,
          batchCode: res.data.batchCode,
          name:      res.data.assetName,
          imageUrl:  res.data.imageUrl ? FileUrlHelper.getFullUrl(res.data.imageUrl) : firstUnit.imageUrl,
          quantity:  res.data.originalQuantity,
        };
        const ref = this.matDialog.open(AssetEditPopupComponent, {
          data: { asset: assetForEdit, dropdownData: this.dropdownData() } as AssetEditPopupData,
          maxWidth: '900px', width: '95vw', maxHeight: '96vh',
          disableClose: true, panelClass: 'asset-popup-panel'
        });
        ref.afterClosed().subscribe(result => {
          if (result?.action === 'submit') this.handleEditAsset(result.data);
        });
      },
      error: () => this.globalService.showToastr('Failed to load batch details', 'error')
    });
  }
 
  private handleEditAsset(formData: any): void {
    const req: AssetRequest = {
      id:                  formData.id,
      name:                formData.name,
      assetBrand:          formData.assetBrand,
      assetModelNo:        formData.assetModelNo,
      assetSerialNo:       formData.assetSerialNo,
      serialNumbers:       formData.serialNumbers,
      description:         formData.description,
      category:            formData.category,
      subCategory:         formData.subCategory,
      unitPrice:           formData.unitPrice,
      supplier:            formData.supplier,
      department:          formData.department,
      subDepartment:       formData.subDepartment,
      warranetyInMonth:    formData.warranetyInMonth,
      assetStatus:         formData.assetStatus,
      isDepreciable:       formData.isDepreciable ?? false,
      depreciableCost:     formData.depreciableCost,
      salvageValue:        formData.salvageValue,
      depreciationInMonth: formData.depreciationInMonth,
      depreciationMethod:  formData.depreciationMethod,
      dateAquired:         formData.dateAquired,
      dateOfPurchase:      formData.dateOfPurchase,
      dateOfManufacture:   formData.dateOfManufacture,
      yearOfValuation:     formData.yearOfValuation,
      assignTo:            AssignToType.NotAssigned,
      note:                formData.note,
      imagePath:           formData.ImagePath,
      deliveryNotePath:    formData.DeliveryNotePath,
      purchaseReceiptPath: formData.PurchaseReceiptPath,
      invoicePath:         formData.InvoicePath,
    };
    if (formData.ImageFile           instanceof File) req.imageFile          = formData.ImageFile;
    if (formData.DeliveryNoteFile    instanceof File) req.deliveryNoteFile    = formData.DeliveryNoteFile;
    if (formData.PurchaseReceiptFile instanceof File) req.purchaseReceiptFile = formData.PurchaseReceiptFile;
    if (formData.InvoiceFile         instanceof File) req.invoiceFile         = formData.InvoiceFile;
 
    this.loading.set(true);
    this.assetService.updateAsset(req).subscribe({
      next: (res) => {
        if (res.success) {
          this.globalService.showSnackbar('Batch updated successfully', 'success');
          this.loadBatches();
        } else {
          this.globalService.showToastr(res.message || 'Failed to update asset', 'error');
          this.loading.set(false);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.globalService.showToastr('Failed to update asset', 'error');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  DELETE BATCH
  // ══════════════════════════════════════════════════════════════════════════
  onDeleteBatch(batch: AssetBatchListItem, event: Event): void {
    event.stopPropagation();
    this.popupService.openDeleteConfirmation(
      `Delete batch "${batch.batchCode}"?`,
      `This will permanently soft-delete all ${batch.activeQuantity} active unit(s).`
    ).subscribe(result => {
      if (result?.action !== 'confirm') return;
      const req: AssetBatchDeleteRequest = { batchId: batch.batchId, reason: 'Deleted via Manage Assets' };
      this.loading.set(true);
      this.assetService.deleteBatch(req).subscribe({
        next: (res) => {
          if (res.success) {
            this.globalService.showSnackbar(`Batch "${batch.batchCode}" deleted`, 'success');
            this.batches.update(list => list.filter(b => b.batchId !== batch.batchId));
            this.selectedIds.update(s => { const n = new Set(s); n.delete(batch.batchId); return n; });
          } else {
            this.globalService.showToastr(res.message || 'Failed to delete batch....', 'error');
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.globalService.showToastr('Failed to delete batch', 'error');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
    });
  }
 
  onBulkDelete(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.popupService.openDeleteConfirmation(
      `Delete ${ids.length} selected batch${ids.length > 1 ? 'es' : ''}?`,
      'Batches with assigned or in-use assets cannot be deleted.'
    ).subscribe(result => {
      if (result?.action !== 'confirm') return;
      let done = 0, failed = 0;
      this.loading.set(true);
      ids.forEach(batchId => {
        this.assetService.deleteBatch({ batchId, reason: 'Bulk delete' }).subscribe({
          next: (res) => {
            if (res.success) {
              done++;
              this.batches.update(list => list.filter(b => b.batchId !== batchId));
            } else { failed++; }
            if (done + failed === ids.length) this.finishBulkDelete(done, failed);
          },
          error: () => {
            failed++;
            if (done + failed === ids.length) this.finishBulkDelete(done, failed);
          }
        });
      });
    });
  }
 
  private finishBulkDelete(done: number, failed: number): void {
    this.loading.set(false);
    this.clearSelection();
    if (failed === 0) this.globalService.showSnackbar(`${done} batch(es) deleted`, 'success');
    else this.globalService.showToastr(`${done} deleted, ${failed} failed`, 'error');
    this.cdr.markForCheck();
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  EXPORT — Excel
  // ══════════════════════════════════════════════════════════════════════════
 
  /** Build the flat row data for export */
  private buildExportRows(batches: AssetBatchListItem[]): any[] {
    return batches.map((b, i) => ({
      '#':            i + 1,
      'Batch Code':   b.batchCode,
      'Asset Name':   b.assetName,
      'Category':     b.categoryDisplay ?? '—',
      'Sub Category': b.subCategoryDisplay ?? '—',
      'Total Units':  b.originalQuantity,
      'Active Units': b.activeQuantity,
      'Status':       b.assetStatusDisplay ?? '—',
      'Created Date': this.formatDate(b.createdDate),
      'Created By':   b.createdBy ?? '—',
    }));
  }
 
  private doExportExcel(batches: AssetBatchListItem[], fileName: string): void {
    this.exportingData.set(true);
    this.exportMessage.set('Generating Excel…');
    this.cdr.markForCheck();
 
    try {
      const rows = this.buildExportRows(batches);
      const ws   = XLSX.utils.json_to_sheet(rows);
 
      // Auto-width columns
      const colWidths = Object.keys(rows[0] ?? {}).map(k => ({
        wch: Math.max(k.length, ...rows.map(r => String(r[k]).length)) + 2
      }));
      ws['!cols'] = colWidths;
 
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Assets');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      this.globalService.showSnackbar(`Exported ${batches.length} batch(es) to Excel`, 'success');
    } catch (e) {
      this.globalService.showToastr('Excel export failed', 'error');
    } finally {
      this.exportingData.set(false);
      this.cdr.markForCheck();
    }
  }
 
  exportExcel():         void { this.doExportExcel(this.filteredBatches(), `SAMS_Assets_${this.todayStr()}`); }
  exportSelectedExcel(): void {
    const sel = this.filteredBatches().filter(b => this.selectedIds().has(b.batchId));
    if (!sel.length) { this.globalService.showToastr('No items selected', 'error'); return; }
    this.doExportExcel(sel, `SAMS_Assets_Selected_${this.todayStr()}`);
  }
  exportSingleExcel(batch: AssetBatchListItem): void { this.doExportExcel([batch], `SAMS_${batch.batchCode}`); }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  EXPORT — PDF
  // ══════════════════════════════════════════════════════════════════════════
 
  private doExportPdf(batches: AssetBatchListItem[], title: string, fileName: string): void {
    this.exportingData.set(true);
    this.exportMessage.set('Generating PDF…');
    this.cdr.markForCheck();
 
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
 
      // Header bar
      doc.setFillColor(103, 58, 183);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 10, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, 240, 14);
      doc.text(`Total: ${batches.length} batch(es)`, 10, 20);
 
      // Table
      const head = [['#', 'Batch Code', 'Asset Name', 'Category', 'Sub Category', 'Total Units', 'Active Units', 'Status', 'Created Date']];
      const body = batches.map((b, i) => [
        i + 1,
        b.batchCode,
        b.assetName,
        b.categoryDisplay ?? '—',
        b.subCategoryDisplay ?? '—',
        b.originalQuantity,
        b.activeQuantity,
        b.assetStatusDisplay ?? '—',
        this.formatDate(b.createdDate),
      ]);
 
      autoTable(doc, {
        startY: 26,
        head,
        body,
        headStyles: {
          fillColor: [103, 58, 183],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: { fontSize: 8, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 28 },
          2: { cellWidth: 55 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 28 },
          8: { cellWidth: 28 },
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data: any) => {
          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount} — SAMS Asset Management`,
            148, 205, { align: 'center' }
          );
        }
      });
 
      doc.save(`${fileName}.pdf`);
      this.globalService.showSnackbar(`Exported ${batches.length} batch(es) to PDF`, 'success');
    } catch (e) {
      this.globalService.showToastr('PDF export failed', 'error');
    } finally {
      this.exportingData.set(false);
      this.cdr.markForCheck();
    }
  }
 
  exportPdf(): void {
    this.doExportPdf(
      this.filteredBatches(),
      'SAMS — Asset Batch Report',
      `SAMS_Assets_${this.todayStr()}`
    );
  }
 
  exportSelectedPdf(): void {
    const sel = this.filteredBatches().filter(b => this.selectedIds().has(b.batchId));
    if (!sel.length) { this.globalService.showToastr('No items selected', 'error'); return; }
    this.doExportPdf(sel, 'SAMS — Selected Asset Report', `SAMS_Assets_Selected_${this.todayStr()}`);
  }
 
  exportSinglePdf(batch: AssetBatchListItem): void {
    this.doExportPdf([batch], `SAMS — ${batch.assetName}`, `SAMS_${batch.batchCode}`);
  }
 
  // ── Template download ─────────────────────────────────────────────────────
  downloadTemplate(): void {
    this.downloadingTemplate.set(true);
    this.bulkTemplateService.generateAndDownload(this.dropdownData()).then(() => {
      this.downloadingTemplate.set(false);
      this.globalService.showSnackbar('Template downloaded', 'success');
      this.cdr.markForCheck();
    }).catch(() => {
      this.downloadingTemplate.set(false);
      this.globalService.showToastr('Failed to generate template', 'error');
      this.cdr.markForCheck();
    });
  }
 
  // ── Helpers ───────────────────────────────────────────────────────────────
  trackByBatchId(_: number, b: AssetBatchListItem): number { return b.batchId; }
 
  statusColor(status: string | undefined): string {
    const map: Record<string, string> = {
      new: '#7c3aed', inuse: '#10b981', available: '#06b6d4',
      damaged: '#ef4444', undermaintenance: '#f59e0b',
      returned: '#3b82f6', expired: '#94a3b8'
    };
    return map[(status ?? '').toLowerCase().replace(/\s/g, '')] ?? '#94a3b8';
  }
 
  utilizationPct(b: AssetBatchListItem): number {
    return b.originalQuantity ? Math.round((b.activeQuantity / b.originalQuantity) * 100) : 0;
  }
 
  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
 
  private todayStr(): string {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}
