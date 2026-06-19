import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef, AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { Chart, registerables } from 'chart.js';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '../../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../../core/services/asset/manage-assets.service';
import { AssetIssueService } from '../../../../core/services/asset/asset-issues/asset-issue.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { CompanyStorageService, SubscriptionStorageService } from '../../../../core/services/localStorage/company/company-storage.service';
import { SuppliersService } from '../../../../core/services/supplier/suppliers.service';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';
import { AssetAreaService } from '../../../../core/services/sites-or-branchs/areas/asset-area.service';
import { SubDepartmentService } from '../../../../core/services/department/sub-department/sub-department.service';
import { SitesOrBranchesService } from '../../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetSubCategoriesService } from '../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { UserProfileService } from '../../../../core/services/users/user-profile.service';
import { DepartmentService } from '../../../../core/services/department/department.service';
import { AssetCategoriesService } from '../../../../core/services/asset-categories/asset-categories.service';
import { AssetStatusService } from '../../../../core/services/asset/asset-status/asset-status.service';
import { AssetBatchDetail, AssetBatchQuantityUpdateRequest, AssetDetail, AssetDisposeRequest, AssetDropdownData, AssetTransferRequest, AssetUnitStatusUpdateRequest } from '../../../../core/models/interfaces/asset-manage/assets.interface';
import { AssetIssueStatus, AssignToType, DepreciationMethod, DisposalMethod } from '../../../../core/enum/asset.enums';
import { FileUrlHelper } from '../../../../core/helper/get-file-url';
import { AssetIssue } from '../../../../core/models/interfaces/asset-manage/asset-issue.interface';
import { PopupField, PopupFormConfig } from '../../../../core/models/interfaces/popup-widget.interface';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { QrBarcodePreviewDialogComponent } from '../../asset-qr-barcode/qr-barcode-preview-dialog/qr-barcode-preview-dialog.component';
import { PrintDialogComponent } from '../../asset-qr-barcode/print-dialog/print-dialog.component';

Chart.register(...registerables);
 
