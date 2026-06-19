import {
  Component, computed, OnInit, OnDestroy, signal,
  ViewChild, AfterViewInit, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';

// RxJS
import { Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import {
  AssetTransferHistoryDto, AssetTransferLegDto,
  BatchTransferSummaryDto, OrganisationTransferSummaryDto,
  TransferUserDto, TransferSiteDto, FilterChip
} from '../../../core/models/interfaces/asset-report/asset-transfer-report.interface';

import { AssetTransferReportService } from '../../../core/services/asset-report/asset-transfer-report/asset-transfer-report.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { environment } from '../../../../environments/environment.development';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Dialogs
import { AssetTransferDetailDialogComponent } from './asset-transfer-detail-dialog/asset-transfer-detail-dialog.component';
import { UserDetailDialogComponent, SiteDetailDialogComponent } from './user-site-dialog/UserAndSiteDetailDialogs.component';

// ── Local-storage helpers ─────────────────────────────────────────────────────
const LS_PAGE_SIZE_TIMELINE = 'sams_tr_timeline_page_size';
const LS_PAGE_SIZE_TABLE = 'sams_tr_table_page_size';
const LS_VIEW_MODE = 'sams_tr_view_mode';

function lsGet(key: string, fallback: any): any {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: any): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

@Component({
  selector: 'app-asset-transfer-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, PageHeaderComponent,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonToggleModule, MatCheckboxModule, MatMenuModule,
    MatDatepickerModule, MatNativeDateModule, MatBadgeModule,
    MatDividerModule, MatExpansionModule, MatRippleModule,
  ],
  templateUrl: './asset-transfer-report.component.html',
  styleUrl: './asset-transfer-report.component.scss'
})
export class AssetTransferReportComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Paginator refs ────────────────────────────────────────────────────────
  @ViewChild('timelinePaginator') timelinePaginator!: MatPaginator;
  @ViewChild('tablePaginator') tablePaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);

  // ── Core state ────────────────────────────────────────────────────────────
  loading = signal(false);
  allAssets = signal<AssetTransferHistoryDto[]>([]);
  summary = signal<OrganisationTransferSummaryDto | null>(null);
  selectedAssets = signal<AssetTransferHistoryDto[]>([]);
  filterPanelOpen = signal(false);

  // ── View mode (persisted) ─────────────────────────────────────────────────
  viewMode = new FormControl<'timeline' | 'table' | 'batch'>(lsGet(LS_VIEW_MODE, 'batch'));

  // ── Batch grouping ────────────────────────────────────────────────────────
  // Key = batchCode or 'NO_BATCH' for assets without a batch
  batchGroups = signal<Map<string, BatchTransferSummaryDto>>(new Map());

  // ── Leg expansion ─────────────────────────────────────────────────────────
  expandedLegs = signal<Record<number, boolean>>({});
  expandedBatches = signal<Record<string, boolean>>({});
  readonly LEGS_PREVIEW = 4;

  // ── Private filter signals ────────────────────────────────────────────────
  private _search = signal('');
  private _status = signal('');
  private _category = signal('');
  private _department = signal('');
  private _holderType = signal('');
  private _minTransfers = signal<number | null>(null);
  private _sortBy = signal('lastTransferDate');
  private _startDate = signal<Date | null>(null);
  private _endDate = signal<Date | null>(null);
  private _approvalStatus = signal('');

  // ── Form controls ─────────────────────────────────────────────────────────
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  categoryFilter = new FormControl('');
  departmentFilter = new FormControl('');
  holderTypeFilter = new FormControl('');
  minTransfersFilter = new FormControl<number | null>(null);
  sortControl = new FormControl('lastTransferDate');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  approvalStatusFilter = new FormControl('');

  // ── Timeline pagination (persisted) ───────────────────────────────────────
  timelinePageIndex = signal(0);
  timelinePageSize = signal<number>(lsGet(LS_PAGE_SIZE_TIMELINE, 10));

  // ── Table data source ─────────────────────────────────────────────────────
  tableDataSource = new MatTableDataSource<AssetTransferHistoryDto>([]);
  tableColumns = [
    'select', 'assetId', 'assetName', 'category',
    'totalTransfers', 'currentHolder', 'status', 'lastTransferDate', 'actions'
  ];

  // ── Computed dropdowns ────────────────────────────────────────────────────
  categories = computed(() => {
    const s = new Set(this.allAssets().map(a => a.categoryDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  departments = computed(() => {
    const s = new Set(this.allAssets().map(a => a.departmentDisplay).filter((d): d is string => !!d));
    return [...s].sort();
  });

  // ── Main filter computed ──────────────────────────────────────────────────
  filteredAssets = computed<AssetTransferHistoryDto[]>(() => {
    let data = [...this.allAssets()];

    const search = this._search().toLowerCase().trim();
    const status = this._status();
    const category = this._category();
    const dept = this._department();
    const holderType = this._holderType();
    const minT = this._minTransfers();
    const sortBy = this._sortBy();
    const startDate = this._startDate();
    const endDate = this._endDate();
    const appStatus = this._approvalStatus();

    if (search) {
      data = data.filter(a =>
        a.assetId?.toLowerCase().includes(search) ||
        a.assetName?.toLowerCase().includes(search) ||
        a.assetBrand?.toLowerCase().includes(search) ||
        a.assetSerialNo?.toLowerCase().includes(search) ||
        a.assetModelNo?.toLowerCase().includes(search) ||
        a.categoryDisplay?.toLowerCase().includes(search) ||
        a.batchCode?.toLowerCase().includes(search) ||
        a.departmentDisplay?.toLowerCase().includes(search) ||
        a.transferChain?.some(leg =>
          leg.holderUser?.fullName?.toLowerCase().includes(search) ||
          leg.holderUser?.email?.toLowerCase().includes(search) ||
          leg.holderSite?.siteName?.toLowerCase().includes(search) ||
          leg.transferredByUser?.fullName?.toLowerCase().includes(search)
        )
      );
    }

    if (status === 'active') data = data.filter(a => !a.isDisposed && !a.isCancelled);
    if (status === 'disposed') data = data.filter(a => a.isDisposed);
    if (status === 'cancelled') data = data.filter(a => a.isCancelled);

    if (category) data = data.filter(a => a.categoryDisplay === category);
    if (dept) data = data.filter(a => a.departmentDisplay === dept);

    if (holderType === 'user') data = data.filter(a => !!a.currentHolder?.holderUser);
    if (holderType === 'site') data = data.filter(a => !!a.currentHolder?.holderSite);
    if (holderType === 'none') data = data.filter(a => !a.currentHolder);
    if (holderType === 'disposed') data = data.filter(a => a.isDisposed);

    if (minT !== null && minT !== undefined)
      data = data.filter(a => (a.totalTransfers || 0) >= Number(minT));

    if (startDate) {
      const sd = new Date(startDate); sd.setHours(0, 0, 0, 0);
      data = data.filter(a => a.lastTransferDate && new Date(a.lastTransferDate) >= sd);
    }
    if (endDate) {
      const ed = new Date(endDate); ed.setHours(23, 59, 59, 999);
      data = data.filter(a => a.lastTransferDate && new Date(a.lastTransferDate) <= ed);
    }

    if (appStatus) {
      const n = Number(appStatus);
      data = data.filter(a => a.transferChain?.some(leg => leg.approvalStatus === n));
    }

    // Sort
    data = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'assetName': return (a.assetName || '').localeCompare(b.assetName || '');
        case 'totalTransfers': return (b.totalTransfers || 0) - (a.totalTransfers || 0);
        case 'firstAssignedDate': return new Date(a.firstAssignedDate || 0).getTime() - new Date(b.firstAssignedDate || 0).getTime();
        default: // lastTransferDate
          return new Date(b.lastTransferDate || 0).getTime() - new Date(a.lastTransferDate || 0).getTime();
      }
    });

    return data;
  });

  // ── Filtered batch groups ─────────────────────────────────────────────────
  filteredBatchGroups = computed<BatchTransferSummaryDto[]>(() => {
    const filtered = this.filteredAssets();
    const map = new Map<string, BatchTransferSummaryDto>();

    filtered.forEach(asset => {
      const key = asset.batchCode || `UNIT_${asset.assetRowId}`;
      if (!map.has(key)) {
        // Find from batchGroups signal for metadata
        const existing = this.batchGroups().get(key);
        map.set(
          key,
          existing
            ? {
              ...existing,

              // IMPORTANT
              units: [],

              totalTransferLegs: 0,
              activeUnits: 0,
              disposedUnits: 0,
              pendingApprovalUnits: 0,

              originalQuantity: 0,
              activeQuantity: 0
            }
            : {
              batchId: asset.batchId ?? 0,
              batchCode: asset.batchCode ?? asset.assetId,
              assetName: asset.assetName ?? '—',
              categoryDisplay: asset.categoryDisplay,
              subCategoryDisplay: asset.subCategoryDisplay,
              imageUrl: asset.imageUrl,
              originalQuantity: 0,
              activeQuantity: 0,
              totalTransferLegs: 0,
              activeUnits: 0,
              disposedUnits: 0,
              pendingApprovalUnits: 0,
              units: [],
              _expanded: this.isBatchExpanded(key),
              _loadingUnits: false
            }
        );
      }
      const grp = map.get(key)!;
      if (!grp.units.some(u => u.assetRowId === asset.assetRowId)) {
        grp.units.push(asset);
      }
      grp.totalTransferLegs += asset.totalTransfers || 0;
      if (!asset.isDisposed && !asset.isCancelled) grp.activeUnits++;
      if (asset.isDisposed) grp.disposedUnits++;
      grp.pendingApprovalUnits += asset.transferChain?.filter(l => l.approvalStatus === 1).length || 0;
      grp.originalQuantity = grp.units.length;
      grp.activeQuantity = grp.activeUnits;
    });

    return [...map.values()];
  });

  // ── Timeline pagination ────────────────────────────────────────────────────
  paginatedAssets = computed(() => {
    const start = this.timelinePageIndex() * this.timelinePageSize();
    return this.filteredAssets().slice(start, start + this.timelinePageSize());
  });

  paginatedBatchGroups = computed(() => {
    const start = this.timelinePageIndex() * this.timelinePageSize();
    return this.filteredBatchGroups().slice(start, start + this.timelinePageSize());
  });

  // ── Filter chips ──────────────────────────────────────────────────────────
  activeFilterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this._search()) chips.push({ key: 'search', label: `"${this._search()}"` });
    if (this._status()) chips.push({ key: 'status', label: `Status: ${this._status()}` });
    if (this._category()) chips.push({ key: 'category', label: `Cat: ${this._category()}` });
    if (this._department()) chips.push({ key: 'dept', label: `Dept: ${this._department()}` });
    if (this._holderType()) chips.push({ key: 'holder', label: `Holder: ${this._holderType()}` });
    if (this._minTransfers() !== null) chips.push({ key: 'minT', label: `Min Trans: ${this._minTransfers()}` });
    if (this._startDate()) chips.push({ key: 'from', label: `From: ${this.formatDate(this._startDate())}` });
    if (this._endDate()) chips.push({ key: 'to', label: `To: ${this.formatDate(this._endDate())}` });
    if (this._approvalStatus()) {
      const l: Record<string, string> = { '1': 'Pending', '2': 'Approved', '3': 'Rejected' };
      chips.push({ key: 'app', label: `Approval: ${l[this._approvalStatus()] || this._approvalStatus()}` });
    }
    return chips;
  });

  hasActiveFilters = computed(() => this.activeFilterChips().length > 0);
  activeFilterCount = computed(() => this.activeFilterChips().length);
  allSelected = computed(() => {
    const fa = this.filteredAssets();
    return fa.length > 0 && this.selectedAssets().length === fa.length;
  });
  someSelected = computed(() => this.selectedAssets().length > 0 && !this.allSelected());

  constructor(
    private transferReportService: AssetTransferReportService,
    private globalService: GlobalService,
    private userProfileService: UserProfileService,
    private sitesService: SitesOrBranchesService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.setupListeners();

    // Persist view mode changes
    this.viewMode.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v) lsSet(LS_VIEW_MODE, v);
    });
  }

  ngAfterViewInit(): void {
    if (this.tablePaginator) {
      this.tableDataSource.paginator = this.tablePaginator;
      // Restore persisted page size
      this.tablePaginator.pageSize = lsGet(LS_PAGE_SIZE_TABLE, 25);
    }
    if (this.sort) this.tableDataSource.sort = this.sort;
    this.cdr.detectChanges();

    // Persist table page size
    if (this.tablePaginator) {
      this.tablePaginator.page.pipe(takeUntil(this.destroy$)).subscribe(e => {
        lsSet(LS_PAGE_SIZE_TABLE, e.pageSize);
      });
    }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Load ──────────────────────────────────────────────────────────────────
  loadData(): void {
    this.loading.set(true);

    this.transferReportService.getOrganisationSummary()
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => { if (res.success && res.data) this.summary.set(res.data); },
        error: () => { }
      });

    this.transferReportService.getOrganisationReport()
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          if (res.success && res.data) {
            const assets = res.data.assets || [];
            this.allAssets.set(assets);
            this.tableDataSource.data = assets;

            // Build batch groups map
            const map = new Map<string, BatchTransferSummaryDto>();
            assets.forEach(asset => {
              const key = asset.batchCode || `UNIT_${asset.assetRowId}`;
              if (!map.has(key)) {
                map.set(key, {
                  batchId: asset.batchId ?? 0,
                  batchCode: asset.batchCode ?? asset.assetId,
                  assetName: asset.assetName ?? '—',
                  categoryDisplay: asset.categoryDisplay,
                  subCategoryDisplay: asset.subCategoryDisplay,
                  imageUrl: asset.imageUrl,
                  originalQuantity: 0,
                  activeQuantity: 0,
                  totalTransferLegs: 0,
                  activeUnits: 0,
                  disposedUnits: 0,
                  pendingApprovalUnits: 0,
                  units: [],
                  _expanded: false,
                  _loadingUnits: false,
                });
              }
              const grp = map.get(key)!;
              grp.units.push(asset);
              grp.totalTransferLegs += asset.totalTransfers || 0;
              if (!asset.isDisposed && !asset.isCancelled) grp.activeUnits++;
              if (asset.isDisposed) grp.disposedUnits++;
              grp.pendingApprovalUnits += asset.transferChain?.filter(l => l.approvalStatus === 1).length || 0;
              grp.originalQuantity = grp.units.length;
              grp.activeQuantity = grp.activeUnits;
            });
            this.batchGroups.set(map);

            setTimeout(() => {
              if (this.tablePaginator) {
                this.tableDataSource.paginator = this.tablePaginator;
                this.tablePaginator.pageSize = lsGet(LS_PAGE_SIZE_TABLE, 25);
              }
              if (this.sort) this.tableDataSource.sort = this.sort;
              this.cdr.detectChanges();
            });
          }
          this.loading.set(false);
        },
        error: err => {
          console.error(err);
          this.globalService.showToastr('Failed to load transfer report', 'error');
          this.loading.set(false);
        }
      });
  }

  // ── Listeners ─────────────────────────────────────────────────────────────
  setupListeners(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('search', v || ''));

    const immediateControls: [FormControl, string][] = [
      [this.statusFilter, 'status'],
      [this.categoryFilter, 'category'],
      [this.departmentFilter, 'department'],
      [this.holderTypeFilter, 'holderType'],
      [this.minTransfersFilter, 'minTransfers'],
      [this.sortControl, 'sortBy'],
      [this.startDateControl, 'startDate'],
      [this.endDateControl, 'endDate'],
      [this.approvalStatusFilter, 'approvalStatus'],
    ];
    immediateControls.forEach(([ctrl, key]) =>
      ctrl.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(v => this.applyFilter(key, v ?? (key === 'sortBy' ? 'lastTransferDate' : '')))
    );
  }

  private applyFilter(key: string, value: any): void {
    switch (key) {
      case 'search': this._search.set(value); break;
      case 'status': this._status.set(value); break;
      case 'category': this._category.set(value); break;
      case 'department': this._department.set(value); break;
      case 'holderType': this._holderType.set(value); break;
      case 'minTransfers': this._minTransfers.set(value); break;
      case 'sortBy': this._sortBy.set(value); break;
      case 'startDate': this._startDate.set(value); break;
      case 'endDate': this._endDate.set(value); break;
      case 'approvalStatus': this._approvalStatus.set(value); break;
    }
    this.timelinePageIndex.set(0);
    this.tableDataSource.data = this.filteredAssets();
    if (this.tablePaginator) this.tablePaginator.firstPage();
  }

  // ── Filter panel ──────────────────────────────────────────────────────────
  toggleFilterPanel(): void { this.filterPanelOpen.update(v => !v); }

  removeChip(key: string): void {
    const resetMap: Record<string, () => void> = {
      search: () => this.searchControl.setValue(''),
      status: () => this.statusFilter.setValue(''),
      category: () => this.categoryFilter.setValue(''),
      dept: () => this.departmentFilter.setValue(''),
      holder: () => this.holderTypeFilter.setValue(''),
      minT: () => this.minTransfersFilter.setValue(null),
      from: () => this.startDateControl.setValue(null),
      to: () => this.endDateControl.setValue(null),
      app: () => this.approvalStatusFilter.setValue(''),
    };
    resetMap[key]?.();
  }

  clearFilters(): void {
    [this.searchControl, this.statusFilter, this.categoryFilter, this.departmentFilter,
    this.holderTypeFilter, this.approvalStatusFilter].forEach(c => c.setValue('', { emitEvent: false }));
    [this.minTransfersFilter, this.startDateControl, this.endDateControl].forEach(c => c.setValue(null, { emitEvent: false }));
    this._search.set(''); this._status.set(''); this._category.set('');
    this._department.set(''); this._holderType.set(''); this._minTransfers.set(null);
    this._startDate.set(null); this._endDate.set(null); this._approvalStatus.set('');
    this._sortBy.set('lastTransferDate');
    this.timelinePageIndex.set(0);
    this.tableDataSource.data = this.filteredAssets();
    if (this.tablePaginator) this.tablePaginator.firstPage();
  }

  // ── Timeline pagination ────────────────────────────────────────────────────
  onTimelinePage(event: PageEvent): void {
    this.timelinePageIndex.set(event.pageIndex);
    this.timelinePageSize.set(event.pageSize);
    lsSet(LS_PAGE_SIZE_TIMELINE, event.pageSize);
  }

  // ── Batch expand ──────────────────────────────────────────────────────────
  isBatchExpanded(batchCode: string): boolean { return !!this.expandedBatches()[batchCode]; }

  toggleBatch(batchCode: string): void {
    this.expandedBatches.update(prev => ({ ...prev, [batchCode]: !prev[batchCode] }));
  }

  // ── Leg expand ────────────────────────────────────────────────────────────
  isLegsExpanded(id: number): boolean { return !!this.expandedLegs()[id]; }

  toggleLegs(id: number): void {
    this.expandedLegs.update(prev => ({ ...prev, [id]: !prev[id] }));
  }

  getVisibleLegs(asset: AssetTransferHistoryDto): AssetTransferLegDto[] {
    const chain = asset.transferChain || [];
    return this.isLegsExpanded(asset.assetRowId) ? chain : chain.slice(0, this.LEGS_PREVIEW);
  }

  hasMoreLegs(asset: AssetTransferHistoryDto): boolean {
    return (asset.transferChain?.length || 0) > this.LEGS_PREVIEW;
  }

  hiddenLegsCount(asset: AssetTransferHistoryDto): number {
    return Math.max(0, (asset.transferChain?.length || 0) - this.LEGS_PREVIEW);
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  trackByAsset(_: number, a: AssetTransferHistoryDto): number { return a.assetRowId; }
  trackByBatch(_: number, b: BatchTransferSummaryDto): string { return b.batchCode; }

  toggleSelect(asset: AssetTransferHistoryDto): void {
    const cur = this.selectedAssets();
    const i = cur.findIndex(a => a.assetRowId === asset.assetRowId);
    this.selectedAssets.set(i >= 0 ? cur.filter(a => a.assetRowId !== asset.assetRowId) : [...cur, asset]);
  }

  toggleSelectAll(event: any): void {
    this.selectedAssets.set(event.checked ? [...this.filteredAssets()] : []);
  }

  isSelected(asset: AssetTransferHistoryDto): boolean {
    return this.selectedAssets().some(a => a.assetRowId === asset.assetRowId);
  }

  clearSelection(): void { this.selectedAssets.set([]); }

  // ── Dialogs ────────────────────────────────────────────────────────────────
  private _dialogPending = false;

  openAssetDetail(asset: AssetTransferHistoryDto): void {
    if (this._dialogPending) return;
    this._dialogPending = true;

    this.transferReportService.getByAssetRowId(asset.assetRowId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this._dialogPending = false;
          this.dialog.open(AssetTransferDetailDialogComponent, {
            width: '1120px', maxWidth: '97vw', maxHeight: '96vh',
            data: { asset: (res.success && res.data) ? res.data : asset },
            panelClass: 'transfer-detail-dialog'
          });
        },
        error: () => {
          this._dialogPending = false;
          this.dialog.open(AssetTransferDetailDialogComponent, {
            width: '1120px', maxWidth: '97vw', maxHeight: '96vh',
            data: { asset }, panelClass: 'transfer-detail-dialog'
          });
        }
      });
  }

  openUserDetail(event: Event, user: TransferUserDto): void {
    event.stopPropagation();
    if (!user.userProfileId) return;
    this.userProfileService.getUserById(user.userProfileId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => this.dialog.open(UserDetailDialogComponent, {
          width: '500px', maxWidth: '95vw',
          data: { user: (res.success && res.data) ? res.data : user }
        }),
        error: () => this.dialog.open(UserDetailDialogComponent, {
          width: '500px', maxWidth: '95vw', data: { user }
        })
      });
  }

  openSiteDetail(event: Event, site: TransferSiteDto): void {
    event.stopPropagation();
    if (!site.siteId) return;
    this.sitesService.getSiteOrBranchById(site.siteId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => this.dialog.open(SiteDetailDialogComponent, {
          width: '500px', maxWidth: '95vw',
          data: { site: (res.success && res.data) ? res.data : site }
        }),
        error: () => this.dialog.open(SiteDetailDialogComponent, {
          width: '500px', maxWidth: '95vw', data: { site }
        })
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getImageUrl(path: string | null | undefined): string {
    if (!path || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${environment.assetBaseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  holdDaysTotal(asset: AssetTransferHistoryDto): number {
    return (asset.transferChain || []).reduce((s, l) => s + (l.holdDays || 0), 0);
  }

  getBatchStatusBadge(batch: BatchTransferSummaryDto): string {
    if (batch.disposedUnits === batch.originalQuantity) return 'All Disposed';
    if (batch.disposedUnits > 0) return `${batch.disposedUnits} Disposed`;
    if (batch.activeUnits === batch.originalQuantity) return 'All Active';
    return `${batch.activeUnits} Active`;
  }

  // ── PDF Export ─────────────────────────────────────────────────────────────
  exportToPDF(): void { this.generatePDF(this.filteredAssets(), 'transfer-report-all'); }

  exportSelectedToPDF(): void {
    if (!this.selectedAssets().length) {
      this.globalService.showToastr('Select at least one asset', 'error');
      return;
    }
    this.generatePDF(this.selectedAssets(), 'transfer-report-selected');
  }

  private generatePDF(assets: AssetTransferHistoryDto[], fileName: string): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    // ── Banner ──────────────────────────────────────────────────────────────
    doc.setFillColor(103, 58, 183);
    doc.rect(0, 0, W, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('SMART ASSET MANAGEMENT SYSTEM — SAMS', W / 2, 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Asset Transfer Report', W / 2, 14, { align: 'center' });

    let y = 22;

    // ── Summary strip ────────────────────────────────────────────────────────
    const s = this.summary();
    if (s) {
      doc.setFillColor(243, 232, 255);
      doc.roundedRect(12, y, W - 24, 14, 2, 2, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
      const items = [
        `Total Assets: ${s.totalAssets}`,
        `Active: ${s.totalActiveAssets}`,
        `Disposed: ${s.totalDisposedAssets}`,
        `Transfers: ${s.totalTransferLegs}`,
        `Pending: ${s.totalPendingApprovals}`,
        `Exported: ${assets.length} assets`,
      ];
      const colW = (W - 28) / items.length;
      items.forEach((item, i) => doc.text(item, 16 + i * colW, y + 9));
      y += 18;
    }

    // ── Report metadata ───────────────────────────────────────────────────────
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(130, 130, 130);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, y, { align: 'right' });
    if (this.activeFilterChips().length > 0) {
      doc.text(`Filters: ${this.activeFilterChips().map(c => c.label).join(' · ')}`, 14, y);
    }
    y += 6; doc.setTextColor(40, 40, 40);

    // ── Group assets by batch ─────────────────────────────────────────────────
    const batchMap = new Map<string, AssetTransferHistoryDto[]>();
    assets.forEach(a => {
      const key = a.batchCode || `Unit: ${a.assetId}`;
      if (!batchMap.has(key)) batchMap.set(key, []);
      batchMap.get(key)!.push(a);
    });

    let batchIdx = 0;
    batchMap.forEach((batchAssets, batchCode) => {
      batchIdx++;
      if (y > doc.internal.pageSize.getHeight() - 25) { doc.addPage(); y = 14; }

      // Batch header
      doc.setFillColor(237, 231, 246);
      doc.roundedRect(12, y, W - 24, 13, 2, 2, 'F');
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 20, 140);
      doc.text(`${batchIdx}. Batch: ${batchCode}  —  ${batchAssets[0].assetName || ''}`, 16, y + 5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
      const batchMeta = [
        batchAssets[0].categoryDisplay,
        `${batchAssets.length} unit(s)`,
        batchAssets[0].departmentDisplay,
      ].filter(Boolean).join(' · ');
      doc.text(batchMeta, 16, y + 10);

      // Stats on right
      const activeCount = batchAssets.filter(a => !a.isDisposed && !a.isCancelled).length;
      const disposedCount = batchAssets.filter(a => a.isDisposed).length;
      doc.setTextColor(56, 142, 60);
      doc.text(`Active: ${activeCount}`, W - 45, y + 5);
      if (disposedCount > 0) { doc.setTextColor(198, 40, 40); doc.text(`Disposed: ${disposedCount}`, W - 45, y + 10); }
      doc.setTextColor(40, 40, 40);
      y += 16;

      // Each unit in this batch
      batchAssets.forEach((asset, uIdx) => {
        if (y > doc.internal.pageSize.getHeight() - 30) { doc.addPage(); y = 14; }

        // Unit sub-header
        doc.setFillColor(250, 247, 255);
        doc.roundedRect(14, y, W - 28, 10, 1.5, 1.5, 'F');
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(103, 58, 183);
        doc.text(`Unit ${uIdx + 1}: ${asset.assetId}`, 18, y + 4);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
        doc.text([asset.assetBrand, asset.assetSerialNo, `${asset.totalTransfers} transfers`].filter(Boolean).join(' · '), 18, y + 8.5);

        // Current holder info on right
        const ch = asset.currentHolder;
        if (ch) {
          const holderTxt = ch.holderUser ? `Now with: ${ch.holderUser.fullName}` :
            ch.holderSite ? `Now at: ${ch.holderSite.siteName}` : '';
          if (holderTxt) {
            doc.setTextColor(56, 142, 60); doc.setFont('helvetica', 'bold');
            doc.text(holderTxt, W - 17, y + 6, { align: 'right' });
          }
        }
        if (asset.isDisposed) {
          doc.setTextColor(198, 40, 40); doc.setFont('helvetica', 'bold');
          doc.text('DISPOSED', W - 17, y + 6, { align: 'right' });
        }
        doc.setTextColor(40, 40, 40);
        y += 13;

        // Transfer chain table
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
            leg.assignTo === 1 ? 'User' : leg.assignTo === 2 ? 'Site/Branch' : 'Disposed',
            holder,
            leg.approvalStatusDisplay || '—',
            this.formatDate(leg.transferDate || leg.createdDate),
            `${leg.holdDays ?? 0} day(s)`,
            leg.transferredByUser?.fullName || leg.transferredByEmail || '—',
            leg.status || '—',
            leg.isCurrent ? '✓ CURRENT' : '',
          ];
        });

        if (rows.length) {
          autoTable(doc, {
            head: [['#', 'Type', 'Assign To', 'Holder', 'Approval', 'Date', 'Hold', 'Transferred By', 'Status', 'Current']],
            body: rows,
            startY: y,
            margin: { left: 16, right: 14 },
            styles: { fontSize: 6.5, cellPadding: 1.8 },
            headStyles: { fillColor: [74, 20, 140], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
            alternateRowStyles: { fillColor: [248, 244, 255] },
            columnStyles: {
              0: { cellWidth: 7 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 },
              3: { cellWidth: 40 }, 4: { cellWidth: 18 }, 5: { cellWidth: 20 },
              6: { cellWidth: 14 }, 7: { cellWidth: 34 }, 8: { cellWidth: 16 },
              9: { cellWidth: 16, fontStyle: 'bold', textColor: [56, 142, 60] }
            },
            didParseCell: (data: any) => {
              // Highlight current leg row
              const row = rows[data.row.index];
              if (row && row[9] === '✓ CURRENT') {
                data.cell.styles.fillColor = [232, 245, 233];
              }
            }
          } as any);
          y = (doc as any).lastAutoTable.finalY + 3;
        } else {
          doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(160, 160, 160);
          doc.text('No transfer history.', 18, y + 3);
          y += 7;
        }

        // Current holder footer for active assets
        if (ch && !asset.isDisposed) {
          const holderLine = ch.holderUser
            ? `Current: ${ch.holderUser.fullName} (${ch.holderUser.designationDisplay || ''}) — ${ch.holdDays ?? 0} days since ${this.formatDate(ch.holdStart)}`
            : ch.holderSite
              ? `Current: ${ch.holderSite.siteName}${ch.holderSite.area ? ' › ' + ch.holderSite.area.areaName : ''} — ${ch.holdDays ?? 0} days since ${this.formatDate(ch.holdStart)}`
              : '';
          if (holderLine) {
            doc.setFillColor(232, 245, 233);
            doc.roundedRect(16, y, W - 32, 8, 1.5, 1.5, 'F');
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 94, 32);
            doc.text(holderLine, 20, y + 5);
            doc.setTextColor(40, 40, 40);
            y += 10;
          }
        }

        y += 3;
      });

      y += 4;
    });

    // ── Footer on each page ────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(180, 180, 180);
      doc.text(
        `SAMS — System-generated Report · Confidential · Page ${i} of ${pageCount}`,
        W / 2, doc.internal.pageSize.getHeight() - 4, { align: 'center' }
      );
      doc.setFillColor(103, 58, 183);
      doc.rect(0, doc.internal.pageSize.getHeight() - 2, W, 2, 'F');
    }

    doc.save(`${fileName}-${Date.now()}.pdf`);
    this.globalService.showToastr('PDF exported successfully', 'success');
  }
}
