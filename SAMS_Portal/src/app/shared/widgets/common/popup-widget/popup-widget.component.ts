import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
    MatSlideToggleModule
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
    ])
  ],
  host: {
    '[@dialogAnimation]': "'enter'"
  }
})
export class PopupWidgetComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<PopupWidgetComponent>);
  private fb = inject(FormBuilder);
  private filesUploadService = inject(FilesUploadService);
  private countryService = inject(CountryService);
  public data: PopupData = inject(MAT_DIALOG_DATA);

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

      controls[field.key] = new FormControl(
        { value, disabled: isDisabled },
        validators.length ? validators : null
      );

      // 🆕 Add email verification control if enabled
      if (field.type === 'email' && field.showEmailVerification) {
        const verificationKey = field.emailVerificationKey || 'isEmailVerified';
        const verificationValue = this.data?.data?.[verificationKey] ?? false;
        controls[verificationKey] = new FormControl(verificationValue);
      }
    });

    if (!controls['profilePicture']) {
      controls['profilePicture'] = new FormControl(this.data?.data?.profilePicture || '');
    }

    this.form = new FormGroup(controls);

    console.log('Popup form initialized:', {
      type: this.data.type,
      formValid: this.form.valid,
      controls: Object.keys(this.form.controls)
    });
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

    console.log(`Cascading: ${childField.cascadeFrom} → ${childField.key}`, {
      parentValue,
      isInitial,
      currentChildValue: childControl.value
    });

    // Clear child value if configured (skip on initial load to preserve edit values)
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

  private updateFieldOptions(fieldKey: string, options: any[]) {
    this.fieldOptionsMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, options);
      return newMap;
    });
  }

  private setFieldLoading(fieldKey: string, loading: boolean) {
    this.fieldLoadingMap.update(map => {
      const newMap = new Map(map);
      newMap.set(fieldKey, loading);
      return newMap;
    });
  }

  getFieldOptions(fieldKey: string): any[] {
    return this.fieldOptionsMap().get(fieldKey) || [];
  }

  isFieldLoading(fieldKey: string): boolean {
    return this.fieldLoadingMap().get(fieldKey) || false;
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

  // 🆕 Get email verification control
  getEmailVerificationControl(field: PopupField): FormControl | null {
    if (!this.form || !field.showEmailVerification) return null;
    const key = field.emailVerificationKey || 'isEmailVerified';
    return this.form.get(key) as FormControl;
  }

  // 🆕 Get default verification tooltip
  getEmailVerificationTooltip(field: PopupField): string {
    return field.emailVerificationTooltip || 
      'When enabled, a verification link will be automatically sent to this email address. The user must verify their email before accessing the system.';
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

  getInputType(fieldType: string): string {
    switch (fieldType) {
      case 'password': return 'password';
      case 'email': return 'email';
      case 'number': return 'number';
      default: return 'text';
    }
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
    const formValue = { ...this.form!.value };

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
    if (field.dependsOn && this.data?.data) {
      const dependentValue = this.data.data[field.dependsOn];
      if (field.dependsOnValue !== undefined) {
        return dependentValue === field.dependsOnValue;
      }
      return !!dependentValue;
    }
    return true;
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
}