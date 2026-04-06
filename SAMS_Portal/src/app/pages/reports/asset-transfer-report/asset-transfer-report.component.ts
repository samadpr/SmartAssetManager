import {
  Component, computed, OnInit, signal, ViewChild, AfterViewInit,
  ChangeDetectorRef
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
 
// RxJS
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  AssetTransferHistoryDto,
  AssetTransferLegDto,
  OrganisationTransferSummaryDto,
  TransferUserDto,
  TransferSiteDto
} from '../../../core/models/interfaces/asset-report/asset-transfer-report.interface';
import { GlobalService } from '../../../core/services/global/global.service';
import { environment } from '../../../../environments/environment.development';
import { merge, Subject } from 'rxjs';
 
// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
// Dialogs
import {
  AssetTransferDetailDialogComponent
} from './asset-transfer-detail-dialog/asset-transfer-detail-dialog.component';
import { AssetTransferReportService } from '../../../core/services/asset-report/asset-transfer-report/asset-transfer-report.service';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { SitesOrBranchesService } from '../../../core/services/sites-or-branchs/sites-or-branches.service';
import { SiteDetailDialogComponent, UserDetailDialogComponent } from './user-site-dialog/UserAndSiteDetailDialogs.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
 
interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-asset-transfer-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonToggleModule, MatCheckboxModule,
    MatMenuModule, MatDatepickerModule, MatNativeDateModule,
    MatBadgeModule, MatDividerModule, MatExpansionModule,
  ],
  templateUrl: './asset-transfer-report.component.html',
  styleUrl: './asset-transfer-report.component.scss'
})
export class AssetTransferReportComponent implements OnInit, AfterViewInit {
  
  // ── Two separate named paginators ──────────────────────────────────────────
  @ViewChild('timelinePaginator') timelinePaginator!: MatPaginator;
  @ViewChild('tablePaginator') tablePaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
 
  private destroy$ = new Subject<void>();
 
  // ── Core state ─────────────────────────────────────────────────────────────
  loading = signal(false);
  allAssets = signal<AssetTransferHistoryDto[]>([]);
  summary = signal<OrganisationTransferSummaryDto | null>(null);
  selectedAssets = signal<AssetTransferHistoryDto[]>([]);
  filterPanelOpen = signal(false);
 
  // ── "Show more legs" per asset ────────────────────────────────────────────
  expandedLegs = signal<Record<number, boolean>>({});
  readonly LEGS_PREVIEW = 5;
 
  // ── Private filter signals (what computed() actually reads) ────────────────
  private _search = signal('');
  private _status = signal('');
  private _category = signal('');
  private _department = signal('');
  private _holderType = signal('');
  private _minTransfers = signal<number | null>(null);
  private _sortBy = signal('assetId');
  private _startDate = signal<Date | null>(null);
  private _endDate = signal<Date | null>(null);
  private _approvalStatus = signal('');
 
  // ── Form controls (bound to template) ─────────────────────────────────────
  searchControl       = new FormControl('');
  statusFilter        = new FormControl('');
  categoryFilter      = new FormControl('');
  departmentFilter    = new FormControl('');
  holderTypeFilter    = new FormControl('');
  minTransfersFilter  = new FormControl<number | null>(null);
  sortControl         = new FormControl('assetId');
  viewMode            = new FormControl('timeline');
  startDateControl    = new FormControl<Date | null>(null);
  endDateControl      = new FormControl<Date | null>(null);
  approvalStatusFilter = new FormControl('');
 
  // ── Timeline pagination state ──────────────────────────────────────────────
  timelinePageIndex = signal(0);
  timelinePageSize  = signal(10);
 
  // ── Table data source ──────────────────────────────────────────────────────
  tableDataSource = new MatTableDataSource<AssetTransferHistoryDto>([]);
  tableColumns = [
    'select', 'assetId', 'assetName', 'category',
    'totalTransfers', 'currentHolder', 'status', 'lastTransferDate', 'actions'
  ];
 
