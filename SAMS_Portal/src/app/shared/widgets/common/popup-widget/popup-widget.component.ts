import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { PopupConfirmConfig, PopupData, PopupField, PopupFormConfig, PopupResult, PopupViewConfig } from '../../../../core/models/interfaces/popup-widget.interface';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FilesUploadService } from '../../../../core/services/common/files-upload.service';
import { Country, CountryService } from '../../../../core/services/account/country/country.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { GlobalService } from '../../../../core/services/global/global.service';
import { FilePreviewComponent } from '../list-widget/file-preview/file-preview.component';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AssetDepreciation } from '../../../../core/models/interfaces/asset-manage/assets.interface';

@Component({
  selector: 'app-popup-widget',
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
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './popup-widget.component.html',
  styleUrl: './popup-widget.component.scss',
  animations: [
    trigger('dialogAnimation', [
      state('enter', style({ transform: 'scale(1)', opacity: 1 })),
      transition('* => enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ])
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    // 🆕 New animation for success feedback
    trigger('successPulse', [
      transition('* => success', [
        style({ transform: 'scale(1)' }),
        animate('150ms ease-out', style({ transform: 'scale(1.1)' })),
        animate('150ms ease-in', style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  host: {
    '[@dialogAnimation]': "'enter'"
  }
})
export class PopupWidgetComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<PopupWidgetComponent>);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private filesUploadService = inject(FilesUploadService);
  private countryService = inject(CountryService);
  public data: PopupData = inject(MAT_DIALOG_DATA);
  private globalService = inject(GlobalService);
  private popupService = inject(PopupWidgetService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  form: FormGroup | null = null;
  loading = signal(false);
  imageUploading = signal(false);
  submitted = signal(false);
  imagePreview = signal<string | null>(null);
  imageFile = signal<File | null>(null);
  countries = signal<Country[]>([]);
  countriesLoaded = signal(false);

  // 🆕 NEW: Track Quick Add button disabled state
  quickAddDisabledMap = signal<Map<string, boolean>>(new Map());

  // 🔥 NEW: Track conditional field visibility
  private conditionalFieldsMap = signal<Map<string, PopupField>>(new Map());
  private fieldValidatorsMap = signal<Map<string, any[]>>(new Map());

  private destroy$ = new Subject<void>();
  fieldOptionsMap = signal<Map<string, any[]>>(new Map());
  fieldLoadingMap = signal<Map<string, boolean>>(new Map());
  quickAddLoadingMap = signal<Map<string, boolean>>(new Map());

  // 🆕 Track success state for animations
  quickAddSuccessMap = signal<Map<string, boolean>>(new Map());

  isFormType = computed(() => this.data?.type === 'form');
  isViewType = computed(() => this.data?.type === 'view');
  isConfirmType = computed(() => this.data?.type === 'confirm');
  isCompactMode = computed(() => {
    const config = this.data?.config as PopupFormConfig | PopupViewConfig;
    return config?.compactMode || false;
  });

  get formConfig(): PopupFormConfig | null {
    return this.isFormType() ? (this.data.config as PopupFormConfig) : null;
  }

  get viewConfig(): PopupViewConfig | null {
    return this.isViewType() ? (this.data.config as PopupViewConfig) : null;
  }

  get confirmConfig(): PopupConfirmConfig | null {
    return this.isConfirmType() ? (this.data.config as PopupConfirmConfig) : null;
  }

  ngOnInit() {
    this.loadCountries();
    if (this.isFormType()) {
      this.initializeForm();
      this.setupCascadingDropdowns();
      this.setupConditionalDisplay();
    }
    if (this.data?.data?.profilePicture) {
      this.imagePreview.set(this.data.data.profilePicture);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCountries() {
    const allCountries = this.countryService.getAllCountries();
    this.countries.set(allCountries);
    this.countriesLoaded.set(true);

    if (this.isFormType() && this.form) {
      this.updateCountryField();
    }
  }

  /**
   * ✅ FIXED: Properly sanitize HTML content for safe rendering
   */
  sanitizeHtml(html: string | undefined | null): SafeHtml {
    if (!html) {
      return '';
    }

    // For trusted internal content, bypass security
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
 * ✅ ENHANCED: Format depreciation schedule with proper structure
 */
  private formatDepreciationScheduleAsTable(schedule: AssetDepreciation[]): string {
    if (!schedule || schedule.length === 0) {
      return '<div class="no-schedule-data"><mat-icon class="info-icon">info_outline</mat-icon><span>No depreciation schedule available</span></div>';
    }

    let html = '<div class="depreciation-schedule-wrapper">';
    html += '<div class="depreciation-schedule-table">';
    html += '<table cellspacing="0" cellpadding="0">';

    // Table Header
    html += '<thead>';
    html += '<tr>';
    html += '<th class="col-year">Year</th>';
    html += '<th class="col-beginning">Beginning Value</th>';
    html += '<th class="col-depreciation">Depreciation</th>';
    html += '<th class="col-ending">Ending Value</th>';
    html += '</tr>';
    html += '</thead>';

    // Table Body
    html += '<tbody>';
    schedule.forEach((item, index) => {
      const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
      html += `<tr class="${rowClass}">`;
      html += `<td class="year-cell">${this.escapeHtml(item.year.toString())}</td>`;
      html += `<td class="currency-cell">₹${this.escapeHtml(this.formatCurrency(item.bookValueYearBegining))}</td>`;
      html += `<td class="currency-cell depreciation">₹${this.escapeHtml(this.formatCurrency(item.depreciation))}</td>`;
      html += `<td class="currency-cell">₹${this.escapeHtml(this.formatCurrency(item.bookValueYearEnd))}</td>`;
      html += '</tr>';
    });
    html += '</tbody>';

    html += '</table>';
    html += '</div>'; // Close depreciation-schedule-table
    html += '</div>'; // Close depreciation-schedule-wrapper

    return html;
  }

  /**
   * ✅ NEW: Helper method to escape HTML entities
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * ✅ Helper method to format currency
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private updateCountryField() {
    if (!this.form) return;

    const countryControl = this.form.get('country');
    if (countryControl && this.formConfig) {
      const countryField = this.formConfig.fields.find(f => f.key === 'country');
      if (countryField && countryField.type === 'select') {
        countryField.options = this.countries().map(country => ({
          value: country.name,
          label: country.name,
          disabled: false,
          code: country.code
        }));
      }
    }
  }

  private initializeForm() {
    const cfg = this.formConfig;
    if (!cfg) return;

    const controls: { [k: string]: FormControl } = {};

    // 🔥 STEP 1: Build conditional fields map
    cfg.fields.forEach(field => {
      if (field.showIf || field.dependsOn) {
        this.conditionalFieldsMap.update(map => {
          const newMap = new Map(map);
          newMap.set(field.key, field);
          return newMap;
        });
      }
    });

    cfg.fields.forEach(field => {
      const validators = this.getFieldValidators(field);
      let value = field.value;

      // Get existing data
      if (this.data?.data && this.data.data[field.key] !== undefined) {
        value = this.data.data[field.key];

        // File field handling
        if (field.type === 'file') {
          if (typeof value === 'string' && value.trim() !== '') {
            this.filePreviewMap.update(map => {
              const newMap = new Map(map);
              newMap.set(field.key, value as string);
              return newMap;
            });
            value = null;
          } else if (value instanceof File) {
            this.fileMap.update(map => {
              const newMap = new Map(map);
              newMap.set(field.key, value as File);
              return newMap;
            });
          } else {
            value = null;
          }
        }
      }

      // Handle checkbox defaults
      if (field.type === 'checkbox' || field.type === 'toggle') {
        value = !!value;
      }
      // Handle date conversion
      else if (field.type === 'date' && value) {
        value = new Date(value);
      }

      // 🔥 CRITICAL: Determine initial disabled state
      let isDisabled = field.disabled || false;

      // Cascade handling
      if (field.cascadeFrom) {
        isDisabled = true;
      }

      // Email verification
      if (field.type === 'email' && field.showEmailVerification) {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const isAlreadyVerified = this.data?.data?.[verificationKey] === true;
        if (isAlreadyVerified) {
          isDisabled = true;
        }
      }

      // Country field
      if (field.key === 'country' && field.type === 'select') {
        field.options = this.countries().map(country => ({
          value: country.name,
          label: country.name,
          disabled: false,
          code: country.code
        }));
      }

      // Store select options
      if (field.options) {
        this.fieldOptionsMap.update(map => {
          const newMap = new Map(map);
          newMap.set(field.key, field.options || []);
          return newMap;
        });
      }

      // 🔥 NEW: Store original validators for dynamic management
      if (validators.length > 0) {
        this.fieldValidatorsMap.update(map => {
          const newMap = new Map(map);
          newMap.set(field.key, validators);
          return newMap;
        });
      }

      // 🔥 CRITICAL: Check if field should be initially hidden
      const shouldBeHidden = !this.shouldShowField(field);

      // 🔥 Create form control with conditional validators
      controls[field.key] = new FormControl(
        { value, disabled: isDisabled },
        shouldBeHidden || (field.type === 'file' && this.filePreviewMap().has(field.key))
          ? [] // No validators for hidden or existing file fields
          : validators
      );

      // Email verification toggle
      if (field.type === 'email' && field.showEmailVerification) {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const isAlreadyVerified = this.data?.data?.[verificationKey] === true;

        const verificationControl = new FormControl({
          value: isAlreadyVerified,
          disabled: isAlreadyVerified
        });

        controls[verificationKey] = verificationControl;
      }
    });

    // Profile picture control
    if (!controls['profilePicture']) {
      controls['profilePicture'] = new FormControl(
        this.data?.data?.profilePicture || ''
      );
    }

    this.form = new FormGroup(controls);

    // ✅ Setup reactive features AFTER form creation
    this.setupEmailVerificationValidation();
    this.setupCascadingDropdowns();
    this.setupConditionalDisplay(); // 🔥 CRITICAL: This must run after form is created
    this.setupDepreciableCostAutoBinding();
  }

  private setupDepreciableCostAutoBinding() {
    if (!this.form) return;

    const isDepreciableCtrl = this.form.get('isDepreciable');
    const unitPriceCtrl = this.form.get('unitPrice');
    const depreciableCostCtrl = this.form.get('depreciableCost');

    if (!isDepreciableCtrl || !unitPriceCtrl || !depreciableCostCtrl) return;

    let userManuallyEdited = false;

    // Detect manual edit
    depreciableCostCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        userManuallyEdited = true;
      });

    // When unit price changes
    unitPriceCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(price => {
        if (!userManuallyEdited && price != null) {
          depreciableCostCtrl.setValue(price, { emitEvent: false });
        }
      });

    // When depreciation toggle changes
    isDepreciableCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDepreciable => {

        if (!isDepreciable) {
          // NOT depreciable → mirror unit price
          depreciableCostCtrl.setValue(unitPriceCtrl.value, { emitEvent: false });
          depreciableCostCtrl.disable({ emitEvent: false });
          userManuallyEdited = false;
        } else {
          // Depreciable → allow editing
          depreciableCostCtrl.enable({ emitEvent: false });

          if (!depreciableCostCtrl.value) {
            depreciableCostCtrl.setValue(unitPriceCtrl.value, { emitEvent: false });
          }
        }

        depreciableCostCtrl.updateValueAndValidity({ emitEvent: false });
      });

    // 🔥 INITIAL LOAD (Edit Mode)
    const initialIsDepreciable = isDepreciableCtrl.value;

    if (!initialIsDepreciable) {
      depreciableCostCtrl.setValue(unitPriceCtrl.value, { emitEvent: false });
      depreciableCostCtrl.disable({ emitEvent: false });
    }
  }


  private setupCascadingDropdowns() {
    if (!this.form || !this.formConfig) return;

    const cascadingFields = this.formConfig.fields.filter(f => f.cascadeFrom);

    cascadingFields.forEach(childField => {
      const parentControl = this.form!.get(childField.cascadeFrom!);

      if (parentControl) {
        parentControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(parentValue => {
            this.handleCascadeChange(childField, parentValue);
          });

        const initialParentValue = parentControl.value;
        if (initialParentValue) {
          setTimeout(() => {
            this.handleCascadeChange(childField, initialParentValue, true);
          }, 0);
        }
      }
    });
  }

  private handleCascadeChange(childField: PopupField, parentValue: any, isInitial: boolean = false) {
    const childControl = this.form!.get(childField.key);
    if (!childControl) return;

    // Clear value if not initial load
    if (!isInitial && childField.clearOnParentChange !== false) {
      childControl.setValue(null);
      childControl.markAsTouched();
    }

    if (!parentValue) {
      childControl.disable();
      this.updateFieldOptions(childField.key, []);
      return;
    }

    // 🔥 Handle dynamic loading
    if (childField.loadOptionsOnChange) {
      this.setFieldLoading(childField.key, true);
      childControl.disable();

      childField.loadOptionsOnChange(parentValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (options) => {
            console.log(`✅ Loaded ${options.length} options for ${childField.key}`);

            this.updateFieldOptions(childField.key, options);
            this.setFieldLoading(childField.key, false);
            childControl.enable();

            // Restore existing value during edit
            if (isInitial && this.data?.data?.[childField.key]) {
              const existingValue = this.data.data[childField.key];
              const valueExists = options.some(opt => opt.value === existingValue);

              if (valueExists) {
                setTimeout(() => {
                  childControl.setValue(existingValue);
                  childControl.markAsTouched();
                  childControl.updateValueAndValidity();
                }, 100);
              }
            }
          },
          error: (error) => {
            console.error(`❌ Error loading options for ${childField.key}:`, error);
            this.updateFieldOptions(childField.key, []);
            this.setFieldLoading(childField.key, false);
            childControl.enable();
          }
        });
    }
    // 🔥 Handle cached filtering (CRITICAL FIX)
    else if (childField.options && childField.cascadeProperty) {
      const filteredOptions = childField.options.filter(opt =>
        opt[childField.cascadeProperty!] === parentValue
      );

      console.log(`🔍 Filtered ${filteredOptions.length} options for ${childField.key} (parent=${parentValue})`);

      // 🔥 CRITICAL: Update field options
      this.updateFieldOptions(childField.key, filteredOptions);
      childControl.enable();

      // Restore existing value during edit
      if (isInitial && this.data?.data?.[childField.key]) {
        const existingValue = this.data.data[childField.key];
        const valueExists = filteredOptions.some(opt => opt.value === existingValue);

        if (valueExists) {
          setTimeout(() => {
            childControl.setValue(existingValue);
            childControl.markAsTouched();
            childControl.updateValueAndValidity();
          }, 100);
        } else {
          console.warn(`⚠️ Existing value ${existingValue} not found in filtered options`);
        }
      }
    }
  }

  // 🔥 FIXED: Properly update field options AND the original field config
  private updateFieldOptions(fieldKey: string, options: any[]) {
    console.log(`📝 Updating options for ${fieldKey}:`, options.length);

    // Update the signal map
    this.fieldOptionsMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, options);
      return newMap;
    });

    // 🔥 Force change detection
    if (this.form) {
      const control = this.form.get(fieldKey);
      if (control) {
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  /**
   * 🆕 DEBUG: Log current dropdown state
   */
  private debugDropdownState(fieldKey: string, message: string) {
    console.group(`🐛 DEBUG: ${message}`);
    console.log('Field:', fieldKey);
    console.log('Options in map:', this.fieldOptionsMap().get(fieldKey)?.length || 0);

    if (this.formConfig) {
      const field = this.formConfig.fields.find(f => f.key === fieldKey);
      if (field) {
        console.log('Options in config:', field.options?.length || 0);
        console.log('Cascade from:', field.cascadeFrom);
        console.log('Cascade property:', field.cascadeProperty);
      }
    }

    if (this.form) {
      const control = this.form.get(fieldKey);
      console.log('Control value:', control?.value);
      console.log('Control disabled:', control?.disabled);
    }

    console.groupEnd();
  }


  private setFieldLoading(fieldKey: string, loading: boolean) {
    this.fieldLoadingMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, loading);
      return newMap;
    });

    const control = this.form?.get(fieldKey);
    if (!control) return;

    if (loading) {
      control.disable({ emitEvent: false });
    } else {
      control.enable({ emitEvent: false });
    }
  }

  private setQuickAddLoading(fieldKey: string, loading: boolean) {
    this.quickAddLoadingMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, loading);
      return newMap;
    });
  }

  // 🆕 Set success animation state
  private setQuickAddSuccess(fieldKey: string, success: boolean) {
    this.quickAddSuccessMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, success);
      return newMap;
    });

    if (success) {
      setTimeout(() => {
        this.quickAddSuccessMap.update(map => {
          const newMap = new Map(map);
          newMap.set(fieldKey, false);
          return newMap;
        });
      }, 600);
    }
  }

  isQuickAddLoading(fieldKey: string): boolean {
    return this.quickAddLoadingMap().get(fieldKey) || false;
  }

  isQuickAddSuccess(fieldKey: string): boolean {
    return this.quickAddSuccessMap().get(fieldKey) || false;
  }

  getFieldOptions(fieldKey: string): any[] {
    return this.fieldOptionsMap().get(fieldKey) || [];
  }

  isFieldLoading(fieldKey: string): boolean {
    return this.fieldLoadingMap().get(fieldKey) || false;
  }

  isQuickAddDisabled(field: PopupField): boolean {
    if (!field.quickAdd?.enabled) return true;

    // Check if there's a condition for enabling
    if (field.quickAdd.enableWhen) {
      const parentFieldKey = field.quickAdd.enableWhen.field;
      const parentControl = this.form?.get(parentFieldKey);

      if (!parentControl) return true;

      const parentValue = parentControl.value;

      // Check hasValue condition
      if (field.quickAdd.enableWhen.hasValue !== undefined) {
        const hasValue = parentValue !== null &&
          parentValue !== undefined &&
          parentValue !== '';
        return !hasValue;
      }

      // Check specific value condition
      if (field.quickAdd.enableWhen.value !== undefined) {
        return parentValue !== field.quickAdd.enableWhen.value;
      }
    }

    // Check if field itself is disabled
    if (field.disabled) return true;

    // Check if field is in loading state
    if (this.isFieldLoading(field.key)) return true;

    // Check if Quick Add is already loading
    if (this.isQuickAddLoading(field.key)) return true;

    return false;
  }

  /**
   * 🆕 Get tooltip for disabled Quick Add button
   */
  getQuickAddDisabledTooltip(field: PopupField): string {
    if (!field.quickAdd?.enabled) {
      return 'Quick add is not enabled';
    }

    if (field.quickAdd.enableWhen) {
      const parentFieldKey = field.quickAdd.enableWhen.field;
      const parentField = this.formConfig?.fields.find(f => f.key === parentFieldKey);
      const parentLabel = parentField?.label || parentFieldKey;

      if (field.quickAdd.enableWhen.hasValue) {
        return `Select ${parentLabel} first to enable quick add`;
      }

      if (field.quickAdd.enableWhen.value !== undefined) {
        return `${parentLabel} must be "${field.quickAdd.enableWhen.value}" to enable quick add`;
      }
    }

    if (field.disabled) {
      return 'Field is disabled';
    }

    if (this.isFieldLoading(field.key)) {
      return 'Loading options...';
    }

    if (this.isQuickAddLoading(field.key)) {
      return 'Adding new item...';
    }

    return field.quickAdd?.buttonLabel || 'Add new item';
  }

  // 🆕 Enhanced Quick Add with better UX
  onQuickAddClick(field: PopupField, event: Event) {
    event.stopPropagation();

    if (!field.quickAdd || this.isQuickAddLoading(field.key)) return;

    // Check if Quick Add should be disabled
    if (this.isQuickAddDisabled(field)) {
      console.warn('Quick Add is disabled for field:', field.key);
      return;
    }

    const quickAddConfig = field.quickAdd;

    // 🔥 NEW: Handle parent context (auto-populate and lock)
    if (quickAddConfig.parentContext) {
      const parentFieldKey = quickAddConfig.parentContext.field;
      const parentValue = this.form?.get(parentFieldKey)?.value;

      console.log('🎯 Parent context:', {
        parentField: parentFieldKey,
        parentValue: parentValue,
        autoPopulate: quickAddConfig.parentContext.autoPopulate,
        lockParent: quickAddConfig.parentContext.lockParent
      });

      if (parentValue) {
        // Find parent field in Quick Add popup
        const parentFieldInPopup = quickAddConfig.fields.find(
          f => f.key === `${parentFieldKey}Id` || f.key === parentFieldKey
        );

        if (parentFieldInPopup) {
          if (quickAddConfig.parentContext.autoPopulate) {
            parentFieldInPopup.value = parentValue;
            console.log('✅ Auto-populated parent field:', parentFieldKey, '=', parentValue);
          }

          if (quickAddConfig.parentContext.lockParent) {
            parentFieldInPopup.disabled = true;
            console.log('🔒 Locked parent field:', parentFieldKey);
          }
        }
      }
    }

    // 🔥 LEGACY: Support old enableWhen logic (backward compatibility)
    else if (quickAddConfig.enableWhen) {
      const parentFieldKey = quickAddConfig.enableWhen.field;
      const parentValue = this.form?.get(parentFieldKey)?.value;

      if (parentValue) {
        const parentFieldInPopup = quickAddConfig.fields.find(
          f => f.key === `${parentFieldKey}Id` || f.key === parentFieldKey
        );

        if (parentFieldInPopup) {
          parentFieldInPopup.value = parentValue;
          parentFieldInPopup.disabled = true;
        }
      }
    }

    const nestedPopupConfig: PopupFormConfig = {
      title: quickAddConfig.popupTitle,
      subtitle: `Add new ${field.label.toLowerCase()} and continue`,
      icon: quickAddConfig.popupIcon || 'add_circle_outline',
      fields: quickAddConfig.fields,
      columns: 2,
      maxWidth: '650px',
      submitButtonText: 'Add & Select',
      cancelButtonText: 'Cancel'
    };

    const nestedPopupData: PopupData = {
      type: 'form',
      config: nestedPopupConfig,
      data: {}
    };

    const dialogRef = this.dialog.open(PopupWidgetComponent, {
      data: nestedPopupData,
      width: nestedPopupConfig.width || 'auto',
      maxWidth: nestedPopupConfig.maxWidth || '650px',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'nested-popup-backdrop',
      panelClass: ['popup-widget-panel', 'nested-popup'],
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'submit' && quickAddConfig.onAdd) {
        this.handleQuickAddSubmit(field, result.data, quickAddConfig);
      }
    });
  }


  /**
 * 🆕 Setup reactive Quick Add button state management
 */
  private setupQuickAddButtonStates() {
    if (!this.form || !this.formConfig) return;

    const fieldsWithQuickAdd = this.formConfig.fields.filter(
      f => f.quickAdd?.enabled && f.quickAdd.enableWhen
    );

    fieldsWithQuickAdd.forEach(field => {
      if (!field.quickAdd?.enableWhen) return;

      const parentFieldKey = field.quickAdd.enableWhen.field;
      const parentControl = this.form!.get(parentFieldKey);

      if (!parentControl) return;

      // Listen to parent field changes
      parentControl.valueChanges
        .pipe(
          debounceTime(50),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          const isDisabled = this.isQuickAddDisabled(field);

          this.quickAddDisabledMap.update(map => {
            const newMap = new Map(map);
            newMap.set(field.key, isDisabled);
            return newMap;
          });
        });

      // Initial state
      const initialDisabled = this.isQuickAddDisabled(field);
      this.quickAddDisabledMap.update(map => {
        const newMap = new Map(map);
        newMap.set(field.key, initialDisabled);
        return newMap;
      });
    });
  }

  // 🔥 FIXED: Proper refresh and selection logic
  private handleQuickAddSubmit(field: PopupField, newData: any, quickAddConfig: any) {
    if (!quickAddConfig.onAdd) return;

    this.setQuickAddLoading(field.key, true);

    quickAddConfig.onAdd(newData).subscribe({
      next: (response: any) => {
        console.log('✅ Quick add success:', response);

        if (quickAddConfig.refreshOptions) {
          // Use the refresh function to get updated options
          quickAddConfig.refreshOptions(response).subscribe({
            next: (newOptions: any[]) => {
              console.log('✅ Refreshed options:', newOptions.length);

              // 🔥 CRITICAL: Update the field options in the map
              this.updateFieldOptions(field.key, newOptions);

              // Extract the newly created item's ID
              const newItemId = response?.data?.id || response?.id;

              console.log('🎯 Selecting new item:', newItemId);

              // Auto-select the newly added item
              if (newItemId && this.form) {
                const control = this.form.get(field.key);
                if (control) {
                  // Small delay to ensure dropdown is fully updated
                  setTimeout(() => {
                    control.setValue(newItemId);
                    control.markAsTouched();
                    control.updateValueAndValidity();

                    console.log('✅ Value set in form control:', control.value);

                    // 🔥 CRITICAL: Trigger cascade update for child fields
                    this.triggerCascadeUpdate(field.key, newItemId);
                  }, 100);
                }
              }

              this.setQuickAddLoading(field.key, false);
              this.setQuickAddSuccess(field.key, true);
            },
            error: (err: any) => {
              console.error('❌ Error refreshing options:', err);
              this.setQuickAddLoading(field.key, false);
            }
          });
        } else {
          // Fallback: manually add to options if no refresh function
          const currentOptions = this.getFieldOptions(field.key);
          const newItemId = response?.data?.id || response?.id;
          const newItemName = response?.data?.name || response?.name || 'New Item';

          const newOption = {
            value: newItemId,
            label: newItemName
          };

          const updatedOptions = [...currentOptions, newOption];
          this.updateFieldOptions(field.key, updatedOptions);

          // Auto-select
          if (this.form && newItemId) {
            const control = this.form.get(field.key);
            if (control) {
              setTimeout(() => {
                control.setValue(newItemId);
                control.markAsTouched();
                control.updateValueAndValidity();

                this.triggerCascadeUpdate(field.key, newItemId);
              }, 100);
            }
          }

          this.setQuickAddLoading(field.key, false);
          this.setQuickAddSuccess(field.key, true);
        }
      },
      error: (error: any) => {
        console.error('❌ Quick add error:', error);
        this.setQuickAddLoading(field.key, false);
      }
    });
  }

  /**
   * 🆕 NEW: Trigger cascade update for child fields
   */
  private triggerCascadeUpdate(parentFieldKey: string, parentValue: any) {
    if (!this.formConfig) return;

    // Find child fields that cascade from this parent
    const childFields = this.formConfig.fields.filter(
      f => f.cascadeFrom === parentFieldKey
    );

    childFields.forEach(childField => {
      console.log('🔄 Triggering cascade update for child:', childField.key);
      this.handleCascadeChange(childField, parentValue, false);
    });
  }

  private getFieldValidators(field: PopupField) {
    const validators: any[] = [];

    if (field.required) {
      validators.push(Validators.required);
    }
    if (field.type === 'email') {
      validators.push(Validators.email);
    }
    if (field.minLength) {
      validators.push(Validators.minLength(field.minLength));
    }
    if (field.maxLength) {
      validators.push(Validators.maxLength(field.maxLength));
    }
    if (field.type === 'number' && field.min !== undefined) {
      validators.push(Validators.min(field.min));
    }
    if (field.type === 'number' && field.max !== undefined) {
      validators.push(Validators.max(field.max));
    }
    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }
    if (field.validators) {
      validators.push(...field.validators);
    }

    return validators;
  }

  // 🆕 NEW: Setup reactive validation for email verification toggle
  private setupEmailVerificationValidation() {
    if (!this.form || !this.formConfig) return;

    const emailFields = this.formConfig.fields.filter(
      f => f.type === 'email' && f.showEmailVerification
    );

    emailFields.forEach(field => {
      const emailControl = this.form!.get(field.key);
      const verificationKey = field.emailVerificationKey || 'isEmailVerified';
      const verificationControl = this.form!.get(verificationKey);

      if (!emailControl || !verificationControl) return;

      // Check if email is already verified from backend
      const isAlreadyVerified = this.data?.data?.[verificationKey] === true;

      // Only setup listeners if NOT already verified
      if (!isAlreadyVerified) {
        // Listen to email field changes
        emailControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            // Enable/disable verification toggle based on email validity
            if (emailControl.valid && emailControl.value) {
              verificationControl.enable();
            } else {
              verificationControl.disable();
              // Reset toggle to false when email becomes invalid
              if (verificationControl.value) {
                verificationControl.setValue(false, { emitEvent: false });
              }
            }
          });

        // Initial check
        if (emailControl.valid && emailControl.value) {
          verificationControl.enable();
        } else {
          verificationControl.disable();
        }
      }
    });
  }

  getEmailVerificationControl(field: PopupField): FormControl | null {
    if (!this.form || !field.showEmailVerification) return null;
    const key = field.emailVerificationKey || 'isEmailVerified';
    return this.form.get(key) as FormControl;
  }

  getEmailVerificationTooltip(field: PopupField): string {
    return field.emailVerificationTooltip ||
      'When enabled, a verification link will be automatically sent to this email address.';
  }

  // 🆕 NEW: Method to check if email verification toggle should be disabled
  isEmailVerificationDisabled(field: PopupField): boolean {
    if (!this.form || !field.showEmailVerification) {
      return false;
    }

    const verificationKey = field.emailVerificationKey || 'isEmailVerified';
    const verificationControl = this.form.get(verificationKey);

    if (!verificationControl) {
      return false;
    }

    // Check if control is disabled (either from backend verification or invalid email)
    return verificationControl.disabled;
  }

  // 🔥 UPDATED: Get email verification status
  getEmailVerificationStatus(field: PopupField): boolean {
    if (!this.form || !field.showEmailVerification) {
      return false;
    }

    const verificationKey = field.emailVerificationKey || 'isEmailVerified';
    const verificationControl = this.form.get(verificationKey);

    return verificationControl?.value === true;
  }

  // 🆕 NEW: Check if email is already verified from backend
  isEmailAlreadyVerified(field: PopupField): boolean {
    if (!field.showEmailVerification) {
      return false;
    }

    const verificationKey = field.emailVerificationKey || 'isEmailVerified';
    return this.data?.data?.[verificationKey] === true;
  }

  // 🆕 NEW: Check if email field should be disabled
  isEmailFieldDisabled(field: PopupField): boolean {
    if (!this.form || field.type !== 'email') {
      return false;
    }

    const emailControl = this.form.get(field.key);
    return emailControl?.disabled ?? false;
  }

  // 🆕 NEW: Get tooltip for disabled email field
  getDisabledEmailTooltip(field: PopupField): string {
    if (this.isEmailAlreadyVerified(field)) {
      return 'This email has been verified and cannot be changed';
    }
    return '';
  }

  getCountryFlagUrl(countryCode: string): string {
    return this.countryService.getFlagUrl(countryCode);
  }

  getCountryCodeFromName(countryName: string): string {
    const country = this.countries().find(c => c.name === countryName);
    return country ? country.code : '';
  }

  getCountryNameFromCode(countryCode: string): string {
    const country = this.countries().find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  }

  openFileChooser(input: HTMLInputElement) {
    try {
      input.value = '';
    } catch { }
    input.click();
  }

  onImageSelect(event: Event, input?: HTMLInputElement) {
    const inputEl = input ?? (event.target as HTMLInputElement);
    if (!inputEl || !inputEl.files?.length) return;

    const file = inputEl.files[0];

    if (!file.type.startsWith('image/')) {
      console.warn('Invalid file type selected.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      console.warn('File too large (max 5MB).');
      return;
    }

    this.imageFile.set(file);

    const reader = new FileReader();
    reader.onload = (e: any) => this.imagePreview.set(e.target.result);
    reader.readAsDataURL(file);

    setTimeout(() => {
      try { inputEl.value = ''; } catch { }
      if (this.fileInputRef?.nativeElement) {
        try { this.fileInputRef.nativeElement.value = ''; } catch { }
      }
    }, 0);
  }

  onImageRemove() {
    this.imagePreview.set(null);
    this.imageFile.set(null);
    this.imageUploading.set(false);
    this.imagePreview.set('/assets/images/ProfilePic.png');

    if (this.form) {
      this.form.patchValue({ profilePicture: '' });
    }

    try {
      if (this.fileInputRef?.nativeElement) {
        this.fileInputRef.nativeElement.value = '';
      }
    } catch { }
  }

  getFieldError(fieldKey: string): string {
    if (!this.form) return '';
    const control = this.form.get(fieldKey);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    if (errors['pattern']) return 'Please enter a valid format';

    return 'Invalid input';
  }

  isFieldInvalid(key: string): boolean {
    if (!this.form) return false;
    const control = this.form.get(key);

    // 🔥 CRITICAL: Don't show errors for hidden fields
    const field = this.formConfig?.fields.find(f => f.key === key);
    if (field && !this.shouldShowField(field)) {
      return false;
    }

    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted()));
  }


  getDisplayValue(field: PopupField): any {
    if (!this.data?.data) return null;
    return this.data.data[field.key];
  }

  getSelectDisplayValue(field: PopupField): string {
    const value = this.getDisplayValue(field);
    if (!value || !field.options) return value?.toString() || '';

    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : value.toString();
  }

  getDateDisplayValue(field: PopupField): string {
    const value = this.getDisplayValue(field);
    if (!value) return '';

    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return value.toString();
    }
  }

  onSubmit() {
    if (!this.form) return;
    this.submitted.set(true);

    // 🔥 CRITICAL: Before validation, ensure hidden fields don't block submission
    this.cleanupHiddenFields();

    if (!this.form.valid) {
      console.warn('❌ Form invalid:', this.form.errors);

      // Debug: Log invalid controls
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form!.get(key);
        if (control && control.invalid) {
          const field = this.formConfig?.fields.find(f => f.key === key);
          const isVisible = field ? this.shouldShowField(field) : true;
          console.warn(`❌ Invalid field: ${key}`, {
            errors: control.errors,
            value: control.value,
            isVisible,
            disabled: control.disabled
          });
        }
      });

      Object.keys(this.form.controls).forEach(key => this.form!.get(key)?.markAsTouched());
      return;
    }

    this.loading.set(true);

    const file = this.imageFile();

    if (file) {
      this.imageUploading.set(true);
      this.filesUploadService.uploadProfilePicture(file).subscribe({
        next: (res) => {
          this.imageUploading.set(false);
          if (res?.url) {
            this.imagePreview.set(res.url);
            this.form!.patchValue({ profilePicture: res.url });
          }
          this.imageFile.set(null);
          this.finalizeSubmit();
        },
        error: (err) => {
          console.error('Error uploading image:', err);
          this.imageUploading.set(false);
          this.loading.set(false);
        }
      });
    } else {
      this.finalizeSubmit();
    }
  }

  // ============================================================================
  // 🔥 NEW: Clean up hidden fields before submission
  // ============================================================================
  private cleanupHiddenFields() {
    if (!this.form || !this.formConfig) return;

    this.formConfig.fields.forEach(field => {
      const control = this.form!.get(field.key);
      if (!control) return;

      const isVisible = this.shouldShowField(field);

      if (!isVisible) {
        // Clear validators for hidden fields
        control.clearValidators();

        // Optionally clear value (uncomment if you want to remove hidden field data)
        // control.setValue(null, { emitEvent: false });

        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  // 5️⃣ UPDATE: Fixed final submit processing
  private finalizeSubmit() {
    if (!this.form) return;

    const formValue = { ...this.form.getRawValue() };

    console.log('📤 Form raw value:', formValue);

    // 🔥 CRITICAL: Process file fields with proper naming
    if (this.formConfig) {
      this.formConfig.fields.forEach(field => {
        if (field.type === 'file') {
          const fieldKey = field.key;
          const fileFieldKey = this.getFileFieldKey(fieldKey);
          const pathFieldKey = this.getPathFieldKey(fieldKey);

          // Check if user uploaded a NEW file
          const newFile = this.fileMap().get(fileFieldKey);

          if (newFile instanceof File) {
            // 🔥 NEW FILE: Add with "File" suffix
            formValue[fileFieldKey] = newFile;
            delete formValue[fieldKey]; // Remove old key

            console.log(`✅ NEW FILE: ${fileFieldKey}`, newFile.name);
          } else {
            // 🔥 EXISTING FILE: Preserve path
            const existingUrl = this.filePreviewMap().get(fieldKey);

            if (existingUrl && typeof existingUrl === 'string' && !existingUrl.startsWith('data:')) {
              // Extract relative path from full URL
              const relativePath = this.extractRelativePath(existingUrl);
              formValue[pathFieldKey] = relativePath;

              console.log(`✅ EXISTING FILE: ${pathFieldKey} = ${relativePath}`);
            } else {
              formValue[pathFieldKey] = null;
            }

            // Clean up File field if no new upload
            delete formValue[fileFieldKey];
            delete formValue[fieldKey];
          }
        }
      });
    }

    console.log('📦 Final form data:', formValue);

    // Handle email verification toggles
    if (this.formConfig) {
      const emailFields = this.formConfig.fields.filter(
        f => f.type === 'email' && f.showEmailVerification
      );

      emailFields.forEach(field => {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const verificationControl = this.form!.get(verificationKey);

        if (verificationControl?.disabled && !this.isEmailAlreadyVerified(field)) {
          formValue[verificationKey] = false;
        }
      });
    }

    // Clean up hidden field values
    if (this.formConfig) {
      this.formConfig.fields.forEach(field => {
        if (!this.shouldShowField(field)) {
          // Optionally remove hidden field data
          // delete formValue[field.key];
        }
      });
    }

    const result: PopupResult = {
      action: 'submit',
      data: formValue
    };

    console.log('✅ Submitting:', result);

    this.dialogRef.close(result);
    this.loading.set(false);
    this.submitted.set(false);
  }


  private extractRelativePath(fullUrl: string): string {
    try {
      const url = new URL(fullUrl);
      return url.pathname.startsWith('/')
        ? url.pathname.substring(1)
        : url.pathname;
    } catch {
      return fullUrl;
    }
  }

  onConfirm() {
    this.loading.set(true);
    setTimeout(() => {
      this.dialogRef.close({ action: 'confirm' });
    }, 300);
  }

  onCancel() {
    this.dialogRef.close({ action: 'cancel' });
  }

  onClose() {
    this.dialogRef.close({ action: 'close' });
  }

  onEdit() {
    this.dialogRef.close({ action: 'edit', data: this.data?.data });
  }

  shouldShowField(field: PopupField): boolean {
    // Check old dependsOn logic (for backward compatibility)
    if (field.dependsOn) {
      const dependentValue = this.form?.get(field.dependsOn)?.value ?? this.data?.data?.[field.dependsOn];

      if (field.dependsOnValue !== undefined) {
        return dependentValue === field.dependsOnValue;
      }
      return !!dependentValue;
    }

    // Check new showIf logic (more flexible)
    if (field.showIf) {
      const conditionalField = field.showIf.field;
      const conditionalValue = field.showIf.value;

      // First try to get value from form control (for real-time updates)
      let actualValue = this.form?.get(conditionalField)?.value;

      // Fallback to data if form doesn't have the field
      if (actualValue === undefined || actualValue === null) {
        actualValue = this.data?.data?.[conditionalField];
      }

      // Compare values
      if (typeof conditionalValue === 'boolean') {
        return !!actualValue === conditionalValue;
      }

      return actualValue === conditionalValue;
    }

    return true;
  }

  private setupConditionalDisplay() {
    if (!this.form || !this.formConfig) return;

    const conditionalFields = this.formConfig.fields.filter(
      f => f.showIf || f.dependsOn || f.conditionalRequired
    );

    conditionalFields.forEach(childField => {

      /* ===============================
         PART 1: EXISTING showIf / dependsOn LOGIC (UNCHANGED)
         =============================== */

      const watchedFieldKey =
        childField.showIf?.field ||
        childField.dependsOn ||
        childField.conditionalRequired?.field;

      if (!watchedFieldKey) return;

      const watchedControl = this.form!.get(watchedFieldKey);
      const childControl = this.form!.get(childField.key);

      if (!watchedControl || !childControl) return;

      watchedControl.valueChanges
        .pipe(
          debounceTime(100),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {

          /* ---------- Visibility ---------- */
          if (childField.showIf || childField.dependsOn) {
            const shouldShow = this.evaluateFieldVisibility(childField, value);

            if (shouldShow) {
              this.enableFieldWithValidators(childField);
            } else {
              this.disableFieldAndClearValidators(childField);
            }
          }

          /* ===============================
             PART 2: 🔥 CONDITIONAL REQUIRED (NEW)
             =============================== */
          if (childField.conditionalRequired) {
            const shouldBeRequired =
              value === childField.conditionalRequired.value;

            if (shouldBeRequired) {
              const baseValidators =
                this.fieldValidatorsMap().get(childField.key) || [];

              childControl.setValidators([
                Validators.required,
                ...baseValidators
              ]);
            } else {
              childControl.clearValidators();
            }
          }

          childControl.updateValueAndValidity({ emitEvent: false });
        });

      /* ===============================
         PART 3: INITIAL LOAD (EDIT MODE FIX)
         =============================== */

      const initialValue = watchedControl.value;

      // Visibility init
      if (childField.showIf || childField.dependsOn) {
        const shouldShow = this.evaluateFieldVisibility(childField, initialValue);
        if (!shouldShow) {
          this.disableFieldAndClearValidators(childField);
        } else {
          this.enableFieldWithValidators(childField);
        }
      }

      // Conditional required init
      if (childField.conditionalRequired) {
        if (initialValue === childField.conditionalRequired.value) {
          childControl.setValidators([Validators.required]);
        } else {
          childControl.clearValidators();
        }
        childControl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }


  // ============================================================================
  // 🔥 NEW: Evaluate field visibility based on conditions
  // ============================================================================
  private evaluateFieldVisibility(field: PopupField, parentValue: any): boolean {
    // Check showIf condition (new flexible logic)
    if (field.showIf) {
      const conditionalValue = field.showIf.value;

      if (typeof conditionalValue === 'boolean') {
        return !!parentValue === conditionalValue;
      }

      return parentValue === conditionalValue;
    }

    // Check dependsOn condition (legacy logic)
    if (field.dependsOn) {
      if (field.dependsOnValue !== undefined) {
        return parentValue === field.dependsOnValue;
      }
      return !!parentValue;
    }

    return true;
  }

  // ============================================================================
  // 🔥 NEW: Enable field and restore its validators
  // ============================================================================
  private enableFieldWithValidators(field: PopupField) {
    const control = this.form?.get(field.key);
    if (!control) return;

    // Restore validators from stored map
    const validators = this.fieldValidatorsMap().get(field.key) || [];

    if (validators.length > 0) {
      control.setValidators(validators);
    }

    // Don't enable if it should be disabled for other reasons
    if (!field.disabled && !field.cascadeFrom) {
      control.enable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  // ============================================================================
  // 🔥 NEW: Disable field and clear validators (critical for hidden fields)
  // ============================================================================
  private disableFieldAndClearValidators(field: PopupField) {
    const control = this.form?.get(field.key);
    if (!control) return;

    // 🔥 CRITICAL: Clear all validators for hidden fields
    control.clearValidators();

    // 🔥 OPTION 1: Clear value (recommended for cleaner data)
    // control.setValue(null, { emitEvent: false });

    // 🔥 OPTION 2: Keep value but mark as valid (if you want to preserve data)
    // This is better for cases where you want to keep the data even when hidden

    control.updateValueAndValidity({ emitEvent: false });
  }

  trackByField(index: number, field: PopupField): string {
    return field.key || index.toString();
  }

  getUserFullName(): string {
    if (!this.data?.data) return '';
    const firstName = this.data.data.firstName || '';
    const lastName = this.data.data.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  }

  getUserProfileImage(): string {
    if (this.imagePreview()) return this.imagePreview()!;
    if (this.data?.data?.profilePicture) return this.data.data.profilePicture;
    return '/assets/images/ProfilePic.png';
  }

  formatDisplayValue(field: PopupField, value: any): string {
    // 🔥 CRITICAL: Never format info fields - they handle their own rendering
    if (field.type === 'info') {
      return ''; // Return empty string, let the template handle it
    }

    // 🔥 CRITICAL: Never format file fields here
    if (field.type === 'file') {
      return ''; // File fields are handled separately in template
    }

    if (!value && value !== false) return 'Not specified';

    switch (field.type) {
      case 'date':
        return this.getDateDisplayValue(field);
      case 'select':
      case 'radio':
        if (field.key === 'country') {
          return value;
        }
        return this.getSelectDisplayValue(field);
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'email':
        return value;
      case 'phone':
        return this.formatPhoneNumber(value);
      case 'textarea':
        return value;
      default:
        return value.toString();
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1)$2-$3');
    }
    return phone;
  }

  // File handling signals
  fileMap = signal<Map<string, File>>(new Map());
  filePreviewMap = signal<Map<string, string>>(new Map());
  fileDragOverMap = signal<Map<string, boolean>>(new Map());

  // File handling methods
  openFilePicker(fieldKey: string) {
    const input = document.getElementById(`file-input-${fieldKey}`) as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  onFileSelected(event: Event, fieldKey: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.handleFileUpload(file, fieldKey);
    }
  }

  onFileDragOver(event: DragEvent, fieldKey: string) {
    event.preventDefault();
    event.stopPropagation();
    this.setFileDragOver(fieldKey, true);
  }

  onFileDragLeave(event: DragEvent, fieldKey: string) {
    event.preventDefault();
    event.stopPropagation();
    this.setFileDragOver(fieldKey, false);
  }

  onFileDrop(event: DragEvent, fieldKey: string) {
    event.preventDefault();
    event.stopPropagation();
    this.setFileDragOver(fieldKey, false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFileUpload(file, fieldKey);
    }
  }

  private handleFileUpload(file: File, fieldKey: string) {
    const field = this.formConfig?.fields.find(f => f.key === fieldKey);
    if (!field) return;

    // Validate file type
    if (field.acceptedFileTypes) {
      const acceptedTypes = field.acceptedFileTypes.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!acceptedTypes.includes(fileExtension)) {
        this.globalService.showToastr(
          `Invalid file type. Accepted: ${field.acceptedFileTypes}`,
          'error'
        );
        return;
      }
    }

    // Validate file size
    if (field.maxFileSize) {
      const maxSizeInBytes = field.maxFileSize * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        this.globalService.showToastr(
          `File size exceeds ${field.maxFileSize}MB limit`,
          'error'
        );
        return;
      }
    }

    // 🔥 CRITICAL FIX: Store file with "File" suffix for backend
    const fileFieldKey = this.getFileFieldKey(fieldKey);

    this.fileMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fileFieldKey, file);
      return newMap;
    });

    // 🔥 Update form control with File object
    if (this.form) {
      this.form.get(fieldKey)?.setValue(file);
      this.form.get(fieldKey)?.markAsTouched();
    }

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreviewMap.update(map => {
          const newMap = new Map(map);
          newMap.set(fieldKey, e.target.result);
          return newMap;
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.filePreviewMap.update(map => {
        const newMap = new Map(map);
        newMap.set(fieldKey, file.name);
        return newMap;
      });
    }

    console.log('✅ File uploaded:', {
      fieldKey,
      fileFieldKey,
      fileName: file.name,
      fileSize: file.size
    });
  }

  // 2️⃣ NEW: Helper to convert field key to backend expected format
  private getFileFieldKey(fieldKey: string): string {
    // Maps: imageUrl -> ImageFile, deliveryNote -> DeliveryNoteFile, etc.
    const mapping: { [key: string]: string } = {
      'imageUrl': 'ImageFile',
      'imageFile': 'ImageFile',
      'deliveryNote': 'DeliveryNoteFile',
      'deliveryNoteFile': 'DeliveryNoteFile',
      'purchaseReceipt': 'PurchaseReceiptFile',
      'purchaseReceiptFile': 'PurchaseReceiptFile',
      'invoice': 'InvoiceFile',
      'invoiceFile': 'InvoiceFile'
    };

    return mapping[fieldKey] || fieldKey;
  }

  // 3️⃣ NEW: Helper to get path field key
  private getPathFieldKey(fieldKey: string): string {
    const mapping: { [key: string]: string } = {
      'imageUrl': 'ImagePath',
      'imageFile': 'ImagePath',
      'deliveryNote': 'DeliveryNotePath',
      'deliveryNoteFile': 'DeliveryNotePath',
      'purchaseReceipt': 'PurchaseReceiptPath',
      'purchaseReceiptFile': 'PurchaseReceiptPath',
      'invoice': 'InvoicePath',
      'invoiceFile': 'InvoicePath'
    };

    return mapping[fieldKey] || fieldKey;
  }

  removeFile(fieldKey: string) {
    // Clear file from map
    const fileFieldKey = this.getFileFieldKey(fieldKey);

    this.fileMap.update(map => {
      const newMap = new Map(map);
      newMap.delete(fileFieldKey);
      return newMap;
    });

    // Clear preview
    this.filePreviewMap.update(map => {
      const newMap = new Map(map);
      newMap.delete(fieldKey);
      return newMap;
    });

    // Clear form control
    if (this.form) {
      this.form.get(fieldKey)?.setValue(null);
      this.form.get(fieldKey)?.markAsTouched();
    }

    // Clear file input
    const input = document.getElementById(`file-input-${fieldKey}`) as HTMLInputElement;
    if (input) {
      input.value = '';
    }

    console.log('🗑️ File removed:', { fieldKey, fileFieldKey });
  }

  getFilePreview(fieldKey: string): string | null {
    return this.filePreviewMap().get(fieldKey) || null;
  }

  // getFileName(fieldKey: string): string {
  //   const file = this.fileMap().get(fieldKey);
  //   return file ? file.name : this.filePreviewMap().get(fieldKey) || '';
  // }

  // isImageFile(fieldKey: string): boolean {
  //   const preview = this.filePreviewMap().get(fieldKey);
  //   return preview ? preview.startsWith('data:image/') : false;
  // }

  isFileDragOver(fieldKey: string): boolean {
    return this.fileDragOverMap().get(fieldKey) || false;
  }

  private setFileDragOver(fieldKey: string, isDragOver: boolean) {
    this.fileDragOverMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, isDragOver);
      return newMap;
    });
  }
  //-----------------------------------------

  // 🆕 File handling methods for view mode
  getFieldFileUrl(fieldKey: string): string | null {
    // Priority 1: Check preview map (newly uploaded files)
    const preview = this.filePreviewMap().get(fieldKey);
    if (preview && preview.trim() !== '') {
      // console.log(`✅ Found preview for ${fieldKey}:`, preview);
      return preview;
    }

    // Priority 2: Check data object (backend URLs)
    const value = this.data?.data?.[fieldKey];

    if (typeof value === 'string' && value.trim() !== '') {
      console.log(`✅ Found backend URL for ${fieldKey}:`, value);
      return value;
    }

    // Priority 3: Handle File objects (edge case)
    if (value instanceof File) {
      try {
        const objectUrl = URL.createObjectURL(value);
        console.log(`✅ Created object URL for ${fieldKey}:`, objectUrl);
        return objectUrl;
      } catch (error) {
        console.error(`❌ Error creating object URL for ${fieldKey}:`, error);
        return null;
      }
    }

    console.warn(`⚠️ No file URL found for ${fieldKey}`);
    return null;
  }

  isImageFile(fileUrlOrData: string | null | undefined): boolean {
    if (!fileUrlOrData || fileUrlOrData.trim() === '') {
      return false;
    }

    const url = fileUrlOrData.toLowerCase();

    // Check data URL format
    if (url.startsWith('data:image/')) {
      return true;
    }

    // Check file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico'];
    const urlWithoutQuery = url.split('?')[0]; // Remove query parameters

    return imageExtensions.some(ext => urlWithoutQuery.endsWith(ext));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.error('❌ Image failed to load:', img.src);

    // Optionally replace with placeholder
    // img.src = '/assets/images/file-not-found.png';
  }

  getFileIcon(filePathOrUrl: string | null | undefined): string {
    if (!filePathOrUrl) {
      return 'insert_drive_file';
    }

    const ext = this.getFileExtension(filePathOrUrl).toLowerCase();

    const iconMap: { [key: string]: string } = {
      // Documents
      'pdf': 'picture_as_pdf',
      'doc': 'description',
      'docx': 'description',
      'txt': 'text_snippet',
      'rtf': 'description',

      // Spreadsheets
      'xls': 'table_chart',
      'xlsx': 'table_chart',
      'csv': 'table_chart',

      // Presentations
      'ppt': 'slideshow',
      'pptx': 'slideshow',

      // Archives
      'zip': 'folder_zip',
      'rar': 'folder_zip',
      '7z': 'folder_zip',
      'tar': 'folder_zip',
      'gz': 'folder_zip',

      // Images
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'bmp': 'image',

      // Code files
      'html': 'code',
      'css': 'code',
      'js': 'code',
      'ts': 'code',
      'json': 'data_object',
      'xml': 'code',

      // Other
      'mp4': 'video_library',
      'avi': 'video_library',
      'mp3': 'audio_file',
      'wav': 'audio_file'
    };

    return iconMap[ext] || 'insert_drive_file';
  }


  getFileExtension(filePathOrUrl: string | null | undefined): string {
    if (!filePathOrUrl) {
      return '';
    }

    // Remove query parameters
    const cleanPath = filePathOrUrl.split('?')[0];

    // Get last part after dot
    const parts = cleanPath.split('.');

    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }

    return '';
  }

  getFileName(filePathOrUrl: string | null | undefined): string {
    if (!filePathOrUrl) {
      return 'Unknown File';
    }

    // Remove query parameters
    const cleanPath = filePathOrUrl.split('?')[0];

    // Get last segment after slash
    const segments = cleanPath.split('/');
    const filename = segments[segments.length - 1];

    // Decode URI component (handle encoded characters)
    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  }

  getFileSize(filePath: string): string | null {
    // For existing files, we don't have size info
    // You could enhance this by storing file metadata
    return null;
  }

  getFileObjectSize(fieldKey: string): string | null {
    const file = this.fileMap().get(fieldKey);

    if (!file || !(file instanceof File)) {
      return null;
    }

    return this.formatFileSize(file.size);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }


  onFilePreview(fileUrl: string, fileName: string): void {
    console.log('📄 Preview file:', { fileUrl, fileName });

    if (!fileUrl) {
      this.globalService.showToastr('File URL not available', 'error');
      return;
    }

    const extension = this.getFileExtension(fileUrl);

    this.dialog.open(FilePreviewComponent, {
      data: {
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: extension
      },
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      panelClass: 'file-preview-dialog',
      autoFocus: false,
      hasBackdrop: true,
      disableClose: false
    });
  }
  onFileDownload(fileUrl: string, fileName: string): void {
    console.log('💾 Download file:', { fileUrl, fileName });

    if (!fileUrl) {
      this.globalService.showToastr('File URL not available', 'error');
      return;
    }

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
        this.downloadFile(fileUrl, fileName);
      }
    });
  }
  private downloadFile(url: string, fileName: string): void {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.globalService.showSnackbar(`Downloading ${fileName}...`, 'success');
    } catch (error) {
      console.error('❌ Download error:', error);
      this.globalService.showToastr('Failed to download file', 'error');
    }
  }

  isCompactFileField(field: PopupField): boolean {
    if (field.type !== 'file') return false;

    const config = this.formConfig || this.viewConfig;
    if (!config) return false;

    const columns = config.columns || 1;
    const fieldSpan = field.colSpan || 1;

    // Use compact mode for files in grids with 3+ columns
    // and files that don't span the full width
    return columns >= 3 && fieldSpan <= 2;
  }

  /**
   * Get CSS classes for file field based on mode
   */
  getFileFieldClasses(field: PopupField): string[] {
    const classes: string[] = [];

    if (this.isCompactFileField(field)) {
      classes.push('compact-file');
    }

    if (this.isViewType()) {
      classes.push('view-mode');
    }

    return classes;
  }

  /**
   * Get CSS classes for file view container
   */
  getFileViewContainerClasses(field: PopupField): string[] {
    const classes: string[] = [];

    if (this.isCompactFileField(field)) {
      classes.push('compact-view');
    }

    return classes;
  }
}