function decodeBatchHash(hash: string): number | null {
  try {
    const padded = hash + '='.repeat((4 - hash.length % 4) % 4);
    const decoded = atob(padded);
    const match = decoded.match(/^sams-batch-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  } catch { return null; }
}
 
const UNITS_PAGE_SIZE = 10;
 
@Component({
  selector: 'app-asset-batch-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    PageHeaderComponent, ScrollingModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatChipsModule,
    MatMenuModule, MatCheckboxModule,
    MatDividerModule, MatProgressBarModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatPaginatorModule
  ],
  templateUrl: './asset-batch-detail.component.html',
  styleUrl: './asset-batch-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class AssetBatchDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  // ── Injections ────────────────────────────────────────────────────────────
  private route              = inject(ActivatedRoute);
  private router             = inject(Router);
  private assetService       = inject(ManageAssetsService);
  private issueService       = inject(AssetIssueService);
  private globalService      = inject(GlobalService);
  private popupService       = inject(PopupWidgetService);
  private companyStorage     = inject(CompanyStorageService);
  private subscriptionStorage = inject(SubscriptionStorageService);
  private siteSvc            = inject(SitesOrBranchesService);
  private areaSvc            = inject(AssetAreaService);
  private userSvc            = inject(UserProfileService);
  private assetStatusSvc     = inject(AssetStatusService);
  private snack              = inject(MatSnackBar);
  private cdr                = inject(ChangeDetectorRef);
  private platformId         = inject(PLATFORM_ID);
  private matDialog          = inject(MatDialog);
 
  // ── Chart canvas refs ─────────────────────────────────────────────────────
  @ViewChild('lineCanvas')     lineCanvas!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')      barCanvas!:      ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;
 
  private charts: Chart[]        = [];
  private chartsInitialized      = false;
  private previousTab            = -1;
 
  // ── Core state ────────────────────────────────────────────────────────────
  loading       = signal(true);
  actionLoading = signal(false);
  batch         = signal<AssetBatchDetail | null>(null);
  batchId       = signal<number | null>(null);
 
  // ── Tab ───────────────────────────────────────────────────────────────────
  activeTab = signal(0);
 
  // ── Unit selection ────────────────────────────────────────────────────────
  selectedUnitIds = signal<Set<number>>(new Set());
 
  // ── Status update state ───────────────────────────────────────────────────
  /** Status being edited for a single unit inline */
  editingStatusUnitId = signal<number | null>(null);
  /** Bulk status selection value */
  bulkStatusValue     = signal<number | null>(null);
  /** Loading for status update */
  statusUpdateLoading = signal(false);
 
  // ── Unit search / filter controls ────────────────────────────────────────
  unitSearch       = new FormControl('');
  unitAssignFilter = new FormControl<string>('all');
  unitUserFilter   = new FormControl<number | null>(null);
  unitSiteFilter   = new FormControl<number | null>(null);
  unitAreaFilter   = new FormControl<number | null>(null);
 
  filterExpanded = signal(false);
 
  // ── Unit pagination ───────────────────────────────────────────────────────
  unitPageIndex = signal(0);
  unitPageSize  = signal(UNITS_PAGE_SIZE);
 
  // ── Add / remove units ────────────────────────────────────────────────────
  showAddUnitsPanel = signal(false);
  newSerials        = signal('');
  removeReason      = signal('');
 
  // ── Dropdown data ─────────────────────────────────────────────────────────
  dropdownData = signal<AssetDropdownData>({
    categories: [], allSubCategories: [], suppliers: [], sites: [],
    allAreas: [], departments: [], allSubDepartments: [],
    depreciationMethods: [], assignToOptions: [], usersList: [], assetStatus: []
  });
 
  private destroy$ = new Subject<void>();
 
  // ── Enums to template ─────────────────────────────────────────────────────
  AssignToType       = AssignToType;
  DisposalMethod     = DisposalMethod;
  DepreciationMethod = DepreciationMethod;
 
  // ── Subscription / limit ─────────────────────────────────────────────────
  assetLimit      = computed(() => this.subscriptionStorage.getAssetLimit());
  totalOrgUnits   = signal<number>(0); // loaded from batch detail context
  isLimitReached  = computed(() => {
    const lim = this.assetLimit();
    return (!!lim && lim > 0) && this.totalOrgUnits() >= lim;
  });
  remainingSlots  = computed(() => {
    const lim = this.assetLimit();
    if (!lim || lim <= 0) return Infinity;
    return Math.max(0, lim - this.totalOrgUnits());
  });
 
  // ── Computed: all units ───────────────────────────────────────────────────
  units = computed<AssetDetail[]>(() => this.batch()?.assets ?? []);
 
  assignedUnits   = computed(() => this.units().filter(u => u.assignTo !== AssignToType.NotAssigned && u.assignTo !== AssignToType.Disposed));
  unassignedUnits = computed(() => this.units().filter(u => u.assignTo === AssignToType.NotAssigned));
  disposedUnits   = computed(() => this.units().filter(u => u.assignTo === AssignToType.Disposed));
  userAssigned    = computed(() => this.units().filter(u => u.assignTo === AssignToType.User));
  siteAssigned    = computed(() => this.units().filter(u => u.assignTo === AssignToType.Site));
 
  depreciableUnits = computed(() =>
    this.units().filter(u => u.isDepreciable && u.depreciationSchedule && u.depreciationSchedule.length > 0)
  );
  depreciableFlaggedUnits = computed(() => this.units().filter(u => u.isDepreciable));
 
  totalValue           = computed(() => this.units().reduce((s, u) => s + (Number(u.unitPrice) || 0), 0));
  totalDepreciableCost = computed(() => this.depreciableFlaggedUnits().reduce((s, u) => s + (Number(u.depreciableCost) || 0), 0));
 
  selectedCount    = computed(() => this.selectedUnitIds().size);
  allUnitsSelected = computed(() => {
    const u = this.pagedUnits();
    return u.length > 0 && u.every(x => this.selectedUnitIds().has(x.id));
  });
 
  // ── Unique filter options ──────────────────────────────────────────────────
  uniqueUsers = computed(() => {
    const map = new Map<number, string>();
    this.units().forEach(u => { if (u.assignUserId && u.assignUserDisplay) map.set(u.assignUserId, u.assignUserDisplay); });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  });
 
  uniqueSites = computed(() => {
    const map = new Map<number, string>();
    this.units().forEach(u => { if (u.siteId && u.siteDisplay) map.set(u.siteId, u.siteDisplay); });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  });
 
  uniqueAreas = computed(() => {
    const map = new Map<number, string>();
    this.units().forEach(u => { if (u.areaId && u.areaDisplay) map.set(u.areaId, u.areaDisplay); });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  });
 
  // ── Filtered / paged units ────────────────────────────────────────────────
  filteredUnits = computed<AssetDetail[]>(() => {
    const q      = this.searchValue().toLowerCase().trim();
    const assign = this.assignValue();
    const userId = this.userValue();
    const siteId = this.siteValue();
    const areaId = this.areaValue();
 
    return this.units().filter(u => {
      if (q) {
        const match =
          u.assetId.toLowerCase().includes(q) ||
          (u.assetSerialNo ?? '').toLowerCase().includes(q) ||
          (u.assignUserDisplay ?? '').toLowerCase().includes(q) ||
          (u.siteDisplay ?? '').toLowerCase().includes(q) ||
          (u.areaDisplay ?? '').toLowerCase().includes(q) ||
          (u.assetStatusDisplay ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (assign === 'user'     && u.assignTo !== AssignToType.User)        return false;
      if (assign === 'site'     && u.assignTo !== AssignToType.Site)        return false;
      if (assign === 'none'     && u.assignTo !== AssignToType.NotAssigned) return false;
      if (assign === 'disposed' && u.assignTo !== AssignToType.Disposed)    return false;
      if (userId && u.assignUserId !== userId) return false;
      if (siteId && u.siteId      !== siteId)  return false;
      if (areaId && u.areaId      !== areaId)  return false;
      return true;
    });
  });
 
  pagedUnits = computed<AssetDetail[]>(() => {
    const start = this.unitPageIndex() * this.unitPageSize();
    return this.filteredUnits().slice(start, start + this.unitPageSize());
  });
 
  filteredUnitCount = computed(() => this.filteredUnits().length);
 
  hasUnitFilters = computed(() =>
    !!(this.unitSearch.value?.trim() ||
      (this.unitAssignFilter.value && this.unitAssignFilter.value !== 'all') ||
      this.unitUserFilter.value || this.unitSiteFilter.value || this.unitAreaFilter.value)
  );
 
  parsedSerialCount = computed(() =>
    this.newSerials().split(',').map(s => s.trim()).filter(Boolean).length
  );
 
  // ── Depreciation signals ──────────────────────────────────────────────────
  readonly perUnitSchedule = computed(() => {
    const units = this.depreciableUnits();
    if (!units.length) return [];
    return units[0].depreciationSchedule ?? [];
  });
 
  readonly depSchedule = computed(() => {
    const unitCount = this.depreciableUnits().length;
    if (!unitCount) return [];
    return this.perUnitSchedule().map(row => ({
      year:                  row.year,
      bookValueYearBegining: row.bookValueYearBegining * unitCount,
      depreciation:          row.depreciation          * unitCount,
      bookValueYearEnd:      row.bookValueYearEnd       * unitCount
    }));
  });
 
  totalDeprec   = computed(() => this.depSchedule().reduce((s, r) => s + (r.depreciation ?? 0), 0));
  lastBookValue = computed(() => { const s = this.depSchedule(); return s.length ? s[s.length - 1].bookValueYearEnd : 0; });
 
  depProgress = computed(() => {
    const units = this.depreciableUnits();
    if (!units.length) return 0;
    const totalCost = Number(units[0].depreciableCost || 0) * units.length;
    if (!totalCost) return 0;
    return Math.min(100, (this.totalDeprec() / totalCost) * 100);
  });
 
  depMethodLabel = computed(() => {
    switch (this.depreciableFlaggedUnits()[0]?.depreciationMethod) {
      case DepreciationMethod.StraightLine:             return 'Straight Line';
      case DepreciationMethod.DecliningBalance:         return 'Declining Balance';
      case DepreciationMethod.DoubleDecliningBalance:   return 'Double Declining Balance';
      case DepreciationMethod.OneFiftyDecliningBalance: return '150% Declining Balance';
      case DepreciationMethod.SumOfYearsDigits:         return 'Sum of Years Digits';
      default: return '—';
    }
  });
 
  hasDepreciableButNoSchedule = computed(() =>
    this.depreciableFlaggedUnits().length > 0 && this.depreciableUnits().length === 0
  );
 
  // Reactive signal mirrors for filter controls
  searchValue = signal('');
  assignValue = signal('all');
  userValue   = signal<number | null>(null);
  siteValue   = signal<number | null>(null);
  areaValue   = signal<number | null>(null);
 
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const hash = this.route.snapshot.paramMap.get('hash') ?? '';
    const id   = decodeBatchHash(hash);
    if (!id) {
      this.globalService.showToastr('Invalid asset link', 'error');
      this.router.navigate(['/asset-management']);
      return;
    }
    this.batchId.set(id);
    this.loadDropdownData();
    this.loadBatchDetail(id);
 
    this.unitSearch.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => { this.searchValue.set(value ?? ''); this.unitPageIndex.set(0); this.cdr.markForCheck(); });
 
    this.unitAssignFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(value => { this.assignValue.set(value ?? 'all'); this.unitPageIndex.set(0); this.cdr.markForCheck(); });
 
    this.unitUserFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(value => { this.userValue.set(value); this.unitPageIndex.set(0); this.cdr.markForCheck(); });
 
    this.unitSiteFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(value => { this.siteValue.set(value); this.unitPageIndex.set(0); this.cdr.markForCheck(); });
 
    this.unitAreaFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(value => { this.areaValue.set(value); this.unitPageIndex.set(0); this.cdr.markForCheck(); });
  }
 
  ngAfterViewChecked(): void {
    if (this.previousTab === 2 && this.activeTab() !== 2) {
      this.chartsInitialized = false;
      this.destroyCharts();
    }
    this.previousTab = this.activeTab();
 
    if (
      this.activeTab() === 2 &&
      !this.chartsInitialized &&
      this.depSchedule().length > 0 &&
      isPlatformBrowser(this.platformId) &&
      this.lineCanvas?.nativeElement &&
      this.barCanvas?.nativeElement &&
      this.doughnutCanvas?.nativeElement
    ) {
      setTimeout(() => {
        this.initCharts();
        this.chartsInitialized = true;
        this.cdr.markForCheck();
      }, 60);
    }
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }
 
  // ── Data loading ──────────────────────────────────────────────────────────
  private loadDropdownData(): void {
    forkJoin({
      sites:  this.siteSvc.getMySites(),
      areas:  this.areaSvc.getMyAreas(),
      users:  this.userSvc.getOrganizationUsers(),
      status: this.assetStatusSvc.getByOrganization()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.dropdownData.update(d => ({
          ...d,
          sites:    r.sites.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          allAreas: r.areas.data?.map(a => ({ value: a.id, label: a.name ?? '', siteId: a.siteId })) ?? [],
          usersList: r.users.data?.map(u => ({ value: u.userProfileId, label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() })) ?? [],
          assetStatus: r.status.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          assignToOptions: [
            { value: AssignToType.NotAssigned, label: 'Not Assigned' },
            { value: AssignToType.User,  label: 'User' },
            { value: AssignToType.Site,  label: 'Site' }
          ]
        }));
        this.cdr.markForCheck();
      }
    });
  }
 
  loadBatchDetail(id: number): void {
    this.loading.set(true);
    this.chartsInitialized = false;
    this.destroyCharts();
 
    this.assetService.getAssetBatchDetail(id).pipe(
      takeUntil(this.destroy$),
      finalize(() => { this.loading.set(false); this.cdr.markForCheck(); })
    ).subscribe({
      next: res => {
        if (res.success && res.data) {
          const mapped: AssetBatchDetail = {
            ...res.data,
            imageUrl: res.data.imageUrl ? FileUrlHelper.getFullUrl(res.data.imageUrl) : undefined,
            assets: (res.data.assets ?? []).map(a => ({
              ...a,
              imageUrl:        a.imageUrl        ? FileUrlHelper.getFullUrl(a.imageUrl)        : undefined,
              deliveryNote:    a.deliveryNote    ? FileUrlHelper.getFullUrl(a.deliveryNote)    : undefined,
              purchaseReceipt: a.purchaseReceipt ? FileUrlHelper.getFullUrl(a.purchaseReceipt) : undefined,
              invoice:         a.invoice         ? FileUrlHelper.getFullUrl(a.invoice)         : undefined,
              qrcodeImage:     a.qrcodeImage     ? this.ensureBase64Prefix(a.qrcodeImage)      : undefined,
              barcode:         a.barcode         ? this.ensureBase64Prefix(a.barcode)          : undefined
            }))
          };
          this.batch.set(mapped);
          // Compute total org units for limit check using batch active count
          // (approximate: sum of all active units this org has)
          this.loadOrgUnitCount();
        }
      },
      error: () => this.snack.open('Failed to load batch details', 'Dismiss', { duration: 4000 })
    });
  }
 
  /** Load org-level active unit count for subscription limit check */
  private loadOrgUnitCount(): void {
    this.assetService.getAssetBatchList().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        if (res.success && res.data) {
          const total = res.data.reduce((s, b) => s + b.activeQuantity, 0);
          this.totalOrgUnits.set(total);
          this.cdr.markForCheck();
        }
      }
    });
  }
 
  private ensureBase64Prefix(val: string): string {
    if (!val) return val;
    if (val.startsWith('data:')) return val;
    if (val.startsWith('http'))  return val;
    return `data:image/png;base64,${val}`;
  }
 
  refresh(): void {
    const id = this.batchId();
    if (id) { this.clearUnitFilters(); this.loadBatchDetail(id); }
  }
 
  // ── Unit selection ────────────────────────────────────────────────────────
  isUnitSelected(id: number): boolean { return this.selectedUnitIds().has(id); }
 
  toggleUnit(id: number): void {
    const s = new Set(this.selectedUnitIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedUnitIds.set(s);
  }
 
  toggleAllUnits(): void {
    this.allUnitsSelected()
      ? this.selectedUnitIds.set(new Set())
      : this.selectedUnitIds.set(new Set(this.pagedUnits().map(u => u.id)));
  }
 
  clearSelection(): void { this.selectedUnitIds.set(new Set()); }
 
  clearUnitFilters(): void {
    this.unitSearch.setValue('', { emitEvent: false });
    this.unitAssignFilter.setValue('all', { emitEvent: false });
    this.unitUserFilter.setValue(null, { emitEvent: false });
    this.unitSiteFilter.setValue(null, { emitEvent: false });
    this.unitAreaFilter.setValue(null, { emitEvent: false });
    this.unitPageIndex.set(0);
    this.cdr.markForCheck();
  }
 
  onUnitPageChange(e: PageEvent): void {
    this.unitPageIndex.set(e.pageIndex);
    this.unitPageSize.set(e.pageSize);
    this.cdr.markForCheck();
  }
 
  // ── Tab ───────────────────────────────────────────────────────────────────
  onTabChange(i: number): void {
    if (i === 2 && this.activeTab() !== 2) {
      this.chartsInitialized = false;
      this.destroyCharts();
      this.activeTab.set(i);
      this.cdr.detectChanges();
      return;
    }
    this.activeTab.set(i);
    this.cdr.markForCheck();
  }
 
  // ── STATUS UPDATE ─────────────────────────────────────────────────────────
 
  /** Start inline edit for a single unit */
  startStatusEdit(unitId: number): void {
    this.editingStatusUnitId.set(unitId);
    this.cdr.markForCheck();
  }
 
  /** Cancel inline status edit */
  cancelStatusEdit(): void {
    this.editingStatusUnitId.set(null);
    this.cdr.markForCheck();
  }
 
  /** Save status for a single unit */
  saveUnitStatus(unit: AssetDetail, newStatusId: number | null): void {
    if (!newStatusId) return;
    this.updateStatuses([unit.id], newStatusId, () => {
      this.editingStatusUnitId.set(null);
    });
  }
 
  /** Apply bulk status to all selected units */
  applyBulkStatus(): void {
    const statusId = this.bulkStatusValue();
    if (!statusId) {
      this.snack.open('Please select a status first', 'Dismiss', { duration: 3000 });
      return;
    }
    const ids = [...this.selectedUnitIds()];
    if (!ids.length) {
      this.snack.open('No units selected', 'Dismiss', { duration: 3000 });
      return;
    }
    this.updateStatuses(ids, statusId, () => {
      this.bulkStatusValue.set(null);
      this.clearSelection();
    });
  }
 
  /** Core status update — calls backend and refreshes batch */
  private updateStatuses(
    assetIds: number[],
    newStatusId: number,
    onSuccess?: () => void
  ): void {
    this.statusUpdateLoading.set(true);
    const req: AssetUnitStatusUpdateRequest = { assetIds, newStatusId };
 
    this.assetService.updateUnitStatus(req).pipe(
      finalize(() => { this.statusUpdateLoading.set(false); this.cdr.markForCheck(); })
    ).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open(
            `Status updated for ${assetIds.length} unit(s)`,
            'Dismiss', { duration: 3000 }
          );
          onSuccess?.();
          // Refresh batch data to reflect new status display
          const id = this.batchId();
          if (id) this.loadBatchDetail(id);
        } else {
          this.snack.open(res.message ?? 'Failed to update status', 'Dismiss', { duration: 4000 });
        }
      },
      error: () => this.snack.open('Failed to update status', 'Dismiss', { duration: 4000 })
    });
  }
 
  /** Get status color by status display name — same map as statusColor() */
  getStatusColor(statusName: string | undefined): string {
    return this.statusColor(statusName);
  }
 
  // ── ADD UNITS (with limit guard) ──────────────────────────────────────────
  tryOpenAddUnitsPanel(): void {
    if (this.isLimitReached()) {
      // Show limit reached state — panel stays closed
      this.snack.open(
        `Asset limit of ${this.assetLimit()} reached. Upgrade your plan to add more units.`,
        'Dismiss',
        { duration: 6000 }
      );
      return;
    }
    this.showAddUnitsPanel.set(!this.showAddUnitsPanel());
  }
 
  // ── Print QR/Barcodes ─────────────────────────────────────────────────────
  openBatchPrintDialog(type: 'qr' | 'barcode' | 'both'): void {
    const selected = this.selectedUnitIds().size > 0
      ? this.units().filter(u => this.selectedUnitIds().has(u.id))
      : this.units();
 
    if (!selected.length) {
      this.snack.open('No units available to print', 'Dismiss', { duration: 3000 });
      return;
    }
 
    const assets = selected.map(u => ({
      id:                 u.id,
      assetId:            u.assetId,
      name:               u.name,
      assetBrand:         u.assetBrand,
      assetModelNo:       u.assetModelNo,
      assetSerialNo:      u.assetSerialNo,
      categoryDisplay:    u.categoryDisplay,
      subCategoryDisplay: u.subCategoryDisplay,
      departmentDisplay:  u.departmentDisplay,
      siteDisplay:        u.siteDisplay,
      areaDisplay:        u.areaDisplay,
      qrcodeImage:        u.qrcodeImage,
      barcode:            u.barcode,
      imageUrl:           u.imageUrl,
      assetStatusDisplay: u.assetStatusDisplay,
      quantity:           u.quantity
    } as any));
 
    this.matDialog.open(PrintDialogComponent, {
      data: { assets, type, mode: this.selectedUnitIds().size > 0 ? 'bulk' : 'all' },
      panelClass: 'print-dialog-panel',
      maxWidth: '900px', width: '95vw'
    });
  }
 
  // ── Actions ───────────────────────────────────────────────────────────────
  openTransfer(unit?: AssetDetail): void {
    const targets = unit
      ? [unit]
      : this.units().filter(u => this.selectedUnitIds().has(u.id) && u.isAvilable);
    if (!targets.length) { this.snack.open('No available units selected', 'Dismiss', { duration: 3000 }); return; }
 
    const config: PopupFormConfig = {
      title: `Transfer ${targets.length > 1 ? targets.length + ' Units' : 'Asset Unit'}`,
      subtitle: targets.length > 1 ? `Transferring ${targets.length} selected units`
        : `Unit: ${targets[0].assetId} — ${targets[0].assetSerialNo ?? ''}`,
      icon: 'swap_horiz', columns: 2, maxWidth: '860px',
      submitButtonText: 'Complete Transfer', cancelButtonText: 'Cancel',
      showCloseButton: true, fields: this.getTransferFields()
    };
 
    this.popupService.openFormPopup(config).subscribe(result => {
      if (result?.action !== 'submit') return;
      const data = result.data;
      this.actionLoading.set(true);
      let completed = 0, failed = 0;
 
      targets.forEach(u => {
        const req: AssetTransferRequest = {
          assetId: u.id, transferDate: data.transferDate, dueDate: data.dueDate,
          assignTo: data.assignTo, assignUserId: data.assignUserId,
          siteId: data.siteId, areaId: data.areaId, note: data.note
        };
        this.assetService.transferAsset(req).pipe(
          finalize(() => {
            if (completed + failed === targets.length)
              this.handleBulkComplete(completed, failed, 'Transfer');
          })
        ).subscribe({
          next: () => { completed++; },
          error: () => { failed++; this.actionLoading.set(false); this.cdr.markForCheck(); }
        });
      });
    });
  }
 
  openDispose(unit?: AssetDetail): void {
    const targets = unit
      ? [unit]
      : this.units().filter(u => this.selectedUnitIds().has(u.id) && u.isAvilable);
    if (!targets.length) { this.snack.open('No available units selected', 'Dismiss', { duration: 3000 }); return; }
 
    const config: PopupFormConfig = {
      title: `Dispose ${targets.length > 1 ? targets.length + ' Units' : 'Asset Unit'}`,
      subtitle: 'This action is irreversible.',
      icon: 'delete_forever', columns: 2, maxWidth: '780px',
      submitButtonText: 'Confirm Disposal', cancelButtonText: 'Cancel',
      showCloseButton: true, fields: this.getDisposeFields()
    };
 
    this.popupService.openFormPopup(config).subscribe(result => {
      if (result?.action !== 'submit') return;
      const data = result.data;
      this.actionLoading.set(true);
      let completed = 0, failed = 0;
 
      targets.forEach(u => {
        const req: AssetDisposeRequest = {
          assetId: u.id, disposalDate: data.disposalDate,
          disposalMethod: data.disposalMethod,
          disposalDocument: data.DisposalDocumentFile instanceof File ? data.DisposalDocumentFile : undefined,
          comment: data.comment
        };
        this.assetService.disposeAsset(req).pipe(
          finalize(() => {
            if (completed + failed === targets.length)
              this.handleBulkComplete(completed, failed, 'Disposal');
          })
        ).subscribe({
          next: () => { completed++; },
          error: () => { failed++; this.actionLoading.set(false); this.cdr.markForCheck(); }
        });
      });
    });
  }
 
  openIssue(unit: AssetDetail): void {
    const config: PopupFormConfig = {
      title: 'Report Issue', subtitle: `Asset: ${unit.name} — ${unit.assetId}`,
      icon: 'bug_report', columns: 2, maxWidth: '820px',
      submitButtonText: 'Submit Issue', cancelButtonText: 'Cancel',
      showCloseButton: true, fields: this.getIssueFields()
    };
 
    this.popupService.openFormPopup(config).subscribe(result => {
      if (result?.action !== 'submit') return;
      const data = result.data;
      const req: AssetIssue = {
        assetId: unit.id, issueTitle: data.issueTitle,
        issueDescription: data.issueDescription, status: data.status ?? AssetIssueStatus.New,
        expectedFixDate: data.expectedFixDate, repairCost: data.repairCost, comment: data.comment
      };
      if (data.InvoiceFile instanceof File) req.invoiceFile = data.InvoiceFile;
      this.issueService.create(req).subscribe({
        next: () => this.snack.open('Issue reported', 'Dismiss', { duration: 3000 }),
        error: () => this.snack.open('Failed to report issue', 'Dismiss', { duration: 4000 })
      });
    });
  }
 
  openQrPreview(unit: AssetDetail, type: 'qr' | 'barcode'): void {
    const assetForPreview = {
      ...unit,
      categoryDisplay:    (unit as any).categoryDisplay    ?? '',
      subCategoryDisplay: (unit as any).subCategoryDisplay ?? '',
      siteDisplay:        unit.siteDisplay  ?? '',
      areaDisplay:        unit.areaDisplay  ?? ''
    };
 
    this.matDialog.open(QrBarcodePreviewDialogComponent, {
      data: { asset: assetForPreview, type },
      panelClass: 'qr-preview-dialog-panel',
      maxWidth: '480px', width: '90vw'
    });
  }
 
  addUnits(): void {
    if (this.isLimitReached()) {
      this.snack.open(
        `Asset limit of ${this.assetLimit()} reached. Please upgrade your plan.`,
        'Dismiss', { duration: 6000 }
      );
      return;
    }
 
    const serials = this.newSerials().split(',').map(s => s.trim()).filter(Boolean);
    if (!serials.length) { this.snack.open('Enter at least one serial number', 'Dismiss', { duration: 3000 }); return; }
 
    const req: AssetBatchQuantityUpdateRequest = { batchId: this.batchId()!, addSerialNumbers: serials };
    this.actionLoading.set(true);
    this.assetService.updateBatchQuantity(req).pipe(
      finalize(() => { this.actionLoading.set(false); this.cdr.markForCheck(); })
    ).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open(`Added ${serials.length} unit(s)`, 'Dismiss', { duration: 3000 });
          this.newSerials.set(''); this.showAddUnitsPanel.set(false); this.refresh();
        } else {
          this.snack.open(res.message ?? 'Failed', 'Dismiss', { duration: 4000 });
        }
      },
      error: () => this.snack.open('Failed to add units', 'Dismiss', { duration: 4000 })
    });
  }
 
  removeSelectedUnits(): void {
    const ids = [...this.selectedUnitIds()];
    if (!ids.length) return;
    this.popupService.openDeleteConfirmation(
      `Remove ${ids.length} unit(s) from this batch?`,
      'Units will be soft-deleted and removed from active count.'
    ).subscribe(r => {
      if (r?.action !== 'confirm') return;
      const req: AssetBatchQuantityUpdateRequest = {
        batchId: this.batchId()!,
        removeAssetIds: ids,
        removalReason: this.removeReason() || 'Removed via batch management'
      };
      this.actionLoading.set(true);
      this.assetService.updateBatchQuantity(req).pipe(
        finalize(() => { this.actionLoading.set(false); this.cdr.markForCheck(); })
      ).subscribe({
        next: res => {
          if (res.success) {
            this.snack.open(`Removed ${ids.length} unit(s)`, 'Dismiss', { duration: 3000 });
            this.clearSelection(); this.refresh();
          }
        },
        error: () => this.snack.open('Failed to remove units', 'Dismiss', { duration: 4000 })
      });
    });
  }
 
  private handleBulkComplete(completed: number, failed: number, action: string): void {
    this.actionLoading.set(false);
    const msg = failed === 0
      ? `${action} completed for ${completed} unit(s)`
      : `${completed} succeeded, ${failed} failed`;
    this.snack.open(msg, 'Dismiss', { duration: 3500 });
    this.clearSelection(); this.refresh(); this.cdr.markForCheck();
  }
 
  // ── Popup field builders ──────────────────────────────────────────────────
  private getTransferFields(): PopupField[] {
    const d = this.dropdownData();
    return [
      { key: 'd1', label: 'Transfer Details', type: 'divider', colSpan: 4 },
      { key: 'transferDate', label: 'Transfer Date', type: 'date', required: true, colSpan: 2, icon: 'event', value: new Date() },
      { key: 'dueDate', label: 'Due Date', type: 'date', colSpan: 2, icon: 'event' },
      { key: 'assignTo', label: 'Assign To', type: 'select', required: true, colSpan: 2, icon: 'assignment_ind', options: d.assignToOptions },
      { key: 'assignUserId', label: 'Employee', type: 'select', colSpan: 2, icon: 'person', options: d.usersList, showIf: { field: 'assignTo', value: AssignToType.User } },
      { key: 'siteId', label: 'Site', type: 'select', colSpan: 2, icon: 'location_city', options: d.sites, showIf: { field: 'assignTo', value: AssignToType.Site } },
      { key: 'areaId', label: 'Area', type: 'select', colSpan: 2, icon: 'map', options: d.allAreas, cascadeFrom: 'siteId', cascadeProperty: 'siteId', showIf: { field: 'assignTo', value: AssignToType.Site } },
      { key: 'note', label: 'Note', type: 'textarea', colSpan: 4, rows: 2, icon: 'description' }
    ];
  }
 
  private getDisposeFields(): PopupField[] {
    return [
      { key: 'd1', label: 'Disposal Details', type: 'divider', colSpan: 4 },
      { key: 'disposalDate', label: 'Disposal Date', type: 'date', required: true, colSpan: 2, icon: 'event', value: new Date() },
      {
        key: 'disposalMethod', label: 'Disposal Method', type: 'select', required: true, colSpan: 2, icon: 'build',
        options: [
          { value: DisposalMethod.Sold, label: 'Sold' },
          { value: DisposalMethod.Donated, label: 'Donated' },
          { value: DisposalMethod.Recycled, label: 'Recycled' },
          { value: DisposalMethod.Destroyed, label: 'Destroyed' },
          { value: DisposalMethod.Other, label: 'Other' }
        ]
      },
      { key: 'disposalDocument', label: 'Disposal Document', type: 'file', colSpan: 4, icon: 'attach_file', acceptedFileTypes: '.pdf,.jpg,.png', maxFileSize: 10 },
      { key: 'comment', label: 'Comment', type: 'textarea', colSpan: 4, rows: 3, icon: 'description', placeholder: 'Reason for disposal' }
    ];
  }
 
  private getIssueFields(): PopupField[] {
    return [
      { key: 'd1', label: 'Issue Details', type: 'divider', colSpan: 4 },
      { key: 'issueTitle', label: 'Issue Title', type: 'text', required: true, colSpan: 4, icon: 'title', validators: [Validators.minLength(2), Validators.maxLength(100)] },
      { key: 'issueDescription', label: 'Description', type: 'textarea', required: true, colSpan: 4, rows: 4, icon: 'description' },
      {
        key: 'status', label: 'Status', type: 'select', colSpan: 2, icon: 'flag', value: AssetIssueStatus.New,
        options: [
          { value: AssetIssueStatus.New, label: 'New' },
          { value: AssetIssueStatus.InProgress, label: 'In Progress' },
          { value: AssetIssueStatus.Blocker, label: 'Blocker' },
          { value: AssetIssueStatus.Pending, label: 'Pending' }
        ]
      },
      { key: 'expectedFixDate', label: 'Expected Fix Date', type: 'date', colSpan: 2, icon: 'event' },
      { key: 'repairCost', label: 'Estimated Repair Cost', type: 'number', colSpan: 2, icon: 'attach_money', min: 0 },
      { key: 'invoice', label: 'Attach Document', type: 'file', colSpan: 4, icon: 'attach_file', acceptedFileTypes: '.pdf,.jpg,.jpeg,.png', maxFileSize: 10 }
    ];
  }
 
  // ── Charts ─────────────────────────────────────────────────────────────────
  private initCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const sched = this.depSchedule();
    if (!sched.length) return;
 
    this.destroyCharts();
 
    const labels = sched.map(r => `Y${r.year}`);
    const root   = document.documentElement;
    const getVar = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
    const resolveColor = (v: string, alpha = 1): string => {
      const raw = getVar(v);
      if (!raw) return `rgba(103,80,164,${alpha})`;
      if (/^\d/.test(raw)) return `rgba(${raw},${alpha})`;
      return alpha < 1 ? `color-mix(in srgb, ${raw} ${Math.round(alpha * 100)}%, transparent)` : raw;
    };
 
    const primary   = resolveColor('--mat-sys-primary');
    const error     = resolveColor('--mat-sys-error');
    const tertiary  = resolveColor('--mat-sys-tertiary');
    const gridCol   = resolveColor('--mat-sys-outline-variant', .4);
    const textCol   = resolveColor('--mat-sys-on-surface', .75);
    const p20       = resolveColor('--mat-sys-primary', .2);
    const t20       = resolveColor('--mat-sys-tertiary', .15);
    const currSym   = this.currencySymbol();
    const fmt       = (v: number) => `${currSym}${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
 
    const baseScales = {
      x: { grid: { display: false }, ticks: { color: textCol, font: { size: 10 }, maxRotation: 45 } },
      y: { beginAtZero: false, grid: { color: gridCol }, ticks: { color: textCol, font: { size: 10 }, callback: (v: any) => fmt(Number(v)) } }
    };
    const tooltipCallbacks = { label: (ctx: any) => ` ${this.formatCurrency(ctx.parsed?.y ?? ctx.parsed ?? 0)}` };
 
    const lineEl = this.lineCanvas?.nativeElement;
    if (lineEl) {
      const ctx = lineEl.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'Opening Value', data: sched.map(r => Number(r.bookValueYearBegining)), borderColor: primary, backgroundColor: p20, fill: true, tension: .4, borderWidth: 2.5, pointBackgroundColor: primary, pointRadius: 4, pointHoverRadius: 7 },
              { label: 'Closing Value',  data: sched.map(r => Number(r.bookValueYearEnd)),     borderColor: tertiary, backgroundColor: t20, fill: true, tension: .4, borderWidth: 2.5, pointBackgroundColor: tertiary, pointRadius: 4, pointHoverRadius: 7 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: textCol, font: { size: 11 }, boxWidth: 12 } }, tooltip: { callbacks: tooltipCallbacks } }, scales: { ...baseScales, y: { ...baseScales.y, beginAtZero: false } } }
        }));
      }
    }
 
    const barEl = this.barCanvas?.nativeElement;
    if (barEl) {
      const ctx = barEl.getContext('2d');
      if (ctx) {
        const n = sched.length;
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Annual Depreciation', data: sched.map(r => Number(r.depreciation)), backgroundColor: sched.map((_, i) => resolveColor('--mat-sys-error', 0.35 + (i / Math.max(n - 1, 1)) * 0.55)), borderColor: error, borderWidth: 1.5, borderRadius: 5 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: tooltipCallbacks } }, scales: { ...baseScales, y: { ...baseScales.y, beginAtZero: true } } }
        }));
      }
    }
 
    const doughEl = this.doughnutCanvas?.nativeElement;
    if (doughEl) {
      const ctx = doughEl.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart<'doughnut'>(ctx, {
          type: 'doughnut',
          data: { labels: ['Total Depreciated', 'Remaining Value'], datasets: [{ data: [Number(this.totalDeprec()), Number(this.lastBookValue())], backgroundColor: [error, tertiary], borderColor: 'transparent', borderWidth: 0, hoverOffset: 10 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: textCol, font: { size: 11 }, padding: 14, boxWidth: 12 } }, tooltip: { callbacks: { label: (ctx) => ` ${this.formatCurrency(Number(ctx.parsed))}` } } } }
        }));
      }
    }
  }
 
  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }
 
  // ── Format helpers ────────────────────────────────────────────────────────
  currencySymbol = computed<string>(() => {
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'INR';
      return new Intl.NumberFormat('en', { style: 'currency', currency: code })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '₹';
    } catch { return '₹'; }
  });
 
  formatCurrency(v: number | null | undefined): string {
    if (v == null) return '—';
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'INR';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(v);
    } catch { return `₹${(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }
  }
 
  formatDate(v: string | Date | null | undefined): string {
    if (!v) return '—';
    try {
      const d = new Date(v);
      return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  }
 
  assignLabel(t: number | AssignToType | undefined): string {
    switch (t) {
      case AssignToType.User:     return 'User';
      case AssignToType.Site:     return 'Site / Branch';
      case AssignToType.Disposed: return 'Disposed';
      default: return 'Unassigned';
    }
  }
 
  assignIcon(t: number | AssignToType | undefined): string {
    switch (t) {
      case AssignToType.User:     return 'person';
      case AssignToType.Site:     return 'location_city';
      case AssignToType.Disposed: return 'delete_forever';
      default: return 'radio_button_unchecked';
    }
  }
 
  statusColor(s: string | undefined): string {
    const map: Record<string, string> = {
      new: '#7c3aed', inuse: '#10b981', available: '#06b6d4',
      damaged: '#ef4444', undermaintenance: '#f59e0b',
      returned: '#3b82f6', expired: '#94a3b8'
    };
    return map[(s ?? '').toLowerCase().replace(/[\s_]/g, '')] ?? '#94a3b8';
  }
 
  utilizationPct(b: AssetBatchDetail | null): number {
    if (!b || !b.originalQuantity) return 0;
    return Math.round((b.activeQuantity / b.originalQuantity) * 100);
  }
 
  depreciationPercent(row: any): number {
    const units = this.depreciableUnits();
    if (!units.length) return 0;
    const totalCost = Number(units[0].depreciableCost || 0) * units.length;
    if (!totalCost) return 0;
    return parseFloat(((Number(row.depreciation) / totalCost) * 100).toFixed(1));
  }
 
  isDisposed(unit: AssetDetail): boolean { return unit.assignTo === AssignToType.Disposed; }
 
  openFile(url: string | undefined): void { if (url) window.open(url, '_blank'); }
 
  goBack(): void { this.router.navigate(['/asset-management']); }
 
  trackById(_: number, u: AssetDetail): number { return u.id; }
}
