import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AspNetRoleDto, ManageRoleDetailsRequest, ManageUserRoleRequest } from '../../../../core/models/interfaces/manage-roles/manage-roles.interface';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RolePermission, RolePermissionGroup, RolePermissionsData } from '../../../../core/models/class/manage-roles/roles-models.class';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';

export interface RoleDialogData {
  mode: 'add' | 'edit';
  role?: ManageUserRoleRequest;
  title?: string;
  aspNetRoles: AspNetRoleDto[];
}

export interface RoleDialogResult {
  action: 'save' | 'cancel';
  data?: ManageUserRoleRequest;
}
@Component({
  selector: 'app-role-add-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatExpansionModule
  ],
  templateUrl: './role-add-edit-dialog.component.html',
  styleUrl: './role-add-edit-dialog.component.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class RoleAddEditDialogComponent implements OnInit {

  private dialogRef = inject(MatDialogRef<RoleAddEditDialogComponent>);
  private fb = inject(FormBuilder);
  public data: RoleDialogData = inject(MAT_DIALOG_DATA);

  // Form and loading state
  roleForm!: FormGroup;
  loading = signal(false);
  submitted = signal(false);

  // Permission data
  permissionGroups = signal<RolePermissionGroup[]>(RolePermissionsData.PERMISSION_GROUPS);
  selectedPermissions = signal<Set<string>>(new Set());
  expandedPanels = signal<Record<string, boolean>>({});// Default expanded panels

  // AspNetRoles for mapping
  aspNetRolesMap = signal<Map<string, AspNetRoleDto>>(new Map());

  // Computed properties
  isEditMode = computed(() => this.data.mode === 'edit');
  dialogTitle = computed(() => this.data.title || (this.isEditMode() ? 'Edit Role' : 'Add New Role'));
  totalPermissions = computed(() => this.permissionGroups().reduce((sum, group) => sum + group.permissions.length, 0));
  selectedCount = computed(() => this.selectedPermissions().size);
  selectedPercentage = computed(() =>
    this.totalPermissions() > 0 ? Math.round((this.selectedCount() / this.totalPermissions()) * 100) : 0
  );

  ngOnInit() {
    this.initializeAspNetRolesMap();
    this.initializePermissionGroups();
    this.initializeForm();
    this.loadExistingPermissions();
  }

  private initializeAspNetRolesMap() {
    const rolesMap = new Map<string, AspNetRoleDto>();
    let roles: AspNetRoleDto[] = [];

    // 👇 use runtime check, but tell TS it's 'any' first
    const rawRoles: any = this.data?.aspNetRoles;

    if (Array.isArray(rawRoles)) {
      roles = rawRoles;
    } else if (rawRoles?.data && Array.isArray(rawRoles.data)) {
      roles = rawRoles.data;
    } else {
      console.error('aspNetRoles is not an array:', rawRoles);
    }

    roles.forEach(role => rolesMap.set(role.name, role));
    this.aspNetRolesMap.set(rolesMap);
  }

  private initializePermissionGroups() {
    // Create permission groups based on available AspNetRoles
    // 👇 Get raw data
    const rawRoles: any = this.data?.aspNetRoles;
    let aspNetRoles: any[] = [];

    // 👇 Runtime guard - normalize to an array
    if (Array.isArray(rawRoles)) {
      aspNetRoles = rawRoles;
    } else if (rawRoles?.data && Array.isArray(rawRoles.data)) {
      aspNetRoles = rawRoles.data;
    } else {
      console.error('aspNetRoles is not an array:', rawRoles);
      aspNetRoles = []; // fallback to empty array
    }
    
    const categoryMap = new Map<string, RolePermission[]>();

    // Filter AspNetRoles to exclude Admin and Super Admin
    const filteredRoles = aspNetRoles.filter(role =>
      role.name !== 'Admin' && role.name !== 'Super Admin'
    );

    // Group permissions by category based on existing RolePermissionsData
    filteredRoles.forEach(aspNetRole => {
      // Find the category for this permission from RolePermissionsData
      const existingPermission = RolePermissionsData.AVAILABLE_PERMISSIONS.find(p => p.dbName === aspNetRole.name);
      const category = existingPermission?.category || 'Other';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      const permission: RolePermission = {
        id: aspNetRole.id, // Use GUID as ID
        name: aspNetRole.name,
        dbName: aspNetRole.name, // Assuming dbName is the same as name for AspNetRoles
        description: existingPermission?.description || `Access to ${aspNetRole.name}`,
        category: category
      };

      categoryMap.get(category)!.push(permission);
    });

    // Create permission groups
    const groups: RolePermissionGroup[] = [];
    categoryMap.forEach((permissions, category) => {
      const existingGroup = RolePermissionsData.PERMISSION_GROUPS.find(g => g.category === category);
      groups.push({
        category: category,
        icon: existingGroup?.icon || 'folder',
        permissions: permissions
      });
    });

    this.permissionGroups.set(groups);
  }

  private initializeForm() {
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });

    if (this.isEditMode() && this.data.role) {
      this.roleForm.patchValue({
        name: this.data.role.name || '',
        description: this.data.role.description || ''
      });
    }
  }

  private loadExistingPermissions() {
    if (this.isEditMode() && this.data.role?.rolePermissions) {
      const existingPermissions = new Set<string>();
      this.data.role.rolePermissions
        .filter(rp => rp.isAllowed)
        .forEach(rp => existingPermissions.add(rp.roleId!));

      console.log('Loading existing permissions:', existingPermissions);
      this.selectedPermissions.set(existingPermissions);
    }
  }

  // Permission management methods
  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions().has(permissionId);
  }

  togglePermission(permission: RolePermission): void {
    const current = new Set(this.selectedPermissions());
    if (current.has(permission.id)) {
      current.delete(permission.id);
    } else {
      current.add(permission.id);
    }
    this.selectedPermissions.set(current);
  }

  toggleGroupPermissions(group: RolePermissionGroup): void {
    const current = new Set(this.selectedPermissions());
    const groupPermissionIds = group.permissions.map(p => p.id);
    const allSelected = groupPermissionIds.every(id => current.has(id));

    if (allSelected) {
      // Deselect all in group
      groupPermissionIds.forEach(id => current.delete(id));
    } else {
      // Select all in group
      groupPermissionIds.forEach(id => current.add(id));
    }

    this.selectedPermissions.set(current);
  }

  getGroupSelectedCount(group: RolePermissionGroup): number {
    return group.permissions.filter(p => this.isPermissionSelected(p.id)).length;
  }


  isGroupFullySelected(group: RolePermissionGroup): boolean {
    return group.permissions.length > 0 &&
      group.permissions.every(p => this.isPermissionSelected(p.id));
  }

  isGroupPartiallySelected(group: RolePermissionGroup): boolean {
    const selectedInGroup = this.getGroupSelectedCount(group);
    return selectedInGroup > 0 && selectedInGroup < group.permissions.length;
  }


  // Panel expansion management
  isPanelExpanded(category: string): boolean {
    return this.expandedPanels()[category] ?? false;
  }

  togglePanel(category: string) {
    this.expandedPanels.update(state => ({
      ...state,
      [category]: !state[category],
    }));
  }

  // Bulk selection methods
  selectAllPermissions(): void {
    const allPermissionIds = this.permissionGroups()
      .flatMap(group => group.permissions)
      .map(p => p.id);
    this.selectedPermissions.set(new Set(allPermissionIds));
  }

  clearAllPermissions(): void {
    this.selectedPermissions.set(new Set());
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  getFieldError(fieldName: string): string {
    const field = this.roleForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    if (errors['required']) return `${fieldName} is required`;
    if (errors['minlength']) return `Minimum length is ${errors['minlength'].requiredLength}`;
    if (errors['maxlength']) return `Maximum length is ${errors['maxlength'].requiredLength}`;

    return 'Invalid input';
  }

  // Form submission
  onSave(): void {
    debugger
    this.submitted.set(true);

    if (this.roleForm.valid) {
      this.loading.set(true);


      // Prepare role permissions using actual AspNetRole data
      const rolePermissions: ManageRoleDetailsRequest[] = [];

      // Get all available permissions from our permission groups
      const allAvailablePermissions = this.permissionGroups()
        .flatMap(group => group.permissions);

      allAvailablePermissions.forEach(permission => {
        const aspNetRole = this.aspNetRolesMap().get(permission.dbName);
        if (aspNetRole) {
          rolePermissions.push({
            roleId: aspNetRole.id, // Use GUID from AspNetRole
            roleName: aspNetRole.name,
            isAllowed: this.selectedPermissions().has(permission.id),
            ...(this.isEditMode() && this.data.role?.id && { manageRoleId: this.data.role.id })
          });
        }
      });

      const roleData: ManageUserRoleRequest = {
        ...(this.isEditMode() && this.data.role?.id && { id: this.data.role.id }),
        name: this.roleForm.get('name')?.value,
        description: this.roleForm.get('description')?.value,
        rolePermissions
      };

      console.log('Saving role data:', roleData);

      // Simulate API call delay
      setTimeout(() => {
        this.loading.set(false);
        this.dialogRef.close({
          action: 'save',
          data: roleData
        } as RoleDialogResult);
      }, 500);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel' } as RoleDialogResult);
  }

  // Search functionality
  searchTerm = signal('');
  filteredGroups = computed(() => {
    const groups = this.permissionGroups(); // read once
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) return groups; // ✅ return original array reference if no search

    // ✅ only create new array if filtering
    return groups
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        )
      }))
      .filter(group => group.permissions.length > 0);
  });


  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  getSelectedCategoryCount(): number {
    return this.filteredGroups().filter(g => this.getGroupSelectedCount(g) > 0).length;
  }

  trackByPermission(index: number, permission: any): any {
    return permission.id;
  }

  trackByGroup(index: number, group: any): string {
    return group.category;
  }
}
