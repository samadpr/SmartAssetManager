// popup-widget.interface.ts - Updated with image upload support
import { ValidatorFn } from '@angular/forms';

export interface PopupFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
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
  
  // Textarea specific
  rows?: number;
  
  // Image upload specific
  acceptedTypes?: string[]; // e.g., ['image/jpeg', 'image/png']
  maxFileSize?: number; // in bytes
  imagePreviewWidth?: number;
  imagePreviewHeight?: number;
  
  // Layout control
  colSpan?: 1 | 2; // How many columns to span (1 or 2)
  breakAfter?: boolean; // Force line break after this field
  
  // Display options
  icon?: string;
  suffix?: string;
  prefix?: string;
  
  // Conditional display
  dependsOn?: string; // Show field only when another field has value
  dependsOnValue?: any;
}

export interface PopupFormConfig {
  title: string;
  subtitle?: string;
  icon?: string;
  
  fields: PopupField[];
  
  // Layout options
  columns?: 1 | 2; // Number of columns (default: 2)
  compactMode?: boolean; // Reduces spacing
  
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
  
  fields: PopupField[]; // Same structure, but will be display-only
  
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