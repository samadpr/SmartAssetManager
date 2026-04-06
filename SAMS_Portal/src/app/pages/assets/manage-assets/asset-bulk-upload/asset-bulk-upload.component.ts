import {
  Component, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

// Project services & types


import { forkJoin, Subscription } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../../core/services/asset/manage-assets.service';
import { AssetBulkTemplateService } from '../../../../core/services/asset/asset-bulk-template/asset-bulk-template.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { SuppliersService } from '../../../../core/services/supplier/suppliers.service';
import { DepartmentService } from '../../../../core/services/department/department.service';
import { AssetCategoriesService } from '../../../../core/services/asset-categories/asset-categories.service';
import { SubDepartmentService } from '../../../../core/services/department/sub-department/sub-department.service';
import { AssetSubCategoriesService } from '../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { UserProfileService } from '../../../../core/services/users/user-profile.service';
import { AssetStatusService } from '../../../../core/services/asset/asset-status/asset-status.service';
import { AssetDropdownData, AssetRequest } from '../../../../core/models/interfaces/asset-manage/assets.interface';
import { AssignToType, DepreciationMethod } from '../../../../core/enum/asset.enums';
import { SitesOrBranchesService } from '../../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../../core/services/sites-or-branchs/areas/asset-area.service';
import { CompanyStorageService, SubscriptionStorageService } from '../../../../core/services/localStorage/company/company-storage.service';

// ── Types ─────────────────────────────────────────────────────────────────────
 
export interface BulkAssetRow {
  // Required
  name:          string;
  assetBrand:    string;
  assetModelNo:  string;
  assetSerialNo: string;
 
  // Optional basic
  quantity?:         number;
  unitPrice?:        number;
  description?:      string;
  warranetyInMonth?: number;
  note?:             string;
 
  // IDs (resolved from labels)
  category?:      number;
  subCategory?:   number;
  supplier?:      number;
  department?:    number;
  subDepartment?: number;
  assetStatus?:   number;
 
  // Assignment
  assignTo?:     number;   // AssignToType enum value
  assignUserId?: number;
  siteId?:       number;
  areaId?:       number;
  transferDate?: Date | null;
  dueDate?:      Date | null;
 
  // Display labels
  categoryDisplay?:      string;
  subCategoryDisplay?:   string;
  supplierDisplay?:      string;
  departmentDisplay?:    string;
  subDepartmentDisplay?: string;
  assetStatusDisplay?:   string;
  assignUserDisplay?:    string;
  siteDisplay?:          string;
  areaDisplay?:          string;
 
  // Depreciation
  isDepreciable?:       boolean;
  depreciableCost?:     number;
  salvageValue?:        number;
  depreciationInMonth?: number;
  depreciationMethod?:  number;
  dateAquired?:         Date | null;
 
  // Dates
  dateOfPurchase?:    Date | null;
  dateOfManufacture?: Date | null;
  yearOfValuation?:   Date | null;
 
  // Files
  _imageFile?:    File | null;
  _deliveryNote?: File | null;
  _receipt?:      File | null;
  _invoice?:      File | null;
}
 
export interface ImportResult {
  asset:  BulkAssetRow;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  error?: string;
}
 
export interface FileSlot {
  key:    '_imageFile' | '_deliveryNote' | '_receipt' | '_invoice';
  label:  string;
  icon:   string;
  accept: string;
}

@Component({
  selector: 'app-asset-bulk-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatExpansionModule,
  ],
  templateUrl: './asset-bulk-upload.component.html',
  styleUrl: './asset-bulk-upload.component.scss',
animations: [
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('bannerSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)', maxHeight: '0px', overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)', maxHeight: '400px' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0px' }))
      ])
    ])
  ]
})
export class AssetBulkUploadComponent implements OnInit {
 
  // ── Services ─────────────────────────────────────────────────────────────
  private router               = inject(Router);
  private fb                   = inject(FormBuilder);
  private assetService         = inject(ManageAssetsService);
  private bulkTemplate         = inject(AssetBulkTemplateService);
  private globalService        = inject(GlobalService);
  private supplierService      = inject(SuppliersService);
  private deptService          = inject(DepartmentService);
  private subDeptService       = inject(SubDepartmentService);
  private siteService          = inject(SitesOrBranchesService);
  private areaService          = inject(AssetAreaService);
  private catService           = inject(AssetCategoriesService);
  private subCatService        = inject(AssetSubCategoriesService);
  private userService          = inject(UserProfileService);
  private statusService        = inject(AssetStatusService);
  private companyStorage       = inject(CompanyStorageService);
  private subscriptionStorage  = inject(SubscriptionStorageService);
 
