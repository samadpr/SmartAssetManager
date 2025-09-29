import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/widgets/page-header/page-header.component';
import { ListConfig, ListWidgetComponent, SelectionActionEvent } from '../../../shared/widgets/common/list-widget/list-widget.component';
import { UserProfileData, UserProfileDetails, UserProfileRequest } from '../../../core/models/account/userProfile';
import { UserProfileService } from '../../../core/services/users/user-profile.service';
import { ToastrService } from 'ngx-toastr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from '../../../core/services/global/global.service';
import { PopupWidgetService } from '../../../core/services/popup-widget/popup-widget.service';
import { Validators } from '@angular/forms';
import { PopupField } from '../../../core/models/interfaces/popup-widget.interface';
import { forkJoin } from 'rxjs';
import { DesignationService } from '../../../core/services/Designation/designation.service';
import { ManageRolesService } from '../../../core/services/roles-manager/manage-roles.service';
import { CountryService } from '../../../core/services/account/country/country.service';

export interface UserProfile {
  userProfileId: number;
  applicationUserId?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: Date; // ISO Date string from API
  designation: number;
  department: number;
  subDepartment: number;
  designationDisplay?: string;
  departmentDisplay?: string;
  subDepartmentDisplay?: string;
  siteDisplay?: string;
  locationDisplay?: string;
  roleIdDisplay?: string;
  roleId?: number;
  joiningDate?: Date; // ISO Date string from API
  leavingDate?: string; // ISO Date string from API
  phoneNumber?: string;
  email?: string;
  address?: string;
  country?: string;
  profilePicture?: string;
}

interface DropdownOption {
  value: any;
  label: string;
  disabled?: boolean;
}

interface DropdownData {
  designations: DropdownOption[];
  departments: DropdownOption[];
  subDepartments: DropdownOption[];
  sites: DropdownOption[];
  locations: DropdownOption[];
  roles: DropdownOption[];
  countries: DropdownOption[];
}

@Component({
  selector: 'app-manage-user',
  imports: [
    PageHeaderComponent,
    ListWidgetComponent
  ],
  templateUrl: './manage-user.component.html',
  styleUrl: './manage-user.component.scss'
})
export class ManageUserComponent implements OnInit {

  private userService = inject(UserProfileService)
  private globalService = inject(GlobalService)
  private popupService = inject(PopupWidgetService)
  private designationService = inject(DesignationService);
  private rolesService = inject(ManageRolesService);
  private countryService = inject(CountryService);


  userProfiles = signal<UserProfile[]>([])
  loading = signal(false);
  dropdownData = signal<DropdownData>({
    designations: [],
    departments: [],
    subDepartments: [],
    sites: [],
    locations: [],
    roles: [],
    countries: []
  });

