export interface PopupField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'date' | 'checkbox';
    value?: any;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    validators?: any[];
    options?: PopupSelectOption[]; // for select type
    rows?: number; // for textarea
    maxLength?: number;
    minLength?: number;
    min?: number; // for number/date
    max?: number; // for number/date
}

export interface PopupSelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface PopupAction {
  key: string;
  label: string;
  type: 'primary' | 'secondary' | 'warn';
  icon?: string;
  disabled?: boolean;
}

export interface PopupConfig {
  title: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  disableClose?: boolean;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

export interface PopupFormConfig extends PopupConfig {
  fields: PopupField[];
  actions?: PopupAction[];
  submitButtonText?: string;
  cancelButtonText?: string;
  showCloseButton?: boolean;
}

export interface PopupConfirmConfig extends PopupConfig {
  message: string;
  details?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'primary' | 'warn' | 'accent';
  icon?: string;
  iconColor?: string;
}

export type PopupType = 'form' | 'confirm';

export interface PopupData {
  type: PopupType;
  config: PopupFormConfig | PopupConfirmConfig;
  data?: any; // for edit mode
}

export interface PopupResult {
  action: 'submit' | 'cancel' | 'confirm' | 'close';
  data?: any;
}