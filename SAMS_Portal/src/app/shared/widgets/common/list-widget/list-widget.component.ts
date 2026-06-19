import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { animate, style, transition, trigger } from '@angular/animations';
import { CountryService } from '../../../../core/services/account/country/country.service';
import { MatDialog } from '@angular/material/dialog';
import { FilePreviewComponent } from './file-preview/file-preview.component';
import { GlobalService } from '../../../../core/services/global/global.service';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';
import { PopupField } from '../../../../core/models/interfaces/popup-widget.interface';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatDividerModule } from '@angular/material/divider';
import { CompanyStorageService } from '../../../../core/services/localStorage/company/company-storage.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ─── Public types ─────────────────────────────────────────────────────────────
 
export type ActionButtonType = 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'mini-fab';
export type ActionPosition   = 'start' | 'end' | 'replace';
 
export interface ActionPopupConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  fields: PopupField[] | (() => PopupField[]);
  columns?: 1 | 2 | 3 | 4;
  maxWidth?: string;
  submitButtonText?: string;
  onSubmit?: (data: any, item: any) => any;
}
 
export interface ListColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'avatar'
       | 'phone' | 'email' | 'address' | 'country' | 'file';
  format?: string;
  visible?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  tooltip?: string;
  showIcon?: boolean;
  ellipsis?: boolean;
  filePreviewEnabled?: boolean;
  fileDownloadEnabled?: boolean;
  fileTypeIcon?: boolean;
  fileNameDisplay?: boolean;
  avatarField?: string;
  nameField?: string;
  countryCodeField?: string;
  emailVerificationKey?: string;
  showEmailVerification?: boolean;
  disableUnverifiedClick?: boolean;
}
 
export interface ListAction {
  key: string;
  label: string;
  icon: string;
  buttonType?: ActionButtonType;
  color?: 'primary' | 'accent' | 'warn' | 'success' | 'info' | string;
  position?: ActionPosition;
  order?: number;
  hidden?: boolean;
  showIf?: (item: any) => boolean;
  disabledIf?: (item: any) => boolean;
  popup?: ActionPopupConfig;
  tooltip?: string;
  confirmMessage?: string;
  confirmTitle?: string;
}
 
export interface ListConfig {
  title: string;
  showSearch?: boolean;
  showRefresh?: boolean;
  showDownload?: boolean;
  showAdd?: boolean;
  addButtonLabel?: string;
  selectable?: boolean;
  compactMode?: boolean;
  showSelectionActions?: boolean;
  rowClickAction?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  maxVisibleRows?: number;
  exportFileName?: string;
  emptyMessage?: string;
  actionsHeaderLabel?: string;
  columns: ListColumn[];
  actions?: ListAction[];
}
 
export interface SelectionActionEvent {
  action: 'delete' | 'export' | 'custom';
  selectedItems: any[];
  customAction?: string;
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// Keys:
//   Column visibility  →  lw_cols_<safe_title>
//   Page size          →  lw_pgsize_<safe_title>
// ═══════════════════════════════════════════════════════════════════════════════
 
function _safeKey(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
function _colsKey(title: string): string { return `lw_cols_${_safeKey(title)}`; }
function _pgSzKey(title: string): string { return `lw_pgsize_${_safeKey(title)}`; }
 
function _lsGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function _lsSet(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* SSR / private mode */ }
}
 
function _saveColVis(key: string, cols: ListColumn[]): void {
  const state: Record<string, boolean> = {};
  cols.forEach(c => { state[c.key] = c.visible !== false; });
  _lsSet(key, JSON.stringify(state));
}
function _loadColVis(key: string): Record<string, boolean> | null {
  const raw = _lsGet(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
function _applyColVis(cols: ListColumn[], state: Record<string, boolean>): void {
  cols.forEach(c => {
    if (Object.prototype.hasOwnProperty.call(state, c.key)) c.visible = state[c.key];
  });
}
 
function _savePgSz(key: string, size: number): void { _lsSet(key, String(size)); }
function _loadPgSz(key: string): number | null {
  const raw = _lsGet(key);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTER CACHE
// ═══════════════════════════════════════════════════════════════════════════════
 
const _fmtCache = new Map<string, Intl.NumberFormat>();
const _numFmt   = new Intl.NumberFormat();
 
function _getCurrencyFmt(code: string): Intl.NumberFormat {
  if (!_fmtCache.has(code)) {
    try {
      _fmtCache.set(code, new Intl.NumberFormat('en', {
        style: 'currency', currency: code,
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }));
    } catch {
      _fmtCache.set(code, new Intl.NumberFormat('en', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }));
    }
  }
  return _fmtCache.get(code)!;
}
 
// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
 
@Component({
  selector: 'app-list-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './list-widget.component.html',
  styleUrl: './list-widget.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    // rowAnimation intentionally removed — animating 200 rows on load caused the jank
    trigger('badgeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    trigger('buttonAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(-10px)' }))
      ])
    ]),
    trigger('chipAnimation', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: 0 }),
        animate('250ms ease-out', style({ opacity: 1, maxHeight: '50px' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, maxHeight: 0 }))
      ])
    ])
  ]
})
export class ListWidgetComponent implements OnInit, AfterViewInit, OnDestroy  {
  
