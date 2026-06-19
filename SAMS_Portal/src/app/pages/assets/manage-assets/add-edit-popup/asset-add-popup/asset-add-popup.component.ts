import {
  Component, inject, OnInit, OnDestroy, signal,
  computed, ViewChild, ElementRef, ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import {
  animate, style, transition, trigger
} from '@angular/animations';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CompanyStorageService } from '../../../../../core/services/localStorage/company/company-storage.service';
import { PopupWidgetService } from '../../../../../core/services/popup-widget/popup-widget.service';
import { AssetCategoriesService } from '../../../../../core/services/asset-categories/asset-categories.service';
import { GlobalService } from '../../../../../core/services/global/global.service';
import { AssetSubCategoriesService } from '../../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { DepartmentService } from '../../../../../core/services/department/department.service';
import { SuppliersService } from '../../../../../core/services/supplier/suppliers.service';
import { SubDepartmentService } from '../../../../../core/services/department/sub-department/sub-department.service';
import { AssignToType, DepreciationMethod } from '../../../../../core/enum/asset.enums';
import { AssetDropdownData, AssetDropdownOption, UnitAssignmentRequest } from '../../../../../core/models/interfaces/asset-manage/assets.interface';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';

export interface AssetAddPopupData {
  dropdownData: AssetDropdownData;
}

interface DepSummary {
  depreciableCost: number;
  salvageValue: number;
  netAmount: number;
  annualDep: number;
  monthlyDep: number;
  methodLabel: string;
}

interface DepPreviewRow {
  year: number;
  begin: number;
  dep: number;
  end: number;
}

/** Per-unit assignment config */
interface UnitAssignment {
  unitIndex: number;        // 0-based
  assignTo: AssignToType;
  assignUserId?: number;
  siteId?: number;
  areaId?: number;
  filteredAreas?: AssetDropdownOption[];
}

