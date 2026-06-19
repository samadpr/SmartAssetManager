import {
  Component, computed, inject, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { forkJoin, Subscription } from 'rxjs';

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
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';

// Project
import { PageHeaderComponent } from '../../../../shared/widgets/page-header/page-header.component';
import { ManageAssetsService } from '../../../../core/services/asset/manage-assets.service';
import { AssetBulkTemplateService, ParsedBulkRow } from '../../../../core/services/asset/asset-bulk-template/asset-bulk-template.service';
import { GlobalService } from '../../../../core/services/global/global.service';
import { SuppliersService } from '../../../../core/services/supplier/suppliers.service';
import { DepartmentService } from '../../../../core/services/department/department.service';
import { AssetCategoriesService } from '../../../../core/services/asset-categories/asset-categories.service';
import { SubDepartmentService } from '../../../../core/services/department/sub-department/sub-department.service';
import { AssetSubCategoriesService } from '../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { UserProfileService } from '../../../../core/services/users/user-profile.service';
import { AssetStatusService } from '../../../../core/services/asset/asset-status/asset-status.service';
import { SitesOrBranchesService } from '../../../../core/services/sites-or-branchs/sites-or-branches.service';
import { AssetAreaService } from '../../../../core/services/sites-or-branchs/areas/asset-area.service';
import { CompanyStorageService, SubscriptionStorageService } from '../../../../core/services/localStorage/company/company-storage.service';
import { AssetDropdownData, AssetRequest, UnitAssignmentRequest } from '../../../../core/models/interfaces/asset-manage/assets.interface';
import { AssignToType, DepreciationMethod } from '../../../../core/enum/asset.enums';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Per-unit assignment within a batch row */
export interface UnitAssignment {
  unitIndex: number;       // 0-based index within the batch
  serialNumber: string;
  assignTo: AssignToType;
  assignUserId?: number;
  siteId?: number;
  areaId?: number;
  transferDate?: Date | null;
  dueDate?: Date | null;
  // display
  assignUserDisplay?: string;
  siteDisplay?: string;
  areaDisplay?: string;
}

/** One row in the review table — represents one batch */
export interface BulkBatchRow {
  // Core fields (from parsed template)
  name: string;
  assetBrand: string;
  assetModelNo: string;
  quantity: number;
  serialNumbers: string[];       // one per unit
  serialNumbersRaw: string;      // original comma string for display/editing

  unitPrice?: number;
  description?: string;
  warranetyInMonth?: number;
  note?: string;

  // Resolved IDs
  category?: number;
  subCategory?: number;
  supplier?: number;
  assetStatus?: number;
  department?: number;
  subDepartment?: number;
  depreciationMethod?: number;

  // Display labels
  categoryDisplay?: string;
  subCategoryDisplay?: string;
  supplierDisplay?: string;
  assetStatusDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;

  // Depreciation
  isDepreciable: boolean;
  depreciableCost?: number;
  salvageValue?: number;
  depreciationInMonth?: number;
  dateAquired?: Date | null;

  // Dates
  dateOfPurchase?: Date | null;
  dateOfManufacture?: Date | null;
  yearOfValuation?: Date | null;

  // Per-unit assignments
  unitAssignments: UnitAssignment[];
  /** global assign mode for this batch */
  assignMode: 'global' | 'per-unit';
  globalAssignTo: AssignToType;
  globalAssignUserId?: number;
  globalSiteId?: number;
  globalAreaId?: number;

  // Files (shared across all units in batch)
  _imageFile?: File | null;
  _deliveryNote?: File | null;
  _receipt?: File | null;
  _invoice?: File | null;

  // UI state
  _serialsValid?: boolean;
  _serialCountMismatch?: boolean;
  _autoFilledSerials?: boolean;
}

/** Import result for step 3 */
export interface ImportResult {
  batch: BulkBatchRow;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  error?: string;
  batchCode?: string; // returned from API on success
}

/** File attachment slot */
export interface FileSlot {
  key: '_imageFile' | '_deliveryNote' | '_receipt' | '_invoice';
  label: string;
  icon: string;
  accept: string;
}

@Component({
  selector: 'app-asset-bulk-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatTooltipModule, MatExpansionModule,
    MatChipsModule, MatDividerModule, MatTabsModule,
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
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, maxHeight: '0px', overflow: 'hidden' }),
        animate('250ms ease-out', style({ opacity: 1, maxHeight: '600px' }))
      ]),
      transition(':leave', [
        animate('180ms ease-in', style({ opacity: 0, maxHeight: '0px' }))
      ])
    ]),
  ]
})
export class AssetBulkUploadComponent implements OnInit {
  // ── Services ───────────────────────────────────────────────────────────────
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private assetService = inject(ManageAssetsService);
  private bulkTemplate = inject(AssetBulkTemplateService);
  private globalService = inject(GlobalService);
  private supplierService = inject(SuppliersService);
  private deptService = inject(DepartmentService);
  private subDeptService = inject(SubDepartmentService);
  private siteService = inject(SitesOrBranchesService);
  private areaService = inject(AssetAreaService);
  private catService = inject(AssetCategoriesService);
  private subCatService = inject(AssetSubCategoriesService);
  private userService = inject(UserProfileService);
  private statusService = inject(AssetStatusService);
  private companyStorage = inject(CompanyStorageService);
  private subscriptionStorage = inject(SubscriptionStorageService);