  // ─── @ViewChild WITHOUT static:true ────────────────────────────────────────
  // Do NOT use { static: true } — the paginator is inside *ngIf in the template.
  // static:true tries to resolve the query at compile time (before *ngIf runs)
  // and always returns undefined. Default static:false resolves after view init.
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort)      sort!: MatSort;
 
  @Input() config!: ListConfig;
  @Input() loading = false;
 
  // ─── data setter ─────────────────────────────────────────────────────────
  // CRITICAL RACE-CONDITION FIX:
  //
  // In Angular, parent change detection runs in this order:
  //   1. Parent ngOnInit
  //   2. Parent ngAfterViewInit  ← @ViewChild children are resolved HERE
  //   3. Parent's first data emission (signal / async)
  //
  // BUT when [data]="assets()" is bound to a signal, Angular may call this
  // setter BEFORE ngAfterViewInit fires (race A). At that point this.paginator
  // is still undefined. Assigning undefined to dataSource.paginator silently
  // disables pagination entirely.
  //
  // The fix: always call _connectPaginator() from the setter. That helper
  // checks if this.paginator exists before doing anything — if it doesn't, it
  // returns early and ngAfterViewInit will call it again once the view is ready.
  private _data: any[] = [];
 
  @Input() set data(value: any[]) {
    this._data = value || [];
    this.dataSource.data = this._data;
    // Attempt paginator wiring — safe to call before view init (no-ops then)
    this._connectPaginator();
    this.updateSelectionState();
    this.cdr.markForCheck();
  }
  get data(): any[] { return this._data; }
 
  // ─── Outputs ──────────────────────────────────────────────────────────────
  @Output() actionClick     = new EventEmitter<{ action: string; item: any }>();
  @Output() addClick        = new EventEmitter<void>();
  @Output() refreshClick    = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() selectionAction = new EventEmitter<SelectionActionEvent>();
  @Output() rowClick        = new EventEmitter<{ action: string; item: any }>();
 
  // ─── Services ─────────────────────────────────────────────────────────────
  private cdr            = inject(ChangeDetectorRef);
  private destroyRef     = inject(DestroyRef);
  private countryService = inject(CountryService);
  private dialog         = inject(MatDialog);
  private globalService  = inject(GlobalService);
  private popupService   = inject(PopupWidgetService);
  private companyStorage = inject(CompanyStorageService);
 
  // ─── Table state ──────────────────────────────────────────────────────────
  dataSource    = new MatTableDataSource<any>([]);
  selection     = new SelectionModel<any>(true, []);
  searchControl = new FormControl('');
 
  // ─── UI signals ───────────────────────────────────────────────────────────
  // IMPORTANT: showPagination only controls CSS visibility of the paginator
  // wrapper div. The <mat-paginator> element itself must ALWAYS stay in the DOM
  // (no *ngIf on it) so @ViewChild resolves correctly in ngAfterViewInit.
  showPagination = signal(false);
  visibleColumns = signal<ListColumn[]>([]);
  hasSelection   = signal(false);
  selectedCount  = signal(0);
 
  // ─── Persistence ──────────────────────────────────────────────────────────
  private _colsKey          = '';
  private _pgSzKey          = '';
  // _resolvedPageSize is always a valid positive integer — never null/undefined
  private _resolvedPageSize = 10;
  get resolvedPageSize(): number {
    return this._resolvedPageSize;
  }
 
  // Guard flag: subscribe to paginator.page only once even if
  // _connectPaginator() is called from both setter AND ngAfterViewInit
  private _paginatorWired = false;
 
  // ─── Formatters (cached — no per-cell allocation) ─────────────────────────
  private _currencyCode = 'USD';
  private _currencyFmt!: Intl.NumberFormat;
 
  // ─── Country caches (built once in ngOnInit) ──────────────────────────────
  private _cntryName = new Map<string, string>();
  private _cntryFlag = new Map<string, string>();
 
  // ─── Displayed-columns signal ─────────────────────────────────────────────
  // Rebuilt only when toggleColumn() or ngOnInit() calls _rebuildDisplayedCols()
  // instead of being recomputed on every CD cycle via a plain method call.
  private _displayedColsSig = signal<string[]>([]);
 
  // ─── Computed action slices ───────────────────────────────────────────────
  startActions   = computed(() => this._actionsByPos('start'));
  endActions     = computed(() => this._actionsByPos('end'));
  defaultActions = computed(() => this._defaultActions());
  replaceActions = computed(() => this._actionsByPos('replace'));
  hasReplaceActions = computed(() => this.replaceActions().length > 0);
 
  // ─── Scroll / height signals ──────────────────────────────────────────────
  shouldScroll = computed(() => {
    return this._resolvedPageSize > (this.config?.maxVisibleRows || 5);
  });
 
  tableMaxHeight = computed(() => {
    const maxRows = this.config?.maxVisibleRows || 5;
    const rowH    = this.config?.compactMode ? 52 : 64;
    if (this._resolvedPageSize <= maxRows) return 'none';
    return `${(maxRows * rowH) + 48}px`;
  });
 
  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════
 
  ngOnInit(): void {
    // 1. Currency formatter (module-level cache — shared across widget instances)
    this._resolveCurrency();
 
    // 2. Per-instance storage keys derived from config title
    this._colsKey = _colsKey(this.config?.title ?? 'default');
    this._pgSzKey = _pgSzKey(this.config?.title ?? 'default');
 
    // 3. Restore column visibility before first render
    if (this.config?.columns?.length) {
      const saved = _loadColVis(this._colsKey);
      if (saved) _applyColVis(this.config.columns, saved);
      this.visibleColumns.set(this.config.columns.filter(c => c.visible !== false));
    }
 
    // 4. Resolve page size
    const savedSz    = _loadPgSz(this._pgSzKey);
    const cfgSz      = this.config?.pageSize ?? 10;
    const validSizes = this.config?.pageSizeOptions ?? [5, 10, 25, 50, 100];
    // Only accept savedSz if it is one of the valid sizes; otherwise use config default
    this._resolvedPageSize = (savedSz && validSizes.includes(savedSz)) ? savedSz : cfgSz;
 
    // 5. Displayed-columns signal
    this._rebuildDisplayedCols();
 
    // 6. Filter predicate
    this._initFilterPredicate();
 
    // 7. Country lookup caches — O(n) once, not per cell
    this._buildCountryCaches();
 
    // 8. Search with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.dataSource.filter = v?.trim().toLowerCase() || '';
        this.cdr.markForCheck();
      });
 
    // 9. Selection tracking
    this.selection.changed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateSelectionState();
        this.selectionChange.emit(this.selection.selected);
        this.cdr.markForCheck();
      });
  }
 
  ngAfterViewInit(): void {
    // Wire sort once — sort doesn't have the race condition paginator has
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
 
    // Wire paginator — at this point @ViewChild is guaranteed to have resolved
    // Calling _connectPaginator() here handles the case where data arrived
    // before the view was ready (Race A described in the setter comment above)
    this._connectPaginator();
 
    this.cdr.markForCheck();
  }
 
  ngOnDestroy(): void { /* takeUntilDestroyed handles all subscription cleanup */ }
 
  // ═══════════════════════════════════════════════════════════════════════════
  // _connectPaginator — THE CORE PAGINATION FIX
  //
  // This is the single method responsible for wiring MatPaginator to
  // MatTableDataSource. It is idempotent and safe to call multiple times.
  //
  // Root causes of the original "all rows shown, pagination broken" bug:
  //
  // BUG 1 — Race condition (most common):
  //   [data]="assets()" feeds an async signal. The setter fires when assets()
  //   emits, which can happen BEFORE ngAfterViewInit. At that moment
  //   this.paginator === undefined. The old code did:
  //     this.dataSource.paginator = this.paginator  // assigns undefined!
  //   MatTableDataSource with paginator=undefined shows ALL rows unsliced.
  //
  // BUG 2 — *ngIf on <mat-paginator>:
  //   The original template had:
  //     <div *ngIf="showPagination() && !loading">
  //       <mat-paginator ...></mat-paginator>
  //     </div>
  //   When loading=true the paginator element is removed from the DOM.
  //   @ViewChild returns undefined. After loading becomes false the element
  //   is added back but @ViewChild does NOT re-fire — it stays undefined.
  //   Fix: NEVER put *ngIf on <mat-paginator>. Use [hidden] or CSS instead.
  //
  // BUG 3 — _resolvedPageSize was typed as `number | null`:
  //   When null leaked into paginator.pageSize it rendered as NaN, silently
  //   breaking the page-size selector.
  // ═══════════════════════════════════════════════════════════════════════════
 
  private _connectPaginator(): void {
    // Guard: if paginator doesn't exist yet, bail out.
    // ngAfterViewInit will call us again once the view is initialised.
    if (!this.paginator) return;
 
    // Apply persisted page size BEFORE assigning to dataSource so the
    // paginator renders with the correct initial value on first paint.
    if (this.paginator.pageSize !== this._resolvedPageSize) {
      this.paginator.pageSize = this._resolvedPageSize;
    }
 
    // Wire the paginator to the data source (idempotent — safe to repeat)
    if (this.dataSource.paginator !== this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
 
    // Sync the showPagination signal
    this.showPagination.set(this._data.length > 10);
 
    // Subscribe to page events exactly once
    if (!this._paginatorWired) {
      this._paginatorWired = true;
 
      this.paginator.page
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((evt: PageEvent) => {
          // Persist page size whenever it changes
          if (evt.pageSize !== this._resolvedPageSize) {
            this._resolvedPageSize = evt.pageSize;
            _savePgSz(this._pgSzKey, evt.pageSize);
            this.showPagination.set(this._data.length > 10);
          }
          this.cdr.markForCheck();
        });
    }
  }
 
  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
 
  private _resolveCurrency(): void {
    try {
      const code = this.companyStorage.get()?.currency?.trim();
      if (code && code.length === 3) {
        // Validate that the code is recognised by Intl before using it
        new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(0);
        this._currencyCode = code;
      }
    } catch { /* keep USD default */ }
    this._currencyFmt = _getCurrencyFmt(this._currencyCode);
  }
 
  private _buildCountryCaches(): void {
    if (!this.config?.columns?.some(c => c.type === 'country')) return;
    try {
      this.countryService.getAllCountries().forEach(c => {
        const upper = c.code.toUpperCase();
        this._cntryName.set(upper, c.name);
        this._cntryFlag.set(upper, this.countryService.getFlagUrl(c.code));
      });
    } catch { /* service unavailable */ }
  }
 
  private _initFilterPredicate(): void {
    this.dataSource.filterPredicate = (row: any, filter: string) => {
      const term = filter.trim().toLowerCase();
      if (!term) return true;
      return this.config.columns.some(col => {
        const val = row[col.key];
        if (val == null) return false;
        if (col.type === 'avatar')  return row[col.nameField || col.key]?.toString().toLowerCase().includes(term);
        if (col.type === 'country') return val.toString().toLowerCase().includes(term)
          || (this._cntryName.get(val.toUpperCase()) ?? '').toLowerCase().includes(term);
        return val.toString().toLowerCase().includes(term);
      });
    };
  }
 
  private _rebuildDisplayedCols(): void {
    const cols: string[] = this.config?.columns?.filter(c => c.visible !== false).map(c => c.key) ?? [];
    if (this.config?.selectable)      cols.unshift('select');
    if (this.config?.actions?.length) cols.push('actions');
    this._displayedColsSig.set(cols);
  }
 
  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════
 
  /** Template shim — reads signal instead of recomputing every CD cycle */
  displayedColumns(): string[] {
    return this._displayedColsSig();
  }
 
  // ─── Column toggle ────────────────────────────────────────────────────────
 
  toggleColumn(column: ListColumn): void {
    column.visible = !column.visible;
    this.visibleColumns.set(this.config.columns.filter(c => c.visible !== false));
    this._rebuildDisplayedCols();
    _saveColVis(this._colsKey, this.config.columns);
    this.cdr.markForCheck();
  }
 
  // ─── Selection ────────────────────────────────────────────────────────────
 
  updateSelectionState(): void {
    this.hasSelection.set(this.selection.selected.length > 0);
    this.selectedCount.set(this.selection.selected.length);
  }
 
  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.filteredData.length
      && this.dataSource.filteredData.length > 0;
  }
 
  isIndeterminate(): boolean {
    return this.selection.selected.length > 0
      && this.selection.selected.length < this.dataSource.filteredData.length;
  }
 
  toggleAllRows(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.filteredData.forEach(r => this.selection.select(r));
  }
 
  toggleRow(row: any): void { this.selection.toggle(row); }
  clearSelection(): void    { this.selection.clear(); }
 
  // ─── Row / action clicks ──────────────────────────────────────────────────
 
  onRowClick(row: any): void {
    if (this.config?.rowClickAction && this.config?.selectable) {
      this.rowClick.emit({ action: this.config.rowClickAction, item: row });
    }
  }
 
  onActionClick(action: string | ListAction, item: any, event?: Event): void {
    event?.stopPropagation();
    if (typeof action === 'object') {
      const a = action as ListAction;
      if (a.popup)          { this._handlePopupAction(a, item); return; }
      if (a.confirmMessage) { this._handleConfirmAction(a, item); return; }
      this.actionClick.emit({ action: a.key, item });
    } else {
      this.actionClick.emit({ action: action as string, item });
    }
  }
 
  onAddClick():     void { this.addClick.emit(); }
  onRefreshClick(): void { this.refreshClick.emit(); }
 
  onDeleteSelected(): void {
    if (this.selection.selected.length > 0) {
      this.selectionAction.emit({ action: 'delete', selectedItems: [...this.selection.selected] });
    }
  }
 
  onExportSelected(): void {
    if (this.selection.selected.length > 0) {
      this._toExcel(this.selection.selected);
      this.selectionAction.emit({ action: 'export', selectedItems: [...this.selection.selected] });
    }
  }
 
  exportToExcel():       void { this._toExcel(this.dataSource.filteredData); }
  exportToPDF():         void { this._toPDF(this.dataSource.filteredData); }
  exportSelectedToPDF(): void { if (this.selection.selected.length) this._toPDF(this.selection.selected); }
 
  // ─── Action helpers ───────────────────────────────────────────────────────
 
  private _actionsByPos(pos: ActionPosition): ListAction[] {
    return (this.config?.actions ?? [])
      .filter(a => (a.position || 'end') === pos)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
 
  private _defaultActions(): ListAction[] {
    return (this.config?.actions ?? [])
      .filter(a => (!a.position || a.position === 'end') && !a.buttonType)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
 
  isActionVisible(action: ListAction, item: any): boolean {
    if (action.hidden) return false;
    return action.showIf ? action.showIf(item) : true;
  }
 
  isActionDisabled(action: ListAction, item: any): boolean {
    return action.disabledIf ? action.disabledIf(item) : false;
  }
 
  getActionButtonClass(action: ListAction): string {
    return ['action-btn', `btn-${action.buttonType || 'icon'}`, action.color ? `btn-${action.color}` : '']
      .filter(Boolean).join(' ');
  }
 
  private _handlePopupAction(action: ListAction, item: any): void {
    if (!action.popup) return;
    const cfg    = action.popup;
    const fields = typeof cfg.fields === 'function' ? cfg.fields() : cfg.fields;
    this.popupService.openFormPopup(
      { title: cfg.title, subtitle: cfg.subtitle, icon: cfg.icon || action.icon, fields,
        columns: cfg.columns || 2, maxWidth: cfg.maxWidth || '800px',
        submitButtonText: cfg.submitButtonText || 'Submit' },
      item
    ).subscribe(result => {
      if (result?.action === 'submit' && cfg.onSubmit) {
        this.loading = true;
        const res = cfg.onSubmit(result.data, item);
        if (res && typeof res.subscribe === 'function') {
          res.subscribe({
            next:  () => { this.loading = false; this.globalService.showSnackbar(`${action.label} completed successfully`, 'success'); this.refreshClick.emit(); this.cdr.markForCheck(); },
            error: () => { this.loading = false; this.globalService.showToastr(`Failed to ${action.label.toLowerCase()}`, 'error'); this.cdr.markForCheck(); }
          });
        } else {
          this.loading = false;
          this.globalService.showSnackbar(`${action.label} completed successfully`, 'success');
          this.refreshClick.emit();
          this.cdr.markForCheck();
        }
      }
    });
  }
 
  private _handleConfirmAction(action: ListAction, item: any): void {
    this.popupService.openGenericConfirmation(
      action.confirmTitle || `Confirm ${action.label}`, action.confirmMessage!,
      { confirmButtonText: action.label, confirmButtonIcon: action.icon, icon: action.icon,
        iconColor: action.color === 'warn' ? 'warn' : 'primary' }
    ).subscribe(result => {
      if (result?.action === 'confirm') this.actionClick.emit({ action: action.key, item });
    });
  }
 
  // ═══════════════════════════════════════════════════════════════════════════
  // CELL VALUE FORMATTING — zero per-cell allocation
  // ═══════════════════════════════════════════════════════════════════════════
 
  formatCellValue(value: any, column: ListColumn, _item?: any): string {
    if (value == null) return '';
    switch (column.type) {
      case 'currency': return this._currencyFmt.format(Number(value) || 0);
      case 'number':   return _numFmt.format(value);
      case 'date':     return new Date(value).toLocaleDateString();
      case 'boolean':  return value ? 'Yes' : 'No';
      default:         return String(value);
    }
  }
 
  formatCellCurrency(value: number): string {
    return this._currencyFmt.format(Number(value) || 0);
  }
 
  getExportValue(value: any, column: ListColumn, item: any): string {
    if (value == null) return '';
    switch (column.type) {
      case 'currency': return this._currencyFmt.format(Number(value) || 0);
      case 'number':   return _numFmt.format(value);
      case 'date':     return new Date(value).toLocaleDateString();
      case 'boolean':  return value ? 'Yes' : 'No';
      case 'country':  return this.getCountryName(value);
      case 'avatar':   return item[column.nameField || column.key] || '';
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey) {
          return `${value} ${item[column.emailVerificationKey] ? '(Verified)' : '(Not Verified)'}`;
        }
        return String(value);
      default: return String(value);
    }
  }
 
  // ─── Lookup helpers ───────────────────────────────────────────────────────
 
  getAvatarUrl(item: any, column: ListColumn): string {
    return item[column.avatarField || 'avatar'] || '/assets/images/ProfilePic.png';
  }
 
  getDisplayName(item: any, column: ListColumn): string {
    return item[column.nameField || column.key] || '';
  }
 
  getCountryName(code: string): string {
    if (!code) return '';
    return this._cntryName.get(code.toUpperCase()) ?? code;
  }
 
  getCountryFlagUrl(code: string): string {
    if (!code) return '';
    return this._cntryFlag.get(code.toUpperCase()) ?? '';
  }
 
  formatPhoneNumber(phone: string | number): string {
    if (!phone) return '';
    const s = phone.toString();
    if (s.length === 10) return `(${s.slice(0, 2)}) ${s.slice(3, 6)}-${s.slice(6)}`;
    return s;
  }
 
  getColumnTooltip(column: ListColumn, value: any, item?: any): string {
    if (column.tooltip) return column.tooltip;
    switch (column.type) {
      case 'avatar':  return this.getDisplayName(item!, column);
      case 'country': return `${this.getCountryName(value)} (${value})`;
      case 'phone':   return `Call ${this.formatPhoneNumber(value)}`;
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey && item) {
          return item[column.emailVerificationKey]
            ? `Send email to ${value} (Verified)` : `${value} (Not Verified)`;
        }
        return `Send email to ${value}`;
      case 'address': return `Address: ${value}`;
      default:        return column.ellipsis ? value?.toString() || '' : '';
    }
  }
 
  onPhoneClick(phone: string, event: Event): void {
    event.stopPropagation();
    if (phone) window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
  }
 
  onEmailClick(email: string, row: any, column: ListColumn, event: Event): void {
    event.stopPropagation();
    if (column.showEmailVerification && column.emailVerificationKey && column.disableUnverifiedClick) {
      if (!row[column.emailVerificationKey]) return;
    }
    if (email) window.open(`mailto:${email}`, '_self');
  }
 
  isEmailVerified(row: any, column: ListColumn): boolean {
    if (!column.emailVerificationKey) return true;
    return row[column.emailVerificationKey] === true;
  }
 
  onAddressClick(address: string, event: Event): void {
    event.stopPropagation();
    if (address) window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');
  }
 
  // ─── File helpers ─────────────────────────────────────────────────────────
 
  getFileExtension(filePath: string): string {
    if (!filePath) return '';
    return filePath.split('.').pop()?.toLowerCase() ?? '';
  }
 
  getFileName(filePath: string): string {
    if (!filePath) return '';
    return filePath.split('/').pop() ?? '';
  }
 
  getTruncatedFileName(filePath: string, maxLength = 20): string {
    if (!filePath) return '';
    const name = this.getFileName(filePath);
    if (name.length <= maxLength) return name;
    const ext  = this.getFileExtension(filePath);
    const base = name.substring(0, name.lastIndexOf('.'));
    const tLen = maxLength - ext.length - 4;
    return tLen > 0
      ? `${base.substring(0, tLen)}...${ext}`
      : `${name.substring(0, maxLength - 3)}...`;
  }
 
  getFileTypeIcon(ext: string): string {
    const e = ext.toLowerCase();
    if (['jpg','jpeg','png','gif','bmp','webp','svg'].includes(e)) return 'image';
    if (e === 'pdf')                                                return 'picture_as_pdf';
    if (['doc','docx'].includes(e))                                 return 'description';
    if (['xls','xlsx','csv'].includes(e))                           return 'table_chart';
    if (['zip','rar','7z','tar','gz'].includes(e))                  return 'folder_zip';
    return 'insert_drive_file';
  }
 
  isPreviewable(ext: string): boolean {
    return ['pdf','jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext.toLowerCase());
  }
 
  onFilePreview(filePath: string, event: Event): void {
    event.stopPropagation();
    this.dialog.open(FilePreviewComponent, {
      data: { fileUrl: filePath, fileName: this.getFileName(filePath), fileType: this.getFileExtension(filePath) },
      width: '90vw', maxWidth: '1200px', height: '90vh',
      panelClass: 'file-preview-dialog', autoFocus: false
    });
  }
 
  onFileDownload(filePath: string, fileName: string, event: Event): void {
    event.stopPropagation();
    this.popupService.openGenericConfirmation(
      'Download File', `Do you want to download "${fileName}"?`,
      { confirmButtonText: 'Download', confirmButtonIcon: 'download', icon: 'download', iconColor: 'primary' }
    ).subscribe(result => {
      if (result?.action === 'confirm') this._downloadFile(filePath, fileName);
    });
  }
 
  private _downloadFile(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    this.globalService.showSnackbar('Download started', 'success');
  }
 
  // ─── Column / icon helpers ────────────────────────────────────────────────
 
  shouldShowIcon(column: ListColumn): boolean {
    return column.showIcon !== false
      && ['phone','email','address','country'].includes(column.type || '');
  }
 
  getColumnIcon(column: ListColumn): string {
    switch (column.type) {
      case 'phone':   return 'phone';
      case 'email':   return 'email';
      case 'address': return 'location_on';
      case 'country': return 'public';
      default:        return 'info';
    }
  }
 
  // ─── TrackBy ──────────────────────────────────────────────────────────────
 
  trackByFn(_index: number, item: any): any {
    return item?.id ?? item?.userProfileId ?? item?.assetId ?? _index;
  }
 
  trackByColKey(_index: number, col: ListColumn): string { return col.key; }
 
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════
 
  private get _exportFileName(): string {
    return this.config?.exportFileName ?? this.config?.title?.replace(/\s+/g, '_') ?? 'export';
  }
 
  private _toExcel(rows: any[]): void {
    const visCols    = this.config.columns.filter(c => c.visible !== false && c.type !== 'file');
    const exportRows = rows.map(item => {
      const row: any = {};
      visCols.forEach(col => { row[col.label] = this.getExportValue(item[col.key], col, item); });
      return row;
    });
 
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = visCols.map(c => ({ wch: Math.max(c.label.length + 4, 16) }));
 
    const currencyCol = this.config.columns.find(c => c.type === 'currency');
    const totalVal    = currencyCol
      ? rows.reduce((s, item) => s + (Number(item[currencyCol.key]) || 0), 0)
      : 0;
 
    const summaryRows: any[] = [
      { Metric: 'Report Title',   Value: this.config.title },
      { Metric: 'Generated Date', Value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
      { Metric: 'Total Records',  Value: rows.length }
    ];
    if (currencyCol) summaryRows.push({ Metric: `Total ${currencyCol.label}`, Value: this._currencyFmt.format(totalVal) });
 
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 24 }, { wch: 36 }];
 
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.config.title.substring(0, 31));
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.writeFile(wb, `${this._exportFileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
 
  private _toPDF(rows: any[]): void {
    const visCols = this.config.columns.filter(c => c.visible !== false && !['file','avatar'].includes(c.type || ''));
    const orient  = visCols.length > 5 ? 'landscape' : 'portrait';
    const doc     = new jsPDF({ orientation: orient, unit: 'mm', format: 'a4' });
    const pw      = doc.internal.pageSize.getWidth();
    const primary: [number,number,number]  = [103, 58, 183];
    const ltPurple: [number,number,number] = [237, 231, 246];
 
    doc.setFillColor(...primary);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(this.config.title, 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 20);
    doc.text(`Total Records: ${rows.length}`, pw / 2, 20);
 
    const currencyCol = this.config.columns.find(c => c.type === 'currency' && c.visible !== false);
    let yPos = 34;
    if (currencyCol) {
      const tot    = rows.reduce((s, item) => s + (Number(item[currencyCol.key]) || 0), 0);
      const fmtTot = this._currencyFmt.format(tot);
      doc.text(`Total ${currencyCol.label}: ${fmtTot}`, pw - 14, 20, { align: 'right' });
      doc.setFillColor(...ltPurple);
      doc.rect(0, yPos - 5, pw, 14, 'F');
      doc.setTextColor(...primary);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(fmtTot, 14, yPos + 2);
      doc.setTextColor(100,100,100); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(currencyCol.label.toUpperCase(), 14, yPos + 7);
      yPos += 18;
    }
 
    autoTable(doc, {
      head: [visCols.map(c => c.label)],
      body: rows.map(item => visCols.map(col => this.getExportValue(item[col.key], col, item))),
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 4, lineColor: [220,220,220], lineWidth: 0.2, textColor: [50,50,50], overflow: 'ellipsize' },
      headStyles: { fillColor: primary, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8.5, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250,247,255] },
      columnStyles: this._pdfColStyles(visCols),
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pages = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8); doc.setTextColor(150,150,150); doc.setFont('helvetica','normal');
        doc.text(`Page ${data.pageNumber} of ${pages}  •  ${this.config.title}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        doc.setDrawColor(...primary); doc.setLineWidth(0.5);
        doc.line(14, doc.internal.pageSize.getHeight() - 12, pw - 14, doc.internal.pageSize.getHeight() - 12);
      }
    });
 
    doc.save(`${this._exportFileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
 
  private _pdfColStyles(cols: ListColumn[]): Record<number, any> {
    const s: Record<number, any> = {};
    cols.forEach((c, i) => {
      if (c.type === 'currency' || c.type === 'number') s[i] = { halign: 'right' };
      else if (c.type === 'boolean')                    s[i] = { halign: 'center' };
      else if (c.type === 'date')                       s[i] = { halign: 'center', cellWidth: 28 };
    });
    return s;
  }
}