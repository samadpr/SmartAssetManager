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
import { Subject, takeUntil } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import { GlobalService } from '../../../../core/services/global/global.service';
import { FilePreviewComponent } from '../list-widget/file-preview/file-preview.component';
import { PopupWidgetService } from '../../../../core/services/popup-widget/popup-widget.service';

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

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  form: FormGroup | null = null;
  loading = signal(false);
  imageUploading = signal(false);
  submitted = signal(false);
  imagePreview = signal<string | null>(null);
  imageFile = signal<File | null>(null);
  countries = signal<Country[]>([]);
  countriesLoaded = signal(false);

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

    cfg.fields.forEach(field => {
      const validators = this.getFieldValidators(field);
      let value = field.value;

      if (this.data?.data && this.data.data[field.key] !== undefined) {
        value = this.data.data[field.key];

        // Handle existing file URLs for file fields
        if (field.type === 'file' && value && typeof value === 'string') {
          this.filePreviewMap.update(map => {
            const newMap = new Map(map);
            newMap.set(field.key, value);
            return newMap;
          });
        }
      }

      if (field.type === 'checkbox') {
        value = !!value;
      } else if (field.type === 'date' && value) {
        value = new Date(value);
      }

      const isDisabled = field.disabled || (field.cascadeFrom ? true : false);

      if (field.key === 'country' && field.type === 'select') {
        field.options = this.countries().map(country => ({
          value: country.name,
          label: country.name,
          disabled: false,
          code: country.code
        }));
      }

      if (field.options) {
        this.fieldOptionsMap.update(map => {
          const newMap = new Map(map);
          newMap.set(field.key, field.options || []);
          return newMap;
        });
      }

      // 🔥 UPDATED: Email field - disable if already verified from backend
      let fieldDisabled = isDisabled;
      if (field.type === 'email' && field.showEmailVerification) {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const isAlreadyVerified = this.data?.data?.[verificationKey] === true;

        // If email is already verified from backend, disable the email field
        if (isAlreadyVerified) {
          fieldDisabled = true;
        }
      }

      controls[field.key] = new FormControl(
        { value, disabled: isDisabled },
        validators.length ? validators : null
      );

      // 🔥 UPDATED: Email verification toggle control
      if (field.type === 'email' && field.showEmailVerification) {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const isAlreadyVerified = this.data?.data?.[verificationKey] === true;

        // Create verification control
        const verificationControl = new FormControl({
          value: isAlreadyVerified,
          disabled: isAlreadyVerified // Disable only if already verified from backend
        });

        controls[verificationKey] = verificationControl;

        // 🆕 Setup reactive validation: toggle enabled only when email is valid
        if (!isAlreadyVerified) {
          // Initially disable the toggle
          verificationControl.disable();
        }
      }
    });

    if (!controls['profilePicture']) {
      controls['profilePicture'] = new FormControl(this.data?.data?.profilePicture || '');
    }

    this.form = new FormGroup(controls);

    // 🆕 Setup email validation listeners AFTER form creation
    this.setupEmailVerificationValidation();
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

    if (!isInitial && childField.clearOnParentChange !== false) {
      childControl.setValue(null);
    }

    if (!parentValue) {
      childControl.disable();
      this.updateFieldOptions(childField.key, []);
      return;
    }

    if (childField.loadOptionsOnChange) {
      this.setFieldLoading(childField.key, true);
      childControl.disable();

      childField.loadOptionsOnChange(parentValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (options) => {
            this.updateFieldOptions(childField.key, options);
            this.setFieldLoading(childField.key, false);
            childControl.enable();
          },
          error: (error) => {
            console.error(`Error loading options for ${childField.key}:`, error);
            this.updateFieldOptions(childField.key, []);
            this.setFieldLoading(childField.key, false);
            childControl.enable();
          }
        });
    } else if (childField.options && childField.cascadeProperty) {
      const filteredOptions = childField.options.filter(opt =>
        opt[childField.cascadeProperty!] === parentValue
      );

      this.updateFieldOptions(childField.key, filteredOptions);
      childControl.enable();
    }
  }

  // 🔥 FIXED: Properly update field options AND the original field config
  private updateFieldOptions(fieldKey: string, options: any[]) {
    // Update the signal map
    this.fieldOptionsMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, options);
      return newMap;
    });

    // 🔥 CRITICAL FIX: Also update the original field config
    if (this.formConfig) {
      const field = this.formConfig.fields.find(f => f.key === fieldKey);
      if (field && field.type === 'select') {
        field.options = options;
      }
    }
  }

  private setFieldLoading(fieldKey: string, loading: boolean) {
    this.fieldLoadingMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, loading);
      return newMap;
    });
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

  // 🆕 Enhanced Quick Add with better UX
  onQuickAddClick(field: PopupField, event: Event) {
    event.stopPropagation();

    if (!field.quickAdd || this.isQuickAddLoading(field.key)) return;

    const quickAddConfig = field.quickAdd;

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
              console.log('✅ Refreshed options:', newOptions);

              // 🔥 CRITICAL: Update both the map AND the field config
              this.updateFieldOptions(field.key, newOptions);

              // Extract the newly created item's ID
              const newItemId = response?.data?.id || response?.id;
              const newItemName = response?.data?.name || response?.name || 'New Item';

              console.log('🎯 Selecting new item:', { id: newItemId, name: newItemName });

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

    if (!this.form.valid) {
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

  private finalizeSubmit() {
    // 🔥 IMPORTANT: Get raw value to include disabled controls
    const formValue = { ...this.form!.getRawValue() };

    // 🆕 Handle email verification: if toggle is disabled due to invalid email, set to false
    if (this.formConfig) {
      const emailFields = this.formConfig.fields.filter(
        f => f.type === 'email' && f.showEmailVerification
      );

      emailFields.forEach(field => {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const verificationControl = this.form!.get(verificationKey);

        // If verification control is disabled and not from backend, ensure it's false
        if (verificationControl?.disabled && !this.isEmailAlreadyVerified(field)) {
          formValue[verificationKey] = false;
        }
      });
    }

    const result: PopupResult = {
      action: 'submit',
      data: formValue
    };

    this.dialogRef.close(result);
    this.loading.set(false);
    this.submitted.set(false);
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

    // 🆕 Check new showIf logic (more flexible)
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

  // Add this new method to set up reactive showIf listeners:
  private setupConditionalDisplay() {
    if (!this.form || !this.formConfig) return;

    const fieldsWithShowIf = this.formConfig.fields.filter(f => f.showIf);

    fieldsWithShowIf.forEach(field => {
      if (!field.showIf) return;

      const watchedField = field.showIf.field;
      const watchedControl = this.form!.get(watchedField);

      if (watchedControl) {
        // Set up value change listener
        watchedControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            // Force Angular to re-evaluate *ngIf by triggering change detection
            // This happens automatically, but we can add logic here if needed

            const childControl = this.form!.get(field.key);
            if (childControl) {
              // If field is now hidden and has a value, optionally clear it
              if (!this.shouldShowField(field) && childControl.value) {
                // Uncomment if you want to clear hidden fields:
                // childControl.setValue(null);
              }
            }
          });
      }
    });
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
    // Get field config
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
      const maxSizeInBytes = field.maxFileSize * 1024 * 1024; // Convert MB to bytes
      if (file.size > maxSizeInBytes) {
        this.globalService.showToastr(
          `File size exceeds ${field.maxFileSize}MB limit`,
          'error'
        );
        return;
      }
    }

    // Store file
    this.fileMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, file);
      return newMap;
    });

    // Update form control
    if (this.form) {
      this.form.get(fieldKey)?.setValue(file);
      this.form.get(fieldKey)?.markAsTouched();
    }

    // Create preview for images
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
      // For non-images, store filename
      this.filePreviewMap.update(map => {
        const newMap = new Map(map);
        newMap.set(fieldKey, file.name);
        return newMap;
      });
    }
  }

  removeFile(fieldKey: string) {
    // Clear file from map
    this.fileMap.update(map => {
      const newMap = new Map(map);
      newMap.delete(fieldKey);
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
    }

    // Clear file input
    const input = document.getElementById(`file-input-${fieldKey}`) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
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
      console.log(`✅ Found preview for ${fieldKey}:`, preview);
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
}