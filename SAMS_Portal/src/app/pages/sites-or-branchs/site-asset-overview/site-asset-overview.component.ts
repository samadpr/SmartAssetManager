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
 
// ── Status colours ────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  new:         '#7c3aed',
  inuse:       '#10b981',
  available:   '#06b6d4',
  damaged:     '#ef4444',
  maintenance: '#f59e0b',
  returned:    '#3b82f6',
  expired:     '#94a3b8',
};
 
// Statuses that count as "issues" (Damaged / Under Maintenance / Expired)
const ISSUE_KEYS = new Set(['damaged', 'maintenance', 'undermaintenance', 'expired']);
 
const CAT_COLORS: Record<string, string> = {
  'IT Equipment': '#7c3aed', Vehicles: '#06b6d4',
  Furniture: '#10b981', Machinery: '#f59e0b', Electronics: '#ef4444',
};
const CAT_ICONS: Record<string, string> = {
  'IT Equipment': 'computer', Vehicles: 'directions_car',
  Furniture: 'chair', Machinery: 'precision_manufacturing', Electronics: 'devices_other',
};
 
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
  /** 1 = User, 2 = Site/Branch, 0 = Not Assigned */
  assignTo: number;
}
 
export interface StatusBreakdown {
  key: string; label: string; count: number; pct: number; color: string;
}
 
export interface SiteVM {
  siteId: number; name: string; city: string; type: number;
  assetCount: number; totalValue: number;
  assets: AssetVM[]; activeCount: number; issueCount: number;
  statusBreakdown: StatusBreakdown[];
  /** Assets directly assigned to the Site/Branch (assignTo === 2) */
  siteAssignedAssets: AssetVM[];
  /** Assets assigned to a User who is associated with this site (assignTo === 1) */
  userAssignedAssets: AssetVM[];
}
 
interface SummaryStat {
  key: string; label: string; value: number; formatted: string;
  icon: string; color: string; tooltip?: string;
}
 
/** Assignment view tab within a site column/card */
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
    ])
  ]
})
export class SiteAssetOverviewComponent implements OnInit, OnDestroy{
 
  private destroy$ = new Subject<void>();
 
  loading       = signal(true);
  detailLoading = signal(false);
 
  allSites    = signal<SiteVM[]>([]);
  assetDetail = signal<AssetDetail | null>(null);
 
  // ── Filters ──────────────────────────────────────────────────────────────
  typeFilter   = signal<string>('all');
  statusFilter = signal<string>('all');
  sortBy       = signal<string>('name');
  searchQuery  = signal<string>('');
 
  viewMode: 'board' | 'grid' | 'list' = 'board';
  maxAssetsInColumn = 8;
  expandedSites = new Set<number>();
 
  /** Per-site assignment tab selection (board/grid) */
  siteAssignmentTab = new Map<number, AssignmentTab>();
 
  selectedAsset = signal<AssetVM | null>(null);
  selectedSite  = signal<SiteVM | null>(null);
 
  resolvedImageUrl = computed<string | null>(() => {
    const d = this.assetDetail();
    if (d?.imageUrl) return FileUrlHelper.getFullUrl(d.imageUrl);
    return this.selectedAsset()?.imageUrl ?? null;
  });
 
  listCols = ['asset', 'category', 'assignedTo', 'status', 'value'];
 
  assetStatuses = [
    { key: 'new',         label: 'New'               },
    { key: 'inuse',       label: 'In Use'            },
    { key: 'available',   label: 'Available'         },
    { key: 'maintenance', label: 'Under Maintenance' },
    { key: 'damaged',     label: 'Damaged'           },
    { key: 'returned',    label: 'Returned'          },
    { key: 'expired',     label: 'Expired'           },
  ];
 
  // ── Currency (from CompanyStorageService) ─────────────────────────────────
  /**
   * Currency CODE from company storage (e.g. "INR", "USD", "EUR").
   * Falls back to "USD" if none stored.
   */
  private get _currencyCode(): string {
    return this.companyStorage.getCurrency()?.trim() || 'USD';
  }
 
  /** Currency SYMBOL only (e.g. "₹", "$", "€") */
  currencySymbol = computed<string>(() => {
    try {
      const code = this._currencyCode;
      return (
        new Intl.NumberFormat('en', { style: 'currency', currency: code })
          .formatToParts(0)
          .find(p => p.type === 'currency')?.value ?? '$'
      );
    } catch {
      return '$';
    }
  });
 
