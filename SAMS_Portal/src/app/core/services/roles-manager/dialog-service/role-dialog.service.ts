import { Injectable } from '@angular/core';
import { RoleAddEditDialogComponent, RoleDialogData, RoleDialogResult } from '../../../../shared/widgets/role/role-add-edit-dialog/role-add-edit-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AspNetRoleDto, ManageUserRoleRequest } from '../../../models/interfaces/manage-roles/manage-roles.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleDialogService {

  constructor(private dialog: MatDialog) {}

  /**
   * Opens the Role Add Dialog
   */
  openAddRoleDialog(
    aspNetRoles: AspNetRoleDto[] = [],
    config?: Partial<MatDialogConfig>
  ): Observable<RoleDialogResult | undefined> {
    const dialogData: RoleDialogData = {
      mode: 'add',
      title: 'Create New Role',
      aspNetRoles: aspNetRoles
    };

    const dialogConfig: MatDialogConfig = {
      width: '900px',
      maxWidth: '95vw',
      height: '83vh',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: true,
      panelClass: 'role-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
      ...config
    };

    return this.dialog.open(RoleAddEditDialogComponent, dialogConfig).afterClosed();
  }

  /**
   * Opens the Role Edit Dialog
   */
  openEditRoleDialog(
    role: ManageUserRoleRequest, 
    aspNetRoles: AspNetRoleDto[],
    config?: Partial<MatDialogConfig>
  ): Observable<RoleDialogResult | undefined> {
    const dialogData: RoleDialogData = {
      mode: 'edit',
      role: role,
      title: `Edit Role: ${role.name}`,
      aspNetRoles: aspNetRoles
    };

    const dialogConfig: MatDialogConfig = {
      width: '900px',
      maxWidth: '95vw',
      height: '83vh',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: true,
      panelClass: 'role-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
      ...config
    };

    return this.dialog.open(RoleAddEditDialogComponent, dialogConfig).afterClosed();
  }

  /**
   * Opens a role view dialog (read-only)
   */
  openViewRoleDialog(
    role: ManageUserRoleRequest, 
    aspNetRoles: AspNetRoleDto[] = [], // Provide default empty array
    config?: Partial<MatDialogConfig>
  ): Observable<RoleDialogResult | undefined> {
    const dialogData: RoleDialogData = {
      mode: 'edit', // We'll add view mode later if needed
      role: role,
      title: `View Role: ${role.name}`,
      aspNetRoles: aspNetRoles
    };

    const dialogConfig: MatDialogConfig = {
      width: '900px',
      maxWidth: '95vw',
      height: '83vh',
      maxHeight: '90vh',
      data: dialogData,
      disableClose: false,
      panelClass: 'role-dialog-panel',
      autoFocus: false,
      restoreFocus: true,
      ...config
    };

    return this.dialog.open(RoleAddEditDialogComponent, dialogConfig).afterClosed();
  }
}