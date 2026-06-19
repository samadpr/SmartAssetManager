import {
  Component, OnInit, OnDestroy, signal, computed,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
 
import { MatCardModule }              from '@angular/material/card';
import { MatIconModule }              from '@angular/material/icon';
import { MatButtonModule }            from '@angular/material/button';
import { MatTableModule }             from '@angular/material/table';
import { MatFormFieldModule }         from '@angular/material/form-field';
import { MatSelectModule }            from '@angular/material/select';
import { MatInputModule }             from '@angular/material/input';
import { MatButtonToggleModule }      from '@angular/material/button-toggle';
import { MatTooltipModule }           from '@angular/material/tooltip';
import { MatExpansionModule }         from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
 
import { PageHeaderComponent }    from '../../../shared/widgets/page-header/page-header.component';
import { DashboardService }       from '../../../core/services/dashboard/dashboard.service';
import { SiteAssetSummary, SiteAssetMini } from '../../../core/models/interfaces/dashboard/dashboard.interface';
import { AssetDetail }            from '../../../core/models/interfaces/asset-manage/assets.interface';
import { FileUrlHelper }          from '../../../core/helper/get-file-url';
import { ManageAssetsService } from '../../../core/services/asset/manage-assets.service';
import { CompanyStorageService } from '../../../core/services/localStorage/company/company-storage.service';
import { AssignToType } from '../../../core/enum/asset.enums';
import { MatChipsModule } from '@angular/material/chips';
import { encodeBatchId } from '../../assets/manage-assets/manage-assets.component';
 
// ── Status colours ────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  new:         '#7c3aed',
  inuse:       '#10b981',
  available:   '#06b6d4',
  damaged:     '#ef4444',
  maintenance: '#f59e0b',
  returned:    '#3b82f6',
  expired:     '#94a3b8',
};
 
const ISSUE_KEYS = new Set(['damaged', 'maintenance', 'undermaintenance', 'expired']);
 
const CAT_COLORS: Record<string, string> = {
  'IT Equipment': '#7c3aed', Vehicles: '#06b6d4',
  Furniture: '#10b981', Machinery: '#f59e0b', Electronics: '#ef4444',
};
const CAT_ICONS: Record<string, string> = {
  'IT Equipment': 'computer', Vehicles: 'directions_car',
  Furniture: 'chair', Machinery: 'precision_manufacturing', Electronics: 'devices_other',
};
 
// ── View Models ───────────────────────────────────────────────────────
 
export interface AssetVM {
  id: number;
  assetId: string;
  name: string;
  category: string;
  status: string;
  statusKey: string;
  value: number | null;
  imageUrl: string | null;
  warrantyDaysLeft: number | null;
  assignTo: number;
  batchId?: number | null;
  batchCode?: string | null;
  batchSequence?: number | null;
  serialNo?: string | null;
}
 
export interface StatusBreakdown {
  key: string; label: string; count: number; pct: number; color: string;
}
 
export interface BatchGroup {
  batchId: number | null;
  batchCode: string | null;
  assets: AssetVM[];
}
 
export interface ListTableRow {
  isBatchHeader?: boolean;
  isUnit?: boolean;
  batchId?: number | null;
  batchCode?: string | null;
  unitCount?: number;
  totalValue?: number;
  id?: number;
  assetId?: string;
  name?: string;
  category?: string;
  status?: string;
  statusKey?: string;
  value?: number | null;
  imageUrl?: string | null;
  assignTo?: number;
  batchSequence?: number | null;
  serialNo?: string | null;
}
 
export interface SiteVM {
  siteId: number;
  name: string;
  city: string;
  type: number;
  assetCount: number;
  totalValue: number;
  assets: AssetVM[];
  activeCount: number;
  issueCount: number;
  batchCount: number;
  statusBreakdown: StatusBreakdown[];
  siteAssignedAssets: AssetVM[];
  userAssignedAssets: AssetVM[];
}
 
interface SummaryStat {
  key: string; label: string; value: number; formatted: string;
  icon: string; color: string; tooltip?: string;
}
 
export type AssignmentTab = 'all' | 'site' | 'user';
 
