import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
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

// ✅ ADD NEW TYPES
export type ActionButtonType =
  | 'raised'
  | 'flat'
  | 'stroked'
  | 'icon'
  | 'fab'
  | 'mini-fab';

export type ActionPosition =
  | 'start'
  | 'end'
  | 'replace';

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
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'avatar' | 'phone' | 'email' | 'address' | 'country' | 'file';
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

// ✅ UPDATED ListAction interface
export interface ListAction {
  key: string;
  label: string;
  icon: string;

  // NEW: Button customization
  buttonType?: ActionButtonType;
  color?: 'primary' | 'accent' | 'warn' | 'success' | 'info' | string;

  // NEW: Positioning
  position?: ActionPosition;
  order?: number;

  // NEW: Visibility conditions
  hidden?: boolean;
  showIf?: (item: any) => boolean;
  disabledIf?: (item: any) => boolean;

  // NEW: Popup configuration
  popup?: ActionPopupConfig;

  // Existing properties
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

  // ✅ NEW: Custom actions header
  actionsHeaderLabel?: string;

  columns: ListColumn[];
  actions?: ListAction[];
}

export interface SelectionActionEvent {
  action: 'delete' | 'export' | 'custom';
  selectedItems: any[];
  customAction?: string;
}

@Component({
  selector: 'app-list-widget',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    trigger('rowAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.98)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
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
  ],
})
export class ListWidgetComponent implements OnInit, AfterViewInit, AfterViewChecked {
 
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
 
  @Input() config!: ListConfig;
  @Input() loading = false;
 
