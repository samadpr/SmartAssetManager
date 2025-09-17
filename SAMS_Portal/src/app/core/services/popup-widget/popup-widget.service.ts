import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PopupConfirmConfig, PopupData, PopupField, PopupFormConfig, PopupResult } from '../../models/interfaces/popup-widget.interface';
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
   * Quick Add popup - simplified method
   */
  openAddPopup(title: string, fields: PopupField[], options?: Partial<PopupFormConfig>): Observable<PopupResult> {
    const config: PopupFormConfig = {
      title,
      fields,
      submitButtonText: 'Add',
      cancelButtonText: 'Cancel',
      showCloseButton: true,
      maxWidth: '600px',
      ...options
    };

    return this.openFormPopup(config);
  }

  /**
   * Quick Edit popup - simplified method
   */
  openEditPopup(title: string, fields: PopupField[], data: any, options?: Partial<PopupFormConfig>): Observable<PopupResult> {
    const config: PopupFormConfig = {
      title,
      fields,
      submitButtonText: 'Update',
      cancelButtonText: 'Cancel',
      showCloseButton: true,
      maxWidth: '600px',
      ...options
    };

    return this.openFormPopup(config, data);
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

  private openDialog(data: PopupData, config: PopupFormConfig | PopupConfirmConfig): MatDialogRef<PopupWidgetComponent> {
    return this.dialog.open(PopupWidgetComponent, {
      data,
      width: config.width || 'auto',
      maxWidth: config.maxWidth || '90vw',
      height: config.height || 'auto',
      maxHeight: config.maxHeight || '90vh',
      disableClose: config.disableClose || false,
      hasBackdrop: config.hasBackdrop !== false,
      backdropClass: config.backdropClass,
      panelClass: ['popup-widget-panel', ...(config.panelClass ? [config.panelClass] : [])],
      autoFocus: true,
      restoreFocus: true
    });
  }
}