  // ── Enums exposed to template ──────────────────────────────────────────────
  readonly AssignToType = AssignToType;

  // ── Step state ─────────────────────────────────────────────────────────────
  currentStep = signal<1 | 2 | 3 | 4>(1);

  // ── Step 1: Upload ─────────────────────────────────────────────────────────
  uploadedFile = signal<File | null>(null);
  isDragOver = signal(false);
  parsing = signal(false);
  parseError = signal<string | null>(null);
  downloadingTemplate = signal(false);

  // ── Step 2: Review ─────────────────────────────────────────────────────────
  batchRows = signal<BulkBatchRow[]>([]);
  editingIndex = signal<number | null>(null);
  editForm!: FormGroup;
  editingUnitIndex = signal<number>(0); // which unit tab is open in drawer
  expandedSerialPanel = signal<boolean>(false);

  private _drawerSubs: Subscription[] = [];

  // Computed filter signals for drawer cascades
  drawerSelectedCategory = signal<number | null>(null);
  drawerSelectedDepartment = signal<number | null>(null);
  drawerSelectedSite = signal<number | null>(null);
  drawerGlobalAssignTo = signal<AssignToType>(AssignToType.NotAssigned);
  drawerUnitAssignTo = signal<AssignToType>(AssignToType.NotAssigned);

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

  filteredAreasGlobal = computed(() => {
    const siteId = this.drawerSelectedSite();
    if (!siteId) return this.dropdowns().allAreas;
    return this.dropdowns().allAreas.filter(a => a.siteId === siteId);
  });

  // ── Step 3: Import ─────────────────────────────────────────────────────────
  importResults = signal<ImportResult[]>([]);
  importedCount = signal(0);
  failedCount = signal(0);
  skippedCount = signal(0);
  currentImporting = signal<string | null>(null);
  currentImportingUnit = signal<string | null>(null);

  importProgress = computed(() => {
    const total = this.validBatches().length;
    if (!total) return 0;
    return ((this.importedCount() + this.failedCount()) / total) * 100;
  });
  failedResults = computed(() => this.importResults().filter(r => r.status === 'failed'));

  // ── Dropdowns ──────────────────────────────────────────────────────────────
  dropdowns = signal<AssetDropdownData>({
    categories: [], allSubCategories: [], suppliers: [], sites: [],
    allAreas: [], departments: [], allSubDepartments: [],
    depreciationMethods: [], assignToOptions: [], usersList: [], assetStatus: []
  });

  // ── Subscription / quota ───────────────────────────────────────────────────
  assetLimit = computed<number>(() => this.subscriptionStorage.getAssetLimit());
  currentAssetCount = signal<number>(0);

  remainingQuota = computed<number>(() => {
    const limit = this.assetLimit();
    if (!limit || limit <= 0) return Infinity;
    return Math.max(0, limit - this.currentAssetCount());
  });

  /** Total units across all valid batches */
  totalValidUnits = computed<number>(() =>
    this.validBatches().reduce((s, b) => s + b.quantity, 0)
  );

