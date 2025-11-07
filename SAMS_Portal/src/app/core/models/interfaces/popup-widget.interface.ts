// popup-widget.interface.ts - Updated with email verification support
import { ValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';

export interface PopupFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

export interface PopupField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox' | 'radio' | 'image' | 'phone';
  value?: any;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  tooltip?: string;
  
  // Validation
  validators?: ValidatorFn[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  
  // Select/Radio options
  options?: PopupFieldOption[];

  // 🆕 EMAIL VERIFICATION TOGGLE
  showEmailVerification?: boolean; // Show verification toggle for this email field
  emailVerificationKey?: string; // Key for the verification boolean field (default: 'isEmailVerified')
  emailVerificationLabel?: string; // Label for toggle (default: 'Send Verification Email')
  emailVerificationTooltip?: string; // Custom tooltip message
  
  // Cascading dropdown support
  cascadeFrom?: string;
  cascadeProperty?: string;
  loadOptionsOnChange?: (parentValue: any) => Observable<PopupFieldOption[]>;
  clearOnParentChange?: boolean;
  
  // Textarea specific
  rows?: number;
  
  // Image upload specific
  acceptedTypes?: string[];
  maxFileSize?: number;
  imagePreviewWidth?: number;
  imagePreviewHeight?: number;
  
  // Layout control
  colSpan?: 1 | 2;
  breakAfter?: boolean;
  
  // Display options
  icon?: string;
  suffix?: string;
  prefix?: string;
  
  // Conditional display
  dependsOn?: string;
  dependsOnValue?: any;
}

export interface PopupFormConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  
  fields: PopupField[];
  
  // Layout options
  columns?: 1 | 2;
  compactMode?: boolean;
  
  // Button configuration
  submitButtonText?: string;
  cancelButtonText?: string;
  showCloseButton?: boolean;
  
  // Dialog options
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

export interface PopupViewConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  
  fields: PopupField[];
  
  // Layout options
  columns?: 1 | 2;
  compactMode?: boolean;
  
  // Button configuration
  closeButtonText?: string;
  editButtonText?: string;
  showEditButton?: boolean;
  
  // Dialog options
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

export interface PopupConfirmConfig {
  title: string;
  message: string;
  details?: string;
  icon?: string;
  iconColor?: 'primary' | 'warn' | 'accent';
  
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'warn' | 'accent';
  
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

export interface PopupData {
  type: 'form' | 'view' | 'confirm';
  config: PopupFormConfig | PopupViewConfig | PopupConfirmConfig;
  data?: any;
}

export interface PopupResult {
  action: 'submit' | 'confirm' | 'cancel' | 'close' | 'edit';
  data?: any;
}