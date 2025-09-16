import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { PopupConfirmConfig, PopupData, PopupField, PopupFormConfig, PopupResult } from '../../../../core/models/interfaces/popup-widget.interface';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
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
    '[@dialogAnimation]': 'enter'
  }
})
export class PopupWidgetComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PopupWidgetComponent>);
  private fb = inject(FormBuilder);
  public data: PopupData = inject(MAT_DIALOG_DATA);

  form: FormGroup | null = null;
  loading = false;        // use boolean for clarity here
  submitted = false;

  // Computed properties for type safety and convenience
  // simple getters (less template weirdness)
  get isFormType(): boolean { return !!(this.data && this.data.type === 'form'); }
  get isConfirmType(): boolean { return !!(this.data && this.data.type === 'confirm'); }
  get formConfig(): PopupFormConfig | null { return this.isFormType ? (this.data.config as PopupFormConfig) : null; }
  get confirmConfig(): PopupConfirmConfig | null { return this.isConfirmType ? (this.data.config as PopupConfirmConfig) : null; }

  ngOnInit() {
    if (this.isFormType) {
      this.initializeForm();
    }
  }


  private initializeForm() {
    const cfg = this.formConfig;
    if (!cfg) return;

    const controls: { [k: string]: FormControl } = {};

    cfg.fields.forEach(field => {
      const validators = this.getFieldValidators(field);
      let value = field.value;

      // If editing, prefer data passed into dialog
      if (this.data?.data && this.data.data[field.key] !== undefined) {
        value = this.data.data[field.key];
      }

      if (field.type === 'checkbox') {
        value = !!value;
      }

      // Explicit FormControl creation - disabled explicit and obvious
      controls[field.key] = new FormControl({ value, disabled: !!field.disabled }, validators.length ? validators : null);
    });

    this.form = new FormGroup(controls);

    // DEBUG: inspect control disabled/enabled state right after creation
    console.log('Popup initialized. form:', this.form);
    Object.keys(this.form.controls).forEach(k => {
      console.log(`control: ${k}, disabled: ${this.form!.get(k)!.disabled}`);
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
    if (field.validators) {
      validators.push(...field.validators);
    }
    return validators;
  }

  getFieldError(fieldKey: string): string {
    if (!this.form) return '';
    const control = this.form.get(fieldKey);
    if (!control || !control.errors) return '';
    const errors = control.errors;
    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email';
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;
    return 'Invalid input';
  }

  isFieldInvalid(key: string) {
    if (!this.form) return false;
    const control = this.form.get(key);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  onSubmit() {
    if (!this.form) return;
    this.submitted = true;

    if (this.form.valid) {
      this.loading = true;
      setTimeout(() => {
        const result: PopupResult = { action: 'submit', data: this.form!.value };
        this.dialogRef.close(result);
      }, 400);
    } else {
      Object.keys(this.form.controls).forEach(k => this.form!.get(k)?.markAsTouched());
    }
  }

  onConfirm() {
    this.loading = true;
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
  // Helper methods for template
  shouldShowField(field: PopupField): boolean {
    return !field.disabled || this.form?.get(field.key)?.value;
  }

  getSelectDisplayValue(field: PopupField, value: any): string {
    if (!field.options) return value;
    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  trackByField(index: number, field: PopupField) {
    return field.key ?? index;
  }
}