  // ── State ────────────────────────────────────────────────────────────────
  currentStep         = signal<1 | 2 | 3 | 4>(1);
  uploadedFile        = signal<File | null>(null);
  isDragOver          = signal(false);
  parsing             = signal(false);
  parseError          = signal<string | null>(null);
  downloadingTemplate = signal(false);
 
  parsedAssets  = signal<BulkAssetRow[]>([]);
  editingIndex  = signal<number | null>(null);
  editForm!:    FormGroup;
 
  importResults    = signal<ImportResult[]>([]);
  importedCount    = signal(0);
  failedCount      = signal(0);
  skippedCount     = signal(0);
  currentImporting = signal<string | null>(null);
 
  dropdowns = signal<AssetDropdownData>({
    categories: [], allSubCategories: [], suppliers: [], sites: [],
    allAreas: [], departments: [], allSubDepartments: [],
    depreciationMethods: [], assignToOptions: [], usersList: [], assetStatus: []
  });
 
  // ── Subscription limit signals ────────────────────────────────────────────
 
  /**
   * Maximum asset count from the subscription plan.
   * 0 or negative = no limit configured, don't enforce.
   */
  assetLimit = computed<number>(() => this.subscriptionStorage.getAssetLimit());
 
  /**
   * How many assets are currently stored (loaded from the asset service
   * at component init so we have an up-to-date count even before any API calls).
   */
  currentAssetCount = signal<number>(0);
 
  /**
   * Remaining slots = limit − current count.
   * Infinity when no limit is configured.
   */
  remainingQuota = computed<number>(() => {
    const limit = this.assetLimit();
    if (!limit || limit <= 0) return Infinity;
    return Math.max(0, limit - this.currentAssetCount());
  });
 