  excessCount = computed<number>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return 0;
    return Math.max(0, this.totalValidUnits() - quota);
  });

  allowedImportCount = computed<number>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return this.validBatches().length;
    // Determine how many batches fit within quota (whole batches)
    let remaining = quota;
    let count = 0;
    for (const b of this.validBatches()) {
      if (remaining >= b.quantity) { remaining -= b.quantity; count++; }
      else break;
    }
    return count;
  });

  showLimitExceededBanner = computed<boolean>(() => {
    const quota = this.remainingQuota();
    if (!isFinite(quota)) return false;
    return this.totalValidUnits() > quota;
  });

  importButtonDisabled = computed<boolean>(() => {
    if (this.validBatches().length === 0) return true;
    const quota = this.remainingQuota();
    if (isFinite(quota) && quota <= 0) return true;
    return false;
  });

  importButtonTooltip = computed<string>(() => {
    if (this.validBatches().length === 0) return 'No valid batches to import';
    const quota = this.remainingQuota();
    if (isFinite(quota) && quota <= 0) return `Asset limit of ${this.assetLimit()} reached. Upgrade plan.`;
    if (this.showLimitExceededBanner()) {
      return `Only ${this.allowedImportCount()} of ${this.validBatches().length} batches can be imported (plan limit).`;
    }
    return `Import ${this.validBatches().length} batch(es) — ${this.totalValidUnits()} total units`;
  });

  // ── Computed: valid/invalid ────────────────────────────────────────────────
  validBatches = computed(() => this.batchRows().filter(b => this.isBatchValid(b)));
  invalidCount = computed(() => this.batchRows().filter(b => !this.isBatchValid(b)).length);
  validCount = computed(() => this.validBatches().length);

  totalImportValue = computed(() =>
    this.validBatches().reduce((s, b) => s + ((b.unitPrice ?? 0) * b.quantity), 0)
  );
  depreciableCount = computed(() => this.batchRows().filter(b => b.isDepreciable).length);

  // ── Currency ───────────────────────────────────────────────────────────────
  private get _currencyCode(): string {
    try {
      const code = this.companyStorage.getCurrency()?.trim();
      if (!code || code.length !== 3) return 'USD';
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(0);
      return code;
    } catch { return 'USD'; }
  }

  currencySymbol = computed<string>(() => {
    try {
      const code = this._currencyCode;
      return new Intl.NumberFormat('en', { style: 'currency', currency: code })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$';
    } catch { return '$'; }
  });

  currencyCode = computed<string>(() => this._currencyCode);

  // ── File slots ─────────────────────────────────────────────────────────────
  readonly fileSlots: FileSlot[] = [
    { key: '_imageFile', label: 'Asset Image', icon: 'image', accept: '.jpg,.jpeg,.png,.webp' },
    { key: '_deliveryNote', label: 'Delivery Note', icon: 'local_shipping', accept: '.pdf,.jpg,.png' },
    { key: '_receipt', label: 'Purchase Receipt', icon: 'receipt', accept: '.pdf,.jpg,.png' },
    { key: '_invoice', label: 'Invoice', icon: 'receipt_long', accept: '.pdf,.jpg,.png' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDropdowns();
    this.loadCurrentAssetCount();
  }

  private loadCurrentAssetCount(): void {
    this.assetService.getByOrg().subscribe({
      next: r => { if (r.success && r.data) this.currentAssetCount.set(r.data.length); },
      error: () => console.warn('Could not fetch asset count for quota check.')
    });
  }

  private loadDropdowns(): void {
    forkJoin({
      suppliers: this.supplierService.getSuppliersByOrg(),
      departments: this.deptService.getMyDepartments(),
      subDepartments: this.subDeptService.getSubDepartments(),
      sites: this.siteService.getMySites(),
      areas: this.areaService.getMyAreas(),
      categories: this.catService.getCategoriesByOrg(),
      subCategories: this.subCatService.getSubCategoriesByOrg(),
      usersList: this.userService.getOrganizationUsers(),
      assetStatus: this.statusService.getByOrganization(),
    }).subscribe({
      next: r => {
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
            { value: DepreciationMethod.None, label: 'None' },
            { value: DepreciationMethod.StraightLine, label: 'Straight Line' },
            { value: DepreciationMethod.DecliningBalance, label: 'Declining Balance' },
            { value: DepreciationMethod.DoubleDecliningBalance, label: 'Double Declining Balance' },
            { value: DepreciationMethod.OneFiftyDecliningBalance, label: '150% Declining Balance' },
            { value: DepreciationMethod.SumOfYearsDigits, label: 'Sum of Years Digits' },
          ],
          assignToOptions: [
            { value: AssignToType.NotAssigned, label: 'Not Assigned' },
            { value: AssignToType.User, label: 'User' },
            { value: AssignToType.Site, label: 'Site / Branch' },
          ],
        }));
        this.cdr.markForCheck();
      },
      error: () => this.globalService.showToastr('Failed to load dropdown data', 'error'),
    });
  }

  // ── Step 1: Upload ─────────────────────────────────────────────────────────
  async downloadTemplate(): Promise<void> {
    this.downloadingTemplate.set(true);
    try {
      await this.bulkTemplate.generateAndDownload(this.dropdowns());
      this.globalService.showSnackbar('Template downloaded!', 'success');
    } catch {
      this.globalService.showToastr('Failed to generate template', 'error');
    } finally {
      this.downloadingTemplate.set(false);
      this.cdr.markForCheck();
    }
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragOver.set(true); }
  onDragLeave(): void { this.isDragOver.set(false); }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this._setFile(file);
  }

  onFileSelect(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this._setFile(file);
  }

  private _setFile(file: File): void {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.parseError.set('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    this.parseError.set(null);
    this.uploadedFile.set(file);
    this.cdr.markForCheck();
  }

  removeFile(e: Event): void {
    e.stopPropagation();
    this.uploadedFile.set(null);
    this.parseError.set(null);
    this.cdr.markForCheck();
  }

  async parseAndProceed(): Promise<void> {
    const file = this.uploadedFile();
    if (!file) return;
    this.parsing.set(true);
    this.parseError.set(null);
    try {
      const rawRows = await this.bulkTemplate.parseUploadedTemplate(file, this.dropdowns());
      const mapped = rawRows.map(r => this._mapToBatchRow(r));
      this.batchRows.set(mapped);
      this.currentStep.set(2);
    } catch (err: any) {
      this.parseError.set(err?.message ?? 'Failed to parse file. Please use the official template.');
    } finally {
      this.parsing.set(false);
      this.cdr.markForCheck();
    }
  }

  private _mapToBatchRow(r: ParsedBulkRow): BulkBatchRow {
    const unitAssignments: UnitAssignment[] = Array.from({ length: r.quantity }, (_, i) => ({
      unitIndex: i,
      serialNumber: r.serialNumbers[i] ?? '',
      assignTo: AssignToType.NotAssigned,
    }));

    return {
      name: r.name,
      assetBrand: r.assetBrand,
      assetModelNo: r.assetModelNo,
      quantity: r.quantity,
      serialNumbers: [...r.serialNumbers],
      serialNumbersRaw: r.serialNumbersRaw,
      unitPrice: r.unitPrice,
      description: r.description,
      warranetyInMonth: r.warranetyInMonth,
      note: r.note,
      category: r.category,
      subCategory: r.subCategory,
      supplier: r.supplier,
      assetStatus: r.assetStatus,
      department: r.department,
      subDepartment: r.subDepartment,
      depreciationMethod: r.depreciationMethod,
      categoryDisplay: r.categoryDisplay,
      subCategoryDisplay: r.subCategoryDisplay,
      supplierDisplay: r.supplierDisplay,
      assetStatusDisplay: r.assetStatusDisplay,
      departmentDisplay: r.departmentDisplay,
      subDepartmentDisplay: r.subDepartmentDisplay,
      isDepreciable: r.isDepreciable,
      depreciableCost: r.depreciableCost,
      salvageValue: r.salvageValue,
      depreciationInMonth: r.depreciationInMonth,
      dateAquired: r.dateAquired,
      dateOfPurchase: r.dateOfPurchase,
      dateOfManufacture: r.dateOfManufacture,
      yearOfValuation: r.yearOfValuation,
      unitAssignments,
      assignMode: 'global',
      globalAssignTo: AssignToType.NotAssigned,
      _serialsValid: r.serialNumbers.every(s => !!s.trim()),
      _serialCountMismatch: r.serialNumbers.length !== r.quantity,
      _autoFilledSerials: r.serialNumbers.some(s => s.includes('-00')),
    };
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  isBatchValid(batch: BulkBatchRow): boolean {
    return !!(
      batch.name?.trim() &&
      batch.assetBrand?.trim() &&
      batch.assetModelNo?.trim() &&
      batch.quantity >= 1 &&
      batch.serialNumbers.length === batch.quantity &&
      batch.serialNumbers.every(s => !!s?.trim())
    );
  }

  getValidationErrors(batch: BulkBatchRow): string[] {
    const errors: string[] = [];
    if (!batch.name?.trim()) errors.push('Asset Name is required');
    if (!batch.assetBrand?.trim()) errors.push('Brand is required');
    if (!batch.assetModelNo?.trim()) errors.push('Model Number is required');
    if (batch.quantity < 1) errors.push('Quantity must be at least 1');
    if (batch.serialNumbers.length !== batch.quantity)
      errors.push(`Serial numbers count (${batch.serialNumbers.length}) ≠ Quantity (${batch.quantity})`);
    const blanks = batch.serialNumbers.filter(s => !s?.trim()).length;
    if (blanks > 0) errors.push(`${blanks} serial number(s) are empty`);
    return errors;
  }

  hasSerialIssue(batch: BulkBatchRow): boolean {
    return batch.serialNumbers.length !== batch.quantity ||
      batch.serialNumbers.some(s => !s?.trim());
  }

  // ── Review table actions ────────────────────────────────────────────────────
  removeBatch(index: number): void {
    this.batchRows.update(list => list.filter((_, i) => i !== index));
    if (this.editingIndex() === index) this.closeEditDrawer();
    this.cdr.markForCheck();
  }

  clearAll(): void { this.batchRows.set([]); this.cdr.markForCheck(); }

  // ── Serial number inline editing ───────────────────────────────────────────
  updateSerial(batchIndex: number, unitIndex: number, value: string): void {
    this.batchRows.update(list => {
      const updated = [...list];
      const batch = { ...updated[batchIndex] };
      batch.serialNumbers = [...batch.serialNumbers];
      batch.serialNumbers[unitIndex] = value.trim();
      batch.unitAssignments = batch.unitAssignments.map((ua, i) =>
        i === unitIndex ? { ...ua, serialNumber: value.trim() } : ua
      );
      batch._serialsValid = batch.serialNumbers.every(s => !!s.trim());
      updated[batchIndex] = batch;
      return updated;
    });
    this.cdr.markForCheck();
  }

  autoFillSerials(batchIndex: number): void {
    this.batchRows.update(list => {
      const updated = [...list];
      const batch = { ...updated[batchIndex] };
      const base = batch.assetModelNo?.trim() || 'SN';
      batch.serialNumbers = Array.from({ length: batch.quantity }, (_, i) =>
        `${base}-${String(i + 1).padStart(3, '0')}`
      );
      batch.unitAssignments = batch.unitAssignments.map((ua, i) => ({
        ...ua, serialNumber: batch.serialNumbers[i]
      }));
      batch._serialsValid = true;
      batch._autoFilledSerials = true;
      updated[batchIndex] = batch;
      return updated;
    });
    this.cdr.markForCheck();
  }

  // ── Proceed to import ──────────────────────────────────────────────────────
  proceedToImport(): void {
    const quota = this.remainingQuota();
    let batchesToImport: BulkBatchRow[];

    if (isFinite(quota) && this.totalValidUnits() > quota) {
      // Take whole batches up to allowed count
      batchesToImport = this.validBatches().slice(0, this.allowedImportCount());
      const skipped = this.validBatches().length - this.allowedImportCount();
      if (skipped > 0) {
        this.globalService.showSnackbar(
          `Importing ${this.allowedImportCount()} batch(es). ${skipped} skipped (plan limit).`,
          'warning'
        );
      }
    } else {
      batchesToImport = this.validBatches();
    }

    this.currentStep.set(3);
    this.importResults.set(batchesToImport.map(batch => ({ batch, status: 'pending' })));
    this.importedCount.set(0);
    this.failedCount.set(0);
    this.skippedCount.set(0);
    this.cdr.markForCheck();
    this._startImport();
  }

  // ── Import engine ──────────────────────────────────────────────────────────
  private async _startImport(): Promise<void> {
    const results = this.importResults();

    for (let i = 0; i < results.length; i++) {
      // Mark as uploading
      this.importResults.update(list => {
        const u = [...list];
        u[i] = { ...u[i], status: 'uploading' };
        return u;
      });
      this.currentImporting.set(results[i].batch.name);
      this.currentImportingUnit.set(
        `Batch of ${results[i].batch.quantity} unit(s)`
      );
      this.cdr.markForCheck();

      await new Promise(r => setTimeout(r, 300));

      try {
        await this._uploadBatch(results[i].batch);
        this.importResults.update(list => {
          const u = [...list];
          u[i] = { ...u[i], status: 'success' };
          return u;
        });
        this.importedCount.update(n => n + 1);
        this.currentAssetCount.update(n => n + results[i].batch.quantity);
      } catch (err: any) {
        const errorMsg = err?.error?.message ?? err?.message ?? 'Upload failed. Please retry.';
        this.importResults.update(list => {
          const u = [...list];
          u[i] = { ...u[i], status: 'failed', error: errorMsg };
          return u;
        });
        this.failedCount.update(n => n + 1);
      }
      this.cdr.markForCheck();
    }

    this.currentImporting.set(null);
    this.currentImportingUnit.set(null);
    await new Promise(r => setTimeout(r, 700));
    this.currentStep.set(4);
    this.cdr.markForCheck();
  }

  private _uploadBatch(batch: BulkBatchRow): Promise<any> {
    const serialNumbers = batch.serialNumbers.map(s => s.trim());
    const isPerUnit = batch.assignMode === 'per-unit' && batch.quantity > 1;

    // ── Build per-unit assignment list when Individual Assignment mode is active ──
    // Each entry maps 1-to-1 with a unit via sequence (1-based = unitIndex + 1).
    // The backend CreateAsync iterates createdAssets and matches by BatchSequence.
    const unitAssignments: UnitAssignmentRequest[] | undefined = isPerUnit
      ? batch.unitAssignments.map((ua, i) => ({
        sequence: i + 1,
        assignTo: ua.assignTo ?? AssignToType.NotAssigned,
        assignUserId: ua.assignUserId ?? undefined,
        siteId: ua.siteId ?? undefined,
        areaId: ua.areaId ?? undefined,
        assetStatus: batch.assetStatus ?? 0,
      }))
      : undefined;

    // In per-unit mode, top-level assignTo is NotAssigned — the backend
    // uses the UnitAssignments[] array for each unit's individual assignment.
    const topLevelAssignTo = isPerUnit
      ? AssignToType.NotAssigned
      : (batch.globalAssignTo ?? AssignToType.NotAssigned);

    const req: AssetRequest = {
      name: batch.name,
      assetBrand: batch.assetBrand,
      assetModelNo: batch.assetModelNo,
      assetSerialNo: serialNumbers[0] ?? '',
      serialNumbers: serialNumbers.length > 1 ? serialNumbers : undefined,
      quantity: batch.quantity,
      unitPrice: batch.unitPrice,
      description: batch.description,
      warranetyInMonth: batch.warranetyInMonth,
      note: batch.note,
      category: batch.category,
      subCategory: batch.subCategory,
      supplier: batch.supplier,
      assetStatus: batch.assetStatus,
      department: batch.department,
      subDepartment: batch.subDepartment,
      isDepreciable: batch.isDepreciable ?? false,
      depreciableCost: batch.depreciableCost,
      salvageValue: batch.salvageValue,
      depreciationInMonth: batch.depreciationInMonth,
      depreciationMethod: batch.depreciationMethod,
      dateAquired: batch.dateAquired ?? undefined,
      dateOfPurchase: batch.dateOfPurchase ?? undefined,
      dateOfManufacture: batch.dateOfManufacture ?? undefined,
      yearOfValuation: batch.yearOfValuation ?? undefined,

      // ── Assignment ──────────────────────────────────────────────────────────
      assignTo: topLevelAssignTo,
      assignUserId: isPerUnit ? undefined : batch.globalAssignUserId,
      assignSiteId: isPerUnit ? undefined : batch.globalSiteId,
      assignAreaId: isPerUnit ? undefined : batch.globalAreaId,
      unitAssignments,   // undefined for global mode, UnitAssignmentRequest[] for per-unit

      // ── Files ───────────────────────────────────────────────────────────────
      imageFile: batch._imageFile ?? undefined,
      deliveryNoteFile: batch._deliveryNote ?? undefined,
      purchaseReceiptFile: batch._receipt ?? undefined,
      invoiceFile: batch._invoice ?? undefined,
    };

    return new Promise((resolve, reject) => {
      this.assetService.createAsset(req).subscribe({ next: resolve, error: reject });
    });
  }

  // ── Retry / skip ───────────────────────────────────────────────────────────
  async retryBatch(item: ImportResult): Promise<void> {
    const idx = this.importResults().indexOf(item);
    if (idx === -1) return;
    this.importResults.update(list => {
      const u = [...list];
      u[idx] = { ...u[idx], status: 'uploading', error: undefined };
      return u;
    });
    this.cdr.markForCheck();
    try {
      await this._uploadBatch(item.batch);
      this.importResults.update(list => {
        const u = [...list];
        u[idx] = { ...u[idx], status: 'success' };
        return u;
      });
      this.importedCount.update(n => n + 1);
      this.currentAssetCount.update(n => n + item.batch.quantity);
      this.failedCount.update(n => Math.max(0, n - 1));
    } catch (err: any) {
      const errorMsg = err?.error?.message ?? err?.message ?? 'Upload failed.';
      this.importResults.update(list => {
        const u = [...list];
        u[idx] = { ...u[idx], status: 'failed', error: errorMsg };
        return u;
      });
    }
    this.cdr.markForCheck();
  }

  editFailedBatch(item: ImportResult): void {
    const idx = this.batchRows().findIndex(b => b === item.batch);
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
    this.cdr.markForCheck();
  }

  // ── Edit Drawer ────────────────────────────────────────────────────────────
  openEditDrawer(index: number): void {
    this._clearDrawerSubs();
    this.editingIndex.set(index);
    this.editingUnitIndex.set(0);
    const batch = this.batchRows()[index];
    this.editForm = this._buildEditForm(batch);

    this.drawerSelectedCategory.set(batch.category ?? null);
    this.drawerSelectedDepartment.set(batch.department ?? null);
    this.drawerSelectedSite.set(batch.globalSiteId ?? null);
    this.drawerGlobalAssignTo.set(batch.globalAssignTo ?? AssignToType.NotAssigned);

    const catSub = this.editForm.get('category')!.valueChanges.subscribe(val => {
      this.drawerSelectedCategory.set(val ?? null);
      this.editForm.get('subCategory')!.setValue(null, { emitEvent: false });
    });
    const deptSub = this.editForm.get('department')!.valueChanges.subscribe(val => {
      this.drawerSelectedDepartment.set(val ?? null);
      this.editForm.get('subDepartment')!.setValue(null, { emitEvent: false });
    });
    const siteSub = this.editForm.get('globalSiteId')!.valueChanges.subscribe(val => {
      this.drawerSelectedSite.set(val ?? null);
      this.editForm.get('globalAreaId')!.setValue(null, { emitEvent: false });
    });
    const assignSub = this.editForm.get('globalAssignTo')!.valueChanges.subscribe(val => {
      this.drawerGlobalAssignTo.set(val ?? AssignToType.NotAssigned);
    });

    this._drawerSubs = [catSub, deptSub, siteSub, assignSub];
    this.cdr.markForCheck();
  }

  closeEditDrawer(): void {
    this._clearDrawerSubs();
    this.editingIndex.set(null);
    this.cdr.markForCheck();
  }

  private _clearDrawerSubs(): void {
    this._drawerSubs.forEach(s => s.unsubscribe());
    this._drawerSubs = [];
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;
    const idx = this.editingIndex();
    if (idx === null) return;
    const v = this.editForm.value;
    const d = this.dropdowns();

    // Resolve display labels
    const catObj = d.categories.find(c => c.value === v.category);
    const subCatObj = d.allSubCategories.find(s => s.value === v.subCategory);
    const suppObj = d.suppliers.find(s => s.value === v.supplier);
    const statusObj = d.assetStatus.find(s => s.value === v.assetStatus);
    const deptObj = d.departments.find(d => d.value === v.department);
    const subDObj = d.allSubDepartments.find(s => s.value === v.subDepartment);
    const userObj = d.usersList.find(u => u.value === v.globalAssignUserId);
    const siteObj = d.sites.find(s => s.value === v.globalSiteId);

    // Parse serial numbers from textarea
    const rawSerials = (v.serialNumbersRaw ?? '')
      .split(',').map((s: string) => s.trim()).filter(Boolean);
    const qty = Math.max(1, v.quantity ?? 1);
    const serials = rawSerials.length === qty ? rawSerials :
      Array.from({ length: qty }, (_, i) => rawSerials[i] ?? `${v.assetModelNo}-${String(i + 1).padStart(3, '0')}`);

    this.batchRows.update(list => {
      const updated = [...list];
      const prev = updated[idx];
      updated[idx] = {
        ...prev,
        ...v,
        serialNumbers: serials,
        quantity: qty,
        categoryDisplay: catObj?.label,
        subCategoryDisplay: subCatObj?.label,
        supplierDisplay: suppObj?.label,
        assetStatusDisplay: statusObj?.label,
        departmentDisplay: deptObj?.label,
        subDepartmentDisplay: subDObj?.label,
        unitAssignments: serials.map((sn: string, i: number) => ({
          ...prev.unitAssignments[i],
          unitIndex: i,
          serialNumber: sn,
        })),
        _serialsValid: serials.every((s: string) => !!s.trim()),
        _serialCountMismatch: serials.length !== qty,
      };
      return updated;
    });

    this.closeEditDrawer();
    this.globalService.showSnackbar('Batch updated', 'success');
    this.cdr.markForCheck();
  }

  getCurrentEditBatch(): BulkBatchRow | null {
    const idx = this.editingIndex();
    if (idx === null) return null;
    return this.batchRows()[idx] ?? null;
  }

  // ── Unit assignment update (from drawer) ───────────────────────────────────
  updateUnitAssignment(batchIndex: number, unitIndex: number, field: keyof UnitAssignment, value: any): void {
    this.batchRows.update(list => {
      const updated = [...list];
      const batch = { ...updated[batchIndex] };
      batch.unitAssignments = batch.unitAssignments.map((ua, i) => {
        if (i !== unitIndex) return ua;
        const next = { ...ua, [field]: value };
        if (field === 'assignTo') {
          next.assignUserId = undefined;
          next.siteId = undefined;
          next.areaId = undefined;
        }
        if (field === 'siteId') next.areaId = undefined;
        return next;
      });
      updated[batchIndex] = batch;
      return updated;
    });
    this.cdr.markForCheck();
  }

  getFilteredAreasForUnit(unitAssignment: UnitAssignment) {
    if (!unitAssignment.siteId) return this.dropdowns().allAreas;
    return this.dropdowns().allAreas.filter(a => a.siteId === unitAssignment.siteId);
  }

  // ── File handling ──────────────────────────────────────────────────────────
  onSlotFileChange(e: Event, key: keyof BulkBatchRow): void {
    e.stopPropagation();
    const file = (e.target as HTMLInputElement).files?.[0];
    const idx = this.editingIndex();
    if (idx === null || !file) return;
    this.batchRows.update(list => {
      const updated = [...list];
      (updated[idx] as any)[key] = file;
      return updated;
    });
    this.cdr.markForCheck();
  }

  removeSlotFile(e: Event, key: keyof BulkBatchRow): void {
    e.stopPropagation();
    const idx = this.editingIndex();
    if (idx === null) return;
    this.batchRows.update(list => {
      const updated = [...list];
      (updated[idx] as any)[key] = null;
      return updated;
    });
    this.cdr.markForCheck();
  }

  // ── Form builder ───────────────────────────────────────────────────────────
  private _buildEditForm(batch: BulkBatchRow): FormGroup {
    // Rebuild serialNumbersRaw from the array
    const serialRaw = batch.serialNumbers.join(', ');
    return this.fb.group({
      name: [batch.name, [Validators.required, Validators.minLength(2)]],
      assetBrand: [batch.assetBrand, Validators.required],
      assetModelNo: [batch.assetModelNo, Validators.required],
      quantity: [batch.quantity, [Validators.required, Validators.min(1), Validators.max(500)]],
      serialNumbersRaw: [serialRaw, Validators.required],
      unitPrice: [batch.unitPrice ?? null],
      description: [batch.description ?? ''],
      warranetyInMonth: [batch.warranetyInMonth ?? null],
      note: [batch.note ?? ''],
      category: [batch.category ?? null],
      subCategory: [batch.subCategory ?? null],
      supplier: [batch.supplier ?? null],
      assetStatus: [batch.assetStatus ?? null],
      department: [batch.department ?? null],
      subDepartment: [batch.subDepartment ?? null],
      isDepreciable: [batch.isDepreciable ?? false],
      depreciableCost: [batch.depreciableCost ?? null],
      salvageValue: [batch.salvageValue ?? null],
      depreciationInMonth: [batch.depreciationInMonth ?? null],
      depreciationMethod: [batch.depreciationMethod ?? null],
      dateAquired: [batch.dateAquired ?? null],
      dateOfPurchase: [batch.dateOfPurchase ?? null],
      dateOfManufacture: [batch.dateOfManufacture ?? null],
      yearOfValuation: [batch.yearOfValuation ?? null],
      assignMode: [batch.assignMode ?? 'global'],
      globalAssignTo: [batch.globalAssignTo ?? AssignToType.NotAssigned],
      globalAssignUserId: [batch.globalAssignUserId ?? null],
      globalSiteId: [batch.globalSiteId ?? null],
      globalAreaId: [batch.globalAreaId ?? null],
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goToAssets(): void { this.router.navigate(['/asset-management']); }
  cancel(): void { this.router.navigate(['/asset-management']); }
  goToUpgrade(): void { this.router.navigate(['/settings/subscription']); }

  startFresh(): void {
    this.uploadedFile.set(null);
    this.batchRows.set([]);
    this.importResults.set([]);
    this.importedCount.set(0);
    this.failedCount.set(0);
    this.skippedCount.set(0);
    this.parseError.set(null);
    this.currentStep.set(1);
    this.loadCurrentAssetCount();
    this.cdr.markForCheck();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  formatAmount(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) return '—';
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency', currency: this._currencyCode,
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(value);
    } catch { return `${this.currencySymbol()}${value.toFixed(2)}`; }
  }

  trackByIndex(index: number): number { return index; }

  assignIcon(val: AssignToType): string {
    const icons: Record<number, string> = { 0: 'do_not_disturb', 1: 'person', 2: 'location_city' };
    return icons[val] ?? 'help';
  }

  getUnitAssignSummary(ua: UnitAssignment): string {
    if (ua.assignTo === AssignToType.User) {
      const u = this.dropdowns().usersList.find(x => x.value === ua.assignUserId);
      return u ? u.label : 'Select user';
    }
    if (ua.assignTo === AssignToType.Site) {
      const s = this.dropdowns().sites.find(x => x.value === ua.siteId);
      return s ? s.label : 'Select site';
    }
    return 'Not Assigned';
  }

  getSerialCount(): number {

    const raw =
      this.editForm.get('serialNumbersRaw')?.value || '';

    return raw
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => !!s)
      .length;
  }

  isSerialCountValid(batch: any): boolean {

    if (!batch?.serialNumbers) {
      return false;
    }

    return (
      batch.serialNumbers.length === batch.quantity &&
      batch.serialNumbers.every((s: string) => !!s?.trim())
    );
  }

  hasInvalidSerials(batch: any): boolean {

    if (!batch?.serialNumbers) {
      return true;
    }

    return (
      batch.serialNumbers.length !== batch.quantity ||
      batch.serialNumbers.some((s: string) => !s?.trim())
    );
  }
}
