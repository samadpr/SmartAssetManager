import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
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
    MatProgressSpinnerModule
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
export class ListWidgetComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input() config!: ListConfig;
  @Input() loading = false;
  private _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value || [];
    this.dataSource.data = this._data;

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    this.showPagination.set(this._data.length > (this.config?.pageSize ?? 10));
    this.updateSelectionState();
    this.updateTableHeight(); // 🆕 Update height when data changes
  }
  get data() { return this._data; }

  @Output() actionClick = new EventEmitter<{ action: string, item: any }>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() selectionAction = new EventEmitter<SelectionActionEvent>();
  @Output() rowClick = new EventEmitter<{ action: string, item: any }>();

  private countryService = inject(CountryService);
  private dialog = inject(MatDialog);
  private globalService = inject(GlobalService);
  private popupService = inject(PopupWidgetService);

  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  searchControl = new FormControl('');
  showPagination = signal(false);
  visibleColumns = signal<ListColumn[]>([]);
  hasSelection = signal(false);
  selectedCount = signal(0);

  // ✅ NEW: Computed actions by position
  startActions = computed(() => this.getActionsByPosition('start'));
  endActions = computed(() => this.getActionsByPosition('end'));
  defaultActions = computed(() => this.getDefaultActions());
  replaceActions = computed(() => this.getActionsByPosition('replace'));

  hasStartActions = computed(() => this.startActions().length > 0);
  hasEndActions = computed(() => this.endActions().length > 0);
  hasReplaceActions = computed(() => this.replaceActions().length > 0);

  // 🆕 NEW: Computed signal for table scrolling
  shouldScroll = computed(() => {
    const pageSize = this.paginator?.pageSize || this.config?.pageSize || 10;
    const maxRows = this.config?.maxVisibleRows || 5;
    return pageSize > maxRows;
  });

  // 🆕 NEW: Computed table height based on page size
  tableMaxHeight = computed(() => {
    const maxRows = this.config?.maxVisibleRows || 5;
    const pageSize = this.paginator?.pageSize || this.config?.pageSize || 10;
    const rowHeight = this.config?.compactMode ? 52 : 64; // Approximate row heights
    const headerHeight = 48;

    if (pageSize <= maxRows) {
      return 'none'; // No max height, show all rows
    }

    // Calculate height for max visible rows + header
    return `${(maxRows * rowHeight) + headerHeight}px`;
  });

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // 🔧 Initialize visible columns FIRST before any data operations
    if (this.config?.columns) {
      this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
    }

    this.initializeComponent();
    this.setupSearch();
    this.setupSelectionTracking();
  }

  ngAfterViewInit() {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;

      // 🆕 Listen to page changes to update height
      this.paginator.page.subscribe(() => {
        this.updateTableHeight();
      });
    }

    // 🔧 Detect changes after view initialization
    this.cdr.detectChanges();
  }

  ngAfterViewChecked() {
    if (this.dataSource && this.paginator && this.dataSource.paginator !== this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.dataSource && this.sort && this.dataSource.sort !== this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  // ✅ NEW: Get actions by position
  private getActionsByPosition(position: ActionPosition): ListAction[] {
    if (!this.config?.actions) return [];

    return this.config.actions
      .filter(action => (action.position || 'end') === position)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // ✅ NEW: Get default actions (no position or position='end')
  private getDefaultActions(): ListAction[] {
    if (!this.config?.actions) return [];

    return this.config.actions
      .filter(action => !action.position || action.position === 'end')
      .filter(action => !action.buttonType) // Only icon buttons by default
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // ✅ NEW: Check if action should be visible
  isActionVisible(action: ListAction, item: any): boolean {
    if (action.hidden) return false;
    if (action.showIf) return action.showIf(item);
    return true;
  }

  // ✅ NEW: Check if action should be disabled
  isActionDisabled(action: ListAction, item: any): boolean {
    if (action.disabledIf) return action.disabledIf(item);
    return false;
  }

  // ✅ NEW: Get action button class
  getActionButtonClass(action: ListAction): string {
    const baseClass = 'action-btn';
    const typeClass = `btn-${action.buttonType || 'icon'}`;
    const colorClass = action.color ? `btn-${action.color}` : '';
    return `${baseClass} ${typeClass} ${colorClass}`.trim();
  }

  // ✅ UPDATED: Handle action click with popup support
  onActionClick(action: string | ListAction, item: any, event?: Event): void {
    event?.stopPropagation();

    if (typeof action === 'object') {
      const actionObj = action as ListAction;

      if (actionObj.popup) {
        this.handleActionWithPopup(actionObj, item);
        return;
      }

      if (actionObj.confirmMessage) {
        this.handleActionWithConfirmation(actionObj, item);
        return;
      }

      this.actionClick.emit({ action: actionObj.key, item });
    } else {
      this.actionClick.emit({ action: action as string, item });
    }
  }

  // ✅ NEW: Handle action with popup
  private handleActionWithPopup(action: ListAction, item: any): void {
    if (!action.popup) return;

    const popupConfig = action.popup;

    const fields =
      typeof popupConfig.fields === 'function'
        ? popupConfig.fields()
        : popupConfig.fields;

    this.popupService.openFormPopup(
      {
        title: popupConfig.title,
        subtitle: popupConfig.subtitle,
        icon: popupConfig.icon || action.icon,
        fields,
        columns: popupConfig.columns || 2,
        maxWidth: popupConfig.maxWidth || '800px',
        submitButtonText: popupConfig.submitButtonText || 'Submit'
      },
      item
    ).subscribe(result => {
      if (result && result.action === 'submit' && popupConfig.onSubmit) {
        this.loading = true;

        const submitResult = popupConfig.onSubmit(result.data, item);

        // Check if result is Observable
        if (submitResult && typeof submitResult.subscribe === 'function') {
          submitResult.subscribe({
            next: (response: any) => {
              this.loading = false;
              this.globalService.showSnackbar(
                `${action.label} completed successfully`,
                'success'
              );
              this.refreshClick.emit();
            },
            error: (error: any) => {
              this.loading = false;
              this.globalService.showToastr(
                `Failed to ${action.label.toLowerCase()}`,
                'error'
              );
              console.error(`Action ${action.key} failed:`, error);
            }
          });
        } else {
          // Handle non-observable result
          this.loading = false;
          this.globalService.showSnackbar(
            `${action.label} completed successfully`,
            'success'
          );
          this.refreshClick.emit();
        }
      }
    });
  }

  // ✅ NEW: Handle action with confirmation
  private handleActionWithConfirmation(action: ListAction, item: any): void {
    this.popupService.openGenericConfirmation(
      action.confirmTitle || `Confirm ${action.label}`,
      action.confirmMessage!,
      {
        confirmButtonText: action.label,
        confirmButtonIcon: action.icon,
        icon: action.icon,
        iconColor: action.color === 'warn' ? 'warn' : 'primary'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.actionClick.emit({ action: action.key, item });
      }
    });
  }

  // 🆕 File handling methods

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

    const fileName = this.getFileName(filePath);
    const extension = this.getFileExtension(filePath);

    if (fileName.length <= maxLength) {
      return fileName;
    }

    // Remove extension for truncation
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncateLength = maxLength - extension.length - 4; // -4 for "..." and "."

    if (truncateLength > 0) {
      return `${nameWithoutExt.substring(0, truncateLength)}...${extension}`;
    }

    return `${fileName.substring(0, maxLength - 3)}...`;
  }

  getFileTypeIcon(extension: string): string {
    const ext = extension.toLowerCase();

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }

    // PDFs
    if (ext === 'pdf') {
      return 'picture_as_pdf';
    }

    // Documents
    if (['doc', 'docx'].includes(ext)) {
      return 'description';
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'table_chart';
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'folder_zip';
    }

    return 'insert_drive_file';
  }

  isPreviewable(extension: string): boolean {
    const ext = extension.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return previewableTypes.includes(ext);
  }

  onFilePreview(filePath: string, event: Event): void {
    event.stopPropagation();

    const fileName = this.getFileName(filePath);
    const fileExtension = this.getFileExtension(filePath);

    this.dialog.open(FilePreviewComponent, {
      data: {
        fileUrl: filePath,
        fileName: fileName,
        fileType: fileExtension
      },
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      panelClass: 'file-preview-dialog',
      autoFocus: false
    });
  }

  onFileDownload(filePath: string, fileName: string, event: Event): void {
    event.stopPropagation();

    this.popupService.openGenericConfirmation(
      'Download File',
      `Do you want to download "${fileName}"?`,
      {
        confirmButtonText: 'Download',
        confirmButtonIcon: 'download',
        icon: 'download',
        iconColor: 'primary'
      }
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.downloadFile(filePath, fileName);
      }
    });
  }

  private downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.globalService.showSnackbar('Download started', 'success');
  }


  // 🆕 NEW: Method to update table height (removed detectChanges to prevent errors)
  private updateTableHeight() {
    // Height is updated via computed signal automatically
    // No need for manual change detection here
  }

  private initializeComponent() {
    // 🔧 Only set data if we have valid columns configured
    if (!this.config?.columns?.length) {
      console.warn('ListWidget: No columns configured');
      return;
    }

    this.dataSource.data = this.data;

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filter.trim().toLowerCase();
      if (!searchTerm) return true;

      return this.config.columns.some(column => {
        const value = data[column.key];
        if (value == null) return false;

        switch (column.type) {
          case 'avatar':
            const nameValue = data[column.nameField || column.key];
            return nameValue?.toString().toLowerCase().includes(searchTerm);
          case 'country':
            const countryName = this.getCountryName(value);
            return value?.toString().toLowerCase().includes(searchTerm) ||
              countryName.toLowerCase().includes(searchTerm);
          default:
            return value.toString().toLowerCase().includes(searchTerm);
        }
      });
    };
  }

  private setupSearch() {
    if (this.config?.showSearch) {
      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(value => {
          this.dataSource.filter = value || '';
        });
    }
  }

  private setupSelectionTracking() {
    this.selection.changed.subscribe(change => {
      this.updateSelectionState();
      this.selectionChange.emit(this.selection.selected);
    });
  }

  private updateSelectionState() {
    const hasItems = this.selection.selected.length > 0;
    this.hasSelection.set(hasItems);
    this.selectedCount.set(this.selection.selected.length);
  }

  displayedColumns(): string[] {
    const cols = this.config?.columns
      ?.filter(c => c.visible !== false)
      .map(c => c.key) || [];

    if (this.config?.selectable) {
      cols.unshift('select');
    }
    if (this.config?.actions?.length) {
      cols.push('actions');
    }
    return cols;
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows && numRows > 0;
  }

  isIndeterminate(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected > 0 && numSelected < numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach(row => this.selection.select(row));
    }
  }

  toggleRow(row: any): void {
    this.selection.toggle(row);
  }

  onRowClick(row: any): void {
    if (this.config?.rowClickAction && this.config?.selectable) {
      this.rowClick.emit({ action: this.config.rowClickAction, item: row });
    }
  }

  toggleColumn(column: ListColumn): void {
    column.visible = !column.visible;
    this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
  }

  // onActionClick(action: string, item: any, event?: Event): void {
  //   event?.stopPropagation();
  //   this.actionClick.emit({ action, item });
  // }

  onAddClick(): void {
    this.addClick.emit();
  }

  onRefreshClick(): void {
    this.refreshClick.emit();
  }

  onDeleteSelected(): void {
    if (this.selection.selected.length > 0) {
      this.selectionAction.emit({
        action: 'delete',
        selectedItems: [...this.selection.selected]
      });
    }
  }

  onExportSelected(): void {
    if (this.selection.selected.length > 0) {
      this.exportData(this.selection.selected);
      this.selectionAction.emit({
        action: 'export',
        selectedItems: [...this.selection.selected]
      });
    }
  }

  clearSelection(): void {
    this.selection.clear();
  }

  exportToExcel(): void {
    this.exportData(this.dataSource.filteredData);
  }

  private exportData(dataToExport: any[]): void {
    const exportData = dataToExport.map(item => {
      const exportItem: any = {};
      this.config.columns
        .filter(col => col.visible !== false && col.type !== 'avatar')
        .forEach(col => {
          exportItem[col.label] = this.getExportValue(item[col.key], col, item);
        });
      return exportItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const fileName = this.config?.exportFileName ||
      `${this.config?.title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  private getExportValue(value: any, column: ListColumn, item: any): string {
    if (value == null) return '';

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat().format(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'country':
        return `${this.getCountryName(value)}`;
      case 'avatar':
        return item[column.nameField || column.key] || '';
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey) {
          const verified = item[column.emailVerificationKey];
          return `${value} ${verified ? '(Verified)' : '(Not Verified)'}`;
        }
        return value;
      default:
        return value.toString();
    }
  }

  formatCellValue(value: any, column: ListColumn, item?: any): string {
    if (value == null) return '';

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'number':
        return new Intl.NumberFormat().format(value);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toString();
    }
  }

  getAvatarUrl(item: any, column: ListColumn): string {
    return item[column.avatarField || 'avatar'] || '/assets/images/ProfilePic.png';
  }

  getDisplayName(item: any, column: ListColumn): string {
    return item[column.nameField || column.key] || '';
  }

  getCountryFlagUrl(country: string): string {
    if (!country) return '';

    const countries = this.countryService.getAllCountries();
    const match = countries.find(c =>
      c.code.toUpperCase() === country.toUpperCase() ||
      c.name.toLowerCase() === country.toLowerCase()
    );

    const code = match ? match.code : country;
    return this.countryService.getFlagUrl(code);
  }

  getCountryName(countryCode: string): string {
    if (!countryCode) return '';
    const countries = this.countryService.getAllCountries();
    const country = countries.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
    return country ? country.name : countryCode;
  }

  formatPhoneNumber(phone: string | number): string {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  }

  getColumnTooltip(column: ListColumn, value: any, item?: any): string {
    if (column.tooltip) return column.tooltip;

    switch (column.type) {
      case 'avatar':
        return this.getDisplayName(item!, column);
      case 'country':
        return `${this.getCountryName(value)} (${value})`;
      case 'phone':
        return `Call ${this.formatPhoneNumber(value)}`;
      case 'email':
        if (column.showEmailVerification && column.emailVerificationKey && item) {
          const verified = item[column.emailVerificationKey];
          return verified ? `Send email to ${value} (Verified)` : `${value} (Not Verified - Click disabled)`;
        }
        return `Send email to ${value}`;
      case 'address':
        return `Address: ${value}`;
      default:
        return column.ellipsis ? value?.toString() || '' : '';
    }
  }

  onPhoneClick(phone: string, event: Event): void {
    event.stopPropagation();
    if (phone) {
      window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
    }
  }

  onEmailClick(email: string, row: any, column: ListColumn, event: Event): void {
    event.stopPropagation();

    if (column.showEmailVerification && column.emailVerificationKey && column.disableUnverifiedClick) {
      const isVerified = row[column.emailVerificationKey];
      if (!isVerified) {
        console.log('Email not verified. Click disabled.');
        return;
      }
    }

    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  }

  isEmailVerified(row: any, column: ListColumn): boolean {
    if (!column.emailVerificationKey) return true;
    return row[column.emailVerificationKey] === true;
  }

  onAddressClick(address: string, event: Event): void {
    event.stopPropagation();
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id || item.userProfileId || index;
  }

  shouldShowIcon(column: ListColumn): boolean {
    return column.showIcon !== false && ['phone', 'email', 'address', 'country'].includes(column.type || '');
  }

  getColumnIcon(column: ListColumn): string {
    switch (column.type) {
      case 'phone': return 'phone';
      case 'email': return 'email';
      case 'address': return 'location_on';
      case 'country': return 'public';
      default: return 'info';
    }
  }
}