@Component({
  selector: 'app-site-asset-overview',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatTableModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonToggleModule, MatTooltipModule, MatExpansionModule,
    MatSnackBarModule, MatChipsModule,
    PageHeaderComponent, DatePipe,
  ],
  templateUrl: './site-asset-overview.component.html',
  styleUrl: './site-asset-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ]),
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('280ms cubic-bezier(.4,0,.2,1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('220ms cubic-bezier(.4,0,.2,1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('filterSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('200ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [
        animate('150ms ease', style({ opacity: 0, transform: 'translateY(-6px)' }))
      ])
    ])
  ]
})
export class SiteAssetOverviewComponent implements OnInit, OnDestroy{
 
  private destroy$ = new Subject<void>();
 
  loading       = signal(true);
  detailLoading = signal(false);
 
  allSites    = signal<SiteVM[]>([]);
  assetDetail = signal<AssetDetail | null>(null);
 
  // ── Filters ───────────────────────────────────────────────────────────
  typeFilter    = signal<string>('all');
  statusFilter  = signal<string>('all');
  assignFilter  = signal<string>('all');
  sortBy        = signal<string>('name');
  searchQuery   = signal<string>('');
  filterPanelOpen = signal<boolean>(false);
 
  viewMode: 'board' | 'grid' | 'list' = 'board';
 
  /**
   * FIX: maxAssetsInColumn now controls how many GROUPS (batch groups OR solo cards)
   * are shown per column — NOT how many individual units.
   * This prevents batches from being cut off mid-way.
   */
  maxGroupsInColumn = 6;
 
  /**
   * Per-site "show all groups" toggle (replaces expandedSites Set).
   * Key = siteId. true = show all groups.
   */
  private expandedSitesMap = new Map<number, boolean>();
 
  /** Per-site assignment tab selection */
  siteAssignmentTab = new Map<number, AssignmentTab>();
 
  /**
   * Per-site, per-batch expand state.
   * Key: `${siteId}_${batchId ?? 'null'}`
   */
  private expandedBatchGroups = new Set<string>();
 
  selectedAsset = signal<AssetVM | null>(null);
  selectedSite  = signal<SiteVM | null>(null);
 
  resolvedImageUrl = computed<string | null>(() => {
    const d = this.assetDetail();
    if (d?.imageUrl) return FileUrlHelper.getFullUrl(d.imageUrl);
    return this.selectedAsset()?.imageUrl ?? null;
  });
 
  listCols = ['asset', 'batch', 'category', 'assignedTo', 'status', 'value'];
 
  assetStatuses = [
    { key: 'new',         label: 'New'               },
    { key: 'inuse',       label: 'In Use'            },
    { key: 'available',   label: 'Available'         },
    { key: 'maintenance', label: 'Under Maintenance' },
    { key: 'damaged',     label: 'Damaged'           },
    { key: 'returned',    label: 'Returned'          },
    { key: 'expired',     label: 'Expired'           },
  ];
 