@Component({
  selector: 'app-asset-add-popup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatRadioModule,
    MatCheckboxModule,
    MatBadgeModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './asset-add-popup.component.html',
  styleUrl: './asset-add-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('220ms cubic-bezier(0.4,0,0.2,1)',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)', maxHeight: '0px', overflow: 'hidden' }),
        animate('220ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)', maxHeight: '800px' }))
      ]),
      transition(':leave', [
        animate('160ms ease-in',
          style({ opacity: 0, transform: 'translateY(-4px)', maxHeight: '0px' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AssetAddPopupComponent implements OnInit, OnDestroy {

  private dialogRef = inject(MatDialogRef<AssetAddPopupComponent>);
  private data: AssetAddPopupData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private companyStorage = inject(CompanyStorageService);
  private popupService = inject(PopupWidgetService);
  private globalService = inject(GlobalService);
  private categoryService = inject(AssetCategoriesService);
  private subCategoryService = inject(AssetSubCategoriesService);
  private supplierService = inject(SuppliersService);
  private departmentService = inject(DepartmentService);
  private subDepartmentService = inject(SubDepartmentService);

  private destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────
  currentStep = 0;
  completedSteps = new Set<number>();
  submitting = false;
  AssignToType = AssignToType;

  steps = [
    { label: 'Basic Info', icon: 'inventory_2' },
    { label: 'Units & Serials', icon: 'widgets' },
    { label: 'Depreciation', icon: 'trending_down' },
    { label: 'Assignment', icon: 'assignment_ind' },
    { label: 'Documents', icon: 'folder_open' }
  ];

  // File state
  files: Record<string, File> = {};
  filePreviews: Record<string, string> = {};
  fileNames: Record<string, string> = {};

  @ViewChild('imageUrlInput') imageUrlInput!: ElementRef<HTMLInputElement>;
  @ViewChild('deliveryNoteInput') deliveryNoteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('purchaseReceiptInput') purchaseReceiptInput!: ElementRef<HTMLInputElement>;
  @ViewChild('invoiceInput') invoiceInput!: ElementRef<HTMLInputElement>;

  // Dropdown data
  dropdownData = signal<AssetDropdownData>({ ...this.data.dropdownData });

  // Filtered cascades (shared)
  filteredSubCategories: AssetDropdownOption[] = [];
  filteredSubDepartments: AssetDropdownOption[] = [];
  userSearchCtrl = new FormControl('');
  filteredUsers: AssetDropdownOption[] = [];

  // Dep calculation
  depSummary: DepSummary | null = null;
  depPreviewRows: DepPreviewRow[] = [];

  // Per-unit serial number inputs (for quantity > 1)
  unitSerials: string[] = [];

  // Per-unit assignment
  unitAssignments: UnitAssignment[] = [];
  /** Which unit is expanded in assignment panel */
  expandedUnitIndex = 0;
  /** Global assignment mode: 'single' = all same, 'per-unit' = individual */
  assignmentMode: 'global' | 'per-unit' = 'global';

  get quantity(): number {
    return Math.max(1, this.basicForm?.get('quantity')?.value ?? 1);
  }

  get depreciationYears(): number {
    const m = this.depForm?.get('depreciationInMonth')?.value;
    return m ? Math.ceil(m / 12) : 0;
  }

  get currencySymbol(): string {
    try {
      const code = this.companyStorage.getCurrency()?.trim() || 'USD';
      return (new Intl.NumberFormat('en', { style: 'currency', currency: code })
        .formatToParts(0).find(p => p.type === 'currency')?.value ?? '$');
    } catch { return '$'; }
  }

  // ── Forms ──────────────────────────────────────────────────────────
  basicForm!: FormGroup;
  classForm!: FormGroup;
  datesForm!: FormGroup;
  depForm!: FormGroup;
  globalAssignForm!: FormGroup;   // for global assignment
  notesForm!: FormGroup;

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForms();
    this.setupFormDependencies();
    this.subscribeAutoCalc();
    this.initUnitSerials(1);
    this.initUnitAssignments(1);
    this.filteredUsers = [...this.dropdownData().usersList];
    this.userSearchCtrl.valueChanges.pipe(
      debounceTime(200), takeUntil(this.destroy$)
    ).subscribe(q => this.filterUsers(q ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form builders ──────────────────────────────────────────────────
  private buildForms(): void {
    this.basicForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      assetBrand: ['', Validators.required],
      assetModelNo: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(500)]],
      unitPrice: [null, [Validators.min(0)]],
      assetStatus: [null, Validators.required],
      description: ['', Validators.maxLength(500)]
    });

    this.classForm = this.fb.group({
      category: [null],
      subCategory: [{ value: null, disabled: true }],
      supplier: [null],
      warranetyInMonth: [null, Validators.min(0)],
      department: [null],
      subDepartment: [{ value: null, disabled: true }]
    });

    this.datesForm = this.fb.group({
      dateOfPurchase: [null],
      dateOfManufacture: [null],
      yearOfValuation: [null]
    });

    this.depForm = this.fb.group({
      isDepreciable: [false],
      depreciableCost: [null],
      salvageValue: [null],
      depreciationInMonth: [null],
      depreciationMethod: [null],
      dateAquired: [null]
    });

    this.globalAssignForm = this.fb.group({
      assignTo: [AssignToType.NotAssigned],
      assignUserId: [null],
      siteId: [null],
      areaId: [{ value: null, disabled: true }],
      transferDate: [new Date()],
      dueDate: [null],
      note: ['']
    });

    this.notesForm = this.fb.group({
      note: ['']
    });
  }

  private setupFormDependencies(): void {
    this.classForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const sub = this.classForm.get('subCategory');
        if (val) { sub?.enable(); }
        else { sub?.disable(); sub?.reset(); }
      });

    this.classForm.get('department')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const sub = this.classForm.get('subDepartment');
        if (val) { sub?.enable(); }
        else { sub?.disable(); sub?.reset(); }
      });

    this.globalAssignForm.get('siteId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const area = this.globalAssignForm.get('areaId');
        if (val) { area?.enable(); }
        else { area?.disable(); area?.reset(); }
      });

    // When quantity changes, resize serial & assignment arrays
    this.basicForm.get('quantity')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(val => {
        const qty = Math.max(1, Number(val) || 1);
        this.initUnitSerials(qty);
        this.initUnitAssignments(qty);
        this.cdr.markForCheck();
      });
  }

  private subscribeAutoCalc(): void {
    const updateDepCost = () => {
      const price = this.basicForm.get('unitPrice')?.value ?? 0;
      const qty = this.basicForm.get('quantity')?.value ?? 1;
      const calc = price * qty;
      if (calc > 0 && this.depForm.get('isDepreciable')?.value) {
        this.depForm.patchValue({ depreciableCost: calc }, { emitEvent: false });
      }
    };

    this.basicForm.get('unitPrice')?.valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(() => { updateDepCost(); this.recalcDepreciation(); });
    this.basicForm.get('quantity')?.valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(() => { updateDepCost(); this.recalcDepreciation(); });
    this.depForm.valueChanges
      .pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcDepreciation());

    this.depForm.get('isDepreciable')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.applyPurchaseDateValidation(!!val));
  }

  // ── Unit Serial Management ─────────────────────────────────────────
  initUnitSerials(qty: number): void {
    const prev = this.unitSerials.slice();
    this.unitSerials = Array.from({ length: qty }, (_, i) => prev[i] ?? '');
  }

  updateSerial(index: number, value: string): void {
    this.unitSerials[index] = value;
  }

  fillSerialsSequentially(): void {
    const base = this.basicForm.get('assetModelNo')?.value ?? 'SN';
    this.unitSerials = this.unitSerials.map((_, i) => `${base}-${String(i + 1).padStart(3, '0')}`);
    this.cdr.markForCheck();
  }

  clearAllSerials(): void {
    this.unitSerials = this.unitSerials.map(() => '');
    this.cdr.markForCheck();
  }

  get allSerialsValid(): boolean {
    if (this.quantity === 1) return true; // single unit: serial not required from units step
    return this.unitSerials.every(s => s.trim().length > 0);
  }

  get serialsEntered(): number {
    return this.unitSerials.filter(s => s.trim().length > 0).length;
  }

  trackByIndex(index: number): number { return index; }

  // ── Unit Assignment Management ─────────────────────────────────────
  initUnitAssignments(qty: number): void {
    const prev = this.unitAssignments.slice();
    this.unitAssignments = Array.from({ length: qty }, (_, i) => {
      if (prev[i]) return { ...prev[i], unitIndex: i };
      return {
        unitIndex: i,
        assignTo: AssignToType.NotAssigned,
        assignUserId: undefined,
        siteId: undefined,
        areaId: undefined,
        filteredAreas: []
      };
    });
  }

  setGlobalAssignment(): void {
    const g = this.globalAssignForm.value;
    this.unitAssignments = this.unitAssignments.map(ua => ({
      ...ua,
      assignTo: g.assignTo,
      assignUserId: g.assignUserId,
      siteId: g.siteId,
      areaId: g.areaId,
    }));
    this.cdr.markForCheck();
  }

  updateUnitAssignment(i: number, field: keyof UnitAssignment, value: any): void {
    const ua = { ...this.unitAssignments[i], [field]: value };
    if (field === 'siteId') {
      ua.areaId = undefined;
      ua.filteredAreas = this.dropdownData().allAreas.filter(a => a.siteId === value);
    }
    if (field === 'assignTo') {
      ua.assignUserId = undefined;
      ua.siteId = undefined;
      ua.areaId = undefined;
      ua.filteredAreas = [];
    }
    this.unitAssignments[i] = ua;
    this.cdr.markForCheck();
  }

  getFilteredAreasForUnit(i: number): AssetDropdownOption[] {
    return this.unitAssignments[i]?.filteredAreas ?? [];
  }

  assignIcon(val: AssignToType): string {
    const icons: Record<number, string> = {
      0: 'do_not_disturb', 1: 'person', 2: 'location_city'
    };
    return icons[val] ?? 'help';
  }

  assignLabel(val: AssignToType): string {
    switch (val) {
      case AssignToType.User: return 'User';
      case AssignToType.Site: return 'Site';
      default: return 'Not Assigned';
    }
  }

  getAssignSummary(ua: UnitAssignment): string {
    if (ua.assignTo === AssignToType.User) {
      const u = this.dropdownData().usersList.find(x => x.value === ua.assignUserId);
      return u ? u.label : 'User';
    }
    if (ua.assignTo === AssignToType.Site) {
      const s = this.dropdownData().sites.find(x => x.value === ua.siteId);
      return s ? s.label : 'Site';
    }
    return 'Not Assigned';
  }

  // ── Global Site → Area cascade for global assign form ──────────────
  filteredAreasGlobal: AssetDropdownOption[] = [];

  onGlobalSiteChange(siteId: number): void {
    this.globalAssignForm.patchValue({ areaId: null });
    this.filteredAreasGlobal = this.dropdownData().allAreas.filter(a => a.siteId === siteId);
    this.cdr.markForCheck();
  }

  selectGlobalAssignType(val: AssignToType): void {
    this.globalAssignForm.patchValue({ assignTo: val });
    this.cdr.markForCheck();
  }

  // ── Navigation ─────────────────────────────────────────────────────
  goToStep(i: number): void { this.currentStep = i; this.cdr.markForCheck(); }

  nextStep(): void {
    if (!this.validateCurrentStep()) return;
    if (this.currentStep < this.steps.length - 1) {
      this.completedSteps.add(this.currentStep);
      this.currentStep++;
      this.cdr.markForCheck();
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) { this.currentStep--; this.cdr.markForCheck(); }
  }

  private validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      this.basicForm.markAllAsTouched();
      this.classForm.markAllAsTouched();
      if (this.basicForm.invalid) {
        this.globalService.showToastr('Please fill all required fields', 'error');
        return false;
      }
    }
    if (this.currentStep === 1) {
      // Validate serials — at least the count should match if qty > 1
      if (this.quantity > 1 && this.serialsEntered < this.quantity) {
        this.globalService.showToastr(
          `Please enter serial numbers for all ${this.quantity} units (${this.serialsEntered}/${this.quantity} filled)`,
          'error'
        );
        return false;
      }
    }
    if (this.currentStep === 2) {
      const isDepr = !!this.depForm.get('isDepreciable')?.value;
      if (isDepr && this.depForm.invalid) {
        this.depForm.markAllAsTouched();
        this.globalService.showToastr('Please complete depreciation fields', 'error');
        return false;
      }
      if (isDepr && !this.datesForm.get('dateOfPurchase')?.value) {
        this.datesForm.get('dateOfPurchase')?.markAsTouched();
        this.globalService.showToastr('Purchase Date is required when depreciation is enabled', 'error');
        return false;
      }
    }
    return true;
  }

  stepHasError(i: number): boolean {
    if (i === 0) return (this.basicForm.invalid && this.basicForm.dirty);
    if (i === 2) {
      return !!(this.depForm.get('isDepreciable')?.value && this.depForm.invalid && this.depForm.dirty);
    }
    return false;
  }

  // ── Cascades ───────────────────────────────────────────────────────
  onCategoryChange(catId: number): void {
    this.classForm.patchValue({ subCategory: null });
    this.filteredSubCategories = this.dropdownData().allSubCategories
      .filter(sc => sc.categoryId === catId);
    this.cdr.markForCheck();
  }

  onDepartmentChange(deptId: number): void {
    this.classForm.patchValue({ subDepartment: null });
    this.filteredSubDepartments = this.dropdownData().allSubDepartments
      .filter(sd => sd.departmentId === deptId);
    this.cdr.markForCheck();
  }

  filterUsers(q: string): void {
    const lower = q.toLowerCase();
    this.filteredUsers = this.dropdownData().usersList
      .filter(u => u.label.toLowerCase().includes(lower));
    this.cdr.markForCheck();
  }

  // ── Depreciation ───────────────────────────────────────────────────
  private applyPurchaseDateValidation(isDepreciable: boolean): void {
    const ctrl = this.datesForm.get('dateOfPurchase');
    if (!ctrl) return;
    if (isDepreciable) { ctrl.addValidators(Validators.required); }
    else { ctrl.removeValidators(Validators.required); }
    ctrl.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  onDepreciableToggle(val: boolean): void {
    if (val) {
      const price = this.basicForm.get('unitPrice')?.value ?? 0;
      const qty = this.basicForm.get('quantity')?.value ?? 1;
      if (price > 0) {
        this.depForm.patchValue({ depreciableCost: price * qty }, { emitEvent: false });
      }
    }
    this.applyPurchaseDateValidation(val);
    this.recalcDepreciation();
    this.cdr.markForCheck();
  }

  recalcDepreciation(): void {
    const v = this.depForm.value;
    if (!v.isDepreciable || !v.depreciableCost || !v.depreciationInMonth) {
      this.depSummary = null;
      this.depPreviewRows = [];
      this.cdr.markForCheck();
      return;
    }

    const cost = Number(v.depreciableCost) || 0;
    const salvage = Number(v.salvageValue) || 0;
    const months = Number(v.depreciationInMonth) || 0;
    const method = v.depreciationMethod ?? DepreciationMethod.StraightLine;
    const years = Math.ceil(months / 12);
    const netAmount = cost - salvage;

    let annualDep = 0;
    switch (method) {
      case DepreciationMethod.StraightLine: annualDep = years > 0 ? netAmount / years : 0; break;
      case DepreciationMethod.DecliningBalance: annualDep = years > 0 ? cost / years : 0; break;
      case DepreciationMethod.DoubleDecliningBalance: annualDep = years > 0 ? (2 * cost) / years : 0; break;
      case DepreciationMethod.OneFiftyDecliningBalance: annualDep = years > 0 ? (1.5 * cost) / years : 0; break;
      case DepreciationMethod.SumOfYearsDigits:
        annualDep = years > 0 ? (netAmount * years) / ((years * (years + 1)) / 2) : 0; break;
      default: annualDep = years > 0 ? netAmount / years : 0;
    }

    const methodLabels: Record<number, string> = {
      [DepreciationMethod.None]: 'None',
      [DepreciationMethod.StraightLine]: 'Straight Line',
      [DepreciationMethod.DecliningBalance]: 'Declining Balance',
      [DepreciationMethod.DoubleDecliningBalance]: 'Double Declining',
      [DepreciationMethod.OneFiftyDecliningBalance]: '150% Declining',
      [DepreciationMethod.SumOfYearsDigits]: 'Sum of Years'
    };

    this.depSummary = {
      depreciableCost: cost, salvageValue: salvage, netAmount,
      annualDep, monthlyDep: annualDep / 12,
      methodLabel: methodLabels[method] ?? 'Straight Line'
    };

    this.depPreviewRows = [];
    let bookValue = cost;
    const previewYears = Math.min(3, years);

    for (let yr = 1; yr <= previewYears; yr++) {
      let dep = annualDep;
      if (method === DepreciationMethod.DecliningBalance) dep = bookValue / years;
      else if (method === DepreciationMethod.DoubleDecliningBalance) dep = (2 / years) * bookValue;
      else if (method === DepreciationMethod.OneFiftyDecliningBalance) dep = (1.5 / years) * bookValue;
      else if (method === DepreciationMethod.SumOfYearsDigits) {
        const remaining = years - yr + 1;
        dep = (remaining / ((years * (years + 1)) / 2)) * netAmount;
      }
      dep = Math.min(dep, Math.max(0, bookValue - salvage));
      const end = Math.max(salvage, bookValue - dep);
      this.depPreviewRows.push({ year: yr, begin: bookValue, dep: bookValue - end, end });
      bookValue = end;
    }

    this.cdr.markForCheck();
  }

  // ── File upload ────────────────────────────────────────────────────
  triggerFileInput(field: string): void {
    const map: Record<string, ElementRef<HTMLInputElement>> = {
      imageUrl: this.imageUrlInput,
      deliveryNote: this.deliveryNoteInput,
      purchaseReceipt: this.purchaseReceiptInput,
      invoice: this.invoiceInput
    };
    map[field]?.nativeElement?.click();
  }

  onFileSelected(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.processFile(file, field);
    input.value = '';
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); }

  onDrop(event: DragEvent, field: string): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file, field);
  }

  private processFile(file: File, field: string): void {
    const maxMB = field === 'imageUrl' ? 5 : 10;
    if (file.size > maxMB * 1024 * 1024) {
      this.globalService.showToastr(`File exceeds ${maxMB}MB limit`, 'error');
      return;
    }
    this.files[field] = file;
    this.fileNames[field] = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.filePreviews[field] = e.target?.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeFile(field: string, event: Event): void {
    event.stopPropagation();
    delete this.files[field];
    delete this.filePreviews[field];
    delete this.fileNames[field];
    this.cdr.markForCheck();
  }

  isImagePreview(field: string): boolean {
    return this.filePreviews[field]?.startsWith('data:image') ?? false;
  }

  // ── Quick Add helpers ───────────────────────────────────────────────
  quickAddCategory(event: Event): void {
    event.stopPropagation();
    this.popupService.openAddPopup('Add New Category', [
      { key: 'name', label: 'Category Name', type: 'text', required: true, colSpan: 2, icon: 'category', validators: [Validators.minLength(2), Validators.maxLength(100)] },
      { key: 'description', label: 'Description', type: 'textarea', colSpan: 2, icon: 'description', rows: 3 }
    ], { maxWidth: '500px', columns: 2 }).subscribe(result => {
      if (result?.action === 'submit') {
        this.categoryService.createCategory(result.data).subscribe(res => {
          if (res.success) {
            this.globalService.showSnackbar('Category added', 'success');
            this.categoryService.getCategoriesByOrg().subscribe(r => {
              if (r.success && r.data) {
                this.dropdownData.update(d => ({ ...d, categories: r.data!.map(c => ({ value: c.id, label: c.name })) }));
                this.cdr.markForCheck();
              }
            });
          }
        });
      }
    });
  }

  quickAddSupplier(event: Event): void {
    event.stopPropagation();
    this.popupService.openAddPopup('Add New Supplier', [
      { key: 'name', label: 'Supplier Name', type: 'text', required: true, colSpan: 2, icon: 'business' },
      { key: 'contactPerson', label: 'Contact Person', type: 'text', colSpan: 1 },
      { key: 'phone', label: 'Phone', type: 'text', colSpan: 1, icon: 'phone' },
      { key: 'email', label: 'Email', type: 'email', colSpan: 2, icon: 'email' },
      { key: 'address', label: 'Address', type: 'textarea', colSpan: 2, rows: 2, icon: 'location_on' }
    ], { maxWidth: '700px', columns: 2 }).subscribe(result => {
      if (result?.action === 'submit') {
        this.supplierService.createSupplier(result.data).subscribe(res => {
          if (res.success) {
            this.globalService.showSnackbar('Supplier added', 'success');
            this.supplierService.getSuppliersByOrg().subscribe(r => {
              if (r.success && r.data) {
                this.dropdownData.update(d => ({ ...d, suppliers: r.data!.map(s => ({ value: s.id!, label: s.name! })) }));
                this.cdr.markForCheck();
              }
            });
          }
        });
      }
    });
  }

  quickAddDepartment(event: Event): void {
    event.stopPropagation();
    this.popupService.openAddPopup('Add New Department', [
      { key: 'name', label: 'Department Name', type: 'text', required: true, colSpan: 2, icon: 'domain', validators: [Validators.minLength(2)] },
      { key: 'description', label: 'Description', type: 'textarea', colSpan: 2, rows: 3 }
    ], { maxWidth: '500px', columns: 2 }).subscribe(result => {
      if (result?.action === 'submit') {
        this.departmentService.createDepartment(result.data).subscribe(res => {
          if (res.success) {
            this.globalService.showSnackbar('Department added', 'success');
            this.departmentService.getMyDepartments().subscribe(r => {
              if (r.success && r.data) {
                this.dropdownData.update(d => ({ ...d, departments: r.data!.map(dep => ({ value: dep.id!, label: dep.name! })) }));
                this.cdr.markForCheck();
              }
            });
          }
        });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────
  formatNum(v: number | null | undefined): string {
    if (v == null) return '0.00';
    return new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  }

  getUnitRange(): number[] {
    return Array.from({ length: this.quantity }, (_, i) => i);
  }

  get assignedUnitCount(): number {
    return this.unitAssignments.filter(
      ua => ua.assignTo !== AssignToType.NotAssigned
    ).length;
  }
  applyFirstUnitToAll(): void {
    if (this.unitAssignments.length < 2) return;
    const src = this.unitAssignments[0];
    this.unitAssignments = this.unitAssignments.map((ua, i) => {
      if (i === 0) return ua;
      return {
        ...ua,
        assignTo: src.assignTo,
        assignUserId: src.assignUserId,
        siteId: src.siteId,
        areaId: src.areaId,
        filteredAreas:
          src.siteId
            ? this.dropdownData().allAreas.filter(a => a.siteId === src.siteId)
            : []
      };
    });
    this.cdr.markForCheck();
  }

  // ── Submit ─────────────────────────────────────────────────────────
  onSubmit(): void {
    [this.basicForm, this.classForm, this.datesForm, this.depForm, this.globalAssignForm, this.notesForm]
      .forEach(f => f.markAllAsTouched());
 
    if (this.basicForm.invalid) {
      this.currentStep = 0;
      this.globalService.showToastr('Please fill all required fields in Basic Info', 'error');
      this.cdr.markForCheck();
      return;
    }
 
    if (this.quantity > 1 && this.serialsEntered < this.quantity) {
      this.currentStep = 1;
      this.globalService.showToastr(`Please enter serial numbers for all ${this.quantity} units`, 'error');
      this.cdr.markForCheck();
      return;
    }
 
    const isDepreciable = !!this.depForm.get('isDepreciable')?.value;
    if (isDepreciable && !this.datesForm.get('dateOfPurchase')?.value) {
      this.currentStep = 2;
      this.globalService.showToastr('Purchase Date is required when Depreciation is enabled', 'error');
      this.cdr.markForCheck();
      return;
    }
 
    if (isDepreciable && this.depForm.invalid) {
      this.currentStep = 2;
      this.globalService.showToastr('Please complete all required Depreciation fields', 'error');
      this.cdr.markForCheck();
      return;
    }
 
    this.submitting = true;
    this.cdr.markForCheck();
 
    const isSingleUnit = this.quantity === 1;
    const serialNumbers = this.unitSerials.map(s => s.trim()).filter(Boolean);
    const isPerUnit = this.assignmentMode === 'per-unit' && !isSingleUnit;
    const globalAssign = this.globalAssignForm.value;
 
    // ── Build per-unit assignment list (UnitAssignmentRequest[]) ────────────
    // Sent only when the user chose "Individual Assignment".
    // Each entry is keyed by 1-based `sequence` matching BatchSequence on the
    // backend, so the service can look up by index without position assumptions.
    const unitAssignments: UnitAssignmentRequest[] | undefined = isPerUnit
      ? this.unitAssignments.map((ua, i) => ({
          sequence: i + 1,                          // 1-based
          assignTo: ua.assignTo ?? AssignToType.NotAssigned,
          assignUserId: ua.assignUserId ?? undefined,
          siteId: ua.siteId ?? undefined,
          areaId: ua.areaId ?? undefined,
          assetStatus: this.basicForm.get('assetStatus')?.value ?? 0
        } as UnitAssignmentRequest))
      : undefined;
 
    // ── Top-level assignment fields ──────────────────────────────────────────
    // In per-unit mode we still send the global fields as a fallback for
    // legacy code paths; the backend prioritises UnitAssignments[] when set.
    // In global mode these are the definitive values.
    const topLevelAssignTo = isPerUnit
      ? AssignToType.NotAssigned               // backend will use UnitAssignments
      : (globalAssign.assignTo ?? AssignToType.NotAssigned);
 
    const formData = {
      // ── Basic / class / dates / dep / notes ─────────────────────────────
      ...this.basicForm.value,
      ...this.classForm.value,
      ...this.datesForm.value,
      ...this.depForm.value,
      note: this.notesForm.get('note')?.value,
 
      // ── Serial numbers ───────────────────────────────────────────────────
      assetSerialNo: isSingleUnit ? (serialNumbers[0] ?? '') : undefined,
      serialNumbers: !isSingleUnit ? serialNumbers : undefined,
 
      // ── Assignment ───────────────────────────────────────────────────────
      assignTo: topLevelAssignTo,
      assignUserId: isPerUnit ? undefined : globalAssign.assignUserId,
      siteId: isPerUnit ? undefined : globalAssign.siteId,
      areaId: isPerUnit ? undefined : globalAssign.areaId,
      transferDate: globalAssign.transferDate,
      dueDate: globalAssign.dueDate,
 
      // ── Per-unit assignments (only present in per-unit mode) ─────────────
      unitAssignments,                           // UnitAssignmentRequest[] | undefined
 
      // ── Files ────────────────────────────────────────────────────────────
      ImageFile: this.files['imageUrl'],
      DeliveryNoteFile: this.files['deliveryNote'],
      PurchaseReceiptFile: this.files['purchaseReceipt'],
      InvoiceFile: this.files['invoice'],
    };
 
    this.dialogRef.close({ action: 'submit', data: formData });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }
}
