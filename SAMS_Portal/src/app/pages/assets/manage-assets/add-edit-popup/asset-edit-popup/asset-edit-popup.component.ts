import {
  Component, inject, OnInit, OnDestroy, signal,
  ViewChild, ElementRef, ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
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
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { CompanyStorageService } from '../../../../../core/services/localStorage/company/company-storage.service';
import { AssetDetail, AssetDropdownData, AssetDropdownOption } from '../../../../../core/models/interfaces/asset-manage/assets.interface';
import { GlobalService } from '../../../../../core/services/global/global.service';
import { PopupWidgetService } from '../../../../../core/services/popup-widget/popup-widget.service';
import { AssetCategoriesService } from '../../../../../core/services/asset-categories/asset-categories.service';
import { AssetSubCategoriesService } from '../../../../../core/services/asset-categories/asset-sub-categories/asset-sub-categories.service';
import { SuppliersService } from '../../../../../core/services/supplier/suppliers.service';
import { DepartmentService } from '../../../../../core/services/department/department.service';
import { SubDepartmentService } from '../../../../../core/services/department/sub-department/sub-department.service';
import { DepreciationMethod } from '../../../../../core/enum/asset.enums';
import { MatDividerModule } from '@angular/material/divider';
import { FileUrlHelper } from '../../../../../core/helper/get-file-url';

export interface AssetEditPopupData {
  asset: AssetDetail;
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

@Component({
  selector: 'app-asset-edit-popup',
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
    MatDividerModule,
  ],
  templateUrl: './asset-edit-popup.component.html',
  styleUrl: './asset-edit-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)', maxHeight: '0px', overflow: 'hidden' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)', maxHeight: '800px' }))
      ]),
      transition(':leave', [
        animate('160ms ease-in', style({ opacity: 0, maxHeight: '0px' }))
      ])
    ])
  ]
})
export class AssetEditPopupComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AssetEditPopupComponent>);
  private data: AssetEditPopupData = inject(MAT_DIALOG_DATA);
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
  activeTab = 0;
  submitting = false;
  isDirty = false;

  tabs = [
    { label: 'Basic Info', icon: 'inventory_2' },
    { label: 'Depreciation', icon: 'trending_down' },
    { label: 'Documents', icon: 'folder_open' }
  ];

  assetData!: AssetDetail;
  dropdownData = signal<AssetDropdownData>({} as AssetDropdownData);

  // Cascades
  filteredSubCategories: AssetDropdownOption[] = [];
  filteredSubDepartments: AssetDropdownOption[] = [];

  // Files
  files: Record<string, File> = {};
  filePreviews: Record<string, string> = {};
  fileNames: Record<string, string> = {};
  removedFiles: Record<string, boolean> = {};

  @ViewChild('imageUrlInput') imageUrlInput!: ElementRef<HTMLInputElement>;
  @ViewChild('deliveryNoteInput') deliveryNoteInput!: ElementRef<HTMLInputElement>;
  @ViewChild('purchaseReceiptInput') purchaseReceiptInput!: ElementRef<HTMLInputElement>;
  @ViewChild('invoiceInput') invoiceInput!: ElementRef<HTMLInputElement>;

  // Depreciation
  depSummary: DepSummary | null = null;
  depPreviewRows: DepPreviewRow[] = [];

  getFileUrl(path: string | null | undefined): string {
    return FileUrlHelper.getFullUrl(path);
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
  notesForm!: FormGroup;

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit(): void {
    this.assetData = this.data.asset;
    this.dropdownData.set(this.data.dropdownData);
    this.buildForms();
    this.setupFormDependencies();
    this.populateForms();
    this.applyInitialControlState();
    this.setupCascades();
    this.subscribeAutoCalc();
    this.watchDirty();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Build forms ────────────────────────────────────────────────────
  private buildForms(): void {
    this.basicForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      assetBrand: ['', Validators.required],
      assetModelNo: ['', Validators.required],
      assetSerialNo: ['', Validators.required],
      unitPrice: [null, Validators.min(0)],
      assetStatus: [{ value: null, disabled: !!(this.assetData?.quantity && this.assetData.quantity > 1) }],
      description: ['', Validators.maxLength(500)]
    });

    this.classForm = this.fb.group({
      category: [null],
      subCategory: [{ value: null, disabled: true }],
      supplier: [null],
      warranetyInMonth: [null],
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

    this.notesForm = this.fb.group({ note: [''] });
  }

  private setupFormDependencies(): void {
    this.classForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const sub = this.classForm.get('subCategory');
        if (val) { sub?.enable(); } else { sub?.disable(); sub?.reset(); }
      });

    this.classForm.get('department')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const sub = this.classForm.get('subDepartment');
        if (val) { sub?.enable(); } else { sub?.disable(); sub?.reset(); }
      });
  }

  // ── Populate ───────────────────────────────────────────────────────
  private populateForms(): void {
    const a = this.assetData;

    this.basicForm.patchValue({
      name: a.name,
      assetBrand: a.assetBrand,
      assetModelNo: a.assetModelNo,
      assetSerialNo: a.assetSerialNo,
      unitPrice: (a as any).unitPrice,
      assetStatus: (a as any).assetStatus,
      description: (a as any).description ?? ''
    });

    this.classForm.patchValue({
      category: (a as any).category,
      subCategory: (a as any).subCategory,
      supplier: (a as any).supplier,
      warranetyInMonth: (a as any).warranetyInMonth,
      department: (a as any).department,
      subDepartment: (a as any).subDepartment
    });

    this.datesForm.patchValue({
      dateOfPurchase: a.dateOfPurchase ? new Date(a.dateOfPurchase) : null,
      dateOfManufacture: a.dateOfManufacture ? new Date(a.dateOfManufacture) : null,
      yearOfValuation: a.yearOfValuation ? new Date(a.yearOfValuation) : null
    });

    this.depForm.patchValue({
      isDepreciable: a.isDepreciable ?? false,
      depreciableCost: (a as any).depreciableCost,
      salvageValue: a.salvageValue,
      depreciationInMonth: a.depreciationInMonth,
      depreciationMethod: a.depreciationMethod,
      dateAquired: a.dateAquired ? new Date(a.dateAquired) : null
    });

    this.notesForm.patchValue({ note: (a as any).note ?? '' });
    this.applyPurchaseDateValidation(a.isDepreciable ?? false);

    setTimeout(() => {
      [this.basicForm, this.classForm, this.datesForm, this.depForm, this.notesForm]
        .forEach(f => f.markAsPristine());
      this.isDirty = false;
      this.cdr.markForCheck();
    }, 100);

    if (a.isDepreciable) this.recalcDepreciation();
  }

  private setupCascades(): void {
    const catId = (this.assetData as any).category;
    const deptId = (this.assetData as any).department;
    if (catId) this.filteredSubCategories = this.dropdownData().allSubCategories.filter(sc => sc.categoryId === catId);
    if (deptId) this.filteredSubDepartments = this.dropdownData().allSubDepartments.filter(sd => sd.departmentId === deptId);
  }

  private applyInitialControlState(): void {
    if (this.classForm.get('category')?.value) this.classForm.get('subCategory')?.enable();
    if (this.classForm.get('department')?.value) this.classForm.get('subDepartment')?.enable();
  }

  private subscribeAutoCalc(): void {
    const update = () => {
      const price = this.basicForm.get('unitPrice')?.value ?? 0;
      const qty = (this.assetData as any).quantity ?? 1;
      const calc = price * qty;
      if (calc > 0 && this.depForm.get('isDepreciable')?.value) {
        this.depForm.patchValue({ depreciableCost: calc }, { emitEvent: false });
      }
      this.recalcDepreciation();
    };
    this.basicForm.get('unitPrice')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(update);
    this.depForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.recalcDepreciation());
    this.depForm.get('isDepreciable')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.applyPurchaseDateValidation(!!val));
  }

  private watchDirty(): void {
    [this.basicForm, this.classForm, this.datesForm, this.depForm, this.notesForm]
      .forEach(f => f.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => { this.isDirty = true; this.cdr.markForCheck(); }));
  }

  private applyPurchaseDateValidation(isDepreciable: boolean): void {
    const ctrl = this.datesForm.get('dateOfPurchase');
    if (!ctrl) return;
    if (isDepreciable) { ctrl.addValidators(Validators.required); }
    else { ctrl.removeValidators(Validators.required); }
    ctrl.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  // ── Cascades ───────────────────────────────────────────────────────
  onCategoryChange(catId: number): void {
    this.classForm.patchValue({ subCategory: null });
    this.filteredSubCategories = this.dropdownData().allSubCategories.filter(sc => sc.categoryId === catId);
    this.cdr.markForCheck();
  }

  onDepartmentChange(deptId: number): void {
    this.classForm.patchValue({ subDepartment: null });
    this.filteredSubDepartments = this.dropdownData().allSubDepartments.filter(sd => sd.departmentId === deptId);
    this.cdr.markForCheck();
  }

  tabHasError(i: number): boolean {
    if (i === 0) return (this.basicForm.invalid && this.basicForm.dirty) || (this.datesForm.invalid && this.datesForm.dirty);
    return false;
  }

  // ── Depreciation ───────────────────────────────────────────────────
  onDepreciableToggle(val: boolean): void {
    if (val) {
      const price = this.basicForm.get('unitPrice')?.value ?? 0;
      const qty = (this.assetData as any).quantity ?? 1;
      if (price > 0) this.depForm.patchValue({ depreciableCost: price * qty }, { emitEvent: false });
    }
    this.applyPurchaseDateValidation(val);
    this.recalcDepreciation();
    this.cdr.markForCheck();
  }

  recalcDepreciation(): void {
    const v = this.depForm?.value;
    if (!v?.isDepreciable || !v.depreciableCost || !v.depreciationInMonth) {
      this.depSummary = null; this.depPreviewRows = []; this.cdr.markForCheck(); return;
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
    for (let yr = 1; yr <= Math.min(3, years); yr++) {
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
      imageUrl: this.imageUrlInput, deliveryNote: this.deliveryNoteInput,
      purchaseReceipt: this.purchaseReceiptInput, invoice: this.invoiceInput
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
      this.globalService.showToastr(`File exceeds ${maxMB}MB limit`, 'error'); return;
    }
    this.files[field] = file;
    this.fileNames[field] = file.name;
    delete this.removedFiles[field];
    const reader = new FileReader();
    reader.onload = (e) => { this.filePreviews[field] = e.target?.result as string; this.isDirty = true; this.cdr.markForCheck(); };
    reader.readAsDataURL(file);
  }

  removeFile(field: string, event: Event): void {
    event.stopPropagation();
    delete this.files[field]; delete this.filePreviews[field]; delete this.fileNames[field];
    this.removedFiles[field] = true;
    this.isDirty = true; this.cdr.markForCheck();
  }

  isImageUrl(url: string | undefined): boolean {
    if (!url) return false;
    return url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
  }

  // ── Quick add helpers ───────────────────────────────────────────────
  quickAddCategory(event: Event): void {
    event.stopPropagation();
    this.popupService.openAddPopup('Add New Category', [
      { key: 'name', label: 'Category Name', type: 'text', required: true, colSpan: 2, icon: 'category', validators: [Validators.minLength(2)] },
      { key: 'description', label: 'Description', type: 'textarea', colSpan: 2, rows: 3 }
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

  // ── Submit ─────────────────────────────────────────────────────────
  onSubmit(): void {
    [this.basicForm, this.classForm, this.datesForm, this.depForm, this.notesForm]
      .forEach(f => f.markAllAsTouched());

    if (this.basicForm.invalid) {
      this.activeTab = 0;
      this.globalService.showToastr('Please fill all required fields in Basic Info', 'error');
      this.cdr.markForCheck(); return;
    }

    const isDepreciable = !!this.depForm.get('isDepreciable')?.value;
    const purchaseDate = this.datesForm.get('dateOfPurchase')?.value;

    if (isDepreciable && !purchaseDate) {
      this.activeTab = 0;
      this.datesForm.get('dateOfPurchase')?.markAsTouched();
      this.globalService.showToastr('Purchase Date is required when Depreciation is enabled', 'error');
      this.cdr.markForCheck(); return;
    }

    if (isDepreciable && this.depForm.invalid) {
      this.activeTab = 1;
      this.globalService.showToastr('Please complete all required Depreciation fields', 'error');
      this.cdr.markForCheck(); return;
    }

    this.submitting = true; this.cdr.markForCheck();

    const formData = {
      id: this.assetData.id,
      ...this.basicForm.value,
      ...this.classForm.value,
      ...this.datesForm.value,
      ...this.depForm.value,
      note: this.notesForm.get('note')?.value,
      ImageFile: this.files['imageUrl'],
      DeliveryNoteFile: this.files['deliveryNote'],
      PurchaseReceiptFile: this.files['purchaseReceipt'],
      InvoiceFile: this.files['invoice'],
      ImagePath: !this.files['imageUrl'] && !this.removedFiles['imageUrl'] ? this.assetData?.imageUrl : undefined,
      DeliveryNotePath: !this.files['deliveryNote'] && !this.removedFiles['deliveryNote'] ? this.assetData?.deliveryNote : undefined,
      PurchaseReceiptPath: !this.files['purchaseReceipt'] && !this.removedFiles['purchaseReceipt'] ? this.assetData?.purchaseReceipt : undefined,
      InvoicePath: !this.files['invoice'] && !this.removedFiles['invoice'] ? this.assetData?.invoice : undefined,
    };

    this.dialogRef.close({ action: 'submit', data: formData });
  }

  onCancel(): void { this.dialogRef.close({ action: 'cancel' }); }
}