  private _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value || [];
    this.dataSource.data = this._data;
    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort)      this.dataSource.sort      = this.sort;
    this.showPagination.set(this._data.length > (this.config?.pageSize ?? 10));
    this.updateSelectionState();
  }
  get data() { return this._data; }
 
  @Output() actionClick    = new EventEmitter<{ action: string; item: any }>();
  @Output() addClick       = new EventEmitter<void>();
  @Output() refreshClick   = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() selectionAction = new EventEmitter<SelectionActionEvent>();
  @Output() rowClick       = new EventEmitter<{ action: string; item: any }>();
 
  private countryService = inject(CountryService);
  private dialog         = inject(MatDialog);
  private globalService  = inject(GlobalService);
  private popupService   = inject(PopupWidgetService);
  // ✅ Inject CompanyStorageService to read currency from localStorage
  private companyStorage = inject(CompanyStorageService);
 
  dataSource    = new MatTableDataSource<any>([]);
  selection     = new SelectionModel<any>(true, []);
  searchControl = new FormControl('');
  showPagination = signal(false);
  visibleColumns = signal<ListColumn[]>([]);
  hasSelection   = signal(false);
  selectedCount  = signal(0);
 
  // ✅ Currency code resolved ONCE from localStorage on init
  // Falls back to 'USD' if nothing stored — safe for all pages
  private _currencyCode = 'USD';
 
  startActions   = computed(() => this.getActionsByPosition('start'));
  endActions     = computed(() => this.getActionsByPosition('end'));
  defaultActions = computed(() => this.getDefaultActions());
  replaceActions = computed(() => this.getActionsByPosition('replace'));
 
  hasStartActions   = computed(() => this.startActions().length > 0);
  hasEndActions     = computed(() => this.endActions().length > 0);
  hasReplaceActions = computed(() => this.replaceActions().length > 0);
 
  shouldScroll = computed(() => {
    const pageSize = this.paginator?.pageSize || this.config?.pageSize || 10;
    const maxRows  = this.config?.maxVisibleRows || 5;
    return pageSize > maxRows;
  });
 
  tableMaxHeight = computed(() => {
    const maxRows   = this.config?.maxVisibleRows || 5;
    const pageSize  = this.paginator?.pageSize || this.config?.pageSize || 10;
    const rowHeight = this.config?.compactMode ? 52 : 64;
    const headerH   = 48;
    if (pageSize <= maxRows) return 'none';
    return `${(maxRows * rowHeight) + headerH}px`;
  });
 
  constructor(private cdr: ChangeDetectorRef) {}
 
  ngOnInit() {
    // ✅ Resolve currency from localStorage once on init
    this._resolveCurrency();
 
    if (this.config?.columns) {
      this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
    }
    this.initializeComponent();
    this.setupSearch();
    this.setupSelectionTracking();
  }
 
  ngAfterViewInit() {
    if (this.sort)      this.dataSource.sort      = this.sort;
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginator.page.subscribe(() => { /* height recomputed via signal */ });
    }
    this.cdr.detectChanges();
  }
 
  ngAfterViewChecked() {
    if (this.dataSource && this.paginator && this.dataSource.paginator !== this.paginator) this.dataSource.paginator = this.paginator;
    if (this.dataSource && this.sort      && this.dataSource.sort      !== this.sort)      this.dataSource.sort      = this.sort;
  }
 
  // ✅ Currency resolution — reads from localStorage via CompanyStorageService
  // Safe: returns 'USD' if no company stored or currency is missing/invalid
  private _resolveCurrency(): void {
    try {
      const company = this.companyStorage.get();
      const code    = company?.currency?.trim();
      if (code && code.length === 3) {
        // Quick validity check — Intl will throw on invalid codes
        new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(0);
        this._currencyCode = code;
      } else {
        this._currencyCode = 'USD';
      }
    } catch {
      this._currencyCode = 'USD';
    }
  }
 
  // ─── Action helpers (unchanged) ──────────────────────────────────────────
  private getActionsByPosition(position: ActionPosition): ListAction[] {
    if (!this.config?.actions) return [];
    return this.config.actions.filter(a => (a.position || 'end') === position).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
 
  private getDefaultActions(): ListAction[] {
    if (!this.config?.actions) return [];
    return this.config.actions.filter(a => !a.position || a.position === 'end').filter(a => !a.buttonType).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
 
  isActionVisible(action: ListAction, item: any): boolean {
    if (action.hidden) return false;
    if (action.showIf) return action.showIf(item);
    return true;
  }
 
  isActionDisabled(action: ListAction, item: any): boolean {
    if (action.disabledIf) return action.disabledIf(item);
    return false;
  }
 
  getActionButtonClass(action: ListAction): string {
    const baseClass  = 'action-btn';
    const typeClass  = `btn-${action.buttonType || 'icon'}`;
    const colorClass = action.color ? `btn-${action.color}` : '';
    return `${baseClass} ${typeClass} ${colorClass}`.trim();
  }
 
  onActionClick(action: string | ListAction, item: any, event?: Event): void {
    event?.stopPropagation();
    if (typeof action === 'object') {
      const actionObj = action as ListAction;
      if (actionObj.popup)          { this.handleActionWithPopup(actionObj, item); return; }
      if (actionObj.confirmMessage) { this.handleActionWithConfirmation(actionObj, item); return; }
      this.actionClick.emit({ action: actionObj.key, item });
    } else {
      this.actionClick.emit({ action: action as string, item });
    }
  }
 
  private handleActionWithPopup(action: ListAction, item: any): void {
    if (!action.popup) return;
    const popupConfig = action.popup;
    const fields = typeof popupConfig.fields === 'function' ? popupConfig.fields() : popupConfig.fields;
    this.popupService.openFormPopup(
      { title: popupConfig.title, subtitle: popupConfig.subtitle, icon: popupConfig.icon || action.icon, fields, columns: popupConfig.columns || 2, maxWidth: popupConfig.maxWidth || '800px', submitButtonText: popupConfig.submitButtonText || 'Submit' },
      item
    ).subscribe(result => {
      if (result && result.action === 'submit' && popupConfig.onSubmit) {
        this.loading = true;
        const submitResult = popupConfig.onSubmit(result.data, item);
        if (submitResult && typeof submitResult.subscribe === 'function') {
          submitResult.subscribe({
            next: () => { this.loading = false; this.globalService.showSnackbar(`${action.label} completed successfully`, 'success'); this.refreshClick.emit(); },
            error: (error: any) => { this.loading = false; this.globalService.showToastr(`Failed to ${action.label.toLowerCase()}`, 'error'); }
          });
        } else {
          this.loading = false; this.globalService.showSnackbar(`${action.label} completed successfully`, 'success'); this.refreshClick.emit();
        }
      }
    });
  }
 
  private handleActionWithConfirmation(action: ListAction, item: any): void {
    this.popupService.openGenericConfirmation(
      action.confirmTitle || `Confirm ${action.label}`, action.confirmMessage!,
      { confirmButtonText: action.label, confirmButtonIcon: action.icon, icon: action.icon, iconColor: action.color === 'warn' ? 'warn' : 'primary' }
    ).subscribe(result => { if (result && result.action === 'confirm') this.actionClick.emit({ action: action.key, item }); });
  }
 
  // ─── File helpers (unchanged) ─────────────────────────────────────────────
  getFileExtension(filePath: string): string {
    if (!filePath) return '';
    const parts = filePath.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
 
  getFileName(filePath: string): string {
    if (!filePath) return '';
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }
 
  getTruncatedFileName(filePath: string, maxLength: number = 20): string {
    if (!filePath) return '';
    const fileName  = this.getFileName(filePath);
    const extension = this.getFileExtension(filePath);
    if (fileName.length <= maxLength) return fileName;
    const nameWithoutExt  = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncateLength  = maxLength - extension.length - 4;
    if (truncateLength > 0) return `${nameWithoutExt.substring(0, truncateLength)}...${extension}`;
    return `${fileName.substring(0, maxLength - 3)}...`;
  }
 
  getFileTypeIcon(extension: string): string {
    const ext = extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
    return 'insert_drive_file';
  }
 
  isPreviewable(extension: string): boolean {
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension.toLowerCase());
  }
 
  onFilePreview(filePath: string, event: Event): void {
    event.stopPropagation();
    this.dialog.open(FilePreviewComponent, {
      data: { fileUrl: filePath, fileName: this.getFileName(filePath), fileType: this.getFileExtension(filePath) },
      width: '90vw', maxWidth: '1200px', height: '90vh', panelClass: 'file-preview-dialog', autoFocus: false
    });
  }
 
  onFileDownload(filePath: string, fileName: string, event: Event): void {
    event.stopPropagation();
    this.popupService.openGenericConfirmation(
      'Download File', `Do you want to download "${fileName}"?`,
      { confirmButtonText: 'Download', confirmButtonIcon: 'download', icon: 'download', iconColor: 'primary' }
    ).subscribe(result => { if (result && result.action === 'confirm') this.downloadFile(filePath, fileName); });
  }
 
  private downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url; link.download = fileName; link.target = '_blank';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.globalService.showSnackbar('Download started', 'success');
  }
 
  // ─── Component init ───────────────────────────────────────────────────────
  private initializeComponent() {
    if (!this.config?.columns?.length) { console.warn('ListWidget: No columns configured'); return; }
    this.dataSource.data = this.data;
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filter.trim().toLowerCase();
      if (!searchTerm) return true;
      return this.config.columns.some(column => {
        const value = data[column.key];
        if (value == null) return false;
        if (column.type === 'avatar') return data[column.nameField || column.key]?.toString().toLowerCase().includes(searchTerm);
        if (column.type === 'country') return value?.toString().toLowerCase().includes(searchTerm) || this.getCountryName(value).toLowerCase().includes(searchTerm);
        return value.toString().toLowerCase().includes(searchTerm);
      });
    };
  }
 
  private setupSearch() {
    if (this.config?.showSearch) {
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(value => { this.dataSource.filter = value || ''; });
    }
  }
 
  private setupSelectionTracking() {
    this.selection.changed.subscribe(() => {
      this.updateSelectionState();
      this.selectionChange.emit(this.selection.selected);
    });
  }
 
  private updateSelectionState() {
    this.hasSelection.set(this.selection.selected.length > 0);
    this.selectedCount.set(this.selection.selected.length);
  }
 
  displayedColumns(): string[] {
    const cols = this.config?.columns?.filter(c => c.visible !== false).map(c => c.key) || [];
    if (this.config?.selectable) cols.unshift('select');
    if (this.config?.actions?.length) cols.push('actions');
    return cols;
  }
 
  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.filteredData.length && this.dataSource.filteredData.length > 0;
  }
 
  isIndeterminate(): boolean {
    return this.selection.selected.length > 0 && this.selection.selected.length < this.dataSource.filteredData.length;
  }
 
  toggleAllRows(): void { this.isAllSelected() ? this.selection.clear() : this.dataSource.filteredData.forEach(row => this.selection.select(row)); }
  toggleRow(row: any): void { this.selection.toggle(row); }
 
  onRowClick(row: any): void {
    if (this.config?.rowClickAction && this.config?.selectable) {
      this.rowClick.emit({ action: this.config.rowClickAction, item: row });
    }
  }
 
  toggleColumn(column: ListColumn): void {
    column.visible = !column.visible;
    this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
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
      this.exportDataToExcel(this.selection.selected);
      this.selectionAction.emit({ action: 'export', selectedItems: [...this.selection.selected] });
    }
  }
 
  // ─── Export helpers (use resolved currency code) ─────────────────────────
  private exportDataToExcel(dataToExport: any[]): void {
    const exportRows = dataToExport.map(item => {
      const row: any = {};
      this.config.columns.filter(col => col.visible !== false && col.type !== 'file')
        .forEach(col => { row[col.label] = this.getExportValue(item[col.key], col, item); });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    ws['!cols'] = this.config.columns.filter(col => col.visible !== false && col.type !== 'file').map(col => ({ wch: Math.max(col.label.length + 4, 16) }));
 
    const totalValue = dataToExport.reduce((sum, item) => {
      const currencyCol = this.config.columns.find(c => c.type === 'currency');
      return currencyCol ? sum + (Number(item[currencyCol.key]) || 0) : sum;
    }, 0);
 
    const summaryRows: any[] = [
      { Metric: 'Report Title',   Value: this.config.title },
      { Metric: 'Generated Date', Value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
      { Metric: 'Total Records',  Value: dataToExport.length }
    ];
    const currencyCol = this.config.columns.find(c => c.type === 'currency' && c.visible !== false);
    if (currencyCol) summaryRows.push({ Metric: `Total ${currencyCol.label}`, Value: this._formatCurrencyForExport(totalValue) });
 
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 24 }, { wch: 36 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.config.title.substring(0, 31));
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    const fileName = `${this.config?.exportFileName || this.config?.title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
 
  exportToPDF():          void { this.exportDataToPDF(this.dataSource.filteredData); }
  exportSelectedToPDF():  void { if (this.selection.selected.length > 0) this.exportDataToPDF(this.selection.selected); }
  exportToExcel():        void { this.exportData(this.dataSource.filteredData); }
  clearSelection():       void { this.selection.clear(); }
 
  private exportData(dataToExport: any[]): void {
    const exportData = dataToExport.map(item => {
      const exportItem: any = {};
      this.config.columns.filter(col => col.visible !== false && col.type !== 'avatar')
        .forEach(col => { exportItem[col.label] = this.getExportValue(item[col.key], col, item); });
      return exportItem;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const fileName = `${this.config?.exportFileName || this.config?.title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
 
  private exportDataToPDF(dataToExport: any[]): void {
    const visibleCols = this.config.columns.filter(col => col.visible !== false && !['file', 'avatar'].includes(col.type || ''));
    const orientation = visibleCols.length > 5 ? 'landscape' : 'portrait';
    const doc         = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth   = doc.internal.pageSize.getWidth();
    const primaryColor: [number, number, number] = [103, 58, 183];
    const lightPurple: [number, number, number]  = [237, 231, 246];
 
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text(this.config.title, 14, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 20);
    doc.text(`Total Records: ${dataToExport.length}`, pageWidth / 2, 20);
 
    const currencyCol = this.config.columns.find(c => c.type === 'currency' && c.visible !== false);
    let yPos = 34;
    if (currencyCol) {
      const totalVal  = dataToExport.reduce((sum, item) => sum + (Number(item[currencyCol.key]) || 0), 0);
      doc.text(`Total ${currencyCol.label}: ${this._formatCurrencyForExport(totalVal)}`, pageWidth - 14, 20, { align: 'right' });
      doc.setFillColor(...lightPurple);
      doc.rect(0, yPos - 5, pageWidth, 14, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(this._formatCurrencyForExport(totalVal), 14, yPos + 2);
      doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(currencyCol.label.toUpperCase(), 14, yPos + 7);
      yPos += 18;
    }
 
    autoTable(doc, {
      head: [visibleCols.map(c => c.label)],
      body: dataToExport.map(item => visibleCols.map(col => this.getExportValue(item[col.key], col, item))),
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.2, textColor: [50, 50, 50], overflow: 'ellipsize' },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250, 247, 255] },
      columnStyles: this.buildPDFColumnStyles(visibleCols),
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount   = (doc as any).internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal');
        doc.text(`Page ${currentPage} of ${pageCount}  •  ${this.config.title}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        doc.setDrawColor(...primaryColor); doc.setLineWidth(0.5);
        doc.line(14, doc.internal.pageSize.getHeight() - 12, pageWidth - 14, doc.internal.pageSize.getHeight() - 12);
      }
    });
 
    const fileName = `${this.config?.exportFileName || this.config?.title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
 
  private buildPDFColumnStyles(columns: ListColumn[]): { [key: number]: any } {
    const styles: { [key: number]: any } = {};
    columns.forEach((col, i) => {
      if (col.type === 'currency' || col.type === 'number') styles[i] = { halign: 'right' };
      else if (col.type === 'boolean') styles[i] = { halign: 'center' };
      else if (col.type === 'date')    styles[i] = { halign: 'center', cellWidth: 28 };
    });
    return styles;
  }
 
  // ✅ CURRENCY FORMAT HELPERS
  // All currency formatting goes through here — reads _currencyCode resolved from localStorage.
  // Safe: if invalid code, falls back to USD silently.
 
  /**
   * Formats a number as currency for display in the table cell.
   * Uses the company currency from localStorage (set once on ngOnInit).
   */
  formatCellCurrency(value: number): string {
    return this._formatCurrencyIntl(value);
  }
 
  /**
   * Formats a number as currency for export (Excel/PDF).
   * Uses the company currency from localStorage.
   */
  private _formatCurrencyForExport(value: number): string {
    return this._formatCurrencyIntl(value);
  }
 
  /**
   * Core Intl formatter. Uses this._currencyCode (resolved from localStorage).
   * Safe fallback to USD on any error.
   */
  private _formatCurrencyIntl(value: number): string {
    try {
      return new Intl.NumberFormat('en', {
        style:                 'currency',
        currency:              this._currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value ?? 0);
    } catch {
      // Fallback to USD if the stored currency code is somehow invalid at runtime
      return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(value ?? 0);
    }
  }
 
  // ─── Cell value formatting ────────────────────────────────────────────────
  getExportValue(value: any, column: ListColumn, item: any): string {
    if (value == null) return '';
    switch (column.type) {
      case 'currency': return this._formatCurrencyForExport(value);
      case 'number':   return new Intl.NumberFormat().format(value);
      case 'date':     return new Date(value).toLocaleDateString();
      case 'boolean':  return value ? 'Yes' : 'No';
      case 'country':  return this.getCountryName(value);
      case 'avatar':   return item[column.nameField || column.key] || '';
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey) {
          return `${value} ${item[column.emailVerificationKey] ? '(Verified)' : '(Not Verified)'}`;
        }
        return value;
      default: return value.toString();
    }
  }
 
  /**
   * ✅ UPDATED: currency type now uses the company's currency from localStorage.
   * All other types unchanged.
   */
  formatCellValue(value: any, column: ListColumn, item?: any): string {
    if (value == null) return '';
    switch (column.type) {
      case 'currency': return this._formatCurrencyIntl(value);   // ← company currency
      case 'number':   return new Intl.NumberFormat().format(value);
      case 'date':     return new Date(value).toLocaleDateString();
      case 'boolean':  return value ? 'Yes' : 'No';
      default:         return value.toString();
    }
  }
 
  // ─── Avatar / display helpers ─────────────────────────────────────────────
  getAvatarUrl(item: any, column: ListColumn): string {
    return item[column.avatarField || 'avatar'] || '/assets/images/ProfilePic.png';
  }
 
  getDisplayName(item: any, column: ListColumn): string {
    return item[column.nameField || column.key] || '';
  }
 
  getCountryFlagUrl(country: string): string {
    if (!country) return '';
    const countries = this.countryService.getAllCountries();
    const match = countries.find(c => c.code.toUpperCase() === country.toUpperCase() || c.name.toLowerCase() === country.toLowerCase());
    return this.countryService.getFlagUrl(match ? match.code : country);
  }
 
  getCountryName(countryCode: string): string {
    if (!countryCode) return '';
    const countries = this.countryService.getAllCountries();
    const country   = countries.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
    return country ? country.name : countryCode;
  }
 
  formatPhoneNumber(phone: string | number): string {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    return phoneStr;
  }
 
  getColumnTooltip(column: ListColumn, value: any, item?: any): string {
    if (column.tooltip) return column.tooltip;
    switch (column.type) {
      case 'avatar':  return this.getDisplayName(item!, column);
      case 'country': return `${this.getCountryName(value)} (${value})`;
      case 'phone':   return `Call ${this.formatPhoneNumber(value)}`;
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey && item) {
          return item[column.emailVerificationKey] ? `Send email to ${value} (Verified)` : `${value} (Not Verified)`;
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
 
  trackByFn(index: number, item: any): any { return item.id || item.userProfileId || index; }
 
  shouldShowIcon(column: ListColumn): boolean {
    return column.showIcon !== false && ['phone', 'email', 'address', 'country'].includes(column.type || '');
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
}