import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, computed, EventEmitter, Input, OnInit, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
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
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  format?: string; // for date formatting
  visible?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ListAction {
  key: string;
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  tooltip?: string;
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
  pageSize?: number;
  pageSizeOptions?: number[];
  exportFileName?: string;
  emptyMessage?: string;
}

@Component({
  selector: 'app-list-widget',
  standalone: true,
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
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
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

    // Reattach paginator & sort every time data changes
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // Show/hide pagination depending on data length
    this.showPagination.set(this._data.length > (this.config?.pageSize ?? 5));
  }
  get data() { return this._data; }
  showPagination = signal(false);
  // guard to avoid re-attaching repeatedly
  private paginatorAttached = false;
  constructor(private cdr: ChangeDetectorRef) { }

  @Output() actionClick = new EventEmitter<{ action: string, item: any }>();
  @Output() addClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<any[]>();

  dataSource = new MatTableDataSource<any>([]);
  selection = new SelectionModel<any>(true, []);
  searchControl = new FormControl('');

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSource.data = this.data || [];
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }
  }

  ngAfterViewInit() {
    // attach sort immediately
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }

    // if paginator exists attach (paginator likely present because we used [hidden] not *ngIf)
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      this.paginatorAttached = true;
    }
  }

  // This catches cases where paginator appears later — e.g. if you're still using *ngIf
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

  visibleColumns = signal<ListColumn[]>([]);
  // showPagination = computed(() => this.data.length > (this.config?.pageSize || 10));

  ngOnInit() {
    this.initializeComponent();
    this.setupSearch();
  }

  private initializeComponent() {
    this.dataSource.data = this.data;
    this.visibleColumns.set(this.config?.columns?.filter(col => col.visible !== false) || []);

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });

    // Custom filter predicate for search
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerm = filter.trim().toLowerCase();
      if (!searchTerm) return true;

      return this.config.columns.some(column => {
        const value = data[column.key];
        if (value == null) return false;
        return value.toString().toLowerCase().includes(searchTerm);
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

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
    this.selectionChange.emit(this.selection.selected);
  }

  toggleRow(row: any): void {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection.selected);
  }

  // Column visibility toggle
  toggleColumn(column: ListColumn): void {
    column.visible = !column.visible;
    this.visibleColumns.set(this.config.columns.filter(col => col.visible !== false));
  }

  // Action handlers
  onActionClick(action: string, item: any): void {
    this.actionClick.emit({ action, item });
  }

  onAddClick(): void {
    this.addClick.emit();
  }

  onRefreshClick(): void {
    this.refreshClick.emit();
  }

  // Export functionality
  exportToExcel(): void {
    const dataToExport = this.dataSource.filteredData.map(item => {
      const exportItem: any = {};
      this.config.columns
        .filter(col => col.visible !== false)
        .forEach(col => {
          exportItem[col.label] = this.formatCellValue(item[col.key], col);
        });
      return exportItem;
    });

    // Calculate sums for numeric columns
    const numericColumns = this.config.columns.filter(col =>
      (col.type === 'number' || col.type === 'currency') && col.visible !== false
    );

    if (numericColumns.length > 0 && dataToExport.length > 0) {
      const summaryRow: any = {};
      this.config.columns
        .filter(col => col.visible !== false)
        .forEach((col, index) => {
          if (index === 0) {
            summaryRow[col.label] = 'TOTAL';
          } else if (numericColumns.includes(col)) {
            const sum = dataToExport.reduce((acc, item) => {
              const value = parseFloat(item[col.label]) || 0;
              return acc + value;
            }, 0);
            summaryRow[col.label] = sum;
          } else {
            summaryRow[col.label] = '';
          }
        });

      dataToExport.push(summaryRow);
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const fileName = this.config?.exportFileName ||
      `${this.config?.title?.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }

  // Format cell values based on column type
  formatCellValue(value: any, column: ListColumn): string {
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

  // Track by function for performance
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

}