  /** Format a numeric amount using the stored currency */
  formatCurrencyAmount(value: number): string {
    if (!value) return `${this.currencySymbol()}0`;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: this._currencyCode,
        maximumFractionDigits: 0,
        notation: value >= 1_000_000 ? 'compact' : 'standard',
      }).format(value);
    } catch {
      // Fallback to manual compact format with symbol
      const sym = this.currencySymbol();
      if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000)     return `${sym}${(value / 1_000).toFixed(0)}K`;
      return `${sym}${value}`;
    }
  }
 
  // ── Computed ─────────────────────────────────────────────────────────────
  filteredSites = computed<SiteVM[]>(() => {
    const type   = this.typeFilter();
    const status = this.statusFilter();
    const sort   = this.sortBy();
    const q      = this.searchQuery().trim().toLowerCase();
    let list     = this.allSites();
 
    if (type !== 'all')   list = list.filter(s => String(s.type) === type);
    if (status !== 'all') list = list.filter(s => s.assets.some(a => a.statusKey === status));
    if (q)                list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.assets.some(a =>
        a.name.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
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
    const s      = this.allSites();
    const total  = s.reduce((acc, x) => acc + x.assetCount, 0);
    const value  = s.reduce((acc, x) => acc + x.totalValue, 0);
    const issues = s.reduce((acc, x) => acc + x.issueCount, 0);
    return [
      { key: 'sites',  label: 'Sites / Branches', value: s.length, formatted: String(s.length),            icon: 'location_city',  color: 'primary' },
      { key: 'assets', label: 'Total Assigned Assets', value: total, formatted: String(total),              icon: 'inventory_2',    color: 'cyan'    },
      { key: 'value',  label: 'Total Assets Value', value: value, formatted: this.formatCurrencyAmount(value), icon: 'payments',    color: 'green'   },
      {
        key: 'issues', label: 'Asset Issues', value: issues, formatted: String(issues),
        icon: 'warning_amber', color: 'warn',
        tooltip: 'Assets counted as issues: Damaged + Under Maintenance + Expired',
      },
    ];
  });
 
  hasActiveFilter = computed(() =>
    this.searchQuery() !== '' || this.typeFilter() !== 'all' || this.statusFilter() !== 'all',
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
      id:        a.id,
      assetId:   a.assetId,
      name:      a.name             ?? '—',
      category:  a.categoryDisplay  ?? '',
      status:    a.status           ?? '—',
      statusKey: a.statusKey        ?? 'new',
      value:     a.unitPrice        ? Number(a.unitPrice) : null,
      imageUrl:  a.assetImageUrl    ? FileUrlHelper.getFullUrl(a.assetImageUrl) : null,
      warrantyDaysLeft: null,
      assignTo:  a.assetAssignTo    ?? AssignToType.NotAssigned,
    }));
 
    const statusMap: Record<string, { label: string; count: number }> = {};
    for (const a of assets) {
      if (!statusMap[a.statusKey]) statusMap[a.statusKey] = { label: a.status, count: 0 };
      statusMap[a.statusKey].count++;
    }
    const tot = assets.length || 1;
    const statusBreakdown = Object.entries(statusMap).map(([key, v]) => ({
      key, label: v.label, count: v.count,
      pct: Math.round((v.count / tot) * 100),
      color: STATUS_COLOR[key] ?? '#94a3b8',
    }));
 
    // Separate assets by assignment type
    const siteAssignedAssets = assets.filter(a => a.assignTo === AssignToType.Site);
    const userAssignedAssets = assets.filter(a => a.assignTo === AssignToType.User);
 
    return {
      siteId: Number(s.siteId), name: s.name, city: s.city ?? '', type: s.type,
      assetCount: s.assetCount, totalValue: Number(s.totalValue), assets,
      activeCount: assets.filter(a => ['inuse', 'available', 'new', 'returned'].includes(a.statusKey)).length,
      issueCount:  assets.filter(a => ISSUE_KEYS.has(a.statusKey)).length,
      statusBreakdown,
      siteAssignedAssets,
      userAssignedAssets,
    };
  }
 
  // ── Filter setters ───────────────────────────────────────────────────────
  setTypeFilter(v: string):   void { this.typeFilter.set(v); }
  setStatusFilter(v: string): void { this.statusFilter.set(v); }
  setSortBy(v: string):       void { this.sortBy.set(v); }
  setSearch(v: string):       void { this.searchQuery.set(v); }
  clearSearch():              void { this.searchQuery.set(''); }
  clearAllFilters():          void {
    this.typeFilter.set('all'); this.statusFilter.set('all');
    this.sortBy.set('name');    this.searchQuery.set('');
  }
 
  // ── Assignment tab helpers ─────────────────────────────────────────────
  getSiteAssignmentTab(siteId: number): AssignmentTab {
    return this.siteAssignmentTab.get(siteId) ?? 'all';
  }
 
  setSiteAssignmentTab(siteId: number, tab: AssignmentTab, event?: Event): void {
    event?.stopPropagation();
    this.siteAssignmentTab.set(siteId, tab);
    this.cdr.markForCheck();
  }
 
  /**
   * Returns the filtered + tabbed asset list for a site column/card.
   * Respects: status filter, search query, assignment tab, expand/collapse.
   */
  getFilteredAssets(site: SiteVM): AssetVM[] {
    const status = this.statusFilter();
    const q      = this.searchQuery().trim().toLowerCase();
    const tab    = this.getSiteAssignmentTab(site.siteId);
 
    // Select base pool by assignment tab
    let list: AssetVM[];
    switch (tab) {
      case 'site': list = site.siteAssignedAssets; break;
      case 'user': list = site.userAssignedAssets; break;
      default:     list = site.assets;
    }
 
    if (status !== 'all') list = list.filter(a => a.statusKey === status);
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.assetId.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
    );
    return this.expandedSites.has(site.siteId) ? list : list.slice(0, this.maxAssetsInColumn);
  }
 
  /** Total (pre-slice) count of filtered assets for a site (for show-more logic) */
  getTotalFilteredCount(site: SiteVM): number {
    const status = this.statusFilter();
    const q      = this.searchQuery().trim().toLowerCase();
    const tab    = this.getSiteAssignmentTab(site.siteId);
 
    let list: AssetVM[];
    switch (tab) {
      case 'site': list = site.siteAssignedAssets; break;
      case 'user': list = site.userAssignedAssets; break;
      default:     list = site.assets;
    }
 
    if (status !== 'all') list = list.filter(a => a.statusKey === status);
    if (q) list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.assetId.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
    );
    return list.length;
  }
 
  toggleExpand(siteId: number): void {
    this.expandedSites.has(siteId) ? this.expandedSites.delete(siteId) : this.expandedSites.add(siteId);
    this.cdr.markForCheck();
  }
 
  openAssetDetail(asset: AssetVM, site: SiteVM): void {
    this.selectedAsset.set(asset); this.selectedSite.set(site);
    this.assetDetail.set(null);    this.detailLoading.set(true);
    this.assetSvc.getById(asset.id)
      .pipe(takeUntil(this.destroy$), finalize(() => { this.detailLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => { if (res?.success && res.data) this.assetDetail.set(res.data); },
        error: () => this.snack.open('Could not load asset details', 'Dismiss', { duration: 3000 }),
      });
  }
 
  closeDetail(): void {
    this.selectedAsset.set(null); this.selectedSite.set(null); this.assetDetail.set(null);
  }
 
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const parent = img.closest('.ac-thumb, .thumb, .gal-thumb');
    if (!parent) { img.style.display = 'none'; return; }
    img.style.display = 'none';
    const fb = parent.querySelector<HTMLElement>('.img-fb, .ac-icon-fb');
    if (fb) fb.style.display = 'flex';
  }
 
  onDrawerImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.closest('.dd-thumb');
    if (parent) { const ic = parent.querySelector<HTMLElement>('.dd-icon'); if (ic) ic.style.display = 'flex'; }
  }
 
  /** Compact formatted value using company currency */
  formatValue(v: number): string {
    return this.formatCurrencyAmount(v);
  }
 
  catColor(cat: string): string { return CAT_COLORS[cat] ?? '#94a3b8'; }
  catIcon(cat:  string): string { return CAT_ICONS[cat]  ?? 'inventory_2'; }
 
  getStatusLabel(key: string): string {
    return this.assetStatuses.find(s => s.key === key)?.label ?? key;
  }
 
  /** Human-readable assignment type label */
  getAssignLabel(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      default: return 'Unassigned';
    }
  }
 
  /** CSS modifier key for assignment badge */
  getAssignKey(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'user';
      case AssignToType.Site: return 'site';
      default: return 'none';
    }
  }
 
  /** Icon for assignment type */
  getAssignIcon(assignTo: number): string {
    switch (assignTo) {
      case AssignToType.User: return 'person';
      case AssignToType.Site: return 'location_city';
      default: return 'radio_button_unchecked';
    }
  }
}
