// popup-widget.interface.ts - Complete with all field types
import { ValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';

export interface PopupFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  [key: string]: any;
}

// Quick Add Configuration
export interface QuickAddConfig {
  enabled: boolean;
  buttonLabel?: string;
  buttonIcon?: string;
  popupTitle: string;
  popupIcon?: string;
  fields: PopupField[];
  onAdd?: (data: any) => Observable<any>;
  refreshOptions?: (newData: any) => Observable<PopupFieldOption[]>;
}

// Conditional Display Configuration
export interface ConditionalDisplay {
  field: string;
  value: any;
}

export interface PopupField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date' |
  'checkbox' | 'radio' | 'image' | 'phone' | 'toggle' | 'info' | 'divider' | 'file';
  value?: any;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  tooltip?: string;
  helperText?: string;

  // Validation
  validators?: ValidatorFn[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;

  // Select/Radio options
  options?: PopupFieldOption[];

  // Quick Add for dropdowns
  quickAdd?: QuickAddConfig;

  // 🆕 ENHANCED FILE UPLOAD PROPERTIES
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  showFilePreview?: boolean;
  filePreviewUrl?: string;
  allowMultiple?: boolean;
  previewWidth?: string; // e.g., '100%', '300px'
  previewHeight?: string; // e.g., 'auto', '200px'
  showFileName?: boolean;
  showFileSize?: boolean;
  downloadEnabled?: boolean; // Allow download in view mode

  // Email Verification Toggle
  showEmailVerification?: boolean;
  emailVerificationKey?: string;
  emailVerificationLabel?: string;
  emailVerificationTooltip?: string;
  emailVerificationDisabled?: boolean;

  // Cascading dropdown support
  cascadeFrom?: string;
  cascadeProperty?: string;
  loadOptionsOnChange?: (parentValue: any) => Observable<PopupFieldOption[]>;
  clearOnParentChange?: boolean;

  // Textarea specific
  rows?: number;

  // // Image upload specific
  // acceptedTypes?: string[];
  // maxFileSize?: number;
  // imagePreviewWidth?: number;
  // imagePreviewHeight?: number;

  // Toggle specific
  color?: 'primary' | 'accent' | 'warn';

  // 🆕 ENHANCED LAYOUT CONTROL
  colSpan?: 1 | 2 | 3 | 4; // Support up to 4 columns
  rowSpan?: number;
  breakAfter?: boolean;
  order?: number; // Custom field ordering

  // Display options
  icon?: string;
  suffix?: string;
  prefix?: string;

  // Conditional display
  dependsOn?: string;
  dependsOnValue?: any;
  showIf?: ConditionalDisplay;
}

export interface PopupFormConfig {
  title: string;
  subtitle?: string;
  icon?: string;

  fields: PopupField[];

  // 🆕 ENHANCED LAYOUT OPTIONS
  columns?: 1 | 2 | 3 | 4; // Support up to 4 columns
  compactMode?: boolean;
  fieldBorderStyle?: 'outline' | 'filled' | 'standard'; // Material form field appearance

  // Button configuration
  submitButtonText?: string;
  submitButtonIcon?: string;
  cancelButtonText?: string;
  showCloseButton?: boolean;

// 🆕 ENHANCED DIALOG OPTIONS
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string | string[];
}

export interface PopupViewConfig {
  title: string;
  subtitle?: string;
  icon?: string;

  fields: PopupField[];

  // Layout options
  columns?: 1 | 2 | 3 | 4;
  compactMode?: boolean;
  fieldBorderStyle?: 'outline' | 'filled' | 'standard';

  // Button configuration
  closeButtonText?: string;
  editButtonText?: string;
  showEditButton?: boolean;

  // Dialog options
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string | string[];
}

export interface PopupConfirmConfig {
  title: string;
  message: string;
  details?: string;
  icon?: string;
  iconColor?: 'primary' | 'warn' | 'accent';

  confirmButtonText?: string;
  confirmButtonIcon?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'warn' | 'accent';

  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  minHeight?: string;
  minWidth?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string | string[];
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