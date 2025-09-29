import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, EventEmitter, Input, OnInit, Output, signal, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
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


export interface ListColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'avatar' | 'phone' | 'email' | 'address' | 'country';
  format?: string; // for date formatting
  visible?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  tooltip?: string;
  showIcon?: boolean;
  ellipsis?: boolean;
  avatarField?: string; // field name for avatar image
  nameField?: string; // field name for display name
  countryCodeField?: string; // field name for country code
  template?: TemplateRef<any>; // custom template
}

export interface ListAction {
  key: string;
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  tooltip?: string;
  hidden?: boolean;
}

export interface ListConfig {
  title: string;
  columns: ListColumn[];
  actions?: ListAction[];
  showSearch?: boolean;
  showRefresh?: boolean;
  showDownload?: boolean;
  showAdd?: boolean;
  addButtonLabel?: string;
  selectable?: boolean;
  compactMode?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  exportFileName?: string;
  emptyMessage?: string;
  rowClickAction?: string; // action to emit on row click
  showSelectionActions?: boolean; // show bulk action buttons when items selected
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
    trigger('selectionActions', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
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
  }
  get data() { return this._data; }

  @Output() actionClick = new EventEmitter<{ action: string, item: any }>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() selectionAction = new EventEmitter<SelectionActionEvent>();
  @Output() rowClick = new EventEmitter<{ action: string, item: any }>();

  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  searchControl = new FormControl('');
  showPagination = signal(false);
  visibleColumns = signal<ListColumn[]>([]);
  hasSelection = signal(false);
  selectedCount = signal(0);

  // Country code to flag mapping (basic set)
  // Country code → flag
  private countryFlags: { [key: string]: string } = {
    // GCC
    'SA': '🇸🇦', 'AE': '🇦🇪', 'QA': '🇶🇦', 'OM': '🇴🇲', 'KW': '🇰🇼', 'BH': '🇧🇭',

    // Major European
    'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
    'CH': '🇨🇭', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',

    // Others
    'IN': '🇮🇳', 'US': '🇺🇸', 'BR': '🇧🇷', 'AU': '🇦🇺', 'CN': '🇨🇳', 'JP': '🇯🇵'
  };

  // Country code → name
  private countryNames: { [key: string]: string } = {
    // GCC
    'SA': 'Saudi Arabia', 'AE': 'UAE', 'QA': 'Qatar',
    'OM': 'Oman', 'KW': 'Kuwait', 'BH': 'Bahrain',

    // Major European
    'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy',
    'ES': 'Spain', 'NL': 'Netherlands', 'CH': 'Switzerland', 'SE': 'Sweden',
    'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',

    // Others
    'IN': 'India', 'US': 'United States', 'BR': 'Brazil',
    'AU': 'Australia', 'CN': 'China', 'JP': 'Japan'
  };
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
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
    }
  }

  ngAfterViewChecked() {
    if (this.dataSource && this.paginator && this.dataSource.paginator !== this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.cdr.detectChanges();
    }
    if (this.dataSource && this.sort && this.dataSource.sort !== this.sort) {
      this.dataSource.sort = this.sort;
      this.cdr.detectChanges();
    }
  }

  private initializeComponent() {
    this.dataSource.data = this.data;
    this.visibleColumns.set(this.config?.columns?.filter(col => col.visible !== false) || []);

    // Enhanced filter predicate
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filter.trim().toLowerCase();
      if (!searchTerm) return true;

      return this.config.columns.some(column => {
        const value = data[column.key];
        if (value == null) return false;

        // Special handling for different column types
        switch (column.type) {
          case 'avatar':
            // Search in name field for avatar columns
            const nameValue = data[column.nameField || column.key];
            return nameValue?.toString().toLowerCase().includes(searchTerm);
          case 'country':
            // Search in both country code and name
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

  // Selection methods
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

  // Row click handler
  onRowClick(row: any): void {
    if (this.config?.rowClickAction && this.config?.selectable) {
      // this.onActionClick(this.config.rowClickAction, row);
      this.rowClick.emit({ action: this.config.rowClickAction, item: row });
    }
  }

  // Column visibility toggle
  toggleColumn(column: ListColumn): void {
    column.visible = !column.visible;
    this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
  }

  // Action handlers
  onActionClick(action: string, item: any, event?: Event): void {
    event?.stopPropagation();
    this.actionClick.emit({ action, item });
  }

  onAddClick(): void {
    this.addClick.emit();
  }

  onRefreshClick(): void {
    this.refreshClick.emit();
  }

  // Selection action handlers
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
    }
  }

  clearSelection(): void {
    this.selection.clear();
  }

  // Export functionality
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
        return `${this.getCountryFlag(value)} ${this.getCountryName(value)}`;
      case 'avatar':
        return item[column.nameField || column.key] || '';
      default:
        return value.toString();
    }
  }

  // Cell value formatting
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

  // Avatar helpers
  getAvatarUrl(item: any, column: ListColumn): string {
    return item[column.avatarField || 'avatar'] || '/assets/images/ProfilePic.png';
  }

  getDisplayName(item: any, column: ListColumn): string {
    return item[column.nameField || column.key] || '';
  }

  // Country helpers
  getCountryFlag(country: string): string {
    if (!country) return '🌍';

    // First check if it's already a code (IN, US, etc.)
    if (this.countryFlags[country.toUpperCase()]) {
      return this.countryFlags[country.toUpperCase()];
    }

    // Otherwise, try to find by name
    const code = Object.keys(this.countryNames).find(
      key => this.countryNames[key].toLowerCase() === country.toLowerCase()
    );

    return code ? this.countryFlags[code] : '🌍';
  }

  getCountryName(countryCode: string): string {
    return this.countryNames[countryCode?.toUpperCase()] || countryCode;
  }

  // Phone number formatting
  formatPhoneNumber(phone: string | number): string {
    if (!phone) return '';
    const phoneStr = phone.toString();
    // Basic US phone number formatting
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 2)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  }

  // Tooltip helpers
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
        return `Send email to ${value}`;
      case 'address':
        return `Address: ${value}`;
      default:
        return column.ellipsis ? value?.toString() || '' : '';
    }
  }

  // Cell click handlers for special column types
  onPhoneClick(phone: string, event: Event): void {
    event.stopPropagation();
    if (phone) {
      window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
    }
  }

  onEmailClick(email: string, event: Event): void {
    event.stopPropagation();
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  }

  onAddressClick(address: string, event: Event): void {
    event.stopPropagation();
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  }

  // Track by function for performance
  trackByFn(index: number, item: any): any {
    return item.id || item.userProfileId || index;
  }

  // Helper method to check if column should show icon
  shouldShowIcon(column: ListColumn): boolean {
    return column.showIcon !== false && ['phone', 'email', 'address', 'country'].includes(column.type || '');
  }

  // Get appropriate icon for column type
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
