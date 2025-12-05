import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopupConfirmConfig, PopupData, PopupField, PopupFormConfig, PopupResult, PopupViewConfig } from '../../models/interfaces/popup-widget.interface';
import { Observable } from 'rxjs';
import { PopupWidgetComponent } from '../../../shared/widgets/common/popup-widget/popup-widget.component';

@Injectable({
  providedIn: 'root'
})
export class PopupWidgetService {
  private dialog = inject(MatDialog);

  /**
   * Open a form popup for Add/Edit operations
   */
  openFormPopup(config: PopupFormConfig, data?: any): Observable<PopupResult> {
    const popupData: PopupData = {
      type: 'form',
      config,
      data
    };

    const dialogRef = this.openDialog(popupData, config);
    return dialogRef.afterClosed();
  }

  /**
   * Open a view-only popup for displaying data
   */
  openViewPopup(config: PopupViewConfig, data: any): Observable<PopupResult> {
    const popupData: PopupData = {
      type: 'view',
      config,
      data
    };

    const dialogRef = this.openDialog(popupData, config);
    return dialogRef.afterClosed();
  }

  /**
   * Open a confirmation popup for Delete operations
   */
  openConfirmPopup(config: PopupConfirmConfig): Observable<PopupResult> {
    const popupData: PopupData = {
      type: 'confirm',
      config
    };

    const dialogRef = this.openDialog(popupData, config);
    return dialogRef.afterClosed();
  }

  /**
   * Quick Add popup - simplified method with 2-column layout support
   */
  openAddPopup(
    title: string,
    fields: PopupField[],
    options?: Partial<PopupFormConfig>
  ): Observable<PopupResult> {
    const config: PopupFormConfig = {
      title,
      fields,
      columns: 2, // Default to 2 columns
      submitButtonText: 'Add',
      cancelButtonText: 'Cancel',
      showCloseButton: true,
      maxWidth: '800px',
      ...options
    };

    return this.openFormPopup(config);
  }

  /**
   * Quick Edit popup - simplified method with 2-column layout support
   */
  openEditPopup(
    title: string,
    fields: PopupField[],
    data: any,
    options?: Partial<PopupFormConfig>
  ): Observable<PopupResult> {
    const config: PopupFormConfig = {
      title,
      fields,
      columns: 2, // Default to 2 columns
      submitButtonText: 'Update',
      cancelButtonText: 'Cancel',
      showCloseButton: true,
      maxWidth: '800px',
      ...options
    };

    return this.openFormPopup(config, data);
  }

  /**
   * Quick View popup - simplified method with 2-column layout support
   */
  openViewPopup2(
    title: string,
    fields: PopupField[],
    data: any,
    options?: Partial<PopupViewConfig>
  ): Observable<PopupResult> {
    const config: PopupViewConfig = {
      title,
      fields,
      columns: 2, // Default to 2 columns
      closeButtonText: 'Close',
      editButtonText: 'Edit',
      showEditButton: false,
      maxWidth: '800px',
      ...options
    };

    return this.openViewPopup(config, data);
  }

  /**
   * Quick Delete confirmation popup
   */
  openDeleteConfirmation(
    message: string,
    details?: string,
    options?: Partial<PopupConfirmConfig>
  ): Observable<PopupResult> {
    const config: PopupConfirmConfig = {
      title: 'Confirm Delete',
      message,
      details,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: 'warn',
      icon: 'delete_forever',
      iconColor: 'warn',
      maxWidth: '500px',
      ...options
    };

    return this.openConfirmPopup(config);
  }

  openRevokeConfirmation(
    message: string,
    details?: string,
    options?: Partial<PopupConfirmConfig>
  ): Observable<PopupResult> {
    const config: PopupConfirmConfig = {
      title: 'Confirm Revoke Access',
      message,
      details,
      confirmButtonText: 'Revoke Access',
      cancelButtonText: 'Cancel',
      confirmButtonColor: 'warn',
      icon: 'delete_forever',
      iconColor: 'warn',
      maxWidth: '500px',
      ...options
    };

    return this.openConfirmPopup(config);
  }

  /**
   * Generic confirmation popup
   */
  openGenericConfirmation(
    title: string,
    message: string,
    options?: Partial<PopupConfirmConfig>
  ): Observable<PopupResult> {
    const config: PopupConfirmConfig = {
      title,
      message,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      confirmButtonColor: 'primary',
      icon: 'help_outline',
      maxWidth: '500px',
      ...options
    };

    return this.openConfirmPopup(config);
  }

  private openDialog(
    data: PopupData,
    config: PopupFormConfig | PopupViewConfig | PopupConfirmConfig
  ): MatDialogRef<PopupWidgetComponent> {
    return this.dialog.open(PopupWidgetComponent, {
      data,
      width: config.width || 'auto',
      maxWidth: config.maxWidth || '90vw',
      minWidth: config.minWidth,
      height: config.height || 'auto',
      maxHeight: config.maxHeight || '90vh',
      minHeight: config.minHeight,
      disableClose: config.disableClose || false,
      hasBackdrop: config.hasBackdrop !== false,
      backdropClass: config.backdropClass,
      panelClass: [
        'popup-widget-panel',
        ...(Array.isArray(config.panelClass)
          ? config.panelClass
          : config.panelClass
            ? [config.panelClass]
            : []
        )
      ],
      autoFocus: true,
      restoreFocus: true
    });
  }
}