  // ── Computed dropdowns ─────────────────────────────────────────────────────
  categories = computed(() => {
    const s = new Set(this.allAssets().map(a => a.categoryDisplay).filter((c): c is string => !!c));
    return [...s].sort();
  });
  departments = computed(() => {
    const s = new Set(this.allAssets().map(a => a.departmentDisplay).filter((d): d is string => !!d));
    return [...s].sort();
  });
 
  // ── MAIN FILTER COMPUTED ───────────────────────────────────────────────────
  filteredAssets = computed(() => {
    let data = [...this.allAssets()];
 
    const search       = this._search().toLowerCase().trim();
    const status       = this._status();
    const category     = this._category();
    const dept         = this._department();
    const holderType   = this._holderType();
    const minT         = this._minTransfers();
    const sortBy       = this._sortBy();
    const startDate    = this._startDate();
    const endDate      = this._endDate();
    const appStatus    = this._approvalStatus();
 
    // 1. Full-text search (asset fields + chain holder names)
    if (search) {
      data = data.filter(a =>
        a.assetId?.toLowerCase().includes(search) ||
        a.assetName?.toLowerCase().includes(search) ||
        a.assetBrand?.toLowerCase().includes(search) ||
        a.assetSerialNo?.toLowerCase().includes(search) ||
        a.assetModelNo?.toLowerCase().includes(search) ||
        a.categoryDisplay?.toLowerCase().includes(search) ||
        a.subCategoryDisplay?.toLowerCase().includes(search) ||
        a.departmentDisplay?.toLowerCase().includes(search) ||
        a.transferChain?.some(leg =>
          leg.holderUser?.fullName?.toLowerCase().includes(search) ||
          leg.holderUser?.email?.toLowerCase().includes(search) ||
          leg.holderSite?.siteName?.toLowerCase().includes(search) ||
          leg.transferredByUser?.fullName?.toLowerCase().includes(search)
        )
      );
    }
 
    // 2. Asset status
    if (status === 'active')    data = data.filter(a => !a.isDisposed && !a.isCancelled);
    if (status === 'disposed')  data = data.filter(a => a.isDisposed);
    if (status === 'cancelled') data = data.filter(a => a.isCancelled);
 
    // 3. Category
    if (category) data = data.filter(a => a.categoryDisplay === category);
 
    // 4. Department
    if (dept) data = data.filter(a => a.departmentDisplay === dept);
 
    // 5. Holder type
    if (holderType === 'user')     data = data.filter(a => !!a.currentHolder?.holderUser);
    if (holderType === 'site')     data = data.filter(a => !!a.currentHolder?.holderSite);
    if (holderType === 'none')     data = data.filter(a => !a.currentHolder);
    if (holderType === 'disposed') data = data.filter(a => a.isDisposed);
 
    // 6. Min transfers
    if (minT !== null && minT !== undefined) {
      data = data.filter(a => (a.totalTransfers || 0) >= Number(minT));
    }
 
    // 7. Date range (last transfer date)
    if (startDate) {
      const sd = new Date(startDate); sd.setHours(0, 0, 0, 0);
      data = data.filter(a => a.lastTransferDate && new Date(a.lastTransferDate) >= sd);
    }
    if (endDate) {
      const ed = new Date(endDate); ed.setHours(23, 59, 59, 999);
      data = data.filter(a => a.lastTransferDate && new Date(a.lastTransferDate) <= ed);
    }
 
    // 8. Approval status (any leg in the chain)
    if (appStatus) {
      const n = Number(appStatus);
      data = data.filter(a => a.transferChain?.some(leg => leg.approvalStatus === n));
    }
 
    // 9. Sort
    data = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'assetName':        return (a.assetName || '').localeCompare(b.assetName || '');
        case 'totalTransfers':   return (b.totalTransfers || 0) - (a.totalTransfers || 0);
        case 'lastTransferDate': return new Date(b.lastTransferDate || 0).getTime() - new Date(a.lastTransferDate || 0).getTime();
        case 'firstAssignedDate':return new Date(a.firstAssignedDate || 0).getTime() - new Date(b.firstAssignedDate || 0).getTime();
        default:                 return (a.assetId || '').localeCompare(b.assetId || '');
      }
    });
 
    return data;
  });
 
  // ── Timeline paginated slice ───────────────────────────────────────────────
  paginatedAssets = computed(() => {
    const start = this.timelinePageIndex() * this.timelinePageSize();
    return this.filteredAssets().slice(start, start + this.timelinePageSize());
  });
 
  // ── Active filter chips ────────────────────────────────────────────────────
  activeFilterChips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (this._search())         chips.push({ key: 'search',         label: `"${this._search()}"` });
    if (this._status())         chips.push({ key: 'status',         label: `Status: ${this._status()}` });
    if (this._category())       chips.push({ key: 'category',       label: `Cat: ${this._category()}` });
    if (this._department())     chips.push({ key: 'department',     label: `Dept: ${this._department()}` });
    if (this._holderType())     chips.push({ key: 'holderType',     label: `Holder: ${this._holderType()}` });
    if (this._minTransfers() !== null) chips.push({ key: 'minTransfers', label: `Min Trans: ${this._minTransfers()}` });
    if (this._startDate())      chips.push({ key: 'startDate',      label: `From: ${this.formatDate(this._startDate())}` });
    if (this._endDate())        chips.push({ key: 'endDate',        label: `To: ${this.formatDate(this._endDate())}` });
    if (this._approvalStatus()) {
      const l: Record<string, string> = { '1': 'Pending', '2': 'Approved', '3': 'Rejected' };
      chips.push({ key: 'approvalStatus', label: `Approval: ${l[this._approvalStatus()] || this._approvalStatus()}` });
    }
    return chips;
  });
 
  hasActiveFilters  = computed(() => this.activeFilterChips().length > 0);
  activeFilterCount = computed(() => this.activeFilterChips().length);
 
  // ── Selection computeds ────────────────────────────────────────────────────
  allSelected  = computed(() => { const fa = this.filteredAssets(); return fa.length > 0 && this.selectedAssets().length === fa.length; });
  someSelected = computed(() => this.selectedAssets().length > 0 && !this.allSelected());
 
  constructor(
    private transferReportService: AssetTransferReportService,
    private globalService: GlobalService,
    private userProfileService: UserProfileService,
    private sitesService: SitesOrBranchesService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.loadData();
    this.setupListeners();
  }
 
  ngAfterViewInit(): void {
    if (this.tablePaginator) this.tableDataSource.paginator = this.tablePaginator;
    if (this.sort)           this.tableDataSource.sort = this.sort;
    this.cdr.detectChanges();
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  // ── Load ───────────────────────────────────────────────────────────────────
 
  loadData(): void {
    this.loading.set(true);
 
    this.transferReportService.getOrganisationSummary().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => { if (res.success && res.data) this.summary.set(res.data); },
      error: () => {}
    });
 
    this.transferReportService.getOrganisationReport().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const assets = res.data.assets || [];
          this.allAssets.set(assets);
          this.tableDataSource.data = assets;
          // Attach paginator AFTER data arrives
          setTimeout(() => {
            if (this.tablePaginator) this.tableDataSource.paginator = this.tablePaginator;
            if (this.sort)           this.tableDataSource.sort = this.sort;
            this.cdr.detectChanges();
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.globalService.showToastr('Failed to load transfer report', 'error');
        this.loading.set(false);
      }
    });
  }
 
  // ── Setup listeners — each valueChanges updates its private signal ─────────
 
  setupListeners(): void {
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('search', v || ''));
 
    this.statusFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('status', v || ''));
 
    this.categoryFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('category', v || ''));
 
    this.departmentFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('department', v || ''));
 
    this.holderTypeFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('holderType', v || ''));
 
    this.minTransfersFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('minTransfers', v));
 
    this.sortControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('sortBy', v || 'assetId'));
 
    this.startDateControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('startDate', v));
 
    this.endDateControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('endDate', v));
 
    this.approvalStatusFilter.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(v => this.applyFilter('approvalStatus', v || ''));
  }
 
  private applyFilter(key: string, value: any): void {
    switch (key) {
      case 'search':         this._search.set(value); break;
      case 'status':         this._status.set(value); break;
      case 'category':       this._category.set(value); break;
      case 'department':     this._department.set(value); break;
      case 'holderType':     this._holderType.set(value); break;
      case 'minTransfers':   this._minTransfers.set(value); break;
      case 'sortBy':         this._sortBy.set(value); break;
      case 'startDate':      this._startDate.set(value); break;
      case 'endDate':        this._endDate.set(value); break;
      case 'approvalStatus': this._approvalStatus.set(value); break;
    }
    // Reset timeline to page 0 on any filter change
    this.timelinePageIndex.set(0);
    // Sync table data source with new filter result
    this.tableDataSource.data = this.filteredAssets();
    if (this.tablePaginator) this.tablePaginator.firstPage();
  }
 
  // ── Filter helpers ─────────────────────────────────────────────────────────
 
  toggleFilterPanel(): void { this.filterPanelOpen.update(v => !v); }
 
  removeChip(key: string): void {
    switch (key) {
      case 'search':         this.searchControl.setValue(''); break;
      case 'status':         this.statusFilter.setValue(''); break;
      case 'category':       this.categoryFilter.setValue(''); break;
      case 'department':     this.departmentFilter.setValue(''); break;
      case 'holderType':     this.holderTypeFilter.setValue(''); break;
      case 'minTransfers':   this.minTransfersFilter.setValue(null); break;
      case 'startDate':      this.startDateControl.setValue(null); break;
      case 'endDate':        this.endDateControl.setValue(null); break;
      case 'approvalStatus': this.approvalStatusFilter.setValue(''); break;
    }
  }
 
  clearFilters(): void {
    // Batch: emit false so individual subs don't fire multiple times
    this.searchControl.setValue('',    { emitEvent: false });
    this.statusFilter.setValue('',     { emitEvent: false });
    this.categoryFilter.setValue('',   { emitEvent: false });
    this.departmentFilter.setValue('', { emitEvent: false });
    this.holderTypeFilter.setValue('', { emitEvent: false });
    this.minTransfersFilter.setValue(null, { emitEvent: false });
    this.startDateControl.setValue(null,   { emitEvent: false });
    this.endDateControl.setValue(null,     { emitEvent: false });
    this.approvalStatusFilter.setValue('', { emitEvent: false });
    // Reset all signals at once
    this._search.set(''); this._status.set(''); this._category.set('');
    this._department.set(''); this._holderType.set(''); this._minTransfers.set(null);
    this._startDate.set(null); this._endDate.set(null); this._approvalStatus.set('');
    this._sortBy.set('assetId');
    this.timelinePageIndex.set(0);
    this.tableDataSource.data = this.filteredAssets();
    if (this.tablePaginator) this.tablePaginator.firstPage();
  }
 
  // ── Timeline pagination ────────────────────────────────────────────────────
 
  onTimelinePage(event: PageEvent): void {
    this.timelinePageIndex.set(event.pageIndex);
    this.timelinePageSize.set(event.pageSize);
  }
 
  // ── Show more legs ─────────────────────────────────────────────────────────
 
  isLegsExpanded(id: number): boolean { return !!this.expandedLegs()[id]; }
 
  toggleLegs(id: number): void {
    this.expandedLegs.update(prev => ({ ...prev, [id]: !prev[id] }));
  }
 
  getVisibleLegs(asset: AssetTransferHistoryDto) {
    const chain = asset.transferChain || [];
    return this.isLegsExpanded(asset.assetRowId) ? chain : chain.slice(0, this.LEGS_PREVIEW);
  }
 
  hasMoreLegs(asset: AssetTransferHistoryDto): boolean {
    return (asset.transferChain?.length || 0) > this.LEGS_PREVIEW;
  }
 
  hiddenLegsCount(asset: AssetTransferHistoryDto): number {
    return Math.max(0, (asset.transferChain?.length || 0) - this.LEGS_PREVIEW);
  }
 
  // ── Tracking ───────────────────────────────────────────────────────────────
 
  trackByAsset(_: number, asset: AssetTransferHistoryDto): number { return asset.assetRowId; }
 
  // ── Selection ──────────────────────────────────────────────────────────────
 
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
  // Guard prevents double-open on double-click
 
  private _dialogPending = false;
 
  openAssetDetail(asset: AssetTransferHistoryDto): void {
    if (this._dialogPending) return;
    this._dialogPending = true;
 
    this.transferReportService.getByAssetRowId(asset.assetRowId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this._dialogPending = false;
        this.dialog.open(AssetTransferDetailDialogComponent, {
          width: '1100px', maxWidth: '97vw', maxHeight: '95vh',
          data: { asset: (res.success && res.data) ? res.data : asset },
          panelClass: 'transfer-detail-dialog'
        });
      },
      error: () => {
        this._dialogPending = false;
        this.dialog.open(AssetTransferDetailDialogComponent, {
          width: '1100px', maxWidth: '97vw', maxHeight: '95vh',
          data: { asset }, panelClass: 'transfer-detail-dialog'
        });
      }
    });
  }
 
  openUserDetail(event: Event, user: TransferUserDto): void {
    event.stopPropagation();
    if (!user.userProfileId) return;
    this.userProfileService.getUserById(user.userProfileId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.dialog.open(UserDetailDialogComponent, {
          width: '540px', maxWidth: '95vw',
          data: { user: (res.success && res.data) ? res.data : user }
        });
      },
      error: () => { this.dialog.open(UserDetailDialogComponent, { width: '540px', maxWidth: '95vw', data: { user } }); }
    });
  }
 
  openSiteDetail(event: Event, site: TransferSiteDto): void {
    event.stopPropagation();
    if (!site.siteId) return;
    this.sitesService.getSiteOrBranchById(site.siteId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.dialog.open(SiteDetailDialogComponent, {
          width: '540px', maxWidth: '95vw',
          data: { site: (res.success && res.data) ? res.data : site }
        });
      },
      error: () => { this.dialog.open(SiteDetailDialogComponent, { width: '540px', maxWidth: '95vw', data: { site } }); }
    });
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  getImageUrl(path: string | null | undefined): string {
    if (!path || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${environment.assetBaseUrl}/${path.startsWith('/') ? path.substring(1) : path}`;
  }
 
  onImageError(event: Event): void { (event.target as HTMLImageElement).style.display = 'none'; }
 
  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
 
  holdDaysTotal(asset: AssetTransferHistoryDto): number {
    return (asset.transferChain || []).reduce((s, l) => s + (l.holdDays || 0), 0);
  }
 
  // ── PDF ────────────────────────────────────────────────────────────────────
 
  exportToPDF(): void { this.generatePDF(this.filteredAssets(), 'transfer-report-all'); }
 
  exportSelectedToPDF(): void {
    if (!this.selectedAssets().length) { this.globalService.showToastr('Select at least one asset', 'error'); return; }
    this.generatePDF(this.selectedAssets(), 'transfer-report-selected');
  }
 
  private generatePDF(assets: AssetTransferHistoryDto[], fileName: string): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 18;
 
    doc.setFillColor(103, 58, 183); doc.rect(0, 0, W, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('SMART ASSET MANAGEMENT SYSTEM', W / 2, 9, { align: 'center' });
 
    y = 22; doc.setTextColor(40, 40, 40); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Asset Transfer Report', 14, y); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, y, { align: 'right' }); y += 6;
 
    if (this.summary()) {
      const s = this.summary()!;
      doc.setFillColor(243, 232, 255); doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(103, 58, 183);
      [`Total: ${s.totalAssets}`, `Active: ${s.totalActiveAssets}`, `Disposed: ${s.totalDisposedAssets}`,
       `Transfers: ${s.totalTransferLegs}`, `Pending: ${s.totalPendingApprovals}`, `Showing: ${assets.length}`
      ].forEach((item, i) => doc.text(item, 17 + i * ((W - 28) / 6), y + 9));
      y += 18;
    }
 
    if (this.activeFilterChips().length > 0) {
      doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100);
      doc.text(`Filters: ${this.activeFilterChips().map(c => c.label).join(' | ')}`, 14, y); y += 5;
    }
    doc.setTextColor(40, 40, 40);
 
    assets.forEach((asset, idx) => {
      doc.setFillColor(237, 231, 246); doc.roundedRect(14, y, W - 28, 12, 2, 2, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(103, 58, 183);
      doc.text(`${idx + 1}. [${asset.assetId}] ${asset.assetName || ''}`, 17, y + 5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
      doc.text([asset.assetBrand, asset.assetModelNo, asset.categoryDisplay].filter(Boolean).join(' · '), 17, y + 9.5);
      const sc = asset.isDisposed ? [211, 47, 47] : [56, 142, 60];
      doc.setTextColor(sc[0], sc[1], sc[2]); doc.setFont('helvetica', 'bold');
      doc.text(asset.isDisposed ? 'Disposed' : 'Active', W - 17, y + 7, { align: 'right' });
      doc.setTextColor(40, 40, 40); y += 14;
 
      const rows = (asset.transferChain || []).map((leg, li) => {
        let holder = '—';
        if (leg.holderUser) holder = leg.holderUser.fullName || '—';
        else if (leg.holderSite) { holder = leg.holderSite.siteName || '—'; if (leg.holderSite.area) holder += ` (${leg.holderSite.area.areaName})`; }
        else if (leg.assignTo === 3) holder = 'Disposed';
        return [`${li + 1}`, leg.assetTypeDisplay || '—',
          leg.assignTo === 1 ? 'User' : leg.assignTo === 2 ? 'Site' : 'Disposed',
          holder, leg.approvalStatusDisplay || '—', this.formatDate(leg.transferDate),
          `${leg.holdDays ?? 0}d`, leg.transferredByUser?.fullName || '—', leg.status || '—'];
      });
 
      if (!rows.length) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
        doc.text('No records.', 17, y + 4); y += 8;
      } else {
        autoTable(doc, {
          head: [['#', 'Type', 'Assign To', 'Holder', 'Approval', 'Date', 'Hold', 'By', 'Status']],
          body: rows, startY: y, margin: { left: 14, right: 14 },
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [74, 20, 140], textColor: 255, fontStyle: 'bold', fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 244, 255] },
          columnStyles: { 0: { cellWidth: 6 }, 1: { cellWidth: 20 }, 2: { cellWidth: 18 }, 3: { cellWidth: 40 }, 4: { cellWidth: 20 }, 5: { cellWidth: 22 }, 6: { cellWidth: 12 }, 7: { cellWidth: 38 }, 8: { cellWidth: 18 } }
        } as any);
        y = (doc as any).lastAutoTable.finalY + 4;
      }
 
      if (asset.currentHolder && !asset.isDisposed) {
        const ch = asset.currentHolder;
        const hs = ch.holderUser ? `User: ${ch.holderUser.fullName}` : ch.holderSite ? `Site: ${ch.holderSite.siteName}${ch.holderSite.area ? ' – ' + ch.holderSite.area.areaName : ''}` : '';
        if (hs) {
          doc.setFillColor(232, 245, 233); doc.roundedRect(14, y, W - 28, 8, 1.5, 1.5, 'F');
          doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 94, 32);
          doc.text(`Currently: ${hs}  |  Since: ${this.formatDate(ch.holdStart)}  |  ${ch.holdDays ?? 0} days`, 17, y + 5);
          doc.setTextColor(40, 40, 40); y += 10;
        }
      }
      y += 4;
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14; }
    });
 
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('System-generated report — SAMS', W / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    doc.save(`${fileName}-${Date.now()}.pdf`);
    this.globalService.showToastr('PDF exported successfully', 'success');
  }
}