  /**
   * Number of valid assets in the upload that exceed the remaining quota.
   * 0 when within limit or no limit configured.
   */
  excessCount = computed<number>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return 0; // no limit
    return Math.max(0, this.validCount() - quota);
  });
 
  /**
   * Number of valid assets we will actually import (capped at quota).
   */
  allowedImportCount = computed<number>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return this.validCount(); // no limit
    return Math.min(this.validCount(), quota);
  });
 
  /**
   * Show the limit exceeded banner in Step 2 when:
   * - A real limit is configured, AND
   * - Valid count in the file exceeds remaining quota
   */
  showLimitExceededBanner = computed<boolean>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return false; // no limit configured
    return this.validCount() > quota;
  });
 
  /**
   * Import button disabled logic:
   * - No valid assets, OR
   * - Quota is 0 (can't import anything)
   */
  importButtonDisabled = computed<boolean>(() => {
    if (this.validCount() === 0) return true;
    const quota = this.remainingQuota();
    if (isFinite(quota) && quota <= 0) return true; // hard blocked
    return false;
  });
 
  /**
   * Tooltip shown on the disabled/enabled import button.
   */
  importButtonTooltip = computed<string>(() => {
    const quota = this.remainingQuota();
    if (this.validCount() === 0) return 'No valid assets to import';
    if (isFinite(quota) && quota <= 0) {
      return `Your asset limit of ${this.assetLimit()} has been reached. Upgrade your plan to import more assets.`;
    }
    if (this.showLimitExceededBanner()) {
      return `Only ${this.allowedImportCount()} of ${this.validCount()} assets will be imported (plan limit: ${this.assetLimit()})`;
    }
    return `Import ${this.validCount()} assets`;
  });
 
  // ── Currency ──────────────────────────────────────────────────────────────
 
  private get _currencyCode(): string {
    try {
      const code = this.companyStorage.getCurrency()?.trim();
      if (!code || code.length !== 3) return 'USD';
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(0);
      return code;
    } catch {
      return 'USD';
    }
  }
 
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
 
  currencyCode = computed<string>(() => this._currencyCode);
 
  formatAmount(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) return '—';
    try {
      return new Intl.NumberFormat('en', {
        style:                 'currency',
        currency:              this._currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${this.currencySymbol()}${value.toFixed(2)}`;
    }
  }
 
  formatAmountOrZero(value: number | null | undefined): string {
    const n = Number(value);
    if (isNaN(n)) return `${this.currencySymbol()}0.00`;
    try {
      return new Intl.NumberFormat('en', {
        style:                 'currency',
        currency:              this._currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return `${this.currencySymbol()}${n.toFixed(2)}`;
    }
  }
 
  // ── Reactive drawer filter signals ────────────────────────────────────────
  drawerSelectedCategory   = signal<number | null>(null);
  drawerSelectedDepartment = signal<number | null>(null);
  drawerSelectedAssignTo   = signal<number>(AssignToType.NotAssigned);
  drawerSelectedSite       = signal<number | null>(null);
 
  private _drawerSubs: Subscription[] = [];
 
  filteredSubCategories = computed(() => {
    const catId = this.drawerSelectedCategory();
    if (!catId) return this.dropdowns().allSubCategories;
    return this.dropdowns().allSubCategories.filter(sc => sc.categoryId === catId);
  });
 
  filteredSubDepartments = computed(() => {
    const deptId = this.drawerSelectedDepartment();
    if (!deptId) return this.dropdowns().allSubDepartments;
    return this.dropdowns().allSubDepartments.filter(sd => sd.departmentId === deptId);
  });
 
  filteredAreas = computed(() => {
    const siteId = this.drawerSelectedSite();
    if (!siteId) return this.dropdowns().allAreas;
    return this.dropdowns().allAreas.filter(a => a.siteId === siteId);
  });
 
  // ── Computed ─────────────────────────────────────────────────────────────
  validCount   = computed(() => this.parsedAssets().filter(a => this.isAssetValid(a)).length);
  invalidCount = computed(() => this.parsedAssets().filter(a => !this.isAssetValid(a)).length);
  validAssets  = computed(() => this.parsedAssets().filter(a => this.isAssetValid(a)));
 
  importProgress = computed(() => {
    const total = this.validAssets().length;
    if (!total) return 0;
    return ((this.importedCount() + this.failedCount()) / total) * 100;
  });
 
  failedResults = computed(() => this.importResults().filter(r => r.status === 'failed'));
 
  totalImportValue = computed(() =>
    this.parsedAssets()
      .filter(a => this.isAssetValid(a))
      .reduce((sum, a) => sum + ((a.unitPrice ?? 0) * (a.quantity ?? 1)), 0)
  );
 
  depreciableCount = computed(() =>
    this.parsedAssets().filter(a => a.isDepreciable).length
  );
 
  // ── File slots ────────────────────────────────────────────────────────────
  readonly fileSlots: FileSlot[] = [
    { key: '_imageFile',    label: 'Asset Image',      icon: 'image',          accept: '.jpg,.jpeg,.png,.webp' },
    { key: '_deliveryNote', label: 'Delivery Note',    icon: 'local_shipping', accept: '.pdf,.jpg,.png' },
    { key: '_receipt',      label: 'Purchase Receipt', icon: 'receipt',        accept: '.pdf,.jpg,.png' },
    { key: '_invoice',      label: 'Invoice',          icon: 'receipt_long',   accept: '.pdf,.jpg,.png' },
  ];
 
  readonly AssignToType = AssignToType;
 
  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDropdowns();
    this.loadCurrentAssetCount();
  }
 
  // ── Load current asset count for quota calculation ────────────────────────
  /**
   * Fetch the current number of assets in the organisation so we can
   * compute remaining quota accurately. We only need the count, not the data.
   */
  private loadCurrentAssetCount(): void {
    this.assetService.getByOrg().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentAssetCount.set(response.data.length);
        }
      },
      error: () => {
        // Non-fatal — quota banner simply won't show if count is unknown
        console.warn('Could not fetch asset count for quota check.');
      }
    });
  }
 
  // ── Navigation ─────────────────────────────────────────────────────────────
  goToUpgrade(): void {
    this.router.navigate(['/settings/subscription']);
  }
 
  // ── Dropdown loading ───────────────────────────────────────────────────────
  private loadDropdowns(): void {
    forkJoin({
      suppliers:      this.supplierService.getSuppliersByOrg(),
      departments:    this.deptService.getMyDepartments(),
      subDepartments: this.subDeptService.getSubDepartments(),
      sites:          this.siteService.getMySites(),
      areas:          this.areaService.getMyAreas(),
      categories:     this.catService.getCategoriesByOrg(),
      subCategories:  this.subCatService.getSubCategoriesByOrg(),
      usersList:      this.userService.getOrganizationUsers(),
      assetStatus:    this.statusService.getByOrganization(),
    }).subscribe({
      next: (r) => {
        this.dropdowns.update(d => ({
          ...d,
          suppliers: r.suppliers.data?.map(s => ({ value: s.id!, label: s.name! })) ?? [],
          departments: r.departments.data?.map(d => ({ value: d.id!, label: d.name! })) ?? [],
          allSubDepartments: r.subDepartments.data?.map(sd => ({
            value: sd.id, label: sd.name ?? '', departmentId: sd.departmentId
          })) ?? [],
          sites: r.sites.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          allAreas: r.areas.data?.map(a => ({ value: a.id, label: a.name ?? '', siteId: a.siteId })) ?? [],
          categories: r.categories.data?.map(c => ({ value: c.id, label: c.name })) ?? [],
          allSubCategories: r.subCategories.data?.map(sc => ({
            value: sc.id, label: sc.name ?? '', categoryId: sc.assetCategorieId
          })) ?? [],
          usersList: r.usersList.data?.map(u => ({
            value: u.userProfileId,
            label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown'
          })) ?? [],
          assetStatus: r.assetStatus.data?.map(s => ({ value: s.id, label: s.name })) ?? [],
          depreciationMethods: [
            { value: DepreciationMethod.None,                     label: 'None' },
            { value: DepreciationMethod.StraightLine,             label: 'Straight Line' },
            { value: DepreciationMethod.DecliningBalance,         label: 'Declining Balance' },
            { value: DepreciationMethod.DoubleDecliningBalance,   label: 'Double Declining Balance' },
            { value: DepreciationMethod.OneFiftyDecliningBalance, label: '150% Declining Balance' },
            { value: DepreciationMethod.SumOfYearsDigits,         label: 'Sum of Years Digits' },
          ],
          assignToOptions: [
            { value: AssignToType.NotAssigned, label: 'Not Assigned' },
            { value: AssignToType.User,        label: 'User' },
            { value: AssignToType.Site,        label: 'Site / Branch' },
          ],
        }));
      },
      error: () => this.globalService.showToastr('Failed to load dropdown data', 'error'),
    });
  }
 
  // ── Template download ──────────────────────────────────────────────────────
  async downloadTemplate(): Promise<void> {
    this.downloadingTemplate.set(true);
    try {
      await this.bulkTemplate.generateAndDownload(this.dropdowns());
      this.globalService.showSnackbar('Template downloaded!', 'success');
    } catch {
      this.globalService.showToastr('Failed to generate template', 'error');
    } finally {
      this.downloadingTemplate.set(false);
    }
  }
 
  // ── Drag & Drop ────────────────────────────────────────────────────────────
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave():            void { this.isDragOver.set(false); }
 
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }
 
  onFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }
 
  private setFile(file: File): void {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.parseError.set('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    this.parseError.set(null);
    this.uploadedFile.set(file);
  }
 
  removeFile(e: Event): void {
    e.stopPropagation();
    this.uploadedFile.set(null);
    this.parseError.set(null);
  }
 
  // ── Parsing ────────────────────────────────────────────────────────────────
  async parseAndProceed(): Promise<void> {
    const file = this.uploadedFile();
    if (!file) return;
 
    this.parsing.set(true);
    this.parseError.set(null);
 
    try {
      const rawRows = await this.bulkTemplate.parseUploadedTemplate(file);
      const mapped  = rawRows.map(row => this.mapRowToAsset(row));
      this.parsedAssets.set(mapped);
      this.currentStep.set(2);
    } catch (err: any) {
      this.parseError.set(err?.message ?? 'Failed to parse file. Please use the official template.');
    } finally {
      this.parsing.set(false);
    }
  }
 
  private mapRowToAsset(row: any): BulkAssetRow {
    const d = this.dropdowns();
 
    const label = (key: string) => row[key]?.toString().trim() || '';
 
    const catLabel      = label('Category');
    const subCatLabel   = label('Sub Category');
    const suppLabel     = label('Supplier');
    const statusLabel   = label('Asset Status');
    const deptLabel     = label('Department');
    const subDeptLabel  = label('Sub Department');
    const deprMethodStr = label('Depreciation Method');
 
    const catObj     = d.categories.find(c => c.label.toLowerCase() === catLabel.toLowerCase());
    const subCatObj  = d.allSubCategories.find(s => s.label.toLowerCase() === subCatLabel.toLowerCase());
    const suppObj    = d.suppliers.find(s => s.label.toLowerCase() === suppLabel.toLowerCase());
    const statusObj  = d.assetStatus.find(s => s.label.toLowerCase() === statusLabel.toLowerCase());
    const deptObj    = d.departments.find(d => d.label.toLowerCase() === deptLabel.toLowerCase());
    const subDeptObj = d.allSubDepartments.find(s => s.label.toLowerCase() === subDeptLabel.toLowerCase());
 
    const deprMethodMap: Record<string, number> = {
      'none': 0, 'straight line': 1, 'declining balance': 2,
      'double declining balance': 3, '150% declining balance': 4,
      'sum of years digits': 5,
    };
    const resolvedDeprMethod = deprMethodStr
      ? (deprMethodMap[deprMethodStr.toLowerCase()] ?? undefined)
      : undefined;
 
    const isDepr = row['Asset is Depreciable (TRUE/FALSE)']?.toString().toUpperCase() === 'TRUE';
 
    return {
      name:          label('Asset Name')    || '',
      assetBrand:    label('Brand')         || '',
      assetModelNo:  label('Model Number')  || '',
      assetSerialNo: label('Serial Number') || '',
      quantity:      this.toNum(row['Quantity'])   ?? 1,
      unitPrice:     this.toNum(row['Unit Price']),
      description:   label('Description') || undefined,
      warranetyInMonth: this.toNum(row['Warranty In Month']),
      note:          label('Note') || undefined,
 
      category:      catObj?.value,
      subCategory:   subCatObj?.value,
      supplier:      suppObj?.value,
      assetStatus:   statusObj?.value,
      department:    deptObj?.value,
      subDepartment: subDeptObj?.value,
 
      categoryDisplay:      catLabel     || undefined,
      subCategoryDisplay:   subCatLabel  || undefined,
      supplierDisplay:      suppLabel    || undefined,
      assetStatusDisplay:   statusLabel  || undefined,
      departmentDisplay:    deptLabel    || undefined,
      subDepartmentDisplay: subDeptLabel || undefined,
 
      isDepreciable:       isDepr,
      depreciableCost:     isDepr ? this.toNum(row['Depreciable Cost'])             : undefined,
      salvageValue:        isDepr ? this.toNum(row['Salvage Value'])                : undefined,
      depreciationInMonth: isDepr ? this.toNum(row['Depreciation Period In Month']) : undefined,
      depreciationMethod:  resolvedDeprMethod,
      dateAquired:         this.toDate(row['Date Acquired (YYYY-MM-DD)']),
      dateOfPurchase:      this.toDate(row['Purchase Date (YYYY-MM-DD)']),
      dateOfManufacture:   this.toDate(row['Manufacturing Date (YYYY-MM-DD)']),
      yearOfValuation:     this.toDate(row['Year of Valuation (YYYY-MM-DD)']),
 
      assignTo: AssignToType.NotAssigned,
    };
  }
 
  private toNum(v: any): number | undefined {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }
 
  private toDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    const d = new Date(v.toString());
    return isNaN(d.getTime()) ? null : d;
  }
 
  // ── Validation ─────────────────────────────────────────────────────────────
  isAssetValid(asset: BulkAssetRow): boolean {
    return !!(asset.name?.trim() && asset.assetBrand?.trim() &&
              asset.assetModelNo?.trim() && asset.assetSerialNo?.trim());
  }
 
  getValidationErrors(asset: BulkAssetRow): string[] {
    const errors: string[] = [];
    if (!asset.name?.trim())          errors.push('Asset Name is required');
    if (!asset.assetBrand?.trim())    errors.push('Brand is required');
    if (!asset.assetModelNo?.trim())  errors.push('Model Number is required');
    if (!asset.assetSerialNo?.trim()) errors.push('Serial Number is required');
    return errors;
  }
 
  // ── Review table actions ───────────────────────────────────────────────────
  removeAsset(index: number): void {
    this.parsedAssets.update(list => list.filter((_, i) => i !== index));
    if (this.editingIndex() === index) this.closeEditDrawer();
  }
 
  clearAll(): void { this.parsedAssets.set([]); }
 
  proceedToImport(): void {
    // When limit exceeded, only import up to the allowed quota
    const quota = this.remainingQuota();
    let assetsToImport: BulkAssetRow[];
 
    if (isFinite(quota) && this.validAssets().length > quota) {
      // Trim to allowed count and warn
      assetsToImport = this.validAssets().slice(0, quota);
      const skipped = this.validAssets().length - quota;
      this.globalService.showSnackbar(
        `Importing ${quota} asset${quota === 1 ? '' : 's'}. ${skipped} asset${skipped === 1 ? '' : 's'} skipped (plan limit).`,
        'warning'
      );
    } else {
      assetsToImport = this.validAssets();
    }
 
    this.currentStep.set(3);
    this.importResults.set(assetsToImport.map(asset => ({ asset, status: 'pending' })));
    this.startImport();
  }
 
  // ── Edit drawer ────────────────────────────────────────────────────────────
  openEditDrawer(index: number): void {
    this._clearDrawerSubs();
 
    this.editingIndex.set(index);
    const asset = this.parsedAssets()[index];
    this.editForm = this.buildEditForm(asset);
 
    this.drawerSelectedCategory.set(asset.category ?? null);
    this.drawerSelectedDepartment.set(asset.department ?? null);
    this.drawerSelectedSite.set(asset.siteId ?? null);
    this.drawerSelectedAssignTo.set(asset.assignTo ?? AssignToType.NotAssigned);
 
    const catSub = this.editForm.get('category')!.valueChanges.subscribe(val => {
      this.drawerSelectedCategory.set(val ?? null);
      this.editForm.get('subCategory')!.setValue(null, { emitEvent: false });
    });
 
    const deptSub = this.editForm.get('department')!.valueChanges.subscribe(val => {
      this.drawerSelectedDepartment.set(val ?? null);
      this.editForm.get('subDepartment')!.setValue(null, { emitEvent: false });
    });
 
    const siteSub = this.editForm.get('siteId')!.valueChanges.subscribe(val => {
      this.drawerSelectedSite.set(val ?? null);
      this.editForm.get('areaId')!.setValue(null, { emitEvent: false });
    });
 
    const assignSub = this.editForm.get('assignTo')!.valueChanges.subscribe(val => {
      this.drawerSelectedAssignTo.set(val ?? AssignToType.NotAssigned);
      this.editForm.patchValue({ assignUserId: null, siteId: null, areaId: null }, { emitEvent: false });
      this.drawerSelectedSite.set(null);
    });
 
    this._drawerSubs = [catSub, deptSub, siteSub, assignSub];
  }
 
  closeEditDrawer(): void {
    this._clearDrawerSubs();
    this.editingIndex.set(null);
  }
 
  private _clearDrawerSubs(): void {
    this._drawerSubs.forEach(s => s.unsubscribe());
    this._drawerSubs = [];
  }
 
  saveEdit(): void {
    if (this.editForm.invalid) return;
    const idx = this.editingIndex();
    if (idx === null) return;
 
    const values = this.editForm.value;
    const d      = this.dropdowns();
 
    const catObj    = d.categories.find(c => c.value === values.category);
    const subCatObj = d.allSubCategories.find(s => s.value === values.subCategory);
    const suppObj   = d.suppliers.find(s => s.value === values.supplier);
    const statusObj = d.assetStatus.find(s => s.value === values.assetStatus);
    const deptObj   = d.departments.find(d => d.value === values.department);
    const subDObj   = d.allSubDepartments.find(s => s.value === values.subDepartment);
    const userObj   = d.usersList.find(u => u.value === values.assignUserId);
    const siteObj   = d.sites.find(s => s.value === values.siteId);
    const areaObj   = d.allAreas.find(a => a.value === values.areaId);
 
    this.parsedAssets.update(list => {
      const updated = [...list];
      updated[idx] = {
        ...updated[idx],
        ...values,
        categoryDisplay:      catObj?.label,
        subCategoryDisplay:   subCatObj?.label,
        supplierDisplay:      suppObj?.label,
        assetStatusDisplay:   statusObj?.label,
        departmentDisplay:    deptObj?.label,
        subDepartmentDisplay: subDObj?.label,
        assignUserDisplay:    userObj?.label,
        siteDisplay:          siteObj?.label,
        areaDisplay:          areaObj?.label,
      };
      return updated;
    });
 
    this.closeEditDrawer();
    this.globalService.showSnackbar('Asset updated', 'success');
  }
 
  getCurrentEditAsset(): BulkAssetRow | null {
    const idx = this.editingIndex();
    if (idx === null) return null;
    return this.parsedAssets()[idx] ?? null;
  }
 
  onSlotFileChange(e: Event, key: keyof BulkAssetRow): void {
    e.stopPropagation();
    const file = (e.target as HTMLInputElement).files?.[0];
    const idx  = this.editingIndex();
    if (idx === null || !file) return;
    this.parsedAssets.update(list => {
      const updated = [...list];
      (updated[idx] as any)[key] = file;
      return updated;
    });
  }
 
  removeSlotFile(e: Event, key: keyof BulkAssetRow): void {
    e.stopPropagation();
    const idx = this.editingIndex();
    if (idx === null) return;
    this.parsedAssets.update(list => {
      const updated = [...list];
      (updated[idx] as any)[key] = null;
      return updated;
    });
  }
 
  private buildEditForm(asset: BulkAssetRow): FormGroup {
    return this.fb.group({
      name:          [asset.name,          [Validators.required, Validators.minLength(2)]],
      assetBrand:    [asset.assetBrand,    [Validators.required]],
      assetModelNo:  [asset.assetModelNo,  [Validators.required]],
      assetSerialNo: [asset.assetSerialNo, [Validators.required]],
      quantity:         [asset.quantity ?? 1],
      unitPrice:        [asset.unitPrice],
      description:      [asset.description],
      warranetyInMonth: [asset.warranetyInMonth],
      note:             [asset.note],
      category:      [asset.category     ?? null],
      subCategory:   [asset.subCategory  ?? null],
      supplier:      [asset.supplier     ?? null],
      assetStatus:   [asset.assetStatus  ?? null],
      department:    [asset.department   ?? null],
      subDepartment: [asset.subDepartment ?? null],
      isDepreciable:       [asset.isDepreciable       ?? false],
      depreciableCost:     [asset.depreciableCost     ?? null],
      salvageValue:        [asset.salvageValue        ?? null],
      depreciationInMonth: [asset.depreciationInMonth ?? null],
      depreciationMethod:  [asset.depreciationMethod  ?? null],
      dateAquired:         [asset.dateAquired         ?? null],
      dateOfPurchase:    [asset.dateOfPurchase    ?? null],
      dateOfManufacture: [asset.dateOfManufacture ?? null],
      yearOfValuation:   [asset.yearOfValuation   ?? null],
      assignTo:     [asset.assignTo    ?? AssignToType.NotAssigned],
      assignUserId: [asset.assignUserId ?? null],
      siteId:       [asset.siteId      ?? null],
      areaId:       [asset.areaId      ?? null],
      transferDate: [asset.transferDate ?? null],
      dueDate:      [asset.dueDate      ?? null],
    });
  }
 
  // ── Import engine ──────────────────────────────────────────────────────────
  private async startImport(): Promise<void> {
    const results = this.importResults();
 
    for (let i = 0; i < results.length; i++) {
      this.importResults.update(list => {
        const updated = [...list];
        updated[i] = { ...updated[i], status: 'uploading' };
        return updated;
      });
      this.currentImporting.set(results[i].asset.name);
 
      await new Promise(r => setTimeout(r, 250));
 
      try {
        await this.uploadSingleAsset(results[i].asset);
        this.importResults.update(list => {
          const updated = [...list];
          updated[i] = { ...updated[i], status: 'success' };
          return updated;
        });
        this.importedCount.update(n => n + 1);
        // Update the live count so quota stays accurate during multi-asset import
        this.currentAssetCount.update(n => n + 1);
      } catch (err: any) {
        const errorMsg = err?.error?.message ?? err?.message ?? 'Upload failed. Please retry.';
        this.importResults.update(list => {
          const updated = [...list];
          updated[i] = { ...updated[i], status: 'failed', error: errorMsg };
          return updated;
        });
        this.failedCount.update(n => n + 1);
      }
    }
 
    this.currentImporting.set(null);
    await new Promise(r => setTimeout(r, 600));
    this.currentStep.set(4);
  }
 
  private uploadSingleAsset(asset: BulkAssetRow): Promise<any> {
    const request: AssetRequest = {
      name:          asset.name,
      assetBrand:    asset.assetBrand,
      assetModelNo:  asset.assetModelNo,
      assetSerialNo: asset.assetSerialNo,
      quantity:      asset.quantity,
      unitPrice:     asset.unitPrice,
      description:   asset.description,
      warranetyInMonth: asset.warranetyInMonth,
      note:          asset.note,
      category:      asset.category,
      subCategory:   asset.subCategory,
      supplier:      asset.supplier,
      assetStatus:   asset.assetStatus,
      department:    asset.department,
      subDepartment: asset.subDepartment,
      isDepreciable: asset.isDepreciable ?? false,
      depreciableCost:     asset.depreciableCost,
      salvageValue:        asset.salvageValue,
      depreciationInMonth: asset.depreciationInMonth,
      depreciationMethod:  asset.depreciationMethod,
      dateAquired:         asset.dateAquired      ?? undefined,
      dateOfPurchase:      asset.dateOfPurchase   ?? undefined,
      dateOfManufacture:   asset.dateOfManufacture ?? undefined,
      yearOfValuation:     asset.yearOfValuation  ?? undefined,
      assignTo:      asset.assignTo ?? AssignToType.NotAssigned,
      assignUserId:  asset.assignUserId,
      assignSiteId:  asset.siteId,
      assignAreaId:  asset.areaId,
      transferDate:  asset.transferDate  ?? undefined,
      dueDate:       asset.dueDate       ?? undefined,
      imageFile:           asset._imageFile    ?? undefined,
      deliveryNoteFile:    asset._deliveryNote ?? undefined,
      purchaseReceiptFile: asset._receipt      ?? undefined,
      invoiceFile:         asset._invoice      ?? undefined,
    };
 
    return new Promise((resolve, reject) => {
      this.assetService.createAsset(request).subscribe({ next: resolve, error: reject });
    });
  }
 
  // ── Retry / skip ───────────────────────────────────────────────────────────
  async retryAsset(item: ImportResult): Promise<void> {
    const idx = this.importResults().indexOf(item);
    if (idx === -1) return;
 
    this.importResults.update(list => {
      const updated = [...list];
      updated[idx] = { ...updated[idx], status: 'uploading', error: undefined };
      return updated;
    });
 
    try {
      await this.uploadSingleAsset(item.asset);
      this.importResults.update(list => {
        const updated = [...list];
        updated[idx] = { ...updated[idx], status: 'success' };
        return updated;
      });
      this.importedCount.update(n => n + 1);
      this.currentAssetCount.update(n => n + 1);
      this.failedCount.update(n => Math.max(0, n - 1));
    } catch (err: any) {
      const errorMsg = err?.error?.message ?? err?.message ?? 'Upload failed.';
      this.importResults.update(list => {
        const updated = [...list];
        updated[idx] = { ...updated[idx], status: 'failed', error: errorMsg };
        return updated;
      });
    }
  }
 
  editFailedAsset(item: ImportResult): void {
    const idx = this.parsedAssets().findIndex(a => a === item.asset);
    if (idx !== -1) {
      this.currentStep.set(2);
      setTimeout(() => this.openEditDrawer(idx), 300);
    }
  }
 
  skipFailed(item: ImportResult): void {
    const idx = this.importResults().indexOf(item);
    if (idx === -1) return;
    this.importResults.update(list => list.filter((_, i) => i !== idx));
    this.failedCount.update(n => Math.max(0, n - 1));
    this.skippedCount.update(n => n + 1);
  }
 
  async editAndRetryFailed(item: ImportResult): Promise<void> {
    await this.retryAsset(item);
  }
 
  // ── Navigation ─────────────────────────────────────────────────────────────
  goToAssets(): void { this.router.navigate(['/assets']); }
  cancel():     void { this.router.navigate(['/assets']); }
 
  startFresh(): void {
    this.uploadedFile.set(null);
    this.parsedAssets.set([]);
    this.importResults.set([]);
    this.importedCount.set(0);
    this.failedCount.set(0);
    this.skippedCount.set(0);
    this.parseError.set(null);
    this.currentStep.set(1);
    // Refresh asset count for the new session
    this.loadCurrentAssetCount();
  }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
  formatFileSize(bytes: number): string {
    if (bytes < 1024)    return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
 
  trackByIndex(index: number): number { return index; }
}
