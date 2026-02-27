import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AssetDisposalReportDto, AssetReportDepreciationDto, AssetReportDto } from '../../../core/models/interfaces/asset-report/assetReportDto.interface';
import { AssetReportService } from '../../../core/services/asset-report/asset-report.service';
import { GlobalService } from '../../../core/services/global/global.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DepreciationScheduleDialogComponent } from './depreciation-schedule-dialog/depreciation-schedule-dialog.component';
import { AssetType, AssignToType, DepreciationMethod, DisposalMethod } from '../../../core/enum/asset.enums';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AssetCategory } from '../../../core/models/interfaces/asset-category/asset-category.interface';
import { AssetSubCategory } from '../../../core/models/interfaces/asset-category/asset-sub-category.interface';
import { Department, SubDepartmentDto } from '../../../core/models/interfaces/department.interface';
import { AssetSite } from '../../../core/models/interfaces/sites-or-branchs/asset-site.interface';
import { AssetArea } from '../../../core/models/interfaces/sites-or-branchs/asset-area.interface';
import { Supplier } from '../../../core/models/interfaces/asset-manage/supplier.interface';
import { AssetStatusDto } from '../../../core/models/interfaces/asset-manage/asset-status.interface';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonService } from '../../../core/services/common/common.service';

interface FilterOptions {
  categories: AssetCategory[];
  subCategories: AssetSubCategory[];
  departments: Department[];
  subDepartments: SubDepartmentDto[];
  sites: AssetSite[];
  areas: AssetArea[];
  suppliers: Supplier[];
  assetStatuses: AssetStatusDto[];
  assetTypes: { id: number; name: string }[];
  assignTypes: { id: number; name: string }[];
  disposalMethods: { id: number; name: string }[];
}