  // ── Currency ──────────────────────────────────────────────────────────
  private get _currencyCode(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
 
  currencySymbol = computed<string>(() => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: this._currencyCode })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$';
    } catch { return '$'; }
  });
 
  formatCurrencyAmount(value: number): string {
    if (!value) return `${this.currencySymbol()}0`;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency', currency: this._currencyCode,
        maximumFractionDigits: 0,
        notation: value >= 1_000_000 ? 'compact' : 'standard',
      }).format(value);
    } catch {
      const sym = this.currencySymbol();
      if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000)     return `${sym}${(value / 1_000).toFixed(0)}K`;
      return `${sym}${value}`;
    }
  }
 
  // ── Computed ──────────────────────────────────────────────────────────
  siteCount      = computed(() => this.allSites().filter(s => s.type === 1).length);
  branchCount    = computed(() => this.allSites().filter(s => s.type === 2).length);
  totalUnitCount = computed(() => this.allSites().reduce((acc, s) => acc + s.assetCount, 0));
 
  filteredSites = computed<SiteVM[]>(() => {
    const type   = this.typeFilter();
    const status = this.statusFilter();
    const assign = this.assignFilter();
    const sort   = this.sortBy();
    const q      = this.searchQuery().trim().toLowerCase();
    let list     = this.allSites();
 
    if (type !== 'all') list = list.filter(s => String(s.type) === type);
 
    if (status !== 'all') list = list.filter(s => s.assets.some(a => a.statusKey === status));
 
    if (assign !== 'all') {
      list = list.filter(s => s.assets.some(a => {
        switch (assign) {
          case 'site':       return a.assignTo === AssignToType.Site;
          case 'user':       return a.assignTo === AssignToType.User;
          case 'unassigned': return a.assignTo === AssignToType.NotAssigned;
          default:           return true;
        }
      }));
    }
 
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.assets.some(a =>
        a.name.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.batchCode ?? '').toLowerCase().includes(q) ||
        (a.serialNo  ?? '').toLowerCase().includes(q),
      ),
    );
 
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'assets_desc': return b.assetCount - a.assetCount;
        case 'assets_asc':  return a.assetCount - b.assetCount;
        case 'value_desc':  return b.totalValue  - a.totalValue;
        case 'value_asc':   return a.totalValue  - b.totalValue;
        default:            return a.name.localeCompare(b.name);
      }
    });
  });
 
  summaryStats = computed<SummaryStat[]>(() => {
    const s       = this.allSites();
    const total   = s.reduce((acc, x) => acc + x.assetCount, 0);
    const value   = s.reduce((acc, x) => acc + x.totalValue, 0);
    const issues  = s.reduce((acc, x) => acc + x.issueCount, 0);
    const batches = s.reduce((acc, x) => acc + x.batchCount, 0);
    return [
      { key: 'sites',   label: 'Sites / Branches',       value: s.length,  formatted: String(s.length),                  icon: 'location_city', color: 'primary' },
      { key: 'assets',  label: 'Total Assigned Units',    value: total,     formatted: String(total),                     icon: 'inventory_2',   color: 'cyan'    },
      { key: 'value',   label: 'Total Assets Value',      value: value,     formatted: this.formatCurrencyAmount(value),  icon: 'payments',      color: 'green'   },
      { key: 'batches', label: 'Distinct Batches',         value: batches,   formatted: String(batches),                   icon: 'view_module',   color: 'primary',
        tooltip: 'Number of distinct asset batches across all sites' },
      { key: 'issues',  label: 'Asset Issues',            value: issues,    formatted: String(issues),
        icon: 'warning_amber', color: 'warn',
        tooltip: 'Assets counted as issues: Damaged + Under Maintenance + Expired' },
    ];
  });
 
  activeFilterCount = computed(() => {
    let n = 0;
    if (this.searchQuery() !== '')     n++;
    if (this.statusFilter() !== 'all') n++;
    if (this.assignFilter() !== 'all') n++;
    return n;
  });
 
  hasActiveFilter = computed(() =>
    this.searchQuery() !== '' || this.typeFilter() !== 'all' ||
    this.statusFilter() !== 'all' || this.assignFilter() !== 'all',
  );
 
  constructor(
    private dashSvc:        DashboardService,
    private assetSvc:       ManageAssetsService,
    private companyStorage: CompanyStorageService,
    private snack:          MatSnackBar,
    private cdr:            ChangeDetectorRef,
  ) {}
 
  ngOnInit():    void { this.loadData(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
 
  loadData(): void {
    this.loading.set(true);
    this.dashSvc.getSitesAssetSummary('all')
      .pipe(takeUntil(this.destroy$), finalize(() => { this.loading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          if (!res?.success || !res.data) return;
          this.allSites.set(res.data.map((s: SiteAssetSummary) => this._mapSite(s)));
        },
        error: () => this.snack.open('Failed to load site data', 'Dismiss', { duration: 4000 }),
      });
  }
 
  private _mapSite(s: SiteAssetSummary): SiteVM {
    const assets: AssetVM[] = (s.assets ?? []).map((a: SiteAssetMini) => ({
      id:            a.id,
      assetId:       a.assetId,
      name:          a.name             ?? '—',
      category:      a.categoryDisplay  ?? '',
      status:        a.status           ?? '—',
      statusKey:     a.statusKey        ?? 'new',
      value:         a.unitPrice        ? Number(a.unitPrice) : null,
      imageUrl:      a.assetImageUrl    ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null,
      warrantyDaysLeft: null,
      assignTo:      a.assetAssignTo    ?? AssignToType.NotAssigned,
      batchId:       (a as any).batchId        ?? null,
      batchCode:     a.batchCode               ?? null,
      batchSequence: (a as any).batchSequence  ?? null,
      serialNo:      (a as any).assetSerialNo  ?? null,
    }));
 
    const statusMap: Record<string, { label: string; count: number }> = {};
    for (const a of assets) {
      if (!statusMap[a.statusKey]) statusMap[a.statusKey] = { label: a.status, count: 0 };
      statusMap[a.statusKey].count++;
    }
    const tot = assets.length || 1;
    const statusBreakdown = Object.entries(statusMap).map(([key, v]) => ({
      key, label: v.label, count: v.count,
      pct:   Math.round((v.count / tot) * 100),
      color: STATUS_COLOR[key] ?? '#94a3b8',
    }));
 
    const siteAssignedAssets = assets.filter(a => a.assignTo === AssignToType.Site);
    const userAssignedAssets = assets.filter(a => a.assignTo === AssignToType.User);
    const batchIds = new Set(assets.map(a => a.batchId).filter(Boolean));
 
    return {
      siteId: Number(s.siteId), name: s.name, city: s.city ?? '', type: s.type,
      assetCount:  s.assetCount, totalValue: Number(s.totalValue), assets,
      activeCount: assets.filter(a => ['inuse', 'available', 'new', 'returned'].includes(a.statusKey)).length,
      issueCount:  assets.filter(a => ISSUE_KEYS.has(a.statusKey)).length,
      batchCount:  batchIds.size,
      statusBreakdown, siteAssignedAssets, userAssignedAssets,
    };
  }
 
  // ── Filter setters ────────────────────────────────────────────────────
  setTypeFilter(v: string):   void { this.typeFilter.set(v); }
  setStatusFilter(v: string): void { this.statusFilter.set(v); }
  setAssignFilter(v: string): void { this.assignFilter.set(v); }
  setSortBy(v: string):       void { this.sortBy.set(v); }
  setSearch(v: string):       void { this.searchQuery.set(v); }
  clearSearch():              void { this.searchQuery.set(''); }
 
  clearAllFilters(): void {
    this.typeFilter.set('all'); this.statusFilter.set('all');
    this.assignFilter.set('all'); this.sortBy.set('name'); this.searchQuery.set('');
    this.cdr.markForCheck();
  }
 
  getAssignFilterLabel(v: string): string {
    const m: Record<string, string> = { site: 'Site Assigned', user: 'User Assigned', unassigned: 'Unassigned' };
    return m[v] ?? 'All';
  }
 
  // ── Assignment tab ────────────────────────────────────────────────────
  getSiteAssignmentTab(siteId: number): AssignmentTab {
    return this.siteAssignmentTab.get(siteId) ?? 'all';
  }
 
  setSiteAssignmentTab(siteId: number, tab: AssignmentTab, event?: Event): void {
    event?.stopPropagation();
    this.siteAssignmentTab.set(siteId, tab);
    this.cdr.markForCheck();
  }
 
  // ── Batch group expand/collapse ───────────────────────────────────────
  private _batchKey(siteId: number, batchId: number | null | undefined): string {
    return `${siteId}_${batchId ?? 'null'}`;
  }
 
  isBatchGroupExpanded(siteId: number, batchId: number | null | undefined): boolean {
    return this.expandedBatchGroups.has(this._batchKey(siteId, batchId));
  }
 
  toggleBatchGroup(siteId: number, batchId: number | null | undefined, event?: Event): void {
    event?.stopPropagation();
    const key = this._batchKey(siteId, batchId);
    this.expandedBatchGroups.has(key)
      ? this.expandedBatchGroups.delete(key)
      : this.expandedBatchGroups.add(key);
    this.cdr.markForCheck();
  }
 
  // ── Site expand/collapse (show more groups) ───────────────────────────
  isSiteExpanded(siteId: number): boolean {
    return this.expandedSitesMap.get(siteId) ?? false;
  }
 
  toggleSiteExpand(siteId: number): void {
    this.expandedSitesMap.set(siteId, !this.isSiteExpanded(siteId));
    this.cdr.markForCheck();
  }
 
  // ── Core filter: get ALL filtered assets (NO slice here) ──────────────
  /**
   * Returns ALL filtered assets for a site based on tab + status + assign + search.
   * IMPORTANT: This does NOT slice — slicing happens at the group level in the template.
   */
  getFilteredAssetsAll(site: SiteVM): AssetVM[] {
    const status = this.statusFilter();
    const assign = this.assignFilter();
    const q      = this.searchQuery().trim().toLowerCase();
    const tab    = this.getSiteAssignmentTab(site.siteId);
 
    let list: AssetVM[];
    switch (tab) {
      case 'site': list = [...site.siteAssignedAssets]; break;
      case 'user': list = [...site.userAssignedAssets]; break;
      default:     list = [...site.assets];
    }
 
    if (status !== 'all') list = list.filter(a => a.statusKey === status);
 
    if (assign !== 'all') {
      list = list.filter(a => {
        switch (assign) {
          case 'site':       return a.assignTo === AssignToType.Site;
          case 'user':       return a.assignTo === AssignToType.User;
          case 'unassigned': return a.assignTo === AssignToType.NotAssigned;
          default:           return true;
        }
      });
    }
 
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.assetId.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.batchCode ?? '').toLowerCase().includes(q) ||
      (a.serialNo  ?? '').toLowerCase().includes(q),
    );
 
    return list;
  }
 
  // ── Build batch groups from ALL filtered assets ───────────────────────
  /**
   * Groups all filtered assets by batchId.
   * Assets without a batch each become a solo group (group.assets.length === 1).
   */
  getAllBatchGroups(site: SiteVM): BatchGroup[] {
    const assets = this.getFilteredAssetsAll(site);
    const map    = new Map<string, BatchGroup>();
 
    for (const asset of assets) {
      const key = asset.batchId ? `batch_${asset.batchId}` : `solo_${asset.id}`;
      if (!map.has(key)) {
        map.set(key, { batchId: asset.batchId ?? null, batchCode: asset.batchCode ?? null, assets: [] });
      }
      map.get(key)!.assets.push(asset);
    }
 
    return [...map.values()];
  }
 
  /**
   * Returns the groups to DISPLAY in board/grid view.
   * When not expanded: returns first `maxGroupsInColumn` groups.
   * When expanded: returns all groups.
   */
  getVisibleBatchGroups(site: SiteVM): BatchGroup[] {
    const all = this.getAllBatchGroups(site);
    if (this.isSiteExpanded(site.siteId)) return all;
    return all.slice(0, this.maxGroupsInColumn);
  }
 
  /** Total group count for "show more" logic */
  getTotalGroupCount(site: SiteVM): number {
    return this.getAllBatchGroups(site).length;
  }
 
  /** Hidden group count */
  getHiddenGroupCount(site: SiteVM): number {
    return Math.max(0, this.getTotalGroupCount(site) - this.maxGroupsInColumn);
  }
 
  // ── Batch helper methods ──────────────────────────────────────────────
  getBatchStatusBreakdown(assets: AssetVM[]): StatusBreakdown[] {
    const sm: Record<string, { label: string; count: number }> = {};
    for (const a of assets) {
      if (!sm[a.statusKey]) sm[a.statusKey] = { label: a.status, count: 0 };
      sm[a.statusKey].count++;
    }
    const tot = assets.length || 1;
    return Object.entries(sm).map(([key, v]) => ({
      key, label: v.label, count: v.count,
      pct: Math.round((v.count / tot) * 100),
      color: STATUS_COLOR[key] ?? '#94a3b8',
    }));
  }
 
  getBatchTotalValue(assets: AssetVM[]): number {
    return assets.reduce((s, a) => s + (a.value ?? 0), 0);
  }
 
  // ── List view table data ──────────────────────────────────────────────
  /**
   * Builds flat row data for the mat-table in list view.
   * - Multi-unit batches get a collapsible header row.
   * - When header is expanded, individual unit rows are inserted below.
   * - Solo assets get a single row directly.
   *
   * FIX: list view now uses getAllBatchGroups (no slicing) so all assets appear.
   */
  getListTableData(site: SiteVM): ListTableRow[] {
    const rows: ListTableRow[] = [];
    const groups = this.getAllBatchGroups(site);
 
    for (const group of groups) {
      if (group.assets.length > 1) {
        // ── Batch header row ─────────────────────────────────────────
        rows.push({
          isBatchHeader: true,
          batchId:    group.batchId,
          batchCode:  group.batchCode,
          unitCount:  group.assets.length,
          totalValue: this.getBatchTotalValue(group.assets),
          name:       group.assets[0]?.name,
          category:   group.assets[0]?.category,
          imageUrl:   group.assets[0]?.imageUrl,
        });
 
        // ── Unit rows (only when expanded) ───────────────────────────
        if (this.isBatchGroupExpanded(site.siteId, group.batchId)) {
          for (const asset of group.assets) {
            rows.push({
              isUnit:        true,
              id:            asset.id,
              assetId:       asset.assetId,
              name:          asset.name,
              category:      asset.category,
              status:        asset.status,
              statusKey:     asset.statusKey,
              value:         asset.value,
              imageUrl:      asset.imageUrl,
              assignTo:      asset.assignTo,
              batchId:       asset.batchId,
              batchCode:     asset.batchCode,
              batchSequence: asset.batchSequence,
              serialNo:      asset.serialNo,
            });
          }
        }
      } else {
        // ── Solo asset row ───────────────────────────────────────────
        const a = group.assets[0];
        if (!a) continue;
        rows.push({
          id:            a.id,
          assetId:       a.assetId,
          name:          a.name,
          category:      a.category,
          status:        a.status,
          statusKey:     a.statusKey,
          value:         a.value,
          imageUrl:      a.imageUrl,
          assignTo:      a.assignTo,
          batchId:       a.batchId,
          batchCode:     a.batchCode,
          batchSequence: a.batchSequence,
          serialNo:      a.serialNo,
        });
      }
    }
 
    return rows;
  }
 
  // ── Legacy helpers kept for template compatibility ────────────────────
  /** @deprecated Use getAllBatchGroups + getVisibleBatchGroups instead */
  getFilteredAssets(site: SiteVM): AssetVM[] {
    return this.getFilteredAssetsAll(site);
  }
 
  getTotalFilteredCount(site: SiteVM): number {
    return this.getFilteredAssetsAll(site).length;
  }
 
  /** Kept for backwards compat with expandedSites usage in old template refs */
  get expandedSites(): Set<number> {
    const s = new Set<number>();
    this.expandedSitesMap.forEach((v, k) => { if (v) s.add(k); });
    return s;
  }
 
  toggleExpand(siteId: number): void {
    this.toggleSiteExpand(siteId);
  }
 
  // ── Asset detail drawer ───────────────────────────────────────────────
  openAssetDetail(asset: AssetVM | ListTableRow, site: SiteVM): void {
    if ((asset as ListTableRow).isBatchHeader) return;
 
    const a = asset as AssetVM;
    if (!a.id) return;
 
    this.selectedAsset.set(a);
    this.selectedSite.set(site);
    this.assetDetail.set(null);
    this.detailLoading.set(true);
 
    this.assetSvc.getById(a.id)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.detailLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => { if (res?.success && res.data) this.assetDetail.set(res.data); },
        error: () => this.snack.open('Could not load asset details', 'Dismiss', { duration: 3000 }),
      });
  }
 
  closeDetail(): void {
    this.selectedAsset.set(null);
    this.selectedSite.set(null);
    this.assetDetail.set(null);
  }
 
  getBatchDetailRoute(batchId: number | null | undefined): string[] {
    if (!batchId) return ['/asset-management'];
    return ['/asset-management/batch', encodeBatchId(batchId)];
  }
 
  // ── Image error handlers ──────────────────────────────────────────────
  onImgError(event: Event): void {
    const img    = event.target as HTMLImageElement;
    const parent = img.closest('.ac-thumb, .thumb, .gal-thumb');
    if (!parent) { img.style.display = 'none'; return; }
    img.style.display = 'none';
    const fb = parent.querySelector<HTMLElement>('.img-fb, .ac-icon-fb');
    if (fb) fb.style.display = 'flex';
  }
 
  onDrawerImgError(event: Event): void {
    const img    = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.closest('.dd-thumb');
    if (parent) { const ic = parent.querySelector<HTMLElement>('.dd-icon'); if (ic) ic.style.display = 'flex'; }
  }
 
  // ── Format helpers ────────────────────────────────────────────────────
  formatValue(v: number): string { return this.formatCurrencyAmount(v); }
 
  catColor(cat: string): string { return CAT_COLORS[cat] ?? '#94a3b8'; }
  catIcon(cat:  string): string { return CAT_ICONS[cat]  ?? 'inventory_2'; }
 
  getStatusLabel(key: string): string {
    return this.assetStatuses.find(s => s.key === key)?.label ?? key;
  }
 
  getAssignLabel(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      default: return 'Unassigned';
    }
  }
 
  getAssignKey(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'user';
      case AssignToType.Site: return 'site';
      default: return 'none';
    }
  }
 
  getAssignIcon(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'person';
      case AssignToType.Site: return 'location_city';
      default: return 'radio_button_unchecked';
    }
  }

  onBatchImgError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  // show the fallback icon sibling
  const fallback = img.nextElementSibling as HTMLElement | null;
  if (fallback) fallback.style.display = 'flex';
}
}
