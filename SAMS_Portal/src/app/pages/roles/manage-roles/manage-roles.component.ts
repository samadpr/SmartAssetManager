import { Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { CommonModule } from '@angular/common';
import { AspNetRoleDto, ManageUserRoleRequest, ManageUserRolesDto } from '../../../core/models/interfaces/manage-roles/manage-roles.interface';
import { ManageRolesService } from '../../../core/services/roles-manager/manage-roles.service';
import { ToastrService } from 'ngx-toastr';
import { RoleDialogService } from '../../../core/services/roles-manager/dialog-service/role-dialog.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from '../../../core/services/global/global.service';

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
  private globalService = inject(GlobalService);

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
    addButtonLabel: 'Add Role',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
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
      // {
      //   key: 'view',
      //   label: 'View',
      //   icon: 'visibility',
      //   color: 'primary',
      //   tooltip: 'View Role details'
      // },
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
          // this.showSnackbar(`Loaded ${transformedRoles.length} roles successfully`, 'success');
        } else {
          this.globalService.showSnackbar('Failed to load roles', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching roles:', error);
        this.globalService.showToastr('Failed to load roles.', 'error');
        this.loading.set(false);
      }
    })
  }

  onAddRole() {
    console.log('Opening Add Role Dialog');

    this.roleDialogService.openAddRoleDialog(this.allAspNetRoles(), {
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
          this.globalService.showSnackbar('Role created successfully', 'success')
          this.lordRoles(); // Refresh the list
        } else {
          this.globalService.showSnackbar('Failed to create role', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating role:', error);
        this.globalService.showToastr('Failed to create role', 'error');
        this.loading.set(false);
      }
    });
  }


  onActionClick(event: { action: string, item: ManageUserRolesDto }) {
    const { action, item } = event;

    switch (event.action) {
      case 'view':
        this.viewRole(event.item);
        break;
      case 'edit':
        console.log('Edit action clicked for role:', event.item);
        this.editRole(event.item);
        break;
      case 'delete':
        console.log('Delete action clicked for role:', event.item);
        this.deleteRole(event.item);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  private viewRole(role: ManageUserRoleRequest) {
    console.log('Viewing role:', role);

    this.roleDialogService.openEditRoleDialog(role, this.allAspNetRoles(), {
      width: '1000px',
      maxWidth: '95vw'
    }).subscribe(result => {
      console.log("cloed view")
      if (result && result.action === 'save' && result.data) {
        this.handleEditRole(result.data);
      }
    });
  }

    // Handle row clicks (opens detail view)
  onRowClick(event: { action: string; item: ManageUserRoleRequest }) {
    if (event.action === 'view') {
      this.viewRole(event.item);
    }
  }

  // Handle bulk selection actions
  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleRoles(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedRoles(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  editRole(roles: ManageUserRolesDto) {
    console.log('Editing role:', roles);

    this.roleDialogService.openEditRoleDialog(roles, this.allAspNetRoles(), {
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
          this.globalService.showSnackbar('Role updated successfully', 'success')
          this.lordRoles(); // Refresh the list
        } else {
          this.globalService.showSnackbar('Failed to update role', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.globalService.showToastr('Failed to update role', 'error');
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

  handleDeleteRole(id: number) {
    this.loading.set(true);
    this.manageRolesService.deleteUserRoleById(id).subscribe({
      next: () => {
        this.roles.update(roles => roles.filter(r => r.id !== id));
        this.globalService.showSnackbar('Role deleted successfully', 'success');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        this.globalService.showToastr('Failed to delete role', 'error');
        this.loading.set(false);
      }
    })
  }

  onRefresh() {
    this.lordRoles();
  }

  onSelectionChange(selected: ManageUserRolesDto[]) {
    console.log('Selected roles:', selected);
  }

  deleteMultipleRoles(selectedRoles: ManageUserRolesDto[]){
    const count = selectedRoles.length;
    const names = selectedRoles.slice(0, 3).map(e => e.name).join(', ');
    const message = count <= 3 ? 
      `Are you sure you want to delete ${names}?` :
      `Are you sure you want to delete ${names} and ${count - 3} other roles?`;
    
    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} employee record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedRoles);
      }
    });
  }

  private exportSelectedRoles(selectedRoles: ManageUserRolesDto[]) {
    console.log(`Exporting ${selectedRoles.length} selected Roles`);
    // Custom export logic here - the widget will handle the actual export
    this.globalService.showSnackbar(`Exported ${selectedRoles.length} employees`, 'success');
  }

  private handleBulkDelete(selectedRoles: ManageUserRolesDto[]) {
    const idsToDelete = selectedRoles.map(emp => emp.id);
    idsToDelete.forEach(id => this.handleDeleteRole(id));
    this.globalService.showSnackbar(
      `${selectedRoles.length} Roles deleted successfully`, 
      'success'
    );

  }
}