interface ActiveFilter {
  type: string;
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-asset-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatRadioModule,
    MatBadgeModule
  ],
  templateUrl: './asset-report.component.html',
  styleUrl: './asset-report.component.scss'
})
export class AssetReportComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data sources
  dataSource = new MatTableDataSource<AssetReportDto>([]);
  depreciationDataSource = new MatTableDataSource<AssetReportDepreciationDto>([]);
  disposalDataSource = new MatTableDataSource<AssetDisposalReportDto>([]);

  // Signals
  loading = signal(false);
  loadingFilters = signal(false);
  allAssets = signal<AssetReportDto[]>([]);
  allDepreciationAssets = signal<AssetReportDepreciationDto[]>([]);
  allDisposalAssets = signal<AssetDisposalReportDto[]>([]);
  filterOptions = signal<FilterOptions>({
    categories: [],
    subCategories: [],
    departments: [],
    subDepartments: [],
    sites: [],
    areas: [],
    suppliers: [],
    assetStatuses: [],
    assetTypes: [],
    assignTypes: [],
    disposalMethods: []
  });
  activeFilters = signal<ActiveFilter[]>([]);
  reportType = signal<'full' | 'depreciation' | 'disposal'>('full');

  // Form Controls - Common
  searchControl = new FormControl('');
  categoryControl = new FormControl<number | ''>('');
  subCategoryControl = new FormControl<number | ''>('');
  departmentControl = new FormControl<number | ''>('');
  subDepartmentControl = new FormControl<number | ''>('');
  siteControl = new FormControl<number | ''>('');
  areaControl = new FormControl<number | ''>('');
  supplierControl = new FormControl<number | ''>('');
  assetStatusControl = new FormControl<number | ''>('');
  assetTypeControl = new FormControl<number | ''>('');
  assignTypeControl = new FormControl<number | ''>('');
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);
  depreciableOnlyControl = new FormControl(false);

  // Form Controls - Disposal specific
  disposalMethodControl = new FormControl<number | ''>('');
  disposalStartDateControl = new FormControl<Date | null>(null);
  disposalEndDateControl = new FormControl<Date | null>(null);

  // Table columns
  displayedColumns: string[] = [
    'assetId',
    'name',
    'category',
    'department',
    'quantity',
    'unitPrice',
    'assetStatus',
    'createdDate'
  ];

  depreciationColumns: string[] = [
    'assetId',
    'name',
    'depreciableCost',
    'salvageValue',
    'depreciationMethod',
    'dateAquired',
    'actions'
  ];

  disposalColumns: string[] = [
    'assetId',
    'name',
    'category',
    'quantity',
    'unitPrice',
    'disposalMethod',
    'disposalDate',
    'disposalStatus'
  ];

  // Signal for filtered data
  filteredAssets = signal<AssetReportDto[]>([]);
  filteredDisposalAssets = signal<AssetDisposalReportDto[]>([]);

  // Computed values based on filteredAssets signal
  totalAssets = computed(() => this.filteredAssets().length);
  
  totalValue = computed(() => 
    this.filteredAssets().reduce((sum, asset) => 
      sum + ((asset.unitPrice || 0) * (asset.quantity || 0)), 0
    )
  );
  
  depreciableAssets = computed(() => 
    this.filteredAssets().filter(asset => asset.isDepreciable).length
  );
  
  totalDepreciationValue = computed(() => 
    this.filteredAssets()
      .filter(asset => asset.isDepreciable)
      .reduce((sum, asset) => sum + (asset.depreciableCost || 0), 0)
  );

  // Disposal computed values
  totalDisposedAssets = computed(() => this.filteredDisposalAssets().length);
  
  totalDisposedValue = computed(() => 
    this.filteredDisposalAssets().reduce((sum, asset) => 
      sum + ((asset.unitPrice || 0) * (asset.quantity || 0)), 0
    )
  );

  disposalMethodCounts = computed(() => {
    const counts = new Map<string, number>();
    this.filteredDisposalAssets().forEach(asset => {
      const method = this.getDisposalMethodName(asset.disposalMethod);
      counts.set(method, (counts.get(method) || 0) + 1);
    });
    return counts;
  });

  // Depreciation computed values
  totalDepreciableAssets = computed(() => this.allDepreciationAssets().length);
  
  totalDepreciationCost = computed(() => 
    this.allDepreciationAssets().reduce((sum, asset) => 
      sum + (asset.depreciableCost || 0), 0
    )
  );

  totalSalvageValue = computed(() => 
    this.allDepreciationAssets().reduce((sum, asset) => 
      sum + (asset.salvageValue || 0), 0
    )
  );

  netDepreciationValue = computed(() => 
    this.totalDepreciationCost() - this.totalSalvageValue()
  );

  constructor(
    private assetReportService: AssetReportService,
    private commonService: CommonService,
    private globalService: GlobalService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFilterData();
    this.loadReportData();
    this.setupSearchListener();
    this.setupFilterListeners();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.depreciationDataSource.paginator = this.paginator;
    this.depreciationDataSource.sort = this.sort;
    this.disposalDataSource.paginator = this.paginator;
    this.disposalDataSource.sort = this.sort;
  }

  /**
   * Load all filter dropdown data from APIs
   */
  loadFilterData(): void {
    this.loadingFilters.set(true);

    forkJoin({
      categories: this.commonService.getCategoriesByOrg(),
      subCategories: this.commonService.getSubCategoriesByOrg(),
      departments: this.commonService.getDepartmentsByOrg(),
      subDepartments: this.commonService.getSubDepartmentsByOrg(),
      sites: this.commonService.getSitesByOrg(),
      areas: this.commonService.getAreasByOrg(),
      suppliers: this.commonService.getSuppliersByOrg(),
      statuses: this.commonService.getStatusByOrg()
    }).subscribe({
      next: (results) => {
        this.filterOptions.set({
          categories: results.categories.data || [],
          subCategories: results.subCategories.data || [],
          departments: results.departments.data || [],
          subDepartments: results.subDepartments.data || [],
          sites: results.sites.data || [],
          areas: results.areas.data || [],
          suppliers: results.suppliers.data || [],
          assetStatuses: results.statuses.data || [],
          assetTypes: this.getAssetTypeOptions(),
          assignTypes: this.getAssignToTypeOptions(),
          disposalMethods: this.getDisposalMethodOptions()
        });
        this.loadingFilters.set(false);
      },
      error: (err) => {
        console.error('Error loading filter data:', err);
        this.globalService.showToastr('Failed to load filter options', 'error');
        this.loadingFilters.set(false);
        
        // Set enum-based options even if API fails
        this.filterOptions.update(options => ({
          ...options,
          assetTypes: this.getAssetTypeOptions(),
          assignTypes: this.getAssignToTypeOptions(),
          disposalMethods: this.getDisposalMethodOptions()
        }));
      }
    });
  }

  /**
   * Get Asset Type options from enum (exclude Disposed for common filters)
   */
  getAssetTypeOptions(): { id: number; name: string }[] {
    return [
      { id: AssetType.Created, name: 'Created' },
      { id: AssetType.Transferred, name: 'Transferred' }
    ];
  }

  /**
   * Get Assign To Type options from enum (exclude Disposed for common filters)
   */
  getAssignToTypeOptions(): { id: number; name: string }[] {
    return [
      { id: AssignToType.NotAssigned, name: 'Not Assigned' },
      { id: AssignToType.User, name: 'User' },
      { id: AssignToType.Site, name: 'Site' }
    ];
  }

  /**
   * Get Disposal Method options from enum
   */
  getDisposalMethodOptions(): { id: number; name: string }[] {
    return [
      { id: DisposalMethod.Sold, name: 'Sold' },
      { id: DisposalMethod.Donated, name: 'Donated' },
      { id: DisposalMethod.Recycled, name: 'Recycled' },
      { id: DisposalMethod.Destroyed, name: 'Destroyed' },
      { id: DisposalMethod.Other, name: 'Other' }
    ];
  }

  /**
   * Get disposal method name from enum
   */
  getDisposalMethodName(method: number | undefined): string {
    if (!method) return 'Unknown';
    
    switch (method) {
      case DisposalMethod.Sold:
        return 'Sold';
      case DisposalMethod.Donated:
        return 'Donated';
      case DisposalMethod.Recycled:
        return 'Recycled';
      case DisposalMethod.Destroyed:
        return 'Destroyed';
      case DisposalMethod.Other:
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get disposal status name
   */
  getDisposalStatusName(status: number | undefined): string {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 1:
        return 'Pending';
      case 2:
        return 'Approved';
      case 3:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get depreciation method name from enum
   */
  getDepreciationMethodName(method: number | undefined): string {
    if (!method) return 'None';
    
    switch (method) {
      case DepreciationMethod.StraightLine:
        return 'Straight Line';
      case DepreciationMethod.DecliningBalance:
        return 'Declining Balance';
      case DepreciationMethod.DoubleDecliningBalance:
        return 'Double Declining Balance';
      case DepreciationMethod.OneFiftyDecliningBalance:
        return '150% Declining Balance';
      case DepreciationMethod.SumOfYearsDigits:
        return 'Sum of Years Digits';
      default:
        return 'None';
    }
  }

  loadReportData(): void {
    this.loading.set(true);

    // Load full info report
    this.assetReportService.getAssetFullInfoReport().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allAssets.set(response.data);
          this.dataSource.data = response.data;
          this.filteredAssets.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading asset report:', err);
        this.globalService.showToastr('Failed to load asset report', 'error');
        this.loading.set(false);
      }
    });

    // Load depreciation report
    this.assetReportService.getAssetDepreciationReport().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allDepreciationAssets.set(response.data);
          this.depreciationDataSource.data = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading depreciation report:', err);
      }
    });

    // Load disposal report
    this.assetReportService.getAssetDisposalReport().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allDisposalAssets.set(response.data);
          this.disposalDataSource.data = response.data;
          this.filteredDisposalAssets.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading disposal report:', err);
        this.globalService.showToastr('Failed to load disposal report', 'error');
      }
    });
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  setupFilterListeners(): void {
    const controls: FormControl<any>[] = [
      this.categoryControl,
      this.subCategoryControl,
      this.departmentControl,
      this.subDepartmentControl,
      this.siteControl,
      this.areaControl,
      this.supplierControl,
      this.assetStatusControl,
      this.assetTypeControl,
      this.assignTypeControl,
      this.startDateControl,
      this.endDateControl,
      this.depreciableOnlyControl,
      this.disposalMethodControl,
      this.disposalStartDateControl,
      this.disposalEndDateControl
    ];

    controls.forEach(control => {
      control.valueChanges.subscribe(() => {
        this.updateActiveFilters();
        this.applyFilters();
      });
    });
  }

  updateActiveFilters(): void {
    const filters: ActiveFilter[] = [];
    const options = this.filterOptions();

    if (this.categoryControl.value) {
      const category = options.categories.find(c => c.id === this.categoryControl.value);
      if (category) {
        filters.push({
          type: 'category',
          value: category.id,
          label: `Category: ${category.name}`
        });
      }
    }

    if (this.subCategoryControl.value) {
      const subCategory = options.subCategories.find(sc => sc.id === this.subCategoryControl.value);
      if (subCategory) {
        filters.push({
          type: 'subCategory',
          value: subCategory.id,
          label: `Sub Category: ${subCategory.name}`
        });
      }
    }

    if (this.departmentControl.value) {
      const department = options.departments.find(d => d.id === this.departmentControl.value);
      if (department) {
        filters.push({
          type: 'department',
          value: department.id,
          label: `Department: ${department.name}`
        });
      }
    }

    if (this.subDepartmentControl.value) {
      const subDepartment = options.subDepartments.find(sd => sd.id === this.subDepartmentControl.value);
      if (subDepartment) {
        filters.push({
          type: 'subDepartment',
          value: subDepartment.id,
          label: `Sub Department: ${subDepartment.name}`
        });
      }
    }

    if (this.siteControl.value) {
      const site = options.sites.find(s => s.id === this.siteControl.value);
      if (site) {
        filters.push({
          type: 'site',
          value: site.id,
          label: `Site: ${site.name}`
        });
      }
    }

    if (this.areaControl.value) {
      const area = options.areas.find(a => a.id === this.areaControl.value);
      if (area) {
        filters.push({
          type: 'area',
          value: area.id,
          label: `Area: ${area.name}`
        });
      }
    }

    if (this.supplierControl.value) {
      const supplier = options.suppliers.find(s => s.id === this.supplierControl.value);
      if (supplier) {
        filters.push({
          type: 'supplier',
          value: supplier.id || 0,
          label: `Supplier: ${supplier.name}`
        });
      }
    }

    if (this.assetStatusControl.value) {
      const status = options.assetStatuses.find(s => s.id === this.assetStatusControl.value);
      if (status) {
        filters.push({
          type: 'assetStatus',
          value: status.id,
          label: `Status: ${status.name}`
        });
      }
    }

    if (this.assetTypeControl.value) {
      const type = options.assetTypes.find(t => t.id === this.assetTypeControl.value);
      if (type) {
        filters.push({
          type: 'assetType',
          value: type.id,
          label: `Type: ${type.name}`
        });
      }
    }

    if (this.assignTypeControl.value) {
      const assignType = options.assignTypes.find(at => at.id === this.assignTypeControl.value);
      if (assignType) {
        filters.push({
          type: 'assignType',
          value: assignType.id,
          label: `Assign To: ${assignType.name}`
        });
      }
    }

    if (this.startDateControl.value && this.endDateControl.value) {
      filters.push({
        type: 'dateRange',
        value: 'dateRange',
        label: `Created: ${this.formatDate(this.startDateControl.value)} - ${this.formatDate(this.endDateControl.value)}`
      });
    }

    if (this.depreciableOnlyControl.value) {
      filters.push({
        type: 'depreciable',
        value: 'true',
        label: 'Depreciable Only'
      });
    }

    // Disposal specific filters
    if (this.disposalMethodControl.value) {
      const method = options.disposalMethods.find(m => m.id === this.disposalMethodControl.value);
      if (method) {
        filters.push({
          type: 'disposalMethod',
          value: method.id,
          label: `Disposal Method: ${method.name}`
        });
      }
    }

    if (this.disposalStartDateControl.value && this.disposalEndDateControl.value) {
      filters.push({
        type: 'disposalDateRange',
        value: 'disposalDateRange',
        label: `Disposed: ${this.formatDate(this.disposalStartDateControl.value)} - ${this.formatDate(this.disposalEndDateControl.value)}`
      });
    }

    this.activeFilters.set(filters);
  }

  applyFilters(): void {
    // Apply filters for full report
    let filteredData = [...this.allAssets()];
    const searchTerm = this.searchControl.value?.toLowerCase() || '';

    // Apply search
    if (searchTerm) {
      filteredData = filteredData.filter(asset =>
        asset.assetId?.toLowerCase().includes(searchTerm) ||
        asset.name?.toLowerCase().includes(searchTerm) ||
        asset.description?.toLowerCase().includes(searchTerm) ||
        asset.assetBrand?.toLowerCase().includes(searchTerm) ||
        asset.assetModelNo?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply common filters
    filteredData = this.applyCommonFilters(filteredData);

    // Update both dataSource and filteredAssets signal
    this.dataSource.data = filteredData;
    this.filteredAssets.set(filteredData);

    // Apply filters for disposal report
    let filteredDisposalData = [...this.allDisposalAssets()];

    // Apply search for disposal
    if (searchTerm) {
      filteredDisposalData = filteredDisposalData.filter(asset =>
        asset.assetId?.toLowerCase().includes(searchTerm) ||
        asset.name?.toLowerCase().includes(searchTerm) ||
        asset.description?.toLowerCase().includes(searchTerm) ||
        asset.assetBrand?.toLowerCase().includes(searchTerm) ||
        asset.assetModelNo?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply common filters to disposal
    filteredDisposalData = this.applyCommonFilters(filteredDisposalData);

    // Apply disposal-specific filters
    if (this.disposalMethodControl.value) {
      filteredDisposalData = filteredDisposalData.filter(asset => 
        asset.disposalMethod === this.disposalMethodControl.value
      );
    }

    if (this.disposalStartDateControl.value && this.disposalEndDateControl.value) {
      const startDate = new Date(this.disposalStartDateControl.value);
      const endDate = new Date(this.disposalEndDateControl.value);
      endDate.setHours(23, 59, 59, 999);

      filteredDisposalData = filteredDisposalData.filter(asset => {
        const disposalDate = new Date(asset.disposalDate || '');
        return disposalDate >= startDate && disposalDate <= endDate;
      });
    }

    // Update disposal dataSource and signal
    this.disposalDataSource.data = filteredDisposalData;
    this.filteredDisposalAssets.set(filteredDisposalData);
  }

  applyCommonFilters<T extends AssetReportDto>(data: T[]): T[] {
    let filteredData = [...data];

    // Apply category filter
    if (this.categoryControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.category === this.categoryControl.value
      );
    }

    // Apply sub-category filter
    if (this.subCategoryControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.subCategory === this.subCategoryControl.value
      );
    }

    // Apply department filter
    if (this.departmentControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.department === this.departmentControl.value
      );
    }

    // Apply sub-department filter
    if (this.subDepartmentControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.subDepartment === this.subDepartmentControl.value
      );
    }

    // Apply site filter
    if (this.siteControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.siteId === this.siteControl.value
      );
    }

    // Apply area filter
    if (this.areaControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.areaId === this.areaControl.value
      );
    }

    // Apply supplier filter
    if (this.supplierControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.supplier === this.supplierControl.value
      );
    }

    // Apply asset status filter
    if (this.assetStatusControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.assetStatus === this.assetStatusControl.value
      );
    }

    // Apply asset type filter
    if (this.assetTypeControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.assetType === this.assetTypeControl.value
      );
    }

    // Apply assign type filter
    if (this.assignTypeControl.value) {
      filteredData = filteredData.filter(asset => 
        asset.assignTo === this.assignTypeControl.value
      );
    }

    // Apply date range filter
    if (this.startDateControl.value && this.endDateControl.value) {
      const startDate = new Date(this.startDateControl.value);
      const endDate = new Date(this.endDateControl.value);
      endDate.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter(asset => {
        const createdDate = new Date(asset.createdDate || '');
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    // Apply depreciable filter
    if (this.depreciableOnlyControl.value) {
      filteredData = filteredData.filter(asset => asset.isDepreciable);
    }

    return filteredData;
  }

  removeFilter(filter: ActiveFilter): void {
    switch (filter.type) {
      case 'category':
        this.categoryControl.setValue('');
        break;
      case 'subCategory':
        this.subCategoryControl.setValue('');
        break;
      case 'department':
        this.departmentControl.setValue('');
        break;
      case 'subDepartment':
        this.subDepartmentControl.setValue('');
        break;
      case 'site':
        this.siteControl.setValue('');
        break;
      case 'area':
        this.areaControl.setValue('');
        break;
      case 'supplier':
        this.supplierControl.setValue('');
        break;
      case 'assetStatus':
        this.assetStatusControl.setValue('');
        break;
      case 'assetType':
        this.assetTypeControl.setValue('');
        break;
      case 'assignType':
        this.assignTypeControl.setValue('');
        break;
      case 'dateRange':
        this.startDateControl.setValue(null);
        this.endDateControl.setValue(null);
        break;
      case 'depreciable':
        this.depreciableOnlyControl.setValue(false);
        break;
      case 'disposalMethod':
        this.disposalMethodControl.setValue('');
        break;
      case 'disposalDateRange':
        this.disposalStartDateControl.setValue(null);
        this.disposalEndDateControl.setValue(null);
        break;
    }
  }

  clearAllFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.subCategoryControl.setValue('');
    this.departmentControl.setValue('');
    this.subDepartmentControl.setValue('');
    this.siteControl.setValue('');
    this.areaControl.setValue('');
    this.supplierControl.setValue('');
    this.assetStatusControl.setValue('');
    this.assetTypeControl.setValue('');
    this.assignTypeControl.setValue('');
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
    this.depreciableOnlyControl.setValue(false);
    this.disposalMethodControl.setValue('');
    this.disposalStartDateControl.setValue(null);
    this.disposalEndDateControl.setValue(null);
  }

  toggleReportType(type: 'full' | 'depreciation' | 'disposal'): void {
    this.reportType.set(type);
  }

  /**
   * Open depreciation schedule dialog
   */
  openDepreciationSchedule(asset: AssetReportDepreciationDto): void {
    this.dialog.open(DepreciationScheduleDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: asset,
      panelClass: 'depreciation-schedule-dialog'
    });
  }

  // Export Functions
  exportToPDF(): void {
    const doc = new jsPDF('landscape');
    let data: any[] = [];
    let title = '';
    let tableHead: string[][] = [];

    if (this.reportType() === 'disposal') {
      data = this.disposalDataSource.filteredData;
      title = 'Asset Disposal Report';
      
      // Add header
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Disposed Assets: ${this.totalDisposedAssets()}`, 14, 34);
      doc.text(`Total Disposed Value: ${this.formatCurrency(this.totalDisposedValue())}`, 14, 40);

      // Prepare table data
      const tableData = data.map(asset => [
        asset.assetId || '',
        asset.name || '',
        asset.categoryDisplay || '',
        asset.quantity?.toString() || '0',
        `$${asset.unitPrice?.toFixed(2) || '0.00'}`,
        this.getDisposalMethodName(asset.disposalMethod),
        this.formatDate(asset.disposalDate),
        this.getDisposalStatusName(asset.disposalAppStatus)
      ]);

      autoTable(doc, {
        head: [['Asset ID', 'Name', 'Category', 'Qty', 'Unit Price', 'Disposal Method', 'Disposal Date', 'Status']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [211, 47, 47] }
      });
    } else {
      data = this.dataSource.filteredData;
      title = 'Asset Report';
      
      // Add header
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Assets: ${this.totalAssets()}`, 14, 34);
      doc.text(`Total Value: ${this.formatCurrency(this.totalValue())}`, 14, 40);

      // Prepare table data
      const tableData = data.map(asset => [
        asset.assetId || '',
        asset.name || '',
        asset.categoryDisplay || '',
        asset.departmentDisplay || '',
        asset.quantity?.toString() || '0',
        `$${asset.unitPrice?.toFixed(2) || '0.00'}`,
        `$${((asset.unitPrice || 0) * (asset.quantity || 0)).toFixed(2)}`,
        asset.assetStatusDisplay || '',
        this.formatDate(asset.createdDate)
      ]);

      autoTable(doc, {
        head: [['Asset ID', 'Name', 'Category', 'Department', 'Qty', 'Unit Price', 'Total', 'Status', 'Created']],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [103, 58, 183] }
      });
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
    this.globalService.showToastr('PDF exported successfully', 'success');
  }

  exportToExcel(): void {
    let data: any[] = [];
    let sheetName = '';
    let summaryData: any[] = [];

    if (this.reportType() === 'disposal') {
      data = this.disposalDataSource.filteredData;
      sheetName = 'Disposal Assets';
      
      const exportData = data.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.name,
        'Brand': asset.assetBrand,
        'Model No': asset.assetModelNo,
        'Serial No': asset.assetSerialNo,
        'Category': asset.categoryDisplay,
        'Sub Category': asset.subCategoryDisplay,
        'Department': asset.departmentDisplay,
        'Quantity': asset.quantity,
        'Unit Price': asset.unitPrice,
        'Total Value': (asset.unitPrice || 0) * (asset.quantity || 0),
        'Disposal Method': this.getDisposalMethodName(asset.disposalMethod),
        'Disposal Date': this.formatDate(asset.disposalDate),
        'Disposal Status': this.getDisposalStatusName(asset.disposalAppStatus),
        'Disposal Document': asset.disposalDocument || 'N/A',
        'Created Date': this.formatDate(asset.createdDate),
        'Created By': asset.createdByName
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Add summary sheet
      summaryData = [
        { 'Metric': 'Total Disposed Assets', 'Value': this.totalDisposedAssets() },
        { 'Metric': 'Total Disposed Value', 'Value': this.formatCurrency(this.totalDisposedValue()) }
      ];

      // Add disposal method breakdown
      this.disposalMethodCounts().forEach((count, method) => {
        summaryData.push({ 'Metric': `Disposed by ${method}`, 'Value': count });
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      XLSX.writeFile(wb, `asset-disposal-report-${new Date().getTime()}.xlsx`);
    } else {
      data = this.dataSource.filteredData;
      sheetName = 'Assets';
      
      const exportData = data.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.name,
        'Brand': asset.assetBrand,
        'Model No': asset.assetModelNo,
        'Serial No': asset.assetSerialNo,
        'Category': asset.categoryDisplay,
        'Sub Category': asset.subCategoryDisplay,
        'Department': asset.departmentDisplay,
        'Sub Department': asset.subDepartmentDisplay,
        'Site': asset.siteDisplay,
        'Area': asset.areaDisplay,
        'Supplier': asset.supplierDisplay,
        'Quantity': asset.quantity,
        'Unit Price': asset.unitPrice,
        'Total Value': (asset.unitPrice || 0) * (asset.quantity || 0),
        'Status': asset.assetStatusDisplay,
        'Type': asset.assetTypeDisplay,
        'Assign To': asset.assignToDisplay,
        'Depreciable': asset.isDepreciable ? 'Yes' : 'No',
        'Created Date': this.formatDate(asset.createdDate),
        'Created By': asset.createdByName
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Add summary sheet
      summaryData = [
        { 'Metric': 'Total Assets', 'Value': this.totalAssets() },
        { 'Metric': 'Total Value', 'Value': this.formatCurrency(this.totalValue()) },
        { 'Metric': 'Depreciable Assets', 'Value': this.depreciableAssets() },
        { 'Metric': 'Total Depreciation Value', 'Value': this.formatCurrency(this.totalDepreciationValue()) }
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      XLSX.writeFile(wb, `asset-report-${new Date().getTime()}.xlsx`);
    }

    this.globalService.showToastr('Excel exported successfully', 'success');
  }

  exportToCSV(): void {
    let data: any[] = [];
    let fileName = '';

    if (this.reportType() === 'disposal') {
      data = this.disposalDataSource.filteredData;
      fileName = 'asset-disposal-report';
      
      const exportData = data.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.name,
        'Brand': asset.assetBrand,
        'Model No': asset.assetModelNo,
        'Serial No': asset.assetSerialNo,
        'Category': asset.categoryDisplay,
        'Sub Category': asset.subCategoryDisplay,
        'Department': asset.departmentDisplay,
        'Quantity': asset.quantity,
        'Unit Price': asset.unitPrice,
        'Total Value': (asset.unitPrice || 0) * (asset.quantity || 0),
        'Disposal Method': this.getDisposalMethodName(asset.disposalMethod),
        'Disposal Date': this.formatDate(asset.disposalDate),
        'Disposal Status': this.getDisposalStatusName(asset.disposalAppStatus),
        'Created Date': this.formatDate(asset.createdDate),
        'Created By': asset.createdByName
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}-${new Date().getTime()}.csv`;
      link.click();
    } else {
      data = this.dataSource.filteredData;
      fileName = 'asset-report';
      
      const exportData = data.map(asset => ({
        'Asset ID': asset.assetId,
        'Name': asset.name,
        'Brand': asset.assetBrand,
        'Model No': asset.assetModelNo,
        'Serial No': asset.assetSerialNo,
        'Category': asset.categoryDisplay,
        'Sub Category': asset.subCategoryDisplay,
        'Department': asset.departmentDisplay,
        'Sub Department': asset.subDepartmentDisplay,
        'Site': asset.siteDisplay,
        'Area': asset.areaDisplay,
        'Supplier': asset.supplierDisplay,
        'Quantity': asset.quantity,
        'Unit Price': asset.unitPrice,
        'Total Value': (asset.unitPrice || 0) * (asset.quantity || 0),
        'Status': asset.assetStatusDisplay,
        'Type': asset.assetTypeDisplay,
        'Assign To': asset.assignToDisplay,
        'Depreciable': asset.isDepreciable ? 'Yes' : 'No',
        'Created Date': this.formatDate(asset.createdDate),
        'Created By': asset.createdByName
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}-${new Date().getTime()}.csv`;
      link.click();
    }

    this.globalService.showToastr('CSV exported successfully', 'success');
  }

  printReport(): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (!printWindow) {
      this.globalService.showToastr('Please allow popups to print the report', 'error');
      return;
    }

    let reportTitle = '';
    let tableHeaders: string[] = [];
    let tableData: any[] = [];
    let statsHtml = '';

    // Prepare data based on report type
    if (this.reportType() === 'disposal') {
      reportTitle = 'Asset Disposal Report';
      tableHeaders = ['Asset ID', 'Name', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Disposal Method', 'Disposal Date', 'Status'];
      tableData = this.disposalDataSource.filteredData;
      
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-box disposal-stat">
            <div class="stat-value">${this.totalDisposedAssets()}</div>
            <div class="stat-label">Total Disposed Assets</div>
          </div>
          <div class="stat-box disposal-value-stat">
            <div class="stat-value">${this.formatCurrency(this.totalDisposedValue())}</div>
            <div class="stat-label">Total Disposed Value</div>
          </div>
        </div>
      `;
    } else if (this.reportType() === 'depreciation') {
      reportTitle = 'Asset Depreciation Report';
      tableHeaders = ['Asset ID', 'Name', 'Depreciable Cost', 'Salvage Value', 'Depreciation Method', 'Date Acquired'];
      tableData = this.depreciationDataSource.filteredData;
      
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-box depreciation-stat">
            <div class="stat-value">${this.totalDepreciableAssets()}</div>
            <div class="stat-label">Depreciable Assets</div>
          </div>
          <div class="stat-box depreciation-value-stat">
            <div class="stat-value">${this.formatCurrency(this.totalDepreciationCost())}</div>
            <div class="stat-label">Total Depreciable Cost</div>
          </div>
          <div class="stat-box salvage-stat">
            <div class="stat-value">${this.formatCurrency(this.totalSalvageValue())}</div>
            <div class="stat-label">Total Salvage Value</div>
          </div>
          <div class="stat-box net-stat">
            <div class="stat-value">${this.formatCurrency(this.netDepreciationValue())}</div>
            <div class="stat-label">Net Depreciation</div>
          </div>
        </div>
      `;
    } else {
      reportTitle = 'Asset Full Report';
      tableHeaders = ['Asset ID', 'Name', 'Category', 'Department', 'Quantity', 'Unit Price', 'Total Value', 'Status', 'Created Date'];
      tableData = this.dataSource.filteredData;
      
      statsHtml = `
        <div class="stats-grid">
          <div class="stat-box primary-stat">
            <div class="stat-value">${this.totalAssets()}</div>
            <div class="stat-label">Total Assets</div>
          </div>
          <div class="stat-box success-stat">
            <div class="stat-value">${this.formatCurrency(this.totalValue())}</div>
            <div class="stat-label">Total Value</div>
          </div>
          <div class="stat-box warning-stat">
            <div class="stat-value">${this.depreciableAssets()}</div>
            <div class="stat-label">Depreciable Assets</div>
          </div>
          <div class="stat-box info-stat">
            <div class="stat-value">${this.formatCurrency(this.totalDepreciationValue())}</div>
            <div class="stat-label">Depreciation Value</div>
          </div>
        </div>
      `;
    }

    // Build table rows
    let tableRowsHtml = '';
    
    tableData.forEach((asset, index) => {
      let rowData: string[] = [];
      
      if (this.reportType() === 'disposal') {
        rowData = [
          asset.assetId || '',
          asset.name || '',
          asset.categoryDisplay || '',
          (asset.quantity || 0).toString(),
          this.formatCurrency(asset.unitPrice),
          this.formatCurrency((asset.unitPrice || 0) * (asset.quantity || 0)),
          this.getDisposalMethodName(asset.disposalMethod),
          this.formatDate(asset.disposalDate),
          this.getDisposalStatusName(asset.disposalAppStatus)
        ];
      } else if (this.reportType() === 'depreciation') {
        rowData = [
          asset.assetId || '',
          asset.name || '',
          this.formatCurrency(asset.depreciableCost),
          this.formatCurrency(asset.salvageValue),
          this.getDepreciationMethodName(asset.depreciationMethod),
          this.formatDate(asset.dateAquired)
        ];
      } else {
        rowData = [
          asset.assetId || '',
          asset.name || '',
          asset.categoryDisplay || '',
          asset.departmentDisplay || '',
          (asset.quantity || 0).toString(),
          this.formatCurrency(asset.unitPrice),
          this.formatCurrency((asset.unitPrice || 0) * (asset.quantity || 0)),
          asset.assetStatusDisplay || '',
          this.formatDate(asset.createdDate)
        ];
      }
      
      tableRowsHtml += `
        <tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">
          ${rowData.map(cell => `<td>${cell}</td>`).join('')}
        </tr>
      `;
    });

    // Build active filters HTML
    let filtersHtml = '';
    if (this.activeFilters().length > 0) {
      filtersHtml = `
        <div class="filters-section">
          <h3>Applied Filters:</h3>
          <div class="filters-list">
            ${this.activeFilters().map(filter => `<span class="filter-badge">${filter.label}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // Build complete HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            background: #fff;
            padding: 20px;
            font-size: 11pt;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #673ab7;
            padding-bottom: 20px;
          }
          
          .print-header h1 {
            color: #673ab7;
            font-size: 28pt;
            font-weight: 700;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .print-header .meta-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          
          .print-header .meta-item {
            font-size: 10pt;
            color: #666;
          }
          
          .print-header .meta-item strong {
            color: #333;
            font-weight: 600;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }
          
          .stat-box {
            padding: 15px 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e0e0e0;
            background: #f9f9f9;
          }
          
          .stat-box.primary-stat {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-color: #2196f3;
          }
          
          .stat-box.success-stat {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-color: #4caf50;
          }
          
          .stat-box.warning-stat {
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-color: #ff9800;
          }
          
          .stat-box.info-stat {
            background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
            border-color: #03a9f4;
          }
          
          .stat-box.disposal-stat {
            background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            border-color: #f44336;
          }
          
          .stat-box.disposal-value-stat {
            background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
            border-color: #e91e63;
          }
          
          .stat-box.depreciation-stat {
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            border-color: #ff9800;
          }
          
          .stat-box.depreciation-value-stat {
            background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
            border-color: #9c27b0;
          }
          
          .stat-box.salvage-stat {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-color: #4caf50;
          }
          
          .stat-box.net-stat {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-color: #2196f3;
          }
          
          .stat-value {
            font-size: 20pt;
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
          }
          
          .stat-label {
            font-size: 9pt;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .filters-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
            border-left: 4px solid #673ab7;
          }
          
          .filters-section h3 {
            font-size: 12pt;
            color: #673ab7;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .filters-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .filter-badge {
            display: inline-block;
            padding: 5px 12px;
            background: #673ab7;
            color: white;
            border-radius: 12px;
            font-size: 9pt;
            font-weight: 500;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .data-table thead {
            background: linear-gradient(135deg, #673ab7 0%, #512da8 100%);
            color: white;
          }
          
          .data-table thead th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #512da8;
          }
          
          .data-table tbody td {
            padding: 10px;
            border: 1px solid #e0e0e0;
            font-size: 9pt;
            color: #333;
          }
          
          .data-table tbody .even-row {
            background: #fafafa;
          }
          
          .data-table tbody .odd-row {
            background: #ffffff;
          }
          
          .data-table tbody tr:hover {
            background: #f0f0f0;
          }
          
          .print-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 9pt;
            color: #666;
          }
          
          .print-footer .page-number {
            margin-top: 10px;
            font-weight: 600;
          }
          
          /* Print-specific styles */
          @media print {
            body {
              padding: 0;
            }
            
            .print-header {
              page-break-after: avoid;
            }
            
            .stats-grid {
              page-break-inside: avoid;
            }
            
            .filters-section {
              page-break-inside: avoid;
            }
            
            .data-table {
              page-break-inside: auto;
            }
            
            .data-table thead {
              display: table-header-group;
            }
            
            .data-table tbody tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            .print-footer {
              page-break-before: avoid;
            }
          }
          
          /* No data message */
          .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 12pt;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${reportTitle}</h1>
          <div class="meta-info">
            <div class="meta-item">
              <strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div class="meta-item">
              <strong>Total Records:</strong> ${tableData.length}
            </div>
          </div>
        </div>
        
        ${statsHtml}
        
        ${filtersHtml}
        
        ${tableData.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        ` : '<div class="no-data">No data available to print</div>'}
        
        <div class="print-footer">
          <div>This is a system-generated report. No signature required.</div>
          <div class="page-number">Page <span id="pageNumber"></span></div>
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            window.print();
            // Close window after printing or cancel
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(value: number | undefined): string {
    if (!value) return '$0.00';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}