  listConfig: ListConfig = {
    title: 'Manage Users',
    showSearch: true,
    showRefresh: true,
    showDownload: true,
    showAdd: true,
    addButtonLabel: 'Add User',
    selectable: true,
    compactMode: false, // Set to true for compact layout
    showSelectionActions: true, // Enable bulk actions
    rowClickAction: 'view', // Enable row click to view details
    pageSize: 5,
    pageSizeOptions: [5, 10, 25, 50],
    exportFileName: 'users_export',
    emptyMessage: 'No Users found. Click "Add User" to create one.',
    columns: [
      {
        key: 'userProfileId',
        label: 'ID',
        sortable: true,
        type: 'number',
        width: '80px',
        align: 'left',
        visible: false
      },
      {
        key: 'fullName',
        label: 'Name',
        sortable: true,
        type: 'avatar',
        width: '250px',
        align: 'left',
        visible: true,
        ellipsis: true,
        avatarField: 'profilePicture',
        nameField: 'fullName',
        tooltip: 'Click to view employee details'
      },
      {
        key: 'dateOfBirth',
        label: 'Birth Date',
        sortable: false,
        type: 'date',
        width: '200px',
        align: 'left',
        visible: true
      },
      {
        key: 'designationDisplay',
        label: 'Designation',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'roleIdDisplay',
        label: 'Role',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'departmentDisplay',
        label: 'Department',
        sortable: true,
        type: 'text',
        width: '200px',
        align: 'left',
        visible: true,
        ellipsis: true
      },
      {
        key: 'phoneNumber',
        label: 'Mobile',
        sortable: false,
        type: 'phone',
        width: '400px',
        align: 'left',
        visible: true,
        showIcon: true,
        tooltip: 'Click to call'
      },
      {
        key: 'joiningDate',
        label: 'Joining Date',
        sortable: false,
        type: 'date',
        width: '200px',
        align: 'left',
        visible: false
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        sortable: false,
        width: '220px',
        align: 'left',
        visible: true,
        showIcon: true,
        ellipsis: true,
        tooltip: 'Click to send email'
      },
      {
        key: 'address',
        label: 'Address',
        sortable: false,
        type: 'address',
        width: '200px',
        align: 'left',
        visible: true,
        showIcon: true,
        ellipsis: true,
        tooltip: 'Click to view on map'
      },
      {
        key: 'country',
        label: 'Country',
        type: 'country',
        sortable: true,
        width: '200px',
        align: 'left',
        visible: true,
        showIcon: false
      },
    ],
    actions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        tooltip: 'Edit User'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        tooltip: 'Delete User'
      }
    ]
  };

  ngOnInit(): void {
    this.loadDropdownData();
    this.loadUsers();
  }
  private loadDropdownData() {
    // Load countries from service
    const allCountries = this.countryService.getAllCountries();

    // Load other dropdown data in parallel
    forkJoin({
      designations: this.designationService.getDesignations(),
      roles: this.rolesService.getUserRoles(),
    }).subscribe({
      next: (responses) => {
        this.dropdownData.update(current => ({
          ...current,
          // Countries from service
          countries: allCountries.map(c => ({
            value: c.code,
            label: c.name
          })),

          // Other dropdowns from API
          designations: responses.designations.map(d => ({
            value: d.id,
            label: d.name
          })),
          roles: responses.roles.success ? responses.roles.data.map((r: any) => ({
            value: r.id,
            label: r.name
          })) : [],

          // Mock data for other dropdowns - replace with actual API calls when available
          departments: [
            { value: 1, label: 'Information Technology' },
            { value: 2, label: 'Human Resources' },
            { value: 3, label: 'Finance' },
            { value: 4, label: 'Marketing' },
            { value: 5, label: 'Operations' }
          ],
          subDepartments: [
            { value: 1, label: 'Software Development' },
            { value: 2, label: 'Quality Assurance' },
            { value: 3, label: 'DevOps' },
            { value: 4, label: 'UI/UX Design' }
          ],
          sites: [
            { value: 1, label: 'Main Office' },
            { value: 2, label: 'Branch Office' },
            { value: 3, label: 'Remote' }
          ],
          locations: [
            { value: 1, label: 'Riyadh' },
            { value: 2, label: 'Jeddah' },
            { value: 3, label: 'Dammam' },
            { value: 4, label: 'Dubai' }
          ]
        }));

        console.log('Dropdown data loaded:', {
          countries: allCountries.length,
          designations: responses.designations.length,
          roles: responses.roles.success ? responses.roles.data.length : 0
        });
      },
      error: (error) => {
        console.error('Error loading dropdown data:', error);
        this.globalService.showToastr('Failed to load form data', 'error');
      }
    });
  }

  private getUserFormFields(): PopupField[] {
    const dropdowns = this.dropdownData();

    return [
      // Personal Information Section
      {
        key: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name',
        colSpan: 1,
        icon: 'person',
        validators: [Validators.minLength(2), Validators.maxLength(50)]
      },
      {
        key: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name',
        colSpan: 1,
        icon: 'person',
        validators: [Validators.minLength(2), Validators.maxLength(50)]
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'Enter email address',
        colSpan: 2,
        icon: 'email',
        validators: [Validators.email]
      },
      {
        key: 'phoneNumber',
        label: 'Phone Number',
        type: 'text',
        required: true,
        placeholder: 'Enter phone number',
        colSpan: 1,
        icon: 'phone',
        validators: [Validators.pattern(/^[\+]?[\d\s\-\(\)]+$/)]
      },
      {
        key: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: false,
        colSpan: 1,
        max: new Date().getDate() // Cannot be future date
      },

      // Work Information Section
      {
        key: 'designation',
        label: 'Designation',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'work',
        options: dropdowns.designations
      },
      {
        key: 'department',
        label: 'Department',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'business',
        options: dropdowns.departments
      },
      {
        key: 'subDepartment',
        label: 'Sub Department',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'account_tree',
        options: dropdowns.subDepartments
      },
      {
        key: 'site',
        label: 'Site',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'location_city',
        options: dropdowns.sites
      },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'place',
        options: dropdowns.locations
      },
      {
        key: 'joiningDate',
        label: 'Joining Date',
        type: 'date',
        required: true,
        colSpan: 1
      },

      // Role and Permissions
      {
        key: 'roleId',
        label: 'Role',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'admin_panel_settings',
        options: dropdowns.roles
      },

      // Address and Country
      {
        key: 'country',
        label: 'Country',
        type: 'select',
        required: false,
        colSpan: 1,
        icon: 'public',
        options: []
      },
      {
        key: 'address',
        label: 'Address',
        type: 'textarea',
        placeholder: 'Enter full address',
        colSpan: 2, // Full width
        rows: 2,
        icon: 'location_on'
      }
    ];
  }

  private getViewFields(): PopupField[] {
    // Use same fields as form but for display purposes
    return this.getUserFormFields();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getCreatedUsersProfilesDetails().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const mapped = response.data.map((u: UserProfileDetails) => this.mapToUserProfile(u));
          this.userProfiles.set(mapped);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.globalService.showToastr('Failed to load users.', 'error')
        this.loading.set(false);
      }
    })
  }

  private mapToUserProfile(data: UserProfileDetails): UserProfile {
    return {
      userProfileId: data.userProfileId,
      applicationUserId: data.applicationUserId,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      designation: data.designation,
      department: data.department,
      subDepartment: data.subDepartment,
      designationDisplay: data.designationDisplay || 'N/A',
      departmentDisplay: data.departmentDisplay,
      subDepartmentDisplay: data.subDepartmentDisplay,
      siteDisplay: data.siteDisplay,
      locationDisplay: data.locationDisplay,
      roleIdDisplay: data.roleIdDisplay,
      roleId: data.roleId,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      leavingDate: data.leavingDate ?? undefined,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      country: data.country,
      profilePicture: data.profilePicture
    };
  }

    // Helper method to get country name from code if needed
  private getCountryNameFromCode(countryCode: string): string {
    const country = this.dropdownData().countries.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  }

  // Helper method to get country code from name
  private getCountryCodeFromName(countryName: string): string {
    const country = this.dropdownData().countries.find(c => c.label === countryName);
    return country ? country.value : '';
  }
  
  onRowClick(event: { action: string; item: UserProfile }) {
    if (event.action === 'view') {
      this.viewUser(event.item);
    }
  }

  onActionClick(event: { action: string; item: UserProfile; }) {
    switch (event.action) {
      case 'view':
        this.viewUser(event.item);
        break;
      case 'edit':
        this.editUser(event.item);
        break;
      case 'delete':
        this.deleteUser(event.item);
        break;
    }
  }

  viewUser(user: UserProfile) {
    const fields = this.getViewFields();

    this.popupService.openViewPopup2('User Profile', fields, user, {
      subtitle: `Employee ID: ${user.employeeId || 'N/A'} | ${user.designationDisplay}`,
      icon: 'person',
      columns: 2,
      maxWidth: '900px',
      maxHeight: '90vh',
      showEditButton: true,
      editButtonText: 'Edit User'
    }).subscribe(result => {
      if (result && result.action === 'edit') {
        this.editUser(user);
      }
    });
  }

  onAddUser() {
    const fields = this.getUserFormFields();

    this.popupService.openAddPopup('Add New User', fields, {
      subtitle: 'Enter user information below',
      icon: 'person_add',
      columns: 2,
      maxWidth: '900px',
      maxHeight: '90vh',
      compactMode: false
    }).subscribe(result => {
      if (result && result.action === 'submit') {
        this.handleAddUser(result.data);
      }
    });

  }

  private handleAddUser(formData: any) {
    this.loading.set(true);

    // Log the form data to see what country value we're getting
    console.log('Form data received:', formData);
    
    // Convert form data to UserProfileRequest format
    const userProfileRequest: UserProfileRequest = {
      userProfileId: 0, // New user
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      designation: formData.designation,
      department: formData.department,
      subDepartment: formData.subDepartment,
      site: formData.site,
      location: formData.location,
      roleId: formData.roleId,
      joiningDate: formData.joiningDate,
      leavingDate: formData.leavingDate,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      address: formData.address,
      country: formData.country,
      profilePicture: formData.profilePicture
    };

    this.userService.createUserProfile(userProfileRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('User created successfully', 'success');
          this.loadUsers(); // Reload the list
        } else {
          this.globalService.showToastr('Failed to create user', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.globalService.showToastr('Failed to create user', 'error');
        this.loading.set(false);
      }
    });
  }

  editUser(user: UserProfile) {
    const fields = this.getUserFormFields();

    this.popupService.openEditPopup(
      'Edit User',
      fields,
      user,
      {
        subtitle: `Update information for ${user.fullName}`,
        icon: 'edit',
        columns: 2,
        maxWidth: '900px',
        maxHeight: '90vh'
      }
    ).subscribe(result => {
      if (result && result.action === 'submit') {
        result.data.userProfileId = user.userProfileId;
        this.handleEditUser(result.data);
      }
    });
  }

  private handleEditUser(formData: any) {
    this.loading.set(true);

    // Convert form data to UserProfileRequest format
    const userProfileRequest: UserProfileRequest = {
      userProfileId: formData.userProfileId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      designation: formData.designation,
      department: formData.department,
      subDepartment: formData.subDepartment,
      site: formData.site,
      location: formData.location,
      roleId: formData.roleId,
      joiningDate: formData.joiningDate,
      leavingDate: formData.leavingDate,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      address: formData.address,
      country: formData.country,
      profilePicture: formData.profilePicture
    };

    this.userService.updateCreatedUserProfile(userProfileRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('User updated successfully', 'success');
          this.loadUsers(); // Reload the list
        } else {
          this.globalService.showToastr('Failed to update user', 'error');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.globalService.showToastr('Failed to update user', 'error');
        this.loading.set(false);
      }
    });
  }

  deleteUser(user: UserProfile) {
    console.log('Deleting designation:', user);
    // Implement delete logic

    this.popupService.openDeleteConfirmation(
      `Are you sure you want to delete "${user.fullName}"?`,
      'This action cannot be undone. All associated data will be permanently removed.'
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleDeleteUser(user.userProfileId);
      }
    });
  }

  private handleDeleteUser(userProfileId: number) {
    this.loading.set(true);
    this.userService.deleteCreatedUserProfile(userProfileId).subscribe({
      next: (response) => {
        if (response.success) {
          this.globalService.showSnackbar('User deleted successfully', 'success');
          this.loadUsers(); // Reload the list
        } else {
          this.globalService.showToastr('Failed to delete user', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error deleting designation:', err);
        this.globalService.showToastr('Failed to delete designation', 'error');
        this.loading.set(false);
      }
    });
  }

  // Handle bulk selection actions
  onSelectionAction(event: SelectionActionEvent) {
    switch (event.action) {
      case 'delete':
        this.deleteMultipleUsers(event.selectedItems);
        break;
      case 'export':
        this.exportSelectedUsers(event.selectedItems);
        break;
      default:
        console.log('Unknown selection action:', event.action);
    }
  }

  deleteMultipleUsers(selectedUsers: UserProfileData[]) {
    const count = selectedUsers.length;
    const names = selectedUsers.slice(0, 3).map(e => e.firstName + ' ' + e.lastName).join(', ');
    const message = count <= 3 ?
      `Are you sure you want to delete ${names}?` :
      `Are you sure you want to delete ${names} and ${count - 3} other employees?`;

    this.popupService.openDeleteConfirmation(
      message,
      `This will permanently delete ${count} employee record${count > 1 ? 's' : ''}.`
    ).subscribe(result => {
      if (result && result.action === 'confirm') {
        this.handleBulkDelete(selectedUsers);
      }
    });
  }

  exportSelectedUsers(selectedUsers: UserProfileData[]) {
    console.log(`Exporting ${selectedUsers.length} selected employees`);
    // Custom export logic here - the widget will handle the actual export
    this.globalService.showSnackbar(`Exported ${selectedUsers.length} employees`, 'success');
  }

  private handleBulkDelete(selectedUser: UserProfileData[]) {
    const idsToDelete = selectedUser.map(user => user.userProfileId);
    idsToDelete.forEach(id => this.handleDeleteUser(id));
    this.globalService.showSnackbar(
      `${selectedUser.length} employees deleted successfully`,
      'success'
    );
  }

  onRefresh() {
    this.loadUsers();
  }

  onSelectionChange(selected: UserProfileData[]) {
    console.log('Selected designations:', selected);
  }
}
