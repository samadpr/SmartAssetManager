import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { CommonModule } from '@angular/common';
import { AspNetRoleDto, ManageUserRoleRequest, ManageUserRolesDto } from '../../../core/models/interfaces/manage-roles/manage-roles.interface';
import { ManageRolesService } from '../../../core/services/roles-manager/manage-roles.service';
import { ToastrService } from 'ngx-toastr';
import { RoleDialogService } from '../../../core/services/roles-manager/dialog-service/role-dialog.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-manage-roles',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent,
    CommonModule
  ],
  templateUrl: './manage-roles.component.html',
  styleUrl: './manage-roles.component.scss'
})
export class ManageRolesComponent implements OnInit {
  private manageRolesService = inject(ManageRolesService);
  private roleDialogService = inject(RoleDialogService);
  private popupService = inject(PopupWidgetService);
  private toastr = inject(ToastrService);
  private snackBar = inject(MatSnackBar);

  roles = signal<ManageUserRoleRequest[]>([]);
  loading = signal(false);
  // NEW: preload AspNetRoles (GUID + name)
  allAspNetRoles = signal<AspNetRoleDto[]>([]);

  listConfig: ListConfig = {
    title: 'Roles Management',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add Designation',
    selectable: true,
    pageSize: 5,
    pageSizeOptions: [5, 10, 25, 50],
    exportFileName: 'roles_list',
    emptyMessage: 'No Roles found. Click "Add role" to create one.',
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '100px',
        align: 'left',
        visible: true
      },
      {
        key: 'name',
        label: 'Role Name',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        type: 'text',
        width: '400px',
        align: 'left',
        visible: true
      }
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        tooltip: 'Edit designation'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete designation'
      }
    ]
  }

  ngOnInit() {
    this.loadAspNetRoles();
    this.lordRoles();
  }

  private loadAspNetRoles() {
    this.manageRolesService.getAllAspNetRoles().subscribe({
      next: (roles) => {
        this.allAspNetRoles.set(roles || []);
      },
      error: (err) => {
        console.error('Failed to load AspNetRoles:', err);
        this.allAspNetRoles.set([]);
      }
    });
  }

  lordRoles() {
    this.loading.set(true);

    this.manageRolesService.getUserRolesWithRoleDetails().subscribe({
      next: (response) => {
        if (response.success) {
          // Transform the data to include permission count
          const transformedRoles = response.data.map((role: ManageUserRolesDto) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            rolePermissions: role.rolePermissions || [],
            permissionCount: role.rolePermissions?.filter(rp => rp.isAllowed).length || 0
          }));

          this.roles.set(transformedRoles);
          this.showSnackbar(`Loaded ${transformedRoles.length} roles successfully`, 'success');
        } else {
          this.showSnackbar('Failed to load roles', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching roles:', error);
        this.toastr.error('Failed to load roles. Please try again later.', 'Error');
        this.showSnackbar('Failed to load roles', 'error');
        this.loading.set(false);
      }
    })
  }

  onAddRole() {
    console.log('Opening Add Role Dialog');
    
    this.roleDialogService.openAddRoleDialog( this.allAspNetRoles(),{
      width: '1000px',
      maxWidth: '95vw'
    }).subscribe(result => {
      if (result && result.action === 'save' && result.data) {
        this.handleAddRole(result.data);
      }
    });
  }

  private handleAddRole(roleData: ManageUserRoleRequest) {
    this.loading.set(true);
    
    this.manageRolesService.createRoleWithRoleDetails(roleData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar('Role created successfully', 'success');
          this.lordRoles(); // Refresh the list
        } else {
          this.showSnackbar('Failed to create role', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating role:', error);
        this.showSnackbar('Failed to create role', 'error');
        this.loading.set(false);
      }
    });
  }


  onActionClick(event: { action: string, item: ManageUserRolesDto }) {
    switch (event.action) {
      case 'edit':
        console.log('Edit action clicked for role:', event.item);
        this.editRole(event.item);
        break;
      case 'delete':
        console.log('Delete action clicked for role:', event.item);
        this.deleteRole(event.item);
        break;
    }
  }

  private viewRole(role: ManageUserRoleRequest) {
    console.log('Viewing role:', role);
    
    this.roleDialogService.openViewRoleDialog(role, this.allAspNetRoles(),{
      width: '1000px',
      maxWidth: '95vw'
    }).subscribe(result => {
      // View dialog doesn't need result handling
      console.log('View dialog closed');
    });
  }

  editRole(roles: ManageUserRolesDto) {
    console.log('Editing role:', roles);
    
    this.roleDialogService.openEditRoleDialog(roles, this.allAspNetRoles(),{
      width: '1000px',
      maxWidth: '95vw'
    }).subscribe(result => {
      if (result && result.action === 'save' && result.data) {
        this.handleEditRole(result.data);
      }
    });
  }

  private handleEditRole(roleData: ManageUserRoleRequest) {
    this.loading.set(true);
    
    this.manageRolesService.updateUserRoleWithRoleDetails(roleData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar('Role updated successfully', 'success');
          this.lordRoles(); // Refresh the list
        } else {
          this.showSnackbar('Failed to update role', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.showSnackbar('Failed to update role', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteRole(roles: ManageUserRolesDto) {
    console.log('Deleting designation:', roles);
    // Implement delete logic

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${roles.name}" role?`,
      'This action cannot be undone. All associated data will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteRole(roles.id);
      }
    });
  }

  handleDeleteRole(id: number){
    this.loading.set(true);
    this.manageRolesService.deleteUserRoleById(id).subscribe({
      next: () => {
        this.roles.update(roles => roles.filter(r => r.id !== id));
        this.showSnackbar('Role deleted successfully', 'success');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        this.showSnackbar('Failed to delete role', 'error');
        this.loading.set(false);
      }
    })
  }

  private showSnackbar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    });
  }


  onRefresh() {
    this.lordRoles();
  }

  onSelectionChange(selected: ManageUserRolesDto[]) {
    console.log('Selected roles:', selected);
  }